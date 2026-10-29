import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { stage8Fixture } from './stage8-fixture.js';
const name = process.env.KITSS_STAGE10_TEST_DB;
test('Stage 10 persisted account operations and redacted operational visibility', { skip: !name ? 'KITSS_STAGE10_TEST_DB absent; database tests not executed' : false, timeout: 180000 }, async t => {
  const f = await stage8Fixture(name);
  let server;
  t.after(async () => { if (server) await new Promise(r => { server.close(r); server.closeAllConnections(); }); await f.close(); });
  const admin = await f.fixtureUser(), student = await f.fixtureUser(['student']), staff = await f.fixtureUser(['admin'], ['accounts.read']), manager = await f.fixtureUser(['admin'], ['accounts.read', 'accounts.manage']);
  const pending = await f.fixtureUser(['student']);
  await f.models.User.updateOne({ _id: pending.user._id }, { $set: { status: 'pending' }, $unset: { emailVerifiedAt: 1 } });
  f.config.corsOrigins = ['http://localhost:5173'];
  server = http.createServer(f.app()); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/api/v1';
  const cookie = actor => (actor.user.roles.includes('student') ? 'kitss_student_session=' : 'kitss_staff_session=') + actor.token;
  const get = async (path, actor) => { const r = await fetch(base + path, { headers: actor ? { Cookie: cookie(actor) } : {} }); return { status: r.status, body: await r.json() }; };
  const csrf = await fetch(base + '/auth/csrf', { headers: { Cookie: cookie(admin) } });
  const token = (await csrf.json()).data.csrfToken;
  const csrfCookie = csrf.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
  const patch = async (id, kind, data, actor = admin, extra = {}) => {
    const r = await fetch(base + '/admin/users/' + id + '/' + kind, { method: 'PATCH', headers: { Cookie: cookie(actor) + '; ' + csrfCookie, Origin: f.config.corsOrigins[0], 'X-CSRF-Token': token, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(data) });
    return { status: r.status, body: await r.json() };
  };
  await t.test('real HTTP read permissions, exact literal search and sanitized details', async () => {
    assert.equal((await get('/admin/users')).status, 401);
    assert.equal((await get('/admin/users', student)).status, 403);
    const list = await get('/admin/users?role=student', staff); assert.equal(list.status, 200); assert.equal(list.body.meta.total, 2);
    assert.equal((await get('/admin/users?q=%5B.*', admin)).body.meta.total, 0);
    const detail = await get('/admin/users/' + student.user.publicId, admin);
    assert.equal(detail.body.data.revision, 0); assert.deepEqual(detail.body.data.summary, { orders: 0, enrollments: 0, registrations: 0 });
    assert.doesNotMatch(JSON.stringify(detail.body), /passwordHash|challenges|activeSession|securityVersion|auditOutbox|tokenHash/);
    assert.equal((await get('/admin/users?page=0', admin)).status, 422);
    assert.equal((await get('/admin/users?status[$ne]=active', admin)).status, 422);
    for (const path of ['/books', '/coaching/courses', '/colleges', '/admin/result-issuers']) {
      const response = await get(path + '?q=%5B.*', admin);
      assert.equal(response.status, 200, path + ' literal malformed regex search');
      assert.equal(response.body.meta.total, 0);
    }
    assert.equal((await get('/admin/enrollments?kind=book', admin)).status, 200);
    assert.equal((await get('/admin/enrollments?kind=book&state=expired', admin)).status, 422);
  });
  await t.test('reasoned suspension persists, invalidates old sessions, audits and rejects stale restoration', async () => {
    const id = student.user.publicId;
    const update = { status: 'suspended', expectedRevision: 0, reason: 'Synthetic reviewed account suspension' };
    assert.equal((await patch(id, 'status', update, staff)).status, 403);
    assert.equal((await patch(id, 'status', update, admin, { Origin: 'https://wrong.invalid' })).status, 403);
    assert.equal((await patch(id, 'status', update, admin, { 'X-CSRF-Token': '' })).status, 403);
    const changed = await patch(id, 'status', update, manager); assert.equal(changed.status, 200); assert.equal(changed.body.data.revision, 1);
    assert.equal((await f.models.User.findById(student.user._id)).status, 'suspended');
    assert.equal(await f.auth.authenticate(student.token, 'student'), null);
    assert.equal((await patch(id, 'status', { status: 'active', expectedRevision: 0, reason: 'stale' })).status, 409);
    assert.equal((await patch(id, 'status', { status: 'active', expectedRevision: 1, reason: 'Synthetic restore' })).status, 200);
    assert.equal(await f.auth.authenticate(student.token, 'student'), null);
    const audit = await get('/admin/audit-logs?resource=' + id, admin);
    assert.equal(audit.body.meta.total, 2); assert.ok(audit.body.data.some(r => r.reason === update.reason));
  });
  await t.test('ordinary staff permissions change without privilege escalation or invitation bypass', async () => {
    const id = staff.user.publicId, input = { roles: ['admin'], permissions: ['audit.read'], expectedRevision: 0, reason: 'Synthetic permission review' };
    assert.equal((await patch(id, 'roles', input, manager)).status, 403);
    assert.equal((await patch(id, 'roles', { ...input, roles: ['super_admin'] })).status, 422);
    assert.equal((await patch(id, 'roles', { ...input, permissions: ['accounts.roles.manage'] })).status, 422);
    assert.equal((await patch(student.user.publicId, 'roles', input)).status, 422);
    const changed = await patch(id, 'roles', input); assert.equal(changed.status, 200);
    assert.deepEqual((await f.models.User.findById(staff.user._id)).permissions, ['audit.read']);
    assert.equal(await f.auth.authenticate(staff.token, 'admin'), null);
    assert.equal((await patch(id, 'roles', input)).status, 409);
  });
  await t.test('self, super-admin and pending identity protection survives concurrent requests', async () => {
    const input = { status: 'suspended', expectedRevision: 0, reason: 'Synthetic protected case' };
    assert.equal((await patch(admin.user.publicId, 'status', input)).status, 403);
    const otherSuper = await f.fixtureUser();
    const responses = await Promise.all([patch(otherSuper.user.publicId, 'status', input), patch(otherSuper.user.publicId, 'status', input)]);
    assert.ok(responses.every(r => r.status === 403));
    assert.equal((await f.models.User.findById(otherSuper.user._id)).status, 'active');
    assert.equal((await patch(pending.user.publicId, 'status', { ...input, status: 'active' })).status, 409);
    const changed = await Promise.all([patch(manager.user.publicId, 'status', input), patch(manager.user.publicId, 'status', input)]);
    assert.deepEqual(changed.map(r => r.status).sort(), [200, 409]);
  });
  await t.test('audit/job filters and dashboard totals use persisted facts without exposing payloads', async () => {
    await f.models.Job.create({ key: randomUUID(), kind: 'result_import', state: 'dead', attempts: 3, token: 'PRIVATE_LEASE_SENTINEL', requestHash: 'PRIVATE_HASH_SENTINEL', resultSummary: { candidate: 'PRIVATE_CANDIDATE_SENTINEL' } });
    const jobs = await get('/admin/jobs?kind=result_import&state=dead', admin);
    assert.equal(jobs.status, 200); assert.equal(jobs.body.meta.total, 1); assert.equal(jobs.body.data[0].attempts, 3);
    assert.doesNotMatch(JSON.stringify(jobs.body), /PRIVATE_|resultSummary|requestHash|token/);
    for (const kind of ['notification_event', 'notification_push']) {
      await f.models.Job.create({ key: randomUUID(), kind, state: 'dead', attempts: 2, token: 'PRIVATE_DEVICE_SENTINEL', resultSummary: { token: 'PRIVATE_PUSH_SENTINEL' } });
      const noticeJobs = await get('/admin/jobs?kind=' + kind + '&state=dead', admin);
      assert.equal(noticeJobs.status, 200); assert.equal(noticeJobs.body.meta.total, 1);
      assert.doesNotMatch(JSON.stringify(noticeJobs.body), /PRIVATE_|resultSummary|token/);
    }
    assert.equal((await get('/admin/jobs', student)).status, 401); // restored account cannot reuse its revoked session
    assert.equal((await get('/admin/audit-logs', student)).status, 401);
    assert.equal((await get('/admin/audit-logs?from=bad', admin)).status, 422);
    const dashboard = await get('/admin/dashboard', admin);
    assert.equal(dashboard.body.data.overview.people.students, await f.models.User.countDocuments({ roles: 'student', status: 'active' }));
    assert.deepEqual(dashboard.body.data.overview.content.books, { published: 0, draft: 0 });
    assert.equal((await get('/public/payment-config')).body.data.available, false);
    assert.equal((await get('/results/config')).body.data.publicationEnabled, false);
  });
});
