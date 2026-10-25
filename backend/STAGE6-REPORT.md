# Stage 6 implementation report - 24 October 2026

## A. Implementation summary

The safely achievable Stage 6 offline/Test Mode commerce scope is implemented in the existing JavaScript modular monolith. It includes provider interfaces, backend-priced internal orders, verified capture state, durable standalone reconciliation/fulfillment, book entitlement checks, raw signed webhook receipts, registration drafts/fee metadata, existing frontend payment-state handling and admin review/financial summaries.

**Provider-connected payments remain disabled.** Fresh Razorpay credentials are not configured or confirmed; the rotation flag is false, no operator approval was created and no real Razorpay API/order/capture/webhook/live payment occurred. The configured development host also has a concrete 500-collection capacity blocker. Its Stage 6 persistence/index/restart smoke did not run successfully. Automated database tests and a separately labelled retained development smoke used a fresh separate local standalone MongoDB server; their success is not presented as actual-host acceptance.

Registration charges/submission/activation, sensitive uploads, coaching purchases/renewals and official invoices/refunds remain blocked by unresolved policies or absent course domain. No fake ordinary-user payment success, teacher-role grant, production deployment or Stage 7 implementation was introduced.

## B. Files changed and dependencies

Existing uncommitted Stage 1-5 work was preserved. Nothing was reset, staged or committed. Git status includes that prior work; this list describes Stage 6 changes only.

| Area | Files |
|---|---|
| New backend commerce module | src/modules/commerce/{commerce.models.js,payment-provider.js,payment.service.js,registration.js,commerce.routes.js,index.js} |
| Backend integration | src/app.js, src/server.js, src/config/env.js, src/modules/auth/security.js, src/modules/media/media.service.js |
| Existing pricing/settings extension | src/modules/publishing/{publishing.models.js,validation.js,publishing.service.js} |
| Configuration/operator tools | backend/package.json; .env.example and ignored .env (safe false rotation flag only); scripts/approve-razorpay.js; scripts/verify-stage6-development.js |
| Backend tests | tests/{commerce-fixture.js,commerce.test.js,commerce.mongodb.integration.test.js}; publishing-fixture.js now accepts isolated Stage 6 names and closes resources after failed initialization |
| New frontend commerce services | modules/user/services/commerceService.js; existing razorpayService.js/orderService.js replaced unsafe prototype behavior |
| Existing book integration | BookCheckoutPage.jsx, BookDetailsPage.jsx, MyPurchasedBooksPage.jsx, services/bookService.js |
| Existing registration forms | StudyRegistrationForm.jsx, TuitionCoachingForm.jsx, TeacherProfessorForm.jsx, CourseRegistrationPage.jsx; new RegistrationDraftControls.jsx |
| Existing coaching gate | CourseDetailsPage.jsx adds an explicit policy gate; CourseSubscribePage.jsx removes invented purchasable plans/durations and remains explicitly unavailable |
| Admin | new AdminOrdersPage.jsx (including FinancialSummary), AdminRegistrationsPage.jsx; existing AdminDashboardPage.jsx, AdminSiteSettingsPage.jsx, AdminRoutes.jsx, AdminLayout.jsx |
| Browser tests | frontend/tests/commerce.browser.test.js; publishing.browser.test.js updates the legitimate Stage 6 unavailable-CTA expectation; frontend/package.json adds test:stage6 |
| Documentation/evidence | README, development-plan 04-13, this report, STAGE6-DEVELOPMENT-VERIFICATION.json and STAGE6-ISOLATED-DEVELOPMENT-VERIFICATION.json |

Backend paths are relative to backend/. Frontend names above refer to the existing modules/admin or modules/user tree. No second frontend/backend, HTTP client, database migration framework, external queue or empty course modules were generated.

No npm dependency was installed or upgraded for Stage 6. Native Node fetch/crypto and the existing Express/Mongoose/storage/test stack suffice. Both dependency audits report zero vulnerabilities. Runtime pin remains Node 22.23.4; execution used installed Node 22.15.0/npm 10.9.2, so the pinned patch remains unverified. A cached MongoDB 7.0.24 test binary was run in a new ignored loopback-only test data directory; no existing database topology/data directory was changed.

## C. Commerce architecture and standalone consistency

Four additive collections: orders, bookEntitlements, registrationApplications and jobs. PaymentAttempt is an embedded Order schema; no separate paymentAttempts collection was created. This intentional refinement supersedes the earlier transaction-based planning proposal.

Order authoritatively records immutable owner/product/price/currency/provider-scope and simulation snapshots; idempotency hash; provider operation intent/binding; bounded payment observations; captured reference/evidence; durable fulfillment obligation/effect marker; revision; reconciliation job/lease/backoff state; and embedded audit outbox. Critical commerce writes request w:1,j:true. Audit delivery also requests journaling before removing a durable outbox event.

Unique indexes cover owner/idempotency key, internal reference, provider/mode/provider-order reference, provider/mode/payment references and owner/book product. BookEntitlement has unique source order and unique user/book. One aggregate per owner/book is deliberate: later requests resume the existing purchase rather than introducing multiple open orders. No renewals or second-purchase policy was invented.

Capture and its fulfillment obligation commit atomically in one Order update. Entitlement upsert is a separate durable effect keyed by source order. A crash after capture leaves pending fulfillment; a crash after entitlement but before acknowledgment reuses the same effect. Concurrent workers cannot create duplicate grants under the unique constraints. Revocation is not overwritten by retry. Status/media access cannot substitute a payment marker for an actual entitlement. A missing effect can be recovered; owner status does not report applied when its corresponding entitlement is absent.

This is **not full cross-document atomicity or exactly-once network delivery**. Correctness assumes healthy journaling/storage, acknowledged writes preserved, intact unique indexes, trusted database writers, maintained workers and operator investigation of dead letters. Unauthorized database edits, backup rollback/disk loss and provider anomalies require reconciliation/restore investigation. No mutex is described as a database transaction. The shared Stage 4/5 lock only serializes current price/reference resolution against book publishing while creating the immutable order snapshot.

## D. Order and payment lifecycle

A54 resolves an eligible published/licensed book and ready clean full PDF, approved positive INR price and pricing revision. It rejects caller amounts/owner/status/discount fields, zero/unconfigured pricing and unsupported registration/coaching products. It stores the immutable quote and owner-scoped key/hash before any provider operation. Changed payload under the same key conflicts; concurrent identical creation returns the same record. Historical amounts remain unchanged after book price updates.

A55 persists one external-create intent using CAS before any call. A successful response must match amount/currency/correlation receipt, then binds the provider order before returning safe Checkout configuration. A timeout or crash produces creating/unknown state; it never authorizes blind re-creation. Reconciliation only binds a positive unambiguous receipt lookup; no match/ambiguity requires investigation. Unstarted orders have a 24-hour engineering expiration, but expiration/dismissal cannot erase a later verified capture.

The provider adapter is Test Mode only. Keys must have a Test prefix; Live Mode/keys fail configuration/readiness checks. The rotation flag alone cannot activate operations. A deliberate future operator CLI confirmation performs a read-only authenticated Test Mode API check and stores a private credential fingerprint approval. Startup accepts a matching record for seven days; changed credentials invalidate it. No CLI validation or approval occurred here. Restart is required after configuration/approval changes.

A56 verifies owner, stored attempt/order binding and HMAC over the stored provider order ID, then fetches authoritative provider order/payment. Exact amount/currency/payment-to-order relation, approved Test credential scope, captured flag/status and provider order paid totals are required. A valid signature alone grants nothing. Wrong/reused references, mode or evidence fail safely. Authorized and failed attempt observations remain non-activated; stale failures cannot regress captured order state or captured attempt evidence. Multiple captured payment references become an investigation flag and do not grant twice.

A58 is authoritative after callback, dismissal, network loss and refresh. Order status, payment attempt state, activation and reconciliation remain distinct. Frontend success is shown only after backend capture and effect acknowledgment. No client callback writes paid state or local ownership. Zero-price access is still policy-gated.

## E. Webhook security

A57 receives bounded raw application/json before JSON parsing and browser session/CSRF middleware. It requires the provider HMAC and event identity, then persists a unique Job receipt with safe IDs and payload hash before acknowledgment. It stores no card/CVV/raw payload. Invalid signatures fail; persistence failure returns retryable 503. Same event/hash deduplicates; a changed body under an existing event identity conflicts.

The durable receipt is not proof of capture. Leased processing retrieves authenticated provider order/payment evidence through the same settlement service as Checkout/reconciliation. Out-of-order/duplicate/stale events cannot downgrade capture. Provider environment is bound to the validated Test credential realm and immutable scope; an optional inconsistent mode field is rejected. No unverified webhook status or arbitrary notes establishes payment truth. Old credential scopes require investigation, not silent rebinding.

Offline contracts follow the official [server integration guidance](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/), [raw webhook validation/dedup guidance](https://razorpay.com/docs/webhooks/validate-test/) and [receipt-filtered order lookup](https://razorpay.com/docs/api/orders/fetch-all/). Provider-connected acceptance remains unverified.

## F. Reconciliation and recovery

The existing server runs a separate commerce worker every 15 seconds. Event Jobs and embedded Order reconciliation state use atomic claims, 60-second leases, random fencing tokens, bounded work (20 each per tick), exponential retry backoff capped at one hour and eight-claim dead-letter state. Expired leases are recoverable after restart. Failed acknowledgment cannot cause a second entitlement. Signed delayed events or owner verification can still establish capture after earlier failed/pending attempts.

B24 requires commerce.reconcile and an empty body, records an audit event and schedules verification/retry. It does not mutate amount/paid truth, accept a payment reference override or issue a refund. Staff inspect pending/authorized/captured/fulfillment/creation/dead state and safe attempt/event processing references through B22/B23. The dashboard also reports event queue state counts; dead letters emit redacted record-ID/error-code logs. Unknown external creates, duplicate captures, scope mismatch, revoked entitlements and unavailable delivery need investigation. Staff must not repair these by editing payment state or stealing live leases.

Durable audit events commit with order/application mutations and retry delivery. Backlog limits fail closed. Workers can be interrupted between effects; leases/dedup recover safely, rather than claiming cross-document atomicity. Database/index capacity, filesystem/journal durability, backups and operator ownership remain operational requirements.

## G. Book and registration integration

Books: existing G05 pricing/publication remains authoritative. A36 returns minimum verified owned-book/secure-content projection; A73 also authorizes actual direct entitlements, retaining ready/clean/license/publication/checksum/range checks. /my-books shows only verified effects and secure PDF links. Complete reader/progress/bookmark experience is deferred. Book Checkout is wired to backend orders/Standard Checkout with honest credential-unavailable state; ordinary users cannot launch a fake provider.

Registration: A15-A17/A19 implement verified-owner configuration/drafts/update/status. Existing study/tuition/teacher/coaching-profile non-document form fields are preserved and validated; form email, when supplied, must match the verified identity. Drafts survive reload via an owned application ID in the page URL. Approved fee metadata can be snapshotted without charging. Required document slots remain explicit; identity numbers and file payloads are rejected, and their UI controls are disabled with an explanation. Nothing silently converts a missing document into completed evidence.

A18 submission, B12 activation/status approval and registration product orders are blocked pending document privacy/retention, eligibility and review/activation policies. B10/B11/B13 allow authorized draft review/notes only. Teacher drafts cannot grant staff roles. No account password is generated by registration success callbacks; those unverified completion paths were removed. The existing Stage 3 identity flow remains canonical, and SMTP is not required for these offline fixtures.

B36/settings.write accepts typed registrationFees metadata with integer minor-unit amounts and approval flags; an empty configuration/unknown fiscal fields are rejected. Configuration is not permission to charge an unfulfillable application. No tax, fiscal invoice or refund policy was invented.

## H. Coaching commerce

The generic product boundary rejects course_plan/renewal purchases while real CoursePlan/catalogue/validity/eligibility rules are absent. No Enrollment model, guessed duration, expiry extension, recurring schedule or fabricated purchasable plan was created. Existing subscription UI shows the gate, and old client-priced checkout calls cannot launch payments. Coaching-profile drafts can persist safely without enrollment/paid access.

G08/A43-A50 successful purchase/renewal and renewal-extension idempotency are intentionally deferred to Stage 7 domain/policy approval. Negative unsupported-product tests pass; no successful renewal test is claimed. Future approved products must use the same authoritative snapshot/capture/unique source-order effect pattern.

## I. Admin and user integration

The existing admin layout now activates /admin/orders and /admin/registrations. commerce.read gates order/attempt/reference views; commerce.reconcile gates verification scheduling. The existing dashboard now uses real Test Mode groups for pending/authorized/gross captured values and fulfillment, with simulated records separate and failed attempt counts. No mock financial figures, net revenue/profit/settlement/tax claims or paid override controls remain on that dashboard. New ordinary-staff grants are not assigned automatically.

Existing settings UI includes registration fee metadata; existing books UI handles product prices/revisions/publication. Order history uses the existing user page/modal style, authoritative account-owned APIs, pagination/error handling and account-switch cleanup. Receipt download obtains owner-only captured Test Mode JSON from the backend and labels it not a tax invoice. A61 official invoices return 409; no refund call exists.

Existing Book Checkout retains its layout/payment-method controls/theme, while authoritative amount comes from the stored order. The order ID is recoverable from the URL; attempt identity comes from the backend. Polling is bounded. Dismissal grants nothing; failed/authorized/captured/activation-pending states are distinct. Full success requires backend fulfillment. No localStorage price/payment/entitlement authority or second HTTP client was added. Existing routes/aliases and non-payment institution/publication flows remain.

## J. Development database evidence

Configured database audit: environment development, database kitss_education_dev, reachable. Before Stage 6 writes, counts were books/banners/facultyProfiles/pageContents=2 each; mediaAssets=4; users=2 existing suspended Stage 5 verification actors; auditlogs=22; domainLocks=1; siteSettings/sessions/auththrottles and institutional/application collections=0. Credential-presence flags were all false and rotation false; no values were printed/copied.

An isolated test initialization on that host failed because it had reached 500 collections. No existing collection/database/index was dropped, no reset was attempted and no pre-existing account/password/institution/historical price was changed. The owner reported no alternative URI. Actual configured-host Stage 6 collections/indexes/persistence/restart success is therefore **blocked**, not passed. No Stage 6 application fixture IDs were created there. Partial empty isolated-test collections from the failed attempt were retained, not destructively cleaned.

[Configured-host evidence](STAGE6-DEVELOPMENT-VERIFICATION.json) records the blocker and safe baseline. Capacity for four additional collections must be provided through owner-controlled operations before startup/schema initialization can succeed on that host. This code does not silently skip required index guarantees.

A separate cached MongoDB 7.0.24 standalone process used a new ignored workspace data root, loopback port 27186, no replica set and per-command URI overrides only. Backend/.env URI/topology were unchanged. Fresh random databases hosted automated tests. A separately retained local development smoke used kitss_stage6_dev_cbce7283a4c04ff4 with fake provider only. The tool seeded an explicitly synthetic internal order for a draft not-for-sale book; this is not a passing real-product eligibility/price test. It verified idempotent lookup, simulated capture receipt persistence, blocked fulfillment, owner status, backend server restart/readiness/persistence and retirement of its own test actor.

Retained local-only IDs:

| Record | ID |
|---|---|
| Suspended verification actor | 6adc73c7d74781822f8a9818 |
| Draft book (not for sale) | 6adc73c7d74781822f8a9819 |
| Simulated internal order | 6adc73c7d74781822f8a981a |
| Durable fake event Job | 6adc73c7d74781822f8a981b |
| Fake provider order | order_acc2d0ec720d49499d294759d8741422 |
| Fake payment | pay_6976b862048a447e88ea547edd1f6349 |

Local smoke counts: books=1, orders=1, jobs=1, users=1 suspended actor, sessions=1 revoked session, auditlogs=3, auththrottles=4 ephemeral; bookEntitlements=0, mediaAssets=0, registrationApplications=0. Required delivery/licensing restrictions prevented fulfillment. No media was uploaded or fake scanner used in this retained smoke. [Separate local evidence](STAGE6-ISOLATED-DEVELOPMENT-VERIFICATION.json) includes all checks/index names. Backend HTTP/database reassembly/restart was exercised within the verification process. After the later isolated mongod exit/restart, a read-only check also confirmed that the retained simulated capture, restricted fulfillment and suspended actor survived. No provider service restart or controlled OS-kill test is claimed.

Temporary local test-server status: final process inspection found recorded PID 12944 absent and no listener on loopback port 27186. The process was already stopped; no graceful-shutdown claim is made for its final exit. Its data directory is retained for review; no recursive database deletion/reset occurred.

## K. Test results and commands

| Verification | Actual result |
|---|---|
| Baseline backend | 39 tests: 35 passed, 4 explicit opt-in skips, 0 failed |
| Baseline frontend build | Passed, existing bundle warning |
| Initial focused standalone commerce/provider | 16 passed, 0 failed/skipped |
| Full backend regression (fresh local auth/Stage 4/5/6 DBs) | 89 tests: 88 passed, 1 optional replica-set test skipped, 0 failed |
| Final focused commerce including journaling/failure injection/payment status | 18 passed, 0 failed/skipped |
| Shared frontend HTTP client | 8 passed, 0 failed/skipped |
| Auth browser final sequential run | 16 passed, 0 failed/skipped on the final sequential run |
| Stage 4 real HTTP/MongoDB browser regression | 13 passed, 0 failed/skipped on the completed rerun |
| Stage 5 real HTTP/MongoDB browser regression | 12 passed, 0 failed/skipped on the completed rerun |
| Stage 6 real HTTP/MongoDB + isolated mock Checkout | 14 passed, 0 failed/skipped (six workflows, seven widths and parent) |
| Final frontend build | Passed; Vite 6.4.5, main bundle 1,644.43 kB / 438.70 kB gzip; existing >500 kB chunk warning |
| Dependency audits | Backend 0, frontend 0 vulnerabilities; no Stage 6 dependency installed |
| Configured-host development smoke | Connectivity/classification verified; Stage 6 persistence/index/restart blocked by collection capacity |
| Separate local retained smoke | All eight recorded checks true, including retained state after isolated MongoDB restart; fake provider/simulated capture, fulfillment intentionally restricted |
| Real Razorpay/SMTP/Live Mode | Not run; no success claim |

Commands were executed from repository root (npm.cmd avoids PowerShell script policy issues):

~~~powershell
# Fresh separate local standalone server; never replace the application .env URI:
$env:MONGODB_URI = 'mongodb://127.0.0.1:27186/kitss_test_host'
# Set each KITSS_AUTH_TEST_DB / KITSS_STAGE4_TEST_DB / KITSS_STAGE5_TEST_DB /
# KITSS_STAGE6_TEST_DB to its strict random kitss_stageN_test_<16hex> name.
npm.cmd --prefix backend test
node --test backend/tests/commerce.test.js backend/tests/commerce.mongodb.integration.test.js
npm.cmd --prefix backend run test:client
npm.cmd --prefix frontend run test:auth
# Set fresh KITSS_STAGE4_BROWSER_DB / KITSS_STAGE5_BROWSER_DB / KITSS_STAGE6_BROWSER_DB per suite:
npm.cmd --prefix frontend run test:stage4
npm.cmd --prefix frontend run test:stage5
npm.cmd --prefix frontend run test:stage6
npm.cmd run build
npm.cmd --prefix backend audit --json
npm.cmd --prefix frontend audit --json
# Separate clearly labelled retained local smoke only, with its own local dev DB/root overrides:
node backend/scripts/verify-stage6-development.js --confirm-development --isolated
git diff --check
~~~

The optional legacy replica-set test was skipped and is not counted as passed. Unit provider transport is fake; all commerce integration records are simulated. Real provider mode/capture/webhook acceptance is not established by these tests. Browser harness supplies only an isolated fake widget/Checkout presentation bridge; backend owner/CSRF/signature/capture/effect verification is unchanged. All external page requests are blocked. Responsive widths are 320/375/390/414/768/1024/1440. Screenshots at 320px and 1440px were visually inspected: the mobile coaching policy gate and desktop loading shell fit the viewport. The desktop screenshot does not establish completed content rendering; completed payment/admin states were checked by workflow tests.

The full backend run and final focused run are separate results; the additional focused case is not represented as a completed 90-test full run. An optional further full-suite rerun was not executed because automatic approval review hit a usage limit; the completed full regression and subsequent focused verification above remain the reported evidence.

Failures investigated: remote collection capacity caused isolated test initialization failure; fixture cleanup was strengthened to close failed initialization connections. An operator script initially ending in -test.js was unintentionally discovered by Node; it exited without a provider call and was renamed. A Stage 5 assertion rejecting empty fee configuration required explicit nonempty validation after the approved Stage 6 extension. Initial browser selectors assumed main existed in registration AuthLayout and counted blocked Google Fonts requests as provider network; selectors/targeted no-provider assertions were corrected. Concurrent auth browser cold-load/navigation timed out and was rerun sequentially. The separate local mongod process also exited unexpectedly during a later regression; affected runs failed and were rerun after restarting the same isolated root with a 0.25 GiB cache cap. The exact original exit cause was not established. Failed/interrupted attempts are not counted as passing runs.

## L. Security and remaining operational gates

- Fresh API/webhook credential rotation and deliberate operator confirmation are still mandatory; no old key/secret was used. The private approval CLI was not executed. A rotation flag alone is insufficient. Real provider-connected Test Mode acceptance is pending. No Live Mode/refund operation exists.
- Configured host needs collection capacity and its own additive-index/persistence/restart verification. Local alternative evidence is explicitly separate. No actual data cleanup was inferred as authorized.
- Actual malware scanner/signature updates, licensed real assets, content provenance, privacy/minors/retention and volume/backup/restore operations remain Stage 5 gates. Payment cannot override them.
- Real SMTP app-password delivery and intended operator bootstrap remain pending. No real mail or existing real user/session was used for verification.
- Registration eligibility/documents/review/activation and free-access rules remain pending; fees can be approved as metadata but charging is blocked. Coaching plans/validity/renewals are absent. No teacher role escalation.
- Taxes/refunds/legal invoices remain owner decisions. Receipts are Test Mode JSON, not official fiscal documents; no GST rate, net revenue/profit or refund action was invented.
- Journaled standalone recovery is tested under the documented failure model, not universal exactly-once/cross-document atomicity. Monitor jobs/dead letters/unknown creates/audit backlog and preserve provider/reference uniqueness. Storage/journal loss, unauthorized edits and restoration need operator investigation.
- Runtime pin verification remains pending; current host is Node 22.15.0. The existing large frontend bundle warning remains. No production deployment was attempted.
- Final review: git diff --check passed (one existing LF/CRLF normalization warning). A value-based scan of 230 shareable backend/frontend/docs text files found zero matches for configured secrets; ignored developer environments, runtime data, logs and browser artifacts were excluded. This is not a Git-history credential audit. Existing uncommitted changes remain preserved; nothing was staged or committed.

## M. Stage 7 readiness and stop point

The reusable gated commerce boundary, book entitlement integration, durable reconciliation, pricing authority and frontend/admin state handling are ready for review. Stage 6 is not operationally accepted for real provider-connected usage while the credential, configured-host and business/operational gates above remain.

Stage 7 may begin only with explicit owner approval and must supply approved real course/plan/validity/eligibility rules before course payments or renewals are enabled. Complete reader/progress/bookmarks, registration activation policy, notifications, results and production deployment were not started. No Stage 7 work is automatically authorized by this report.
