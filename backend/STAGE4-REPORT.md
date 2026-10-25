# Stage 4 delivery report

## A. Stage 4 summary

Implemented the approved taxonomy, institutions/programs and intake slice in the existing JavaScript modular monolith. Existing frontend theme, route aliases and multistep forms are retained and connected to real APIs. No Stage 5 implementation, payment provider calls, real email, real admin bootstrap, seeded institutional affiliations or destructive database migrations were performed.

Owner decisions: admissions require a verified signed-in account; document-free franchise submission for review is allowed; franchise approval remains blocked.

## B. Files changed

New backend: src/modules/institutions/institutions.models.js, validation.js, institutions.service.js, institutions.routes.js; tests/institutions.test.js and institutions.mongodb.integration.test.js; this report. Modified backend: src/app.js, src/server.js, src/modules/auth/security.js, src/middleware/cors.js, src/middleware/errors.js, README.md. No new backend dependencies or environment credentials.

Frontend services: user/services/collegeService.js and authService.js; admin/services/adminService.js. Existing pages/components connected: AdminUniversitiesPage, AdminCollegesPage, AdminCollegeCoursesPage, AdminApplicationsPage, AdminFranchiseRequestsPage, CollegesListingPage, InstitutesListingPage, CollegeDetailsModal, AdmissionApplicationModal and CollegeFranchiseForm. AdminRoutes/AdminLayout add the taxonomy route and enable only this approved domain slice. New AdminTaxonomiesPage and shared Pagination preserve existing visual patterns. Tests: frontend/tests/institutions.browser.test.js and existing auth.browser.test.js. Package manifests/lockfile add the test command and compatible Vite 6.4.5/source-map-js 1.2.2 remediation.

Development-plan documents 04-13 record implementation/refinements, decisions, evidence and gates. Prior uncommitted Stage 1-3 work is preserved; the total Git diff includes that pre-existing work. No commits, reset, staging, database drops or production deployment.

## C. Models and APIs

Business collections: taxonomies, universities, colleges, collegePrograms, admissionApplications, franchiseApplications. One necessary operational collection domainLocks serializes standalone hierarchy mutations; it has no TTL or automatic takeover. Existing User/Session/AuthThrottle/AuditLog remain authoritative; no duplicate identity/payment/media model.

All routes use /api/v1 and existing requestId/envelope/error conventions. A20-A26: GET /taxonomies, /institutions/facets, /universities, /universities/:id/colleges, /colleges, /colleges/:id, /colleges/:id/programs. G01-G04: GET list/detail, POST create, PATCH edit, DELETE archive under /admin/taxonomies, /admin/universities, /admin/colleges and /admin/colleges/:collegeId/programs. Edits/archive require expectedRevision; archive returns 200 with retained record.

A27: POST /admission-applications. A28-A31: POST /franchise-applications, PATCH /franchise-applications/:id, POST /franchise-applications/:id/submit, GET /franchise-applications/:id/status. B02-B09: GET list/detail /admin/admission-applications and /admin/franchise-applications; PATCH /:id/status; POST /:id/notes. Existing API IDs are retained. See validation.js and API plan for field contracts; no payment endpoints changed.

Strict validators reject unexpected fields/invalid IDs, unsafe URLs, excessive arrays/text, invalid enums/prices and malformed pagination. Unique indexes normalize canonical keys, names/codes and idempotency scope. Backend resolves parent membership and approved active hierarchy; public callers cannot request drafts. Published colleges require explicit verification evidence and active state/district/university; programs require a published parent. Parent membership is immutable. Active descendants block deactivation/archive. Applications retain snapshots and references.

## D. Admin integration

University, college/program, admission and franchise screens now list/filter/page real records and show errors. Taxonomy management supports approved kinds and parent relationships. Create/edit/status/archive controls respect server permissions and revisions. Program fees must be supplied explicitly, including zero where applicable. College publication requires reviewer evidence; no fictitious ratings, affiliations or success counts are seeded.

Permissions: institutions.read/write, content.read/write, admissions.read/review, franchises.read/review. Ordinary staff must receive the explicit review grants; super-admin checks remain server-side. Internal notes use session-derived authors and are independently saved without changing status. Franchise approval stays disabled and backend-blocked. Later admin modules remain disabled previews; no unverified financial summaries.

## E. User frontend integration

College/institute directories, filters/facets, parent selectors, details and programs use real MongoDB-backed APIs. Pagination uses backend totals; stale directory queries are cancelled. Active taxonomy choices replace hard-coded intake options in this slice. Missing data displays empty/error states instead of resurrecting mocks. Existing unrelated book/coaching/results/CMS content remains later-stage prototype content; this report does not claim those modules are integrated.

## F. Admission and franchise flows

Admission submission verifies the account, college/program relationship, publication and open admission state. A server reference and immutable program/parent/fee snapshot are persisted. Owner-scoped idempotency keys deduplicate retries and reject changed payloads. Reviewer status transitions are validated; enquiry approval is a manual review outcome and grants no seat, payment, enrollment or account privilege.

Franchise intake preserves the existing steps, persists typed drafts with revisions, recovers authoritative status and submits complete document-free applications as pending. Guest recovery uses a hashed 24-hour capability in a consumed private URL fragment; authenticated drafts require their owner. Pending file metadata blocks submission. No documents silently disappear or count as uploaded. Final submission retries return authoritative state. Rejection requires a reason; approval returns APPROVAL_POLICY_PENDING. Criteria, required evidence and affiliation/publication effect remain unresolved Q06 decisions.

## G. Document handling

Stage 2 StorageProvider/LocalStorageProvider remains unchanged. There is no unauthenticated upload endpoint or private express.static exposure. Selected file names/sizes/types are draft metadata only; bytes are not uploaded, scanned, attached or represented as MediaAssets. Users see this limitation and must remove selections before document-free submission. Full A72 authorization, scanning/quarantine, durable metadata/linking, safe preview/download, retention and lifecycle cleanup are deferred. Q05 privacy/consent/retention approval is required before live sensitive intake.

## H. Test results

Full backend run with fresh KITSS_AUTH_TEST_DB and KITSS_STAGE4_TEST_DB: **59 tests, 58 passed, 1 skipped, 0 failed**. Both real standalone MongoDB auth/domain integrations executed. The sole skip is the prior optional replica-set test; transactional payment readiness is not verified. The Stage 4 subset in that final run contains **14 passed, 0 failed**, including public draft exclusion, referenced-district protection and durable audit recovery/deduplication after an outage. Shared HTTP client: **7 passed, 0 failed**. Backend and frontend audits: **0 vulnerabilities each** after compatible patch remediation.

Authentication browser regression: **16 passed, 0 failed, 0 skipped**, covering desktop/mobile identity, OTP, recovery, transfer, staff guards, invitations and logout (mocked HTTP). Final frontend production build passed with Vite 6.4.5; the existing large-chunk warning remains (main bundle approximately 1.68 MB before gzip). Development startup smoke: liveness/readiness/public colleges 200, unauthenticated me 401, graceful shutdown completed.

Final Stage 4 browser run: **13 passed, 0 failed, 0 skipped**, using real Express/API/MongoDB. All five workflows passed: university create/edit/archive; college/program create/edit/archive; public filters/details and signed-in admission persistence; franchise save/private-link recovery/document-free submission; admin note-only review with unchanged status and blocked approval. Responsive checks passed at **320, 375, 390, 414, 768, 1024 and 1440px**, including all six domain admin routes, public institute details, franchise form and guest admin redirect. Inspected mobile/desktop franchise screenshots retain the existing theme and readable layout. This is not a complete keyboard/screen-reader/accessibility audit.

Earlier failed runs were investigated, not counted as passes. Fixed taxonomy object rendering, nested-response/row selectors, identity-bootstrap remount/input loss and asynchronous restored-college navigation. The form now waits before editing or consuming recovery capability; restored hierarchy must load before advancing. Screenshots and failure diagnostics remain ignored test artifacts. Final test-server/browser teardown and test-owned data cleanup completed normally.

Reproduction: see README for fresh database environment names and npm commands. Tests refuse pre-existing collections and use only isolated records/fake SMTP; cleanup deletes test-owned IDs without collection/database drops. Empty isolated collections/indexes may remain. Stage 4 browser tests use real APIs; Stage 3 browser regression uses intercepted HTTP. Artifacts are ignored in frontend/test-artifacts.

## I. Security review

Existing persistent sessions, account status, RBAC/default deny, exact Origin and signed CSRF protect mutations. Frontend guards/disabled controls complement server enforcement. Admission owner and guest franchise capability checks reject cross-owner access; capabilities are hashed and expire synchronously. Public DTOs omit internal review/audit data. Errors remain sanitized, logging remains redacted, no secrets were copied, and owner .env/MongoDB configuration is preserved. Configured-secret scanning inspected 188 source/test/document files and found no configured values outside ignored environment files. Git diff whitespace checks passed; existing Vite proxy, global styles/shared layouts and results pages are unchanged. Frontend note keys change after successful independent notes and stay stable for retries.

Revisions prevent lost updates. One durable standalone lock serializes cross-record reference validation/mutation across instances and fails closed after a writer crash; it intentionally limits throughput/availability. **Do not clear a lock while a writer may be running.** Stop all instances, investigate/reconcile affected records/audits and compare-and-set the exact stale owner before restart; full runbook is in README. No multi-document transaction guarantee is claimed. Each record mutation embeds a durable audit event; startup/hourly idempotent AuditLog delivery retries, and a bounded backlog blocks further changes safely.

## J. Remaining blockers

SMTP/app-password credentials and real authorized delivery remain pending, without blocking this implementation. No real administrator was created; intended database bootstrap remains an operator step. Owner-approved institutional evidence, real taxonomy/content/prices, Q05 privacy/retention and Q06 approval rules are needed before real intake/publication. No tax/refund/invoice financial policy was invented.

Pinned Node 22.23.4 was not installed/verified; tests use host Node 22.15.0/npm 10.9.2. Production operations, backups, throughput monitoring and full accessibility review remain pending. Prior frontend advisories are fixed at compatible versions; audit results are time-specific. The exposed Razorpay test credential is compromised and must be rotated by the owner before separately approved Stage 6 integration; no SDK, Checkout, webhooks, provider-connected tests or recurring billing were introduced.

## K. Stage 5 readiness

Stage 5 may be planned after accepting the final Stage 4 verification and separately approving scope, licensed book/CMS/media content, privacy/free-reader policies and the secure media lifecycle. Unresolved franchise approval and SMTP operational work stay explicit gates for their affected features. Stage 5 has not started. Stop after Stage 4 and wait for owner approval.
