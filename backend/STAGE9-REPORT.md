# Stage 9 release-candidate integration report - 25 October 2026

## Integration status

Stage 9 is complete for supported-flow release-candidate review. No known unresolved P0/P1 defects remain in the tested scope; production release remains blocked by the operational requirements below. Stage 9 stabilizes the existing JavaScript monolith and UI; no new business modules, dependencies, credentials, payment activation or production deployment were introduced. Existing uncommitted work was preserved. Stage 10 has not started.

| Classification | Current scope |
|---|---|
| Implemented and tested | Identity/session/OTP contracts; institution/intake workflows; supported book/PDF and authored text/PDF coaching access; persisted learning/reading state; commerce authority and disabled-payment UX; results preparation/access infrastructure; notifications and account settings. Exact executed coverage is below. |
| Implemented but operationally gated | Real SMTP delivery, scanner-backed licensed publication, provider-connected Razorpay, trusted official academic publication and registration activation. Test adapters establish neither external-provider acceptance nor source authenticity. |
| Partial | Admin dashboard currently provides permissioned Test Mode financial summaries; generic paid grants/book revocation, advanced PDF accessibility and issuer-specific import/grade adapters remain limited as documented in Stages 6-8. |
| Not implemented / gated | Video pipeline, renewals/free access/manual paid grants, reward/streak system and real issuer integration. No fabricated replacements were enabled. |
| Out of this authorization | Production deployment, live payments, new providers/platforms, redesigns and Stage 10. |

## Confirmed fixes

| Priority | Defect | Fix and evidence |
|---|---|---|
| P1 | Mobile drawer had no trigger despite the layout passing an open handler | Restored the header menu button and existing drawer callback; navigation and bounds checked at seven widths. |
| P2 | My Courses turned a failed API request into "No Courses Yet" | Show the real error and guard late updates; browser injects a 503 and rejects the misleading empty state. |
| P2 | Lesson player discarded access/network errors | Preserve a safe error message without rendering unauthorized lesson resources. |
| P2 | Mark-all-read could fail when another request inserted the same unique receipt | Treat duplicate receipt insertion as a satisfied idempotent read; regression injects the competing insert after a real database write. |
| P2 | Profile displayed absent rewards/join date/avatar data as blanks/broken images | Use actual creation time, explicit unavailable states and the existing logo fallback; no reward data is invented. |
| P2 | Settings claimed a fictitious 24.8 MB offline cache and production version | Describe the existing saved-filter clearing operation accurately; remove the invented production-version label. |
| P2 | Help drawer showed fixed, unverified contact information | Use existing admin-managed public support settings, with an unconfigured state. |
| P2 | Notification error could also display "All Caught Up" | Suppress the empty-success state on a failed initial load; unread state remains server-authoritative. |

Changes are limited to existing header/drawer/layout, profile/settings, MyCourses/LecturePlayer/Notifications pages, the User DTO's creation timestamp, notification receipt error handling, and verification scripts/tests. No business-policy bypass was added. The header exposes the authoritative unread total in its accessible tooltip. Core shared changes were completed before the one full backend regression.

## Routes, journeys and responsive coverage

All **40 registered student route patterns and 17 admin sections** loaded or followed their intended redirects. [Route evidence](STAGE9-ROUTE-VERIFICATION.json) records concrete paths/redirects, zero page exceptions and zero unexpected API 5xx responses. This route smoke verifies rendering/navigation, not every possible form mutation. Alias routes remain redirects. Inactive mock modules are not treated as active journeys or deleted unnecessarily; active services have no mock-data imports. Legacy mock-storage names remain only in cleanup code.

Essential institution/admission/franchise CRUD/review workflows use the existing Stage 4 browser suite without its unchanged full responsive matrix. Books/media/CMS and commerce use their existing workflow assertions with the unchanged matrices omitted. The complete Stage 8 browser pass runs results/export, admin issuer/notice publication, recipient isolation, header count/mark-all, profile/preferences, email change and mobile/desktop forms together. Authentication has its own regression and the full backend security tests. Synthetic source/payment/scanner/mail adapters exist only in isolated databases.

The changed shared header/drawer and high-risk protected PDF/lesson/admin surfaces passed **320/375/390/414/768/1024/1440px**. Targeted Stage 8 forms use 375/1440px. Actual 320/1440 PDF screenshots were inspected: controls remain usable and PDF pages render without horizontal overflow. Screenshots remain private under ignored test artifacts. Unsupported video is explicitly unavailable, not claimed as tested playback.

## Actual configured runtime and database

The actual configured development host passed all 13 checks, with 32 application collections and 19 public/guest route loads. Two retained course drafts survived backend restart. [Actual runtime evidence](STAGE9-DEVELOPMENT-VERIFICATION.json) records real backend/Vite startup, proxy communication, exact Origin rejection, missing-CSRF rejection, private/admin boundaries, MongoDB/index initialization, restart and retained draft persistence. The helper permits only its chosen loopback frontend origin in memory; developer environment files, URI, topology and credentials are unchanged. Its page-load audit performs no application fixture creation or form submission. Authenticated writes/OTP/provider workflows are tested in isolated databases, not falsely claimed as real SMTP/provider acceptance.

Verified private backup/readback preceded deletion of 17 confirmed disposable test databases (410 collections). Post-cleanup verification retained 32 application collections with unchanged document/index counts, preserved unrelated databases and found zero guarded project test databases. [Cleanup evidence](STAGE9-DATABASE-CLEANUP.json) records the checks. Backups remain private under ignored `.runtime`, outside MongoDB/public assets; do not publish them. No working application reset or unrelated database/security changes occurred.

## Executed tests

| Check | Actual completed result |
|---|---|
| One final full backend regression | **121 tests: 120 passed, 1 optional replica-set test skipped, 0 failed**; 526.10 seconds; isolated Stage 3-8 databases |
| Shared HTTP client | 8 passed, 0 failed/skipped |
| Institutions/admissions/franchise browser workflows | 6 passed, 0 failed/skipped; unchanged matrix omitted |
| Cross-stage route/access/reader/navigation browser | Full run: 10 children passed; payment-gate child failed and parent therefore failed (12 total: 10 passed, 2 failed). All route audits, injected course outage and seven widths passed. Corrected focused gate rerun: 2 passed including parent, 10 explicitly excluded, 0 failed. Full route manifest is preserved separately. |
| Coaching/reading/admin browser workflows | 7 passed, 0 failed/skipped; unchanged responsive loop omitted |
| Books/media/CMS browser workflows | 5 passed, 0 failed/skipped; unchanged responsive loop omitted |
| Commerce browser workflows | 7 passed, 0 failed/skipped; isolated fake Checkout only, unchanged responsive loop omitted |
| Combined Stage 8 browser | 10 passed, 0 failed/skipped; complete combined run with no focus filter |
| Authentication browser | 16 passed, 0 failed/skipped; desktop and mobile HTTP contract/guard interactions (mocked HTTP), complemented by real backend security tests |
| Production frontend build | Passed in 24.52 seconds; existing large-bundle warning retained |
| Dependency audits | Backend 0, frontend 0 vulnerabilities; no dependency additions/upgrades |
| Secret/diff/environment review | Zero configured/legacy secret matches in 293 shareable source/build text files; git diff --check passed; environment examples/proxy reviewed, developer .env files unchanged |

Earlier failed runs are not counted as passing suites. The first actual-host attempt stopped on a MongoDB connection-pool error; the final complete development check passed without environment or database changes. The new route harness initially omitted required synthetic university/district references and checked the first cold page before React rendered. Early drawer checks also raced session hydration; waits now bind to the actual signed-in identity. The initial checkout check used an already-entitled account and asserted before hydration; the corrected gate check uses the unpaid account, waits for its identity and the unavailable message, and asserts the payment button is disabled. These fixture/synchronization corrections retain route, role, payment and media assertions. The lesson error-state check exposed and fixed a real swallowed-error defect. No security assertion or parser deadline was relaxed. The optional replica-set connection test was not executed; configured-host acceptance and earlier standalone evidence remain distinct.

Run from repository root: `npm.cmd --prefix backend test` with fresh guarded database names; `npm.cmd --prefix backend run test:client`; `npm.cmd --prefix frontend run test:stage9`; existing `test:stage4/5/6/7/8/auth`; `npm.cmd run build`; both package audits; `git diff --check`; `node backend/scripts/verify-stage9-development.js --confirm-development`. `KITSS_STAGE4_WORKFLOWS_ONLY=true` and `KITSS_BROWSER_WORKFLOWS_ONLY=true` deliberately omit unchanged matrices. The Stage 8 combined run has no focus filter. Exact individual failures/limits are disclosed here rather than hidden by aggregate claims.

## Remaining issues, deployment blockers and Stage 10

No known unresolved P0/P1 defects remain in the executed supported flows. Remaining P2 limitation: canvas PDF text selection/accessibility; operational acceptance below is still required. The large frontend bundle warning remains P3; no optional splitting/performance rewrite was attempted. Existing PDF text-selection/accessibility limitations, integer-mark import mapping and unconfigured catalogues/support content remain documented limitations, not fabricated successful flows.

Production release remains blocked on owner-approved operations: compromised Razorpay credential revocation/rotation and separately authorized provider Test Mode acceptance; real SMTP app-password acceptance; scanner/signature operations and licensed media/instructor/content approval; trusted result source, privacy/retention/grading/publication authorization; registration/document/activation and fiscal/refund/invoice decisions; production host/domain/TLS, safe proxy/CORS/cookie configuration, secrets, bootstrap/role assignment and operator ownership, backups/restore, storage capacity/monitoring and acceptance on the pinned Node runtime. Current verification uses installed Node 22.15.0; the 22.23.4 pin is not newly verified. These gates must not be overridden to meet a deadline.

The release candidate is for supported-flow review, not a production-readiness certificate. Stage 10 release/deployment preparation requires separate owner approval and resolution of its relevant operational gates. **Stop after Stage 9.**
