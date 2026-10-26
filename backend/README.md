# KITSS Education backend - implemented stages and operational gates

Current Stage 11 supplement: [SMTP/Razorpay report](STAGE11-SMTP-RAZORPAY-REPORT.md). Gmail STARTTLS authenticated and six real workflow messages were accepted and owner-confirmed received. The owner's temporary authorization used disclosed credentials; rotation remains outstanding. Razorpay Test Mode read-only authentication succeeded, but payment activation/webhooks/real paid entitlements remain gated. Older stage-specific SMTP statements below are historical.

Gmail uses `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, backend-only `SMTP_USER`, `SMTP_APP_PASSWORD`, `SMTP_FROM` and optional `SMTP_FROM_NAME`. Edit only ignored `backend/.env`; its path is independent of shell working directory. After privately configuring authorized credentials, `node backend/scripts/verify-smtp.js --verify --confirm-local-smtp-use` checks the connection without sending email. `node backend/scripts/verify-razorpay-auth.js --confirm-test-key-use` performs only read-only Test Mode authentication and cannot enable checkout. Rotation/operator approval is a separate existing gate. Do not rerun live mail acceptance without a new authorized budget: the Stage 11 six-message budget is exhausted and its reservation intentionally remains.

The JavaScript Express modular monolith now includes identity/session/RBAC and SMTP, institutions/intake, books/CMS/secure media, gated verified commerce, and Stage 7 courses/plans/lessons/enrollments/progress/readers. Real SMTP workflow delivery was verified in Stage 11; rotation remains pending. Razorpay provider-connected payments, live sensitive registration and production acceptance remain gated. Video is now implemented through the private inspected-media pipeline; real publication remains scanner/content gated. See [final gap closure](FINAL-GAP-CLOSURE-REPORT.md). Read the latest stage reports before treating any prototype flow as release-ready.

Current Stage 7 status: the configured development host's collection-capacity blocker is resolved. Stages 3–7 initialize 26 application collections and pass actual-host readiness/persistence/backend restart. The host advertises a replica set; earlier inferred standalone descriptions are superseded. No topology or `.env` URI changed. Separate local standalone verification remains distinct. See [Stage 7 report](STAGE7-REPORT.md), [database cleanup](STAGE7-DATABASE-CLEANUP.md) and the Stage 7 runbook below; earlier sections retain historical stage-specific limitations.

## Stage 7 runbook

Start the existing frontend and backend in separate terminals, from the repository root:

```powershell
npm.cmd run server:dev
npm.cmd run client
```

Production-style local startup is `npm.cmd run server`; build is `npm.cmd run build`. Keep the existing Vite `/api` proxy and private backend `.env`. No new Stage 7 secret is required. Keep Razorpay rotation/operator approval disabled until separately authorized fresh credentials and provider-connected verification are available. SMTP continues to use the backend-only provider app password; no real delivery was performed in Stage 7.

Course management is `/admin/coaching`; enrollment support is `/admin/enrollments`. Existing invited staff need explicit server grants:

| Operation | Permission |
|---|---|
| Course/lesson and enrollment reads | learning.read |
| Course/lesson draft edits/archive | learning.write |
| Course publication/unpublication | learning.publish |
| Plan reads / writes | commerce.read / commerce.plans.write |
| Reasoned course enrollment revocation | learning.grants.manage |
| Existing media selection/upload | media.read / media.write |

Create a course draft with real category/language/taxonomy, published instructor, clean thumbnail and source evidence. Define stable keyed syllabus sections; attach matching ordered lessons. Current lessons support authored plain text, private scanned PDF and inspected/scanned MP4 video. Configure plan name, positive INR minor-unit price, explicit day duration, verified-account eligibility and rules approval. No price, validity, monthly/yearly/lifetime access or free policy is defaulted. Publish only when licensed dependencies and an active approved plan are ready. Unpublish the course before changing lesson/plan definitions; edits require the returned expectedRevision. Archive retains historical references. Missing scanner/clean assets keep publication blocked.

Video inspection and native playback are implemented in the final gap closure. No transcoding is performed; incompatible files are rejected. Configure FFprobe/FFmpeg and the maintained scanner as described below. `course_thumbnail` uses the existing image pipeline, `lesson_document` the existing private PDF pipeline. There is no scanner bypass flag or private static route. The actual application has no automatically created super admin, licensed course inventory or successful paid fixture; intended operator bootstrap and content approval remain deliberate owner tasks.

Public APIs retain A43–A46 (`/coaching/courses`, `/coaching/facets`, course detail and plans). A50 returns safe syllabus/lock metadata; A51 returns authorized lesson resources or an explicitly published public preview. A47 never grants free access while that policy is absent. A48/A49 list/read the owner's enrollments; A52 writes explicit completion/in-progress using expectedRevision. A53 checks the exact course/book relationship. Existing `/orders`, verification, webhook and reconciliation routes remain the only commerce contracts. `course_plan` snapshots resolve backend price/duration; provider-connected checkout is still disabled. No recurring billing, renewal extension or manual grant is enabled.

Enrollment requires a verified captured source order and a unique actual effect. The server calculates startsAt from its persisted capture time, and expiresAt from the immutable purchased day count. Expiry, revocation, user status, publication, media/licensing and source-order matching are checked at access time. Course-linked book rights end with course access and never create a permanent book purchase. Retries reuse the source-order effect under the documented Stage 6 journal/index/retry assumptions; they do not promise cross-document transactions or exactly-once network delivery. Revoked effects cannot be resurrected. A unique partial owner/course Order index prevents duplicate first-purchase orders across different plans; plan switching and renewals remain unapproved. B20 rejects arbitrary grants; B21 currently supports course revocation only and cannot mark an order paid or issue a refund.

A37–A42 persist book state/wishlist/page/bookmarks. New state uses expectedRevision=0, subsequent writes the current revision; semantic retries return current state, conflicting writes return 409. Page bounds come from inspected PDFs, not a guessed count. Supply courseId when reading in a course context; it must identify a published course containing that exact book with active enrollment. Wishlist is owner-scoped and grants no access. The minimal GET `/me/wishlist` hydrates the existing wishlist UI.

Both book-reader routes use the existing protected `/api/v1/media/:id/content` bytes with cookie authorization/range requests. Keep same-origin `/api` routing for media as well as JSON APIs. The pinned PDF.js 6.4.299 renderer displays the actual selected page on a bounded canvas and restores server page/bookmarks through page/zoom/contents controls. The parsed page count must match inspected metadata. Its worker, CMaps, fonts and WASM resources are emitted locally by Vite, with same-origin protected range transport and eval disabled. Host the complete dist assets with correct MIME types and test same-origin worker/resource CSP. Canvas text selection/search/accessibility overlays are not implemented; an authorized original-PDF link provides a browser alternative. Already delivered bytes cannot be revoked, and this is not DRM. Lesson completion requires the explicit completion action, not simply loading a resource. Course completion is completed published lessons divided by current published lessons; last lesson/activity comes from persisted progress.

Run database integration suites only with new strict random project names. With a local standalone test URI supplied as a per-command environment override, set KITSS_REQUIRE_STANDALONE=true to assert the topology. The normal backend suite skips opt-in MongoDB suites if their database variables are absent; skipped suites are not verified. Do not overwrite the application's `.env` URI to run isolated tests.

```powershell
# Fresh names: KITSS_AUTH_TEST_DB=kitss_stage3_test_<16hex>
# KITSS_STAGE4_TEST_DB through KITSS_STAGE7_TEST_DB=kitss_stageN_test_<16hex>
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:client
# Fresh KITSS_STAGE7_BROWSER_DB=kitss_stage7_browser_<16hex>:
npm.cmd --prefix frontend run test:stage7
# Run auth and Stage 4–6 browser suites sequentially, not concurrently on this workstation.
npm.cmd --prefix frontend run test:auth
npm.cmd --prefix frontend run test:stage4
npm.cmd --prefix frontend run test:stage5
npm.cmd --prefix frontend run test:stage6
node backend/scripts/verify-stage7-development.js --confirm-development
```

The development verification command is restricted to development/kitss_education_dev and retains labelled unpublished course/lesson/unconfigured-plan fixtures, checks actual-host startup/readiness/protection/indexes/persistence/restart and records safe evidence. It creates no account, admin or paid access. Its topology report is observed metadata, not a request to alter the host. Separate standalone tests do not substitute for configured-host acceptance.

The owner authorized development-only destructive maintenance in Stage 7. The capacity tool first backs up the current application and exact project test candidates, verifies readback/checksums and records private manifests outside MongoDB. It deletes nothing without the explicit cleanup flag. Uncertain resources are excluded. Backups can contain private records/password hashes: keep `.runtime` private and ignored. The logical restore verifier uses only a new database on loopback port 27187 and never connects to the configured application URI.

```powershell
# Deliberate operator inventory/backup only; not a startup command:
node backend/scripts/stage7-database-maintenance.js
# Only after stopping test writers and reviewing positively identified scope:
node backend/scripts/stage7-database-maintenance.js --cleanup-confirmed-project-tests --post-test-cleanup
# Requires the separately running local standalone test MongoDB on 27187:
node backend/scripts/verify-stage7-backup.js --local-restore-confirmed
```

The initial backed-up cleanup removed 41 obsolete project test databases/483 collections and retained all application data. A local logical restore verified the original 17 application collections. Backups are not a production retention/RPO/RTO plan. No unrelated filesystem/database data or server security was changed. See [Stage 7 report](STAGE7-REPORT.md) for exact final tests, limitations, cleanup evidence and Stage 8 approval boundary.

Final Stage 7 verification: full standalone backend 105 passed/1 optional skip; final changed contracts 35 passed; shared client 8 passed; auth and Stage 4/5/6 browser regressions 16/13/12/14 passed; final Stage 7 browser 14 passed across all seven widths. Build passes with the existing large main-chunk warning; both audits report zero vulnerabilities. After testing, 15 additional backed-up disposable databases/310 collections were removed; application counts/index counts stayed unchanged at 26 collections. See [final cleanup evidence](STAGE7-POST-TEST-CLEANUP.json).

## Runtime and dependencies

Node 22.23.4 LTS is pinned in .nvmrc/.node-version; verification used the installed Node 22.15.0/npm 10.9.2. The host runtime was not upgraded. Package engines accept >=22.15.0 <23.

| Exact dependency | Purpose |
|---|---|
| Express 5.3.0 | HTTP/router/JSON parsing |
| Mongoose 9.11.3 | MongoDB connection, schemas, constraints and atomic updates |
| Helmet 8.3.0 | Security headers |
| Pino 10.4.0 | Redacted structured logging |
| Argon2 0.45.1 | Argon2id password hashing (64 MiB, 3 iterations, parallelism 1) |
| Nodemailer 10.2.1 | SMTP authentication using a provider-issued app password |
| Busboy 1.6.0 | Bounded streaming multipart parsing |
| Sharp 0.35.5 | Bounded image decoding and metadata-free re-encoding |
| pdf-lib 1.17.1 | PDF structure/page validation in an isolated child process |

Frontend uses exact pdfjs-dist 6.4.299 for Stage 7 local PDF rendering (supported Node >=22.13.0; installed 22.15.0 is compatible), and playwright-core 1.64.1 as a development dependency, using an existing Chrome executable without downloading browsers. Node's test runner is used throughout. No Razorpay SDK, TypeScript, Redis or transaction dependency was added. SMTP options follow [Nodemailer SMTP documentation](https://nodemailer.com/smtp); hashing uses [node-argon2](https://github.com/ranisalt/node-argon2).

## Setup and commands

Run from the repository root:

~~~powershell
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
~~~

Keep the owner's MongoDB URI and all existing secrets private. The local .env was patched only for standalone mode, a random backend AUTH_SECRET if absent, and blank SMTP placeholders if absent. Existing credentials were preserved. Do not overwrite an existing .env.

Configure backend/.env:

- NODE_ENV, HOST, PORT (5000), APP_PUBLIC_URL, API_PUBLIC_URL, exact CORS_ORIGINS.
- MONGODB_URI: existing owner configuration. MONGODB_REQUIRE_REPLICA_SET=false is the Stage 3 default.
- MONGODB_DB_NAME: optional explicit database override. A URI without a database selects kitss_education_dev in development; production requires an explicit database name/path. Never use an unknown production database for development.
- AUTH_SECRET: private random value of at least 32 characters. The real auth service refuses startup without it; production validation requires it. Local configuration already has a generated value. Generate a new value in a secret manager for each deployment, never commit it.
- STORAGE_LOCAL_ROOT: absolute dedicated directory outside frontend/public, frontend/dist and .git (local file already configured).
- SMTP_HOST, SMTP_PORT=587, SMTP_SECURE=false, SMTP_USER, SMTP_APP_PASSWORD, SMTP_FROM. Use a provider-issued app password, never the mailbox's ordinary password. Set SMTP_FROM to a provider-authorized sender email address. Port 587 uses mandatory STARTTLS; port 465 uses SMTP_SECURE=true. Certificate verification and TLS >=1.2 stay enabled. SMTP debug/raw transport logging is disabled.
- AUTH_OTP_TTL_SECONDS=600, AUTH_RESEND_SECONDS=60; student absolute session 24h or remembered 30d, idle 24h; staff absolute 8h, idle 30m. These are bounded configurable engineering defaults.
- Existing MONGODB_* timeouts/pool settings, JSON_BODY_LIMIT_BYTES, REQUEST_TIMEOUT_MS, SHUTDOWN_TIMEOUT_MS, READINESS_TIMEOUT_MS, LOG_LEVEL, UPLOAD_MAX_BYTES, TRUST_PROXY_HOPS remain supported. Default proxy trust is disabled; configure hops only for a known topology without a bypass path.
- PAYMENT_PROVIDER=razorpay, PAYMENT_MODE=test, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET remain optional, backend-only placeholders. No payment calls or provider-connected tests are part of Stage 3.

Blank SMTP configuration permits backend startup, but email-dependent operations return safe delivery-unavailable responses. Verification/recovery/invitation templates are implemented; SMTP acceptance is not proof of inbox delivery. Recovery acknowledges an eligible delivery request generically, including an uncertain SMTP failure, without claiming delivery. Failed or uncertain proof delivery invalidates that challenge; retry through resend/recovery. There is no automatic email-delivery queue in Stage 3. SMTP credentials are currently absent, so live delivery is NOT verified and no real email was sent.

Two terminals:

~~~powershell
# A
npm.cmd run server:dev
# B
npm.cmd run client
~~~

Production-style local backend command: npm.cmd run server. The existing Vite /api proxy targets http://127.0.0.1:5000 and the shared client uses /api/v1 with cookies. Use localhost:5173 consistently; if the frontend port changes, update exact origins deliberately. Production requires HTTPS and a same-origin reverse proxy. Cross-site cookie deployment is not configured by weakening SameSite.

## MongoDB and consistency

Use the existing standalone-capable database; do not install MongoDB/Docker, initialize a replica set, reset data or drop collections. Connection/ping against the owner-configured URI succeeded. Backend startup validates DB/storage, creates additive security indexes, and only then listens. Existing incompatible/duplicate identity data causes index creation to fail startup safely and requires operator investigation; no automatic destructive migration or syncIndexes is performed.

Canonical collections: User, Session, AuthThrottle and AuditLog. AuthChallenge is an embedded schema under User.challenges (verify/reset/transfer/invite), rather than a separate collection. Pending staff identity contains its invitation challenge; no duplicate StaffInvitation account/model is necessary. This documented adjustment allows proof consumption plus password/verification/session-pointer change in one atomic User update on standalone MongoDB.

User email/public ID indexes are unique; student IDs are generated server-side. Random session credentials are SHA-256 hashed, persistent, expiring and revoked server-side. A student's activeSessionId pointer is authoritative; CAS replacement ensures at most one active session. Password changes/resets increment securityVersion atomically, invalidating all prior sessions even if cleanup fails. Session creation before a losing CAS can leave an unusable orphan until TTL deletion; it cannot authorize access.

Challenges store HMACs using the backend secret, expire synchronously, allow five wrong attempts, and are consumed atomically with their effect. Resends replace old proofs, with a 60-second cooldown. Transfer proof expires in two minutes and requires confirmed:true; only the original active-session pointer/version may be replaced. A new transfer challenge supersedes an older challenge. No browser fingerprint authorizes transfer.

Security events are appended to User.auditOutbox in the same identity mutation, upserted by unique event ID into AuditLog, then removed from the outbox. A temporary audit outage preserves durable events and retries on authentication, maintenance and startup. New security changes fail closed once the outbox backlog reaches 999 events. No caller can edit audit records through an API. Expired challenges are removed at startup and hourly; expiry is enforced before cleanup. Session/throttle TTL cleanup is asynchronous and never substitutes for authorization checks.

Stage 3 uses no multi-document transactions. **Stage 6 must obtain separate approval for its payment consistency strategy**, potentially a replica set or rigorously reviewed alternative. Standalone auth success is not evidence of transactional payment readiness. Mandatory compromised Razorpay credential rotation remains an owner task before Stage 6.

## API contracts

Paths below are relative to /api/v1. Success is {data,requestId}; errors are {error:{code,message,fields?},requestId}. Credentials never appear in success DTOs except short-lived transfer capabilities delivered only after valid credentials. All responses are no-store. Cookie mutation routes require an exact allowed Origin and a signed, host-only HttpOnly double-submit CSRF cookie/header pair, including login/recovery. GET /auth/csrf returns the corresponding header token; the shared client obtains/renews it.

| ID | Operation | Contract |
|---|---|---|
| A01 | GET /auth/csrf | {csrfToken}; no authentication required |
| A02 | POST /auth/login | {identifier,password,rememberMe?,deviceLabel?,kind?}; email/student ID; kind=student or admin; server validates roles; user/session + HttpOnly cookie |
| A03 | GET /auth/me | safe user/permissions/session; 401 if invalid, expired, revoked, suspended or pointer/version mismatch |
| A04 | POST /auth/logout | {}; revokes browser sessions, expires both portal cookies; idempotent 204 |
| A05 | POST /auth/session/transfer | {challengeId,proof,confirmed:true,deviceLabel?}; single-use explicit student transfer |
| A06 | POST /auth/password/forgot | {identifier:email}; generic 202 {message,challengeId} |
| A07 | POST /auth/password/reset | {challengeId,otp,newPassword}; atomic reset, session invalidation, requires login again |
| A08 | POST /auth/password/change | {currentPassword,newPassword}; authenticated; invalidates all sessions |
| A09 | POST /auth/activate | {challengeId,otp}; email verification ONLY, returns safe user; no session or paid eligibility |
| A76/A77 | GET /health/live and /health/ready | process liveness / bounded DB + storage readiness; draining returns not ready |
| B17 | POST /admin/users/invitations | super admin/accounts.roles.manage; {name,email,permissions?}; creates ordinary invited admin or resends pending invitation after cooldown |
| A09 extension | POST /auth/accounts | {name,email,password}; minimal student identity, pending email verification; 202 generic challenge acknowledgment |
| A09 extension | POST /auth/email/resend | {email}; generic 202 challenge acknowledgment |
| A09 extension | POST /auth/invitations/accept | {challengeId,token,newPassword}; consumes invitation, then requires email OTP; no session |
| B17 extension | DELETE /admin/users/invitations/:publicId | {}; idempotent revocation of a pending staff identity |

DEVICE_CONFLICT is HTTP 409 with a normal error envelope plus top-level data containing challengeId/proof/expiry, never a session credential. Other conflicts use safe generic errors. Validation rejects unknown fields/operator objects/role mass assignment. Permissions are code-managed; admin receives only validated assigned grants, student receives none, super_admin receives the code-defined set. accounts.roles.manage cannot be delegated to an ordinary admin. User/Session DTOs omit internal security state. requireSession, requirePermission and requireOwner are shared future business integration points.

B14-B16/B18 general user lists/status/role mutation are deferred; no requirement to expose unneeded account CRUD or a concurrent last-super-admin removal mechanism was invented. Only the CLI can create the initial super admin; later staff invitations cannot mint another super admin. No public staff signup exists.

## Initial super-admin bootstrap (operator only; NOT RUN on the application database)

First configure working SMTP and confirm that the configured database is the intended development/deployment database. Run this explicitly from the root, with no preset account/password:

~~~powershell
$env:KITSS_ALLOW_BOOTSTRAP = 'true'
$env:KITSS_BOOTSTRAP_NAME = Read-Host 'Operator-approved administrator name'
$env:KITSS_BOOTSTRAP_EMAIL = Read-Host 'Administrator email'
$bootstrapPassword = Read-Host 'New administrator password (12-128 characters)' -AsSecureString
try {
  [Net.NetworkCredential]::new('', $bootstrapPassword).Password | node backend/src/modules/auth/bootstrap.js
} finally {
  Remove-Item Env:KITSS_ALLOW_BOOTSTRAP,Env:KITSS_BOOTSTRAP_NAME,Env:KITSS_BOOTSTRAP_EMAIL -ErrorAction SilentlyContinue
  $bootstrapPassword = $null
}
~~~

Password arrives on stdin, not command-line arguments, browser storage or logs. Unique bootstrapKey permanently prevents repeat initialization; an existing super admin also blocks bootstrap. The new identity stays pending until email OTP verification. Open /account/verify, enter the administrator email and request a fresh code (after cooldown), then verify and use Staff sign in. If email fails after identity creation, use resend; do not rerun/bootstrap/reset the database. Startup never bootstraps automatically. Tests exercise bootstrap only inside isolated disposable test data.

## Frontend integration and limits

AuthContext starts unauthenticated/loading, calls /auth/me, and clears private state on logout, account switch or detected expiry. Focus and periodic checks refresh session state; backend revocation applies immediately on the next protected request. Pending refreshes cannot overwrite a newer login/logout. Library state remounts per identity; legacy plaintext credentials/fake token keys are removed without migration. No auth secret is kept in localStorage/sessionStorage.

Existing login/layout, recovery pages and admin shell retain their styles. Added /account/create, /account/verify and /staff/accept reuse AuthLayout. Invitation capability uses a URL fragment, removed from browser history after loading. OTP/password/proofs remain component memory only. Recovery binds its challenge to route state; after reload, request a new code rather than pretending verification persisted.

All /admin routes require staff and their domain permission before rendering. Navigation uses server-authorized permissions and real identity. Existing seven business pages are visibly preview-only with disabled controls; security invitation controls are separately operational. Full business CRUD is not implemented. Student private routes are guarded. Prototype payment/enrollment shortcuts reject calls; no paid rights are seeded for new accounts. Profile editing/email changes, course/media/entitlement/progress and business intake integration remain later-stage work. The legacy exposed payment secret was removed from its source field without copying it; rotation and any Git-history cleanup remain separate owner work. No Git history was rewritten.

## Storage foundation retained

StorageProvider/LocalStorageProvider support generated safe keys; public/private/staging/quarantine separation, bounded streamed writes, checksum/metadata/read/range/delete and failure cleanup. Root/junction/path checks reject traversal and overwrite. Readiness performs storage probes. No express.static/private bytes, unauthenticated upload route, malware scanning, media entitlements or full upload lifecycle is claimed. Later modules must authorize file access before opening streams. Persistent volume permissions/backups and future S3/Cloudinary adapter remain operational work.

## Verification

~~~powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:client
npm.cmd --prefix frontend run test:auth
npm.cmd run build
npm.cmd --prefix backend audit
npm.cmd --prefix frontend audit
~~~

Normal backend tests explicitly skip real MongoDB auth integration unless opted in. To run against a **fresh dedicated database** on the configured host, never the application database:

~~~powershell
$env:KITSS_AUTH_TEST_DB = 'kitss_stage3_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
try { npm.cmd --prefix backend test } finally { Remove-Item Env:KITSS_AUTH_TEST_DB }
~~~

Optional MONGODB_AUTH_TEST_URI selects another authorized test host; database selection is always overridden by the strict unique test name. A pre-existing database is refused. Tests clean only records created in that fresh test database using explicit IDs; they never drop/reset collections or application data. Empty test database collections/indexes may remain for operator cleanup. SMTP uses .invalid addresses and fakes exclusively. The separate legacy replica-set connection test remains opt-in via MONGODB_TEST_URI and is skipped unless explicitly configured; Stage 3 does not require it.

Browser tests intercept every API and block external requests, test desktop/mobile using installed Chrome, and save ignored screenshots in frontend/test-artifacts. Set CHROME_PATH if Chrome is elsewhere; absent Chrome reports a skip. They verify frontend integration against HTTP contracts, not real inbox delivery.

Actual verification: backend 44 passed/1 explicitly skipped legacy replica-set test; shared client 7 passed; desktop/mobile browser 16 passed; frontend build passed with the existing bundle-size warning. Backend audit has 0 advisories; frontend reports 2 high affected packages (existing Vite/source-map-js). Full evidence, startup smoke and remaining gates are recorded in [the verification plan](../docs/development-plan/10-INTEGRATION-AND-TESTING.md) and [master checklist](../docs/development-plan/13-MASTER-IMPLEMENTATION-CHECKLIST.md). Production deployment, real SMTP delivery verification, runtime patch validation, MFA, business/privacy/financial policies and Stage 6 consistency/credential rotation are not completed by Stage 3.
## Stage 4 institutions and intake

The institutions module owns taxonomies, universities, colleges, collegePrograms, admissionApplications and franchiseApplications. No production business data is seeded. Publish only owner-supplied verified institutions and explicit program pricing; missing values remain drafts. Existing staff need explicit admissions.review/franchises.review grants for review actions. Admission requires a verified account. Franchise document-free submission is allowed; approval is blocked pending business policy. Selected files are local metadata only and block submission until removed. There is no upload API or automatic affiliation, student seat, payment, enrollment or staff account grant.

The public API exposes only published records with active verified parent hierarchy. Admin edits/archive use expectedRevision; stale writers receive 409. DELETE archives, retains applications and rejects active children. Admission requests and notes use idempotency keys. A guest franchise recovery link is private, expires after 24 hours, and places its capability in a consumed URL fragment; keep the link secret. Signed-in drafts are owner-bound.

Standalone integrity uses one durable domainLocks record with _id stage4-hierarchy. All module writers acquire owner:null atomically before reference checks/mutations. There is no TTL/automatic lock stealing. A crash can leave DOMAIN_BUSY until operator recovery. If this happens: stop **all** backend writers and maintenance instances; investigate the recorded owner/acquiredAt and last audit/outbox events; verify affected records and parent relationships, repairing only with explicit operator authorization; then clear that exact stale owner with a compare-and-set update to owner:null and unset acquiredAt. Restart one instance, verify writes/readiness/audit delivery, then restore others. Never clear a lock while any writer may still be running. Readiness alone does not prove this write lock is free. This is an availability tradeoff, not a transaction or Stage 6 payment strategy.

Each mutation appends its audit event atomically to the same record. Startup/hourly retries upsert AuditLog by event ID and remove delivered outbox items. A backlog of 999 events blocks further mutations until delivery recovers. Monitor domain_lock_release_failed and institution_audit_pending logs without adding PII payload logging.

Stage 4 test commands (fresh random dedicated databases on the already authorized MongoDB host):

~~~powershell
$env:KITSS_AUTH_TEST_DB = 'kitss_stage3_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE4_TEST_DB = 'kitss_stage4_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
try { npm.cmd --prefix backend test } finally { Remove-Item Env:KITSS_AUTH_TEST_DB, Env:KITSS_STAGE4_TEST_DB }
$env:KITSS_STAGE4_BROWSER_DB = 'kitss_stage4_browser_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
try { npm.cmd --prefix frontend run test:stage4 } finally { Remove-Item Env:KITSS_STAGE4_BROWSER_DB }
~~~

Tests refuse pre-existing collections, use only isolated fixtures/fake mail, and clean test-owned record IDs without drops/resets. Empty test collections/indexes remain. Stage 4 browser tests use **real** API/MongoDB, unlike the Stage 3 mocked HTTP regression suite. Final results: backend 58 passed/1 optional replica-set skip; Stage 4 browser 13 passed; auth browser 16 passed; shared client 7 passed; production build passed with existing bundle warning; both audits 0 vulnerabilities. Full evidence and deferred policies are in [STAGE4-REPORT.md](STAGE4-REPORT.md). Stage 5 and Razorpay integration require separate approval. Vite 6.4.5/source-map-js 1.2.2 remediate the prior compatible dependency advisories; final audit results supersede the historical Stage 3 counts above.


## Stage 5 books, CMS and secure media

The publishing/media modules are now assembled at startup. Six additive collections are initialized; no catalogue, real faculty claims or public site settings are seeded. See [STAGE5-REPORT.md](STAGE5-REPORT.md) for delivery evidence and limitations. Earlier Stage 3/4 descriptions are historical; Stage 5 supersedes their upload/book/CMS deferrals. Existing root start/client commands and Vite proxy are unchanged.

Keep MEDIA_CLAMAV_ENABLED=false until a real maintained local ClamAV daemon is available. MEDIA_CLAMAV_PORT defaults to 3310; only 127.0.0.1 is used. Provision signatures and sufficient StreamMaxLength for approved file sizes, restrict the daemon to loopback and verify it independently before enabling. No daemon was installed or actual-daemon scan verified here. An unavailable scanner returns error/pending and never promotes files. No trusted-upload override exists.

Authorized staff workflow: obtain explicit learning/content/media/settings grants from the legitimate operator; upload one file through the existing book editor or media screen; inspect scan state; retry scan after the daemon is configured; attach only compatible ready/clean media; save draft; supply actual rights/source evidence and explicitly approved pricing; publish with the separate publish grant. Use /admin/content for page/banner/faculty, /admin/media for status/cleanup and /admin/settings for allowlisted public settings. Ordinary students cannot upload or review full private PDFs. No paid/free full-reader access or payment is granted.

Multipart client contract: purpose and idempotencyKey fields first, then one file. Supported purpose limits: book_cover/banner/faculty/cms images 5 MiB; book_preview PDF 10 MiB; book_full PDF 50 MiB. Only PNG/JPEG/WebP and structurally safe PDFs are accepted. Upload progress is indeterminate; validation/quarantine status is reported honestly. Keep proxy/REQUEST_TIMEOUT_MS aligned with expected upload speeds. Storage root remains absolute and outside frontend public/dist; no private static mount exists.

Maintenance runs on startup/hourly. IO intents and cleanupKeys reconcile failed disk operations; stale staged intents have a 15-minute grace period. Cleanup of in-flight promotion destinations is delayed, then retried. Monitor disk capacity, quarantine growth, cleanup/audit failures and DOMAIN_BUSY. Archived/live references protect files from deletion; retention/purge policies are not invented. Use the Stage 4 stop-all-writers lock recovery procedure for a crashed mutex; never steal a live lock. Back up database and storage together and verify restoration before production.

Run the complete backend integration suite on fresh dedicated databases:

~~~powershell
$env:KITSS_AUTH_TEST_DB = 'kitss_stage3_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE4_TEST_DB = 'kitss_stage4_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE5_TEST_DB = 'kitss_stage5_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
try { npm.cmd --prefix backend test } finally { Remove-Item Env:KITSS_AUTH_TEST_DB,Env:KITSS_STAGE4_TEST_DB,Env:KITSS_STAGE5_TEST_DB }
npm.cmd --prefix backend run test:client
$env:KITSS_STAGE5_BROWSER_DB = 'kitss_stage5_browser_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
try { npm.cmd --prefix frontend run test:stage5 } finally { Remove-Item Env:KITSS_STAGE5_BROWSER_DB }
~~~

Tests refuse existing test collections and use fake mail/scanners in isolated databases only. Chrome is required for browser tests (optional CHROME_PATH). Without opt-in DB variables, integration suites explicitly skip. Do not set test names to the application database. Run browser suites separately to avoid cold-load resource contention. Frontend artifacts/screenshots are ignored.

The controlled application-database smoke was explicitly authorized and already executed. Its [retained record report](STAGE5-DEVELOPMENT-VERIFICATION.json) contains no credentials. The script node backend/scripts/verify-stage5-development.js --confirm-development is **not** a routine unit test: it checks development classification, creates additional labelled retained records and retires only its own test actor. Do not rerun against shared/production data or treat its retained fixtures as publishable content. Actual publication used generated data only inside isolated test databases.

SMTP remains optional/blank and no real email was sent. The first operator still needs an approved bootstrap and working SMTP. Razorpay secrets remain backend-only optional placeholders; rotate the compromised test credential before Stage 6. No SDK/orders/Checkout/webhooks/provider-connected tests were added. Stage 6 requires separate owner approval and a standalone payment consistency decision plus pricing/access/tax/refund/invoice policies.

## Stage 6 commerce (offline until operational gates are met)

The same modular monolith now owns Order (embedded PaymentAttempt), BookEntitlement, RegistrationApplication and Job. Critical commerce writes request journaled acknowledgment (w:1,j:true). No MongoDB transaction/replica set is required, no topology change was made, and no payment SDK/dependency was added. [STAGE6-REPORT.md](STAGE6-REPORT.md) records implementation, tests, failure assumptions and blocked work; it supersedes earlier payment deferrals as to offline infrastructure only.

**Current configured-host blocker:** kitss_education_dev is reachable but its host rejects new collections at the 500-collection limit. Stage 6 needs four additive collections. Application startup can fail safely at index initialization until the owner provides capacity; no destructive cleanup or silent schema bypass was performed. Tests used a separate local standalone MongoDB process with a fresh ignored data directory. The configured URI was never replaced. [Configured-host evidence](STAGE6-DEVELOPMENT-VERIFICATION.json) and [separate local retained smoke](STAGE6-ISOLATED-DEVELOPMENT-VERIFICATION.json) are distinct; do not treat local success as configured-host verification.

Payment environment remains backend-only: PAYMENT_PROVIDER=razorpay, PAYMENT_MODE=test, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET and optional RAZORPAY_CREDENTIALS_ROTATED=false. Missing keys do not require provider initialization. The existing ignored .env was appended only with the safe rotation default; existing secrets were preserved. No frontend secret/key variable is required.

No provider request was made here. Before any provider-connected use, the operator must revoke/rotate the compromised old API credential and separately configure a fresh webhook secret in the Test Mode dashboard, configure fresh backend credentials and deliberately set RAZORPAY_CREDENTIALS_ROTATED=true. Then, and only after owner confirmation, execute:

~~~powershell
node backend/scripts/approve-razorpay.js --confirm-rotated-test-credentials
~~~

This deliberately performs a read-only Test Mode API authentication check (no order/payment), then stores a private ignored fingerprint in backend/.runtime/razorpay-test-approval.json. Flag alone is insufficient. Approval must match all configured credentials and is accepted at startup for seven days; credential change invalidates it. Restart the backend after validation/config changes. Never copy/share the approval file or old credentials. No approval file was generated during Stage 6. Live keys/mode are rejected; no automatic switch or recurring subscription exists. A controlled real Test Mode order/capture/webhook acceptance run is still required before operational approval; this report does not claim it passed.

Order invariants: server resolves an eligible published/licensed/clean positive-price book; stores immutable owner/product/price/scope; owner/key/hash deduplicates order creation; unique owner/book prevents duplicate purchase aggregates. New requests for an existing book resume history. A never-started order may bind freshly approved credentials at its first durable provider intent; already-started/uncertain operations retain their original scope and require investigation after rotation. Provider creation persists one intent before one call. Timeout/crash leaves creating/unknown, never a blind retry. Reconciliation can positively bind one matching receipt; no match/ambiguity goes to investigation. Existing unstarted orders expire after 24 hours; later verified captures are still reconciled. No staff endpoint can alter historical amounts or mark unpaid orders paid.

Checkout signatures use the stored provider order ID; authenticated provider reads must confirm order/payment relationship, exact amount/currency and capture/paid totals in the approved Test credential realm. Authorized/failed/dismissed states grant nothing. Capture atomically stores a fulfillment obligation. The downstream BookEntitlement upsert has unique orderId and userId/bookId; retries can recover between effect creation and acknowledgment. Revoked effects cannot be re-granted by reconciliation. Access checks actual entitlement + captured source + current clean/licensed publication; price changes do not rewrite historical snapshots. Cross-document atomicity and exactly-once network delivery are not claimed. Assumptions: acknowledged journaled writes survive, indexes and trusted code remain intact, no unauthorized DB edits, maintained workers and healthy storage/backups.

Worker runs every 15 seconds, max 20 event/order claims per tick, 60-second leases with token-fenced completion, exponential backoff capped at one hour and eight-claim dead letters. Webhooks are bounded raw JSON/HMAC before browser CSRF, persisted as safe Job receipts before acknowledgment, and never store card details or raw provider payloads. Status is derived from provider reads, not the payload. Delayed events/restarts share settlement. Operators inspect /admin/orders filters/details/dead state; B24 schedules verified reconciliation with a fresh retry budget. Never repair financial truth by editing status or clearing leases while a worker may still be live. Uncertain creation/multiple captures/old credential scope need provider-supported investigation, not invented refunds.

Existing /books/:id/checkout uses backend orders and Standard Checkout, honest unavailable/pending/failed/captured/activation-pending state, bounded polling and order ID in URL for refresh recovery. /orders uses owned persisted history/receipt data and account-change cleanup. /my-books provides only verified secure PDF links; complete reader/progress/bookmarks stay later-stage. Payment receipts are clearly labelled Test Mode JSON, never official tax invoices; A61 returns INVOICE_POLICY_PENDING. Refund execution is absent.

Existing study/tuition/teacher/coaching-profile forms can save/reload verified-owner drafts and retain their non-document fields. The URL includes an owned application reference. Identity-number/file inputs are explicitly disabled; required document slots remain outstanding. Submission, registration orders, activation and teacher privileges are blocked pending privacy/eligibility/review policies. /admin/registrations can inspect drafts/add notes only. /admin/settings -> registrationFees configures explicit minor-unit fee approval metadata; it does not enable charges. Book pricing still uses existing G05 and publish validation. Coaching checkout, G08 plan catalogue, enrollment and renewals remain blocked until Stage 7 supplies approved product/validity rules.

/admin/orders uses commerce.read/commerce.reconcile. The existing dashboard uses actual Test Mode pending/authorized/captured/fulfillment summaries, separates simulated records and never labels gross capture as net revenue, profit, taxes or settlement. No payment override/refund/security-secret controls were added. Assign new permissions explicitly through the existing invitation process; ordinary staff grants are not expanded automatically.

Run all database-backed checks against an isolated authorized host. The local verification server was localhost:27186; it is a temporary test instance, not the application database and may be stopped after verification. If restarting it, use the exact retained .runtime/stage6-mongo-process.json data root with the cached binary and loopback binding; do not point mongod at an existing data directory. Do not delete remote collections to make room for tests.

~~~powershell
# Only for a separate authorized local test server, in this terminal:
$env:MONGODB_URI = 'mongodb://127.0.0.1:27186/kitss_test_host'
$env:KITSS_AUTH_TEST_DB = 'kitss_stage3_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE4_TEST_DB = 'kitss_stage4_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE5_TEST_DB = 'kitss_stage5_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE6_TEST_DB = 'kitss_stage6_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:client
$env:KITSS_STAGE6_BROWSER_DB = 'kitss_stage6_browser_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
npm.cmd --prefix frontend run test:stage6
# Also run existing auth, Stage 4 and Stage 5 browser scripts, one suite at a time.
# Clear per-terminal overrides before running the application:
Remove-Item Env:MONGODB_URI,Env:KITSS_AUTH_TEST_DB,Env:KITSS_STAGE4_TEST_DB,Env:KITSS_STAGE5_TEST_DB,Env:KITSS_STAGE6_TEST_DB,Env:KITSS_STAGE6_BROWSER_DB -ErrorAction SilentlyContinue
~~~

The Stage 6 browser harness alone supplies a fake browser Checkout widget/presentation bridge; aggregate records remain simulated, and real backend owner/CSRF/provider-verification checks run. It blocks external requests. There is no application fake-checkout switch or public fake-provider API. The retained development script is an explicit non-routine tool: node backend/scripts/verify-stage6-development.js --confirm-development creates labelled fake-provider fixtures, refuses non-development classification and retires only its own actor. --isolated selects a separately labelled evidence artifact; it does not change the MongoDB host by itself. Only run it after confirming environment/capacity. No actual-host success is claimed while the collection limit remains.

Operational gates remain: fresh credential rotation/operator validation, real provider Test Mode acceptance, configured-host capacity/persistence, scanner/licensing, SMTP, registration/free-access/plan policies, fiscal/refund/legal invoices and durable backup/operator ownership. Stage 7 requires separate approval.

## Stage 8: results, notifications and account settings

Existing start commands remain `npm.cmd run server:dev` and `npm.cmd run client`. No new environment variables, dependencies or provider credentials are required. Official result publication is deliberately disabled in application composition: an admin-entered source reference or request `sourceApproval` cannot enable it. A separate owner-approved source authorization/access policy is required before releasing real results. The injectable approval adapter is exercised only by isolated synthetic tests; no external board integrations or scraping exist.

`/admin/results` manages issuer/exam drafts, source notes, candidate-record review, private JSON imports, correction drafts and reasoned withdrawal. Permissions remain `results.read`, `results.manage` and `results.publish`. Imports additionally require existing media read/write permissions and an operational scanner. Upload purpose `result_import` is private JSON (2 MiB, 1-200 rows), scanned/inspected through the existing media service; it is never public or statically served. The raw file is read only by authorized staff. Imported records retain asset/checksum/batch/external-reference provenance; referenced sources cannot be deleted.

B27 uses `{examId,assetId,mappingVersion:"kitss-results-v1",idempotencyKey}` for a dry run. To commit, repeat it with `dryRun:false` and the returned `validationToken`. Dry-run proof binds the current source checksum and issuer/exam revisions. Import retries reuse the existing Job and per-candidate academic version; interrupted imports can be retried with the same key. Payment workers/queue summaries filter payment_event jobs so result imports cannot enter payment processing. No separate queue/model was added.

A JSON file contains an array of rows in this shape (field names only; supply actual authorized data):

```text
{
  rollNumber, userPublicId,
  student: { name, schoolName?, enrollmentNumber? },
  subjects: [{ code, name, maxMarks, obtained, grade? }],
  totals: { max, obtained, percentage, status, grade?, sgpa?, cgpa? },
  verificationFields: { /* issuer-defined text/date keys */ },
  issueDate: "YYYY-MM-DD", externalId
}
```

Mapping v1 accepts integer subject marks, reconciles totals/percentage, preserves source grades/status, and requires an existing active verified candidate account. It does not infer grades, pass thresholds, institutional claims, signatures or candidate identity. Issuer field schemas allow bounded text/date fields only, never scripts or arbitrary validation code. Verification values are HMAC-protected in records and omitted from DTOs. Academic `revision` identifies the immutable corrected version; record mutation `expectedRevision` is a separate CAS token returned by review APIs. Corrections supply a complete corrected row plus reason/source, leaving the published original unchanged. Withdraw a prior published version before publishing a replacement when source authorization is eventually enabled. Imports default to draft; production publication/lookup remains closed without the trusted-source adapter.

A62-A65 use existing result contracts. Lookup matches exact issuer/exam/normalized roll AND signed-in verified candidate ownership plus configured verification fields. Wrong identity/proof, drafts and withdrawn records return no result. No public candidate search or academic records are generated. `/results` renders only returned records, with actual stored subjects/totals and existing print/PDF export. The displayed record copy makes no issuer digital-signature/QR claims.

`/admin/notifications` uses G14/B34 with `notifications.read`, `notifications.write` and separate `notifications.publish`. Audience is all students, up to 100 explicit active user IDs, or a course with current verified enrollment. Published content is immutable; archive and compose a new draft to change it. Ordinary users get owner-targeted published notices only. Unique receipts persist idempotent reads, API pagination/unread totals drive the bell/page, and mark-all uses a server-list cutoff so later notices stay unread. No WebSockets/push/email notification platform was added. Category preferences filter exam/course/promotional notices; general targeted notices remain visible.

A10 updates only name, phone and board/class profile metadata; avatar upload/edit is not enabled. A13/A14 persist typed notification and validated taxonomy selector preferences on User. Existing profile/settings forms save server values; browser cache clearing removes only saved local course-filter preferences and says so. Email changes (A11/A12) reauthenticate the current password and bind a one-use, expiring, attempt-limited SMTP code to the new address, account security version and requesting session. Failed/expired delivery does not change identity. Confirmation atomically consumes the proof and updates the unique email, rotates the security version and requires sign-in again. The same backend SMTP/app-password transport is reused; real SMTP acceptance remains an operational gate.

Six necessary collections are added: resultIssuers, exams, resultRecords, resultHistory, notifications and notificationReceipts (32 total application collections). Existing User and Job are extended; existing application records are retained. See [Stage 8 report](STAGE8-REPORT.md) for actual tests, cleanup evidence and unresolved gates. Stage 9 requires separate owner approval.

Verification uses fresh `KITSS_STAGE8_TEST_DB=kitss_stage8_test_<16hex>` / `KITSS_STAGE8_BROWSER_DB=kitss_stage8_browser_<16hex>` names. Run `node --test backend/tests/stage8.mongodb.integration.test.js`, `npm.cmd --prefix frontend run test:stage8`, and `node backend/scripts/verify-stage8-development.js --confirm-development`. Browser focus can be set deliberately with `KITSS_STAGE8_BROWSER_FOCUS` for targeted reruns; report selected coverage explicitly. Test fake source/scanner/mail adapters are never installed by server startup. The existing backed-up maintenance tool accepts `--stage8 --cleanup-confirmed-project-tests` and writes separate Stage 8 evidence after validating strict project ownership; run it only after all test writers stop.

## Stage 9 integration verification

Start the existing backend and frontend in separate terminals with `npm.cmd run server:dev` and `npm.cmd run client` from the repository root. Environment files and business gates remain unchanged. See [Stage 9 report](STAGE9-REPORT.md) for completed checks, failures/reruns and release blockers; Stage 10 requires separate approval.

`KITSS_STAGE9_BROWSER_DB=kitss_stage9_browser_<16hex>` enables `npm.cmd --prefix frontend run test:stage9` against a new guarded test database. `KITSS_STAGE9_BROWSER_FOCUS` selects an explicitly reported targeted rerun; unset it for full route/seven-width coverage. Focused evidence is separate from the full route manifest. `KITSS_BROWSER_WORKFLOWS_ONLY=true` omits unchanged responsive loops in Stage 5/6/7 suites without removing their workflow assertions. Always run browser suites sequentially on this workstation. The Stage 8 account/notification combined regression must run without its focus filter.

`node backend/scripts/verify-stage9-development.js --confirm-development` checks only the exact configured development database, starts ephemeral backend/Vite listeners, temporarily permits their loopback origin in memory, checks security boundaries and retained drafts across backend restart, and writes sanitized acceptance evidence. It performs no application fixture creation or form submission. Run `node backend/scripts/stage7-database-maintenance.js --stage9 --cleanup-confirmed-project-tests` only after all test writers stop: the existing development-only tool verifies private backups before deleting positively identified disposable project test databases, preserves the application database and writes separate Stage 9 cleanup evidence. Private backups/screenshots/logs stay ignored; do not publish them.

## Stage 10 account and operational administration

Stage 10 completes original UI/backend/admin connections; it excludes deployment, hosting/domain setup and production release. See [Stage 10 report](STAGE10-REPORT.md) and [F01-F26 traceability](STAGE10-FEATURE-TRACEABILITY.md) for exact completed tests and remaining gates. Existing root `server:dev`/`client` commands and environment files are unchanged; no dependency or collection is added.

`/admin/users` requires `accounts.read`. Explicit `accounts.manage` allows reasoned suspension/restoration of an already verified active/suspended account, with optimistic revision and old-session invalidation. Pending/archived activation, self edits and every super-admin edit are forbidden. Only super admins may update existing ordinary staff's fixed code-allowlisted permissions with B18; student promotion and super-admin promotion/demotion are unavailable. New staff still uses invitation, chosen password and OTP. Operator bootstrap/recovery remains the super-admin lifecycle boundary. Ordinary staff receives neither new permission implicitly.

`/admin/audit-logs` (`audit.read`) and `/admin/operations` (`operations.read`) are read-only, filtered/paginated safe projections; they expose no proofs, session/lease tokens, job payloads or result candidate data. Audit reasons should contain operational context rather than sensitive information. Job retries are not arbitrary admin controls; payment verification/reconciliation stays in Orders. Dashboard counts are timestamped actual total records, including drafts/inactive records, not inferred revenue or approvals. Enrollment review adds read-only book rights/source verification; book revocation/manual grants remain policy-gated.

CMS cards accept `heading | body | optional link key` in the existing editor; categories and the category sheet apply published card text to allowlisted routes. `results` joins the existing safe links. Public brand names reach the actual header; footer links use `internal | /about` or `external | https://...` lines in Site Settings and the existing server validation. Reserved publicFeatures switches remain unavailable because runtime enforcement is not implemented. Identity/document collection, registration activation, official results and real payments remain gated as before.

New tests use fresh `KITSS_STAGE10_TEST_DB=kitss_stage10_test_<16hex>` and `KITSS_STAGE10_BROWSER_DB=kitss_stage10_browser_<16hex>` names. Run `node --test backend/tests/operations.mongodb.integration.test.js`, `node --test backend/tests/registration-fields.test.js`, `node --test backend/tests/registration-roundtrip.mongodb.test.js` with fresh `KITSS_STAGE10_INTAKE_TEST_DB=kitss_stage10_test_<16hex>`, `npm.cmd --prefix frontend run test:stage10` and `node backend/scripts/verify-stage10-development.js --confirm-development`. The existing Stage 9 route audit accepts `KITSS_STAGE10_ROUTE_AUDIT=true` to write separate Stage 10 evidence. Avoid concurrent browser suites. Exact skipped/failed runs are recorded in the report.

The existing backed-up development maintenance tool supports `--stage10 --cleanup-confirmed-project-tests`, with separate Stage 10 evidence. Optional `--completed-backend-tests-only` positively restricts selection to guarded `_test_` databases and excludes all `_browser_` databases; use it only once backend writers have stopped if collection capacity must be reclaimed while browser work continues. Final all-test cleanup requires all writers stopped. Application/unrelated data is preserved, ownership and private backup readback are mandatory, and private backups must never be published.

Final Stage 10 refinements: editable routes wait for initial session resolution before mounting, while actual account switches retain their identity-key remount/clearing. Registration owner responses omit internal review notes; authorized admin responses retain them. Concurrent book fulfillment reuses only a committed effect with the exact same owner/book/source-order/purchase/mode binding; unrelated effects and revocations still fail closed. These final changes have focused acceptance recorded separately from the earlier full backend run. `KITSS_STAGE10_BROWSER_FOCUS` deliberately selects a named browser child for a disclosed targeted rerun; unset it for the full Stage 10 suite.

## Final gap closure: private video lessons

Use the existing `/admin/coaching` lesson editor, **Lesson video** picker and `/admin/media` quarantine/rescan/deletion controls. Unpublish the course before changing lessons. Upload a compatible file, wait for **Clean and ready**, preview the authorized file, select it, save the lesson with published status, then republish the course with licensing/source evidence. Missing or unclean files cannot be linked/published. Uploads show byte progress followed by inspection/scanning status. Unreferenced files can be deleted through existing Media Management; referenced files cannot be deleted. Replacement never deletes a still-referenced original or preserves student access to a detached original.

The initial format is fast-start MP4 (moov before mdat), exactly one H.264 Baseline/Constrained Baseline/Main/High 8-bit yuv420p stream, at most 1920x1080, 60fps, level 4.2; optional one mono/stereo AAC-LC stream; positive duration up to two hours. Other tracks/codecs, malformed/truncated framing or failed complete decode are rejected. Re-export incompatible source content outside KITSS; this stage does not implement a transcoder. The generated synthetic test clip has no third-party lesson content.

Optional backend configuration (see `.env.example`; existing developer `.env` is preserved):

| Variable | Default / purpose |
|---|---|
| MEDIA_FFPROBE_PATH | `ffprobe`, or an absolute executable path |
| MEDIA_FFMPEG_PATH | `ffmpeg`, or an absolute executable path |
| MEDIA_VIDEO_MAX_BYTES | 268435456 (256 MiB), also bounded by UPLOAD_MAX_BYTES |
| MEDIA_VIDEO_UPLOAD_TIMEOUT_MS | 120000, maximum 600000 |
| MEDIA_VIDEO_INSPECTION_TIMEOUT_MS | 120000 per tool, maximum 600000 |
| STORAGE_MIN_FREE_BYTES | 1073741824 (1 GiB reserve beyond a new upload's maximum size) |

Check tool discovery with `Get-Command ffmpeg,ffprobe` on Windows; an installed WinGet package may require absolute executable paths in the private backend environment. Values are executable paths, never commands/flags. Two inspection jobs at most run per backend process; excess attempts return a retryable busy error. Inspection uses bounded output, a single-allocation limit, timeout, pipe-only input protocols and full packet/decode passes. Keep native tools maintained; allocation limits are not an OS-wide process-memory sandbox. See [official ffprobe options](https://ffmpeg.org/ffprobe.html) and [FFmpeg protocol restrictions](https://ffmpeg.org/ffmpeg-protocols.html).

ClamAV remains mandatory: provision a maintained loopback INSTREAM daemon and signatures, and deliberately configure `MEDIA_CLAMAV_ENABLED=true` only after independent acceptance. Align its stream-size/time limits with the approved video maximum, and allow time for upload plus inspection/scanning in any future reverse proxy. No scanner was installed, enabled or bypassed. Scanner absence leaves validated media quarantined; missing inspection executables reject the upload safely. Course/source licensing confirmation remains separate from technical inspection.

POST `/api/v1/media` still uses purpose/idempotencyKey/file, with `lesson_video`. Existing lesson CRUD uses `videoAssetId`; A51 adds `video:{assetId,url,mime,durationSeconds}`. Existing media content delivers private MP4 via authenticated 200/206 and safe 416 (`Content-Range: bytes */size`), checking current course/lesson publication, course rights and current account/enrollment/source-order/expiry/revocation on every new request. Public previews require explicit lesson publication/preview permission. Native media must keep same-origin `/api` routing through the Vite proxy, like the existing PDF reader; no public file URLs or static directories are added.

A52 accepts `positionSeconds`, the current `videoAssetId`, `status` and `expectedRevision`. The server derives duration from inspected MediaAsset metadata, validates position and binds progress to the user/course/lesson/current video. Replacement resets displayed resume/completion for the new video while retaining the existing progress record/revision. Course percentages derive from current published lessons; completion is a learner activity marker, not proof of attendance/certification. Native HTML5 controls provide play/pause/seek/volume/mute/fullscreen, plus a speed selector and loading/buffering/error messages. Position saves every 15 seconds while playing and on pause/hidden/manual save, bounded to five seconds between normal attempts; conflicts/network errors remain visible. An ended event queues behind an in-flight position save. Leaving a lesson cancels pending progress work; an identity epoch check also blocks continuation under a changed account, including after CSRF preparation. Resume uses the last successful server save, not browser localStorage. Abrupt browser termination can lose the final unsaved interval, and previously delivered bytes cannot be revoked (not DRM).

Focused checks from repository root, using fresh strict isolated DB names and installed tools configured in the command environment:

```powershell
$env:KITSS_VIDEO_TEST_DB = 'kitss_stage10_test_' + [guid]::NewGuid().ToString('N').Substring(0,16)
node --test backend/tests/video.test.js backend/tests/video.mongodb.integration.test.js
$env:KITSS_VIDEO_BROWSER_DB = 'kitss_stage10_browser_' + [guid]::NewGuid().ToString('N').Substring(0,16)
npm.cmd --prefix frontend run test:video
```

Set KITSS_VIDEO_WORKFLOWS_ONLY=true only for a deliberate workflow-only rerun that omits the unchanged seven-width loop; report that omission. The tests use real MP4 inspection/decoding and actual private HTTP ranges. Scanner approval and paid enrollment creation use existing isolated fake scanner/payment adapters, never production bypass flags or provider calls. Opt-in tests explicitly skip without isolated DB/tool inputs; a skipped test is not acceptance. Review the final report for executed results, operational gates and real-device limits.
# Final audit and original-scope gap closure

See [final completeness audit](FINAL-PROJECT-COMPLETENESS-AUDIT.md) and [requirement matrix](FINAL-PROJECT-REQUIREMENTS-MATRIX.md) for current status; stage checkmarks are historical evidence, not full operational acceptance. The final audit adds CMS home `about-teaser`, signed-in course-selector preference save/restore, catalogue pagination, taxonomy/instructor search, bounded multi-page enrollment hydration, course outcomes/benefits, plan features/popular/sortOrder, actual selectable/accessible PDF text and keyboard/zoom improvements. Existing plan/course APIs and permissions remain; new editorial fields do not enable financial/access policies.

`npm.cmd --prefix frontend run test:completeness` requires Chrome and a fresh `KITSS_COMPLETENESS_BROWSER_DB=kitss_stage10_browser_<16 lowercase hex>`; it uses real isolated MongoDB/HTTP and explicit synthetic scanner/payment fixtures. `KITSS_PROJECT_AUDIT=true` extends the existing stage9 browser suite to all admin sections at 320/375/390/414/768/1024/1280/1440px and writes separate final-route evidence. Never point fixture variables at the application database. Both suites keep the existing same-origin Vite `/api` proxy.
