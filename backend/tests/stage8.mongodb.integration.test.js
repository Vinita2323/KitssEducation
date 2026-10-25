import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { stage8Fixture } from './stage8-fixture.js';
import { hashPassword } from '../src/modules/auth/security.js';
import { createAccountService } from '../src/modules/auth/account.service.js';
const name = process.env.KITSS_STAGE8_TEST_DB;
test('Stage 8 real MongoDB results, recipient notices, profile and email security', {
  skip: !name ? 'KITSS_STAGE8_TEST_DB not supplied; database integration not executed' : false,
  timeout: 180000
}, async t => {
  const f = await stage8Fixture(name);
  let server;
  t.after(async () => {
    if (server) await new Promise(r => {
      server.close(r);
      server.closeAllConnections();
    });
    await f.close();
  });
  const admin = await f.fixtureUser(),
    student = await f.fixtureUser(['student']),
    other = await f.fixtureUser(['student']);
  const ctx = f.ctx,
    R = f.results,
    T = f.trusted,
    N = f.notifications,
    A = f.account;
  let issuer, exam, asset, record, notice, cutoff;
  const row = {
    rollNumber: 'SYNTHETIC-001',
    userPublicId: student.user.publicId,
    student: {
      name: 'SYNTHETIC TEST CANDIDATE'
    },
    subjects: [{
      code: 'T1',
      name: 'Synthetic subject',
      maxMarks: 100,
      obtained: 80,
      grade: 'SOURCE-A'
    }],
    totals: {
      max: 100,
      obtained: 80,
      percentage: 80,
      status: 'SOURCE-PASS',
      grade: 'SOURCE-A'
    },
    verificationFields: {
      dob: '2000-01-01'
    },
    issueDate: '2026-10-24',
    externalId: 'SYNTHETIC-REFERENCE-1'
  };
  await t.test('issuer/exam CRUD, immutable parents and default publication gate', async () => {
    issuer = await R.mutate('issuers', null, {
      key: 'synthetic',
      type: 'school',
      name: 'SYNTHETIC',
      fullName: 'SYNTHETIC ISOLATED ISSUER',
      status: 'active',
      fieldSchema: [{
        id: 'dob',
        label: 'Date of birth',
        type: 'date',
        required: true
      }],
      source: {
        description: 'Isolated test only',
        authorizationReference: 'SYNTHETIC_ISOLATED_ONLY'
      }
    }, ctx);
    exam = await R.mutate('exams', null, {
      issuerId: issuer.id,
      key: 'synthetic-exam',
      title: 'SYNTHETIC EXAM',
      year: 2026,
      session: 'TEST'
    }, ctx);
    await assert.rejects(() => R.mutate('exams', exam.id, {
      expectedRevision: exam.revision,
      status: 'published'
    }, ctx), {
      code: 'SOURCE_APPROVAL_REQUIRED'
    });
    await assert.rejects(() => R.mutate('issuers', issuer.id, {
      expectedRevision: 999,
      name: 'invalid'
    }, ctx), {
      code: 'REVISION_CONFLICT'
    });
    exam = await T.mutate('exams', exam.id, {
      expectedRevision: exam.revision,
      status: 'published'
    }, ctx);
  });
  const importInput = () => ({
    examId: exam.id,
    assetId: asset.id,
    mappingVersion: 'kitss-results-v1',
    idempotencyKey: 'synthetic-import-key-001'
  });
  await t.test('private scanned JSON import, dry run and idempotent persistence', async () => {
    asset = await f.media.upload({
      purpose: 'result_import',
      stream: Readable.from(Buffer.from(JSON.stringify([row]))),
      mime: 'application/json',
      originalName: 'synthetic.json',
      idempotencyKey: randomUUID(),
      auth: admin.auth,
      ctx
    });
    assert.equal(asset.status, 'ready');
    assert.equal(asset.visibility, 'private');
    const dry = await R.importRecords(importInput(), admin.auth, ctx);
    assert.equal(dry.validRows, 1);
    assert.deepEqual(dry.errors, []);
    await assert.rejects(() => R.importRecords({
      ...importInput(),
      dryRun: false,
      validationToken: 'wrong'
    }, admin.auth, ctx), {
      code: 'INVALID_INPUT'
    });
    const done = await R.importRecords({
      ...importInput(),
      dryRun: false,
      validationToken: dry.validationToken
    }, admin.auth, ctx);
    assert.equal(done.imported, 1);
    assert.deepEqual(await R.importRecords({
      ...importInput(),
      dryRun: false,
      validationToken: dry.validationToken
    }, admin.auth, ctx), done);
    assert.deepEqual((await f.service.summary()).eventQueue, []); // Reused import jobs never appear as payment events.
    await f.service.tick();
    assert.equal((await f.models.Job.findOne({
      kind: 'result_import'
    })).state, 'done');
    record = (await R.list('records')).data[0];
    assert.equal(await f.models.ResultRecord.countDocuments(), 1);
    await assert.rejects(() => f.media.remove(asset.id, {
      expectedRevision: asset.revision
    }, ctx), {
      code: 'MEDIA_REFERENCED'
    });
  });
  await t.test('marks totals, malformed schema and candidate linkage reject invented data', async () => {
    const i = await f.models.ResultIssuer.findById(issuer.id);
    await assert.rejects(() => R.validateRecord({
      ...row,
      totals: {
        ...row.totals,
        obtained: 99
      }
    }, i));
    await assert.rejects(() => R.validateRecord({
      ...row,
      subjects: [{
        ...row.subjects[0],
        obtained: 101
      }]
    }, i));
    await assert.rejects(() => R.validateRecord({
      ...row,
      userPublicId: 'UNKNOWN'
    }, i));
    await assert.rejects(() => R.mutate('issuers', null, {
      key: 'bad',
      type: 'school',
      name: 'bad',
      fullName: 'bad',
      fieldSchema: [{
        id: 'x',
        label: 'x',
        type: 'script',
        required: true
      }]
    }, ctx));
  });
  const lookup = () => ({
    issuerId: issuer.id,
    examId: exam.id,
    rollNumber: row.rollNumber,
    verificationFields: row.verificationFields
  });
  await t.test('unapproved publication and draft lookup remain closed', async () => {
    await assert.rejects(() => R.changeRecord(record.id, 'publish', {
      expectedRevision: record.expectedRevision,
      sourceApproval: 'client-assertion'
    }, ctx), {
      code: 'SOURCE_APPROVAL_REQUIRED'
    });
    await assert.rejects(() => T.lookup(lookup(), student.auth, ctx), {
      code: 'RESULT_NOT_FOUND'
    });
    assert.deepEqual((await R.history({}, student.auth)).data, []);
  });
  await t.test('isolated approved-source lookup exact ownership, proofs, marks and no secret DTO', async () => {
    record = await T.changeRecord(record.id, 'publish', {
      expectedRevision: record.expectedRevision
    }, ctx);
    const result = await T.lookup(lookup(), student.auth, ctx);
    assert.equal(result.totals.obtained, 80);
    assert.equal(result.verificationHash, undefined);
    await assert.rejects(() => T.lookup(lookup(), other.auth, ctx), {
      code: 'RESULT_NOT_FOUND'
    });
    await assert.rejects(() => T.lookup({
      ...lookup(),
      rollNumber: 'SYNTHETIC-OTHER'
    }, student.auth, ctx), {
      code: 'RESULT_NOT_FOUND'
    });
    await assert.rejects(() => T.lookup({
      ...lookup(),
      verificationFields: {
        dob: '2000-02-02'
      }
    }, student.auth, ctx), {
      code: 'RESULT_NOT_FOUND'
    });
    await assert.rejects(() => R.lookup(lookup(), student.auth, ctx), {
      code: 'RESULT_NOT_FOUND'
    });
    assert.equal((await T.history({}, student.auth)).data.length, 1);
    assert.equal(await f.models.ResultHistory.countDocuments(), 1);
  });
  await t.test('correction creates separate draft, original immutable; withdrawal audit revokes lookup', async () => {
    const correction = await T.changeRecord(record.id, 'corrections', {
      expectedRevision: record.expectedRevision,
      reason: 'Synthetic correction',
      source: 'SYNTHETIC-CORRECTION',
      correctedFields: {
        ...row,
        subjects: [{
          ...row.subjects[0],
          obtained: 81
        }],
        totals: {
          ...row.totals,
          obtained: 81,
          percentage: 81
        }
      }
    }, ctx);
    assert.equal(correction.status, 'draft');
    assert.equal(correction.revision, 2);
    assert.equal((await T.lookup(lookup(), student.auth, ctx)).totals.obtained, 80);
    record = await T.changeRecord(record.id, 'withdraw', {
      expectedRevision: record.expectedRevision,
      reason: 'Synthetic withdrawal'
    }, ctx);
    await assert.rejects(() => T.lookup(lookup(), student.auth, ctx), {
      code: 'RESULT_NOT_FOUND'
    });
    assert.equal((await T.history({}, student.auth)).data.length, 0);
    const history = (await T.detail('records', record.id)).audit;
    assert.ok(history.some(a => a.action === 'result_withdraw'));
  });
  await t.test('targeted draft/publication/read ownership and exact unread counts', async () => {
    notice = await N.mutate(null, {
      title: 'SYNTHETIC NOTICE',
      message: 'Isolated test only',
      category: 'general',
      link: '/results',
      audience: {
        kind: 'users',
        userIds: [String(student.user._id)]
      }
    }, ctx);
    assert.equal((await N.list({}, student.auth)).meta.unreadCount, 0);
    notice = await N.publish(notice.id, {
      expectedRevision: notice.revision
    }, ctx);
    const list = await N.list({}, student.auth);
    assert.equal(list.meta.unreadCount, 1);
    cutoff = list.meta.through;
    assert.equal((await N.list({}, other.auth)).data.length, 0);
    await assert.rejects(() => N.mark(notice.id, other.auth), {
      code: 'NOT_FOUND'
    });
    await Promise.all([N.mark(notice.id, student.auth), N.mark(notice.id, student.auth)]);
    assert.equal((await N.list({}, student.auth)).meta.unreadCount, 0);
    assert.equal(await f.models.NotificationReceipt.countDocuments(), 1);
  });
  await t.test('mark-all cutoff preserves later notices and archive hides notice', async () => {
    const draft = await N.mutate(null, {
      title: 'LATER SYNTHETIC',
      message: 'Isolated',
      category: 'exam',
      audience: {
        kind: 'all_students'
      }
    }, ctx);
    const later = await N.publish(draft.id, {
      expectedRevision: draft.revision
    }, ctx);
    await N.markAll({
      through: cutoff
    }, student.auth);
    assert.equal((await N.list({}, student.auth)).meta.unreadCount, 1);
    await N.markAll({
      through: new Date().toISOString()
    }, student.auth);
    assert.equal((await N.list({}, student.auth)).meta.unreadCount, 0);
    await assert.rejects(() => N.mutate(later.id, {
      expectedRevision: later.revision,
      title: 'silent change'
    }, ctx), {
      code: 'PUBLISHED_IMMUTABLE'
    });
    await N.mutate(notice.id, {
      expectedRevision: notice.revision
    }, ctx, true);
    assert.equal((await N.list({}, student.auth)).data.length, 1);
    await assert.rejects(() => N.markAll({
      through: '2099-01-01'
    }, student.auth));
  });
  await t.test('Stage 9 concurrent receipt insertion does not fail mark-all', async () => {
    const Receipt = f.models.NotificationReceipt;
    const original = Receipt.updateOne;
    let injected = false;
    Receipt.updateOne = async function (...args) {
      const result = await original.apply(this, args);
      if (!injected) { injected = true; throw Object.assign(new Error('Synthetic competing read receipt'), { code: 11000 }); }
      return result;
    };
    try { await N.markAll({ through: new Date().toISOString() }, other.auth); }
    finally { Receipt.updateOne = original; }
    assert.equal(injected, true);
    assert.equal((await N.list({}, other.auth)).meta.unreadCount, 0);
  });
  await t.test('profile/preference persistence, typed validation and role protection', async () => {
    const result = await A.profile({
      name: 'SYNTHETIC UPDATED',
      phone: '+91 1234567890',
      profile: {
        board: 'Synthetic board',
        class: 'Synthetic grade'
      }
    }, student.auth, ctx);
    assert.equal(result.user.phone, '+91 1234567890');
    await assert.rejects(() => A.profile({
      roles: ['super_admin']
    }, student.auth, ctx));
    await A.savePreferences({
      notification: {
        examAlerts: false,
        promoAlerts: true
      }
    }, student.auth, ctx);
    const saved = await f.models.User.findById(student.user._id);
    assert.equal(A.preferences({
      user: saved
    }).notification.examAlerts, false);
    assert.equal(saved.name, 'SYNTHETIC UPDATED');
    assert.equal((await N.list({}, {
      ...student.auth,
      user: saved
    })).meta.unreadCount, 0);
    await assert.rejects(() => N.mutate(null, {
      title: 'bad',
      message: 'bad',
      category: 'general',
      link: 'https://untrusted.invalid',
      audience: {
        kind: 'all_students'
      }
    }, ctx));
    await assert.rejects(() => A.savePreferences({
      notification: {
        examAlerts: 'yes'
      }
    }, student.auth, ctx));
    assert.equal((await f.models.User.findById(other.user._id)).name, other.user.name);
  });
  await t.test('email change password, one-use OTP, recipient binding and old-session revocation', async () => {
    await f.models.User.updateOne({
      _id: student.user._id
    }, {
      $set: {
        passwordHash: await hashPassword('SyntheticPassword123!')
      }
    });
    const request = {
      newEmail: 'stage8-new-' + randomUUID() + '@example.invalid',
      currentPassword: 'SyntheticPassword123!'
    };
    await assert.rejects(() => A.emailChange({
      ...request,
      currentPassword: 'wrong'
    }, student.auth, ctx), {
      code: 'REAUTH_REQUIRED'
    });
    const response = await A.emailChange(request, student.auth, ctx);
    assert.equal(f.messages.at(-1).to, request.newEmail);
    await assert.rejects(() => A.confirm({
      challengeId: response.challengeId,
      otp: '000000'
    }, student.auth, ctx), {
      code: 'INVALID_PROOF'
    });
    const changed = await A.confirm({
      challengeId: response.challengeId,
      otp: f.messages.at(-1).code
    }, student.auth, ctx);
    assert.equal(changed.user.email, request.newEmail);
    assert.equal(changed.signInRequired, true);
    assert.equal(await f.auth.authenticate(student.token, 'student'), null);
    await assert.rejects(() => A.confirm({
      challengeId: response.challengeId,
      otp: f.messages.at(-1).code
    }, student.auth, ctx));
  });
  await t.test('expired email proofs and failed SMTP leave identity unchanged', async () => {
    await f.models.User.updateOne({
      _id: other.user._id
    }, {
      $set: {
        passwordHash: await hashPassword('SyntheticPassword123!')
      }
    });
    const before = other.user.emailNormalized;
    const request = {
      newEmail: 'stage8-expired-' + randomUUID() + '@example.invalid',
      currentPassword: 'SyntheticPassword123!'
    };
    const challenge = await A.emailChange(request, other.auth, ctx);
    await f.models.User.updateOne({
      _id: other.user._id
    }, {
      $set: {
        'challenges.emailChange.expiresAt': new Date(0)
      }
    });
    await assert.rejects(() => A.confirm({
      challengeId: challenge.challengeId,
      otp: f.messages.at(-1).code
    }, other.auth, ctx), {
      code: 'INVALID_PROOF'
    });
    await f.models.User.updateOne({
      _id: other.user._id
    }, {
      $set: {
        'challenges.emailChange.sentAt': new Date(0)
      }
    });
    const failed = createAccountService({
      authService: f.auth,
      config: f.config,
      institutions: f.institutions,
      mail: {
        send: async () => {
          throw new Error('Synthetic SMTP unavailable');
        }
      }
    });
    await assert.rejects(() => failed.emailChange(request, other.auth, ctx), {
      code: 'EMAIL_UNAVAILABLE'
    });
    const saved = await f.models.User.findById(other.user._id);
    assert.equal(saved.emailNormalized, before);
    assert.equal(saved.challenges?.emailChange, undefined);
  });
  await t.test('real HTTP RBAC, Origin and CSRF remain enforced; private imports do not leak', async () => {
    server = http.createServer(f.app());
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port + '/api/v1';
    assert.equal((await fetch(base + '/results/config')).status, 200);
    assert.equal((await fetch(base + '/admin/results/records')).status, 401);
    assert.equal((await fetch(base + '/admin/notifications', {
      headers: {
        Cookie: 'kitss_student_session=' + other.token
      }
    })).status, 403);
    assert.equal((await fetch(base + '/me/profile', {
      method: 'PATCH',
      headers: {
        Cookie: 'kitss_student_session=' + other.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'bad'
      })
    })).status, 403);
    assert.equal((await fetch(base + '/media/' + asset.id + '/content')).status, 404);
  });
});
