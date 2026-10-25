# Stage 7 implementation report — 24 October 2026

## A. Implementation summary

Stage 7 adds persisted coaching courses, explicitly configured prepaid plans, syllabus sections, lessons, captured-order enrollments, learning progress and book reading state to the existing JavaScript modular monolith. Existing session/Origin/CSRF/RBAC, publishing/media, storage and commerce boundaries remain authoritative. No second backend, admin application, authentication system, HTTP client or payment implementation was created. The frontend adds exact pdfjs-dist 6.4.299 for actual local PDF rendering; no backend dependency or unrelated package was upgraded.

Existing coaching, course dashboards, readers and admin routes now use MongoDB-backed APIs. Generated textbook pages, coaching mock-store reads, first-lesson/book fallbacks and client-owned wishlist/progress were removed from active learning paths. The navy/orange theme, course cards, sidebar/accordion and reader controls remain. The legacy player route selects from the canonical syllabus rather than assuming a separate legacy course structure.

**Razorpay remains disabled.** All successful payment/enrollment tests use explicitly injected fake providers in isolated databases. No real provider order, Checkout, capture, webhook delivery, Live Mode or real SMTP operation occurred. There is no free enrollment, arbitrary administrative grant, recurring billing or enabled renewal policy. Registration/fiscal gates remain unchanged.

**Video delivery remains unavailable.** The approved storage pipeline inspects images and PDFs, not videos. Stage 7 supports administrator-authored plain text and scanned PDF lessons; attaching a video fails with VIDEO_DELIVERY_UNAVAILABLE. This is an explicit refinement of the original video-required lesson proposal, not a claim that MP4/HLS/transcoding or playback is operational. Real educational publication still needs licensed assets and an operational scanner.

## B. Database cleanup and capacity resolution

The owner explicitly authorized backed-up destructive maintenance of the KITSS development environment. The configured application database is **kitss_education_dev**; its URI and credentials were neither printed nor changed. Before deletion, the tool inspected the exact connected database, recorded a credential-free host fingerprint, verified NODE_ENV=development, enumerated project test collections and checked synthetic user ownership.

The initial inventory contained 44 databases and 41 positively identified Stage 3–6 test databases. Those test databases held **483 collections**. Their strict project names, known collection allowlist and absent/synthetic users passed ownership checks. Unknown databases were excluded. All current application and selected test collections were backed up outside MongoDB under ignored `.runtime/stage7-backup-*`, including BSON Extended JSON rows and indexes. Every file was read back and verified with row/index counts, byte equality and SHA-256 before deletion. A second verified backup immediately preceded cleanup.

Only the 41 confirmed disposable test databases were dropped. The application database was retained; no existing application user, content record, password, index or institutional data was reset. No server user/security configuration or unrelated database was changed. The prior 500-collection failure occurred while creating a fresh database, and the 483 project test collections explain the shared host/account ceiling; account billing configuration was not queried.

The original logical application backup was also restored into a fresh database on the separate loopback-only standalone test server. **All 17 backed-up collections matched restored rows and index counts.** The restore did not replace or write into the configured application database. Private backups contain database contents, including credential hashes where present; do not publish or commit them. Readback and logical restore verification do not establish a production backup SLA, encrypted offsite retention or point-in-time recovery.

Evidence: [cleanup scope](STAGE7-DATABASE-CLEANUP.md), [original inventory/backup/deletions](STAGE7-DATABASE-EVIDENCE.json), [logical restore verification](STAGE7-BACKUP-RESTORE-VERIFICATION.json). Final isolated-test cleanup status: After all test writers stopped, a separate verified private backup preceded removal of 15 additional disposable verification databases (310 collections). Post-cleanup verification found zero remaining guarded project test databases, 26 application collections with unchanged record/index counts, and three total server databases (the application plus the same two resources outside cleanup scope). These 15/310 are additional to the original 41/483, not one simultaneous collection inventory. See [post-test backup/cleanup evidence](STAGE7-POST-TEST-CLEANUP.json)..

## C. Files changed

Existing uncommitted Stage 1–6 work was preserved. Git status includes that earlier work; nothing was reset, staged or committed.

| Area | Stage 7 files |
|---|---|
| New backend module | `src/modules/coaching/{coaching.models.js,validation.js,coaching.service.js,coaching.routes.js,index.js}` |
| Backend integration | `src/app.js`, `src/server.js`, commerce `commerce.models.js` / `payment.service.js`, media `media.service.js`, publishing `coordination.js` |
| Operator verification | `scripts/stage7-database-maintenance.js`, `scripts/verify-stage7-development.js`, `scripts/verify-stage7-backup.js` |
| Tests | `tests/coaching-fixture.js`, `tests/coaching.mongodb.integration.test.js`, shared `publishing-fixture.js` Stage 7 name guard |
| Coaching transport | Existing `user/services/coachingService.js` and subscriptionService now use the existing shared HTTP client/enrollment APIs; obsolete subscription mock grants are retired |
| Coaching pages | Existing CoachingHome, CourseSelector, CourseDetails, CourseSubscribe, MyCourses, CourseDashboard, LecturePlayer, CoursePlayer and BookReader; existing user route file |
| Book reading | New `components/coaching/SecurePdfReader.jsx` and `PdfCanvas.jsx`; existing PdfReaderPage / OnlineBookViewer become compatibility facades; MyPurchasedBooksPage / BookDetailsPage / LibraryContext use server state |
| Reused presentation | CourseProgress, ChapterAccordion, VideoPlayerView, CoachingSidebar, ProtectedVideoPlayer, minimal immersive UserLayout matching and CollegePromoCarousel; carousel now uses published CMS banners instead of fabricated institution promotions |
| Admin | New `AdminCoachingPage.jsx` / `AdminEnrollmentsPage` export; existing AdminRoutes / AdminLayout / MediaPicker |
| Browser verification | New `frontend/tests/coaching.browser.test.js`, test:stage7 script; existing commerce browser assertion follows the integrated reader route |
| Documentation | Backend README, development-plan documents 04–13, this report and safe verification JSON artifacts |

Backend paths above are relative to backend/. Frontend presentation paths are under existing `frontend/src/modules/user` or `admin`. Root scripts, the Vite proxy and the authentication system were retained. No Stage 7 secret/environment change was needed. The frontend manifest/lock add pdfjs-dist 6.4.299 (three installed packages including optional rendering dependencies); npm reported zero vulnerabilities. Runtime remains pinned to Node 22.23.4; execution used installed Node 22.15.0. Verification of the pinned patch remains pending.

## D. Course domain and APIs

Five new collections implement the approved models: `coachingCourses` (Course), `coursePlans` (CoursePlan), `lessons` (Lesson), `enrollments` (Enrollment) and `learningProgress` (LearningProgress). No duplicate User, Order, BookEntitlement, MediaAsset, Taxonomy, AuditLog or Job exists.

Course contains revisioned draft metadata, category, board/class/program/language/state taxonomy references, subjects, published instructor references, thumbnail, linked books, bounded keyed/ordered syllabus sections and source/licensing evidence. Public metadata comes from a separately serialized published snapshot. Draft edits do not silently publish. Archive retains history; publication requires approved metadata, valid clean thumbnail, instructor evidence, linked licensed books, published safe lessons and active approved plans. Lessons/plans require the exact parent course and cannot be edited while it is published; unpublish before changing live dependencies. No review-ready state was invented.

CoursePlan has no default price, duration or eligibility. Authorized administrators explicitly choose positive integer INR minor units, positive integer duration days, verified-account eligibility and rules approval before activation. The 1–36,500 day and 1–1,000,000,000 minor-unit bounds are engineering input limits, not suggested business prices/durations. Incomplete plans stay draft/non-purchasable. Renewal approval cannot be enabled. Archived historical plan/order references are retained.

Lesson records an immutable parent course, valid section key, title/summary, authored text or private inspected PDF, ordering, linked course books, publication/locked/archive state and explicit preview permission. Unknown/mismatched course/lesson identities return errors; no first-item fallback exists. Public syllabus metadata includes locks, not private lesson content or private media IDs. Explicitly published preview lessons may be opened without login; learner progress still needs an enrollment.

Implemented contracts keep A43–A53, G06–G08 and B32 paths. Catalogue queries paginate, escape literal search, filter category/subject/level/language/board/state and allowlist sorting. Lists use the existing `{data,meta,requestId}` envelope. DTOs omit audit outboxes, internal licensing notes and provider keys. No enrollment count, rating, instructor credential or educational content is fabricated.

## E. Admin management

`/admin/coaching` reuses the existing admin shell for course creation/edit/archive/publication, syllabus section editing, lesson ordering/content/PDF management and explicit plan management. It includes loading/empty/error states, safe archive confirmation, revision conflict feedback and paginated responsive tables/forms. Published instructor, taxonomy, book and scanned-media choices come from real APIs.

`/admin/enrollments` lists account/course/source-order references, expiry/revocation and simulation state. Server DTOs also supply bounded safe audit history and progress summary. `learning.read/write/publish`, `commerce.read`, `commerce.plans.write` and `learning.grants.manage` remain distinct fixed permissions; no ordinary staff permissions were assigned automatically.

B19 lists enrollments. B20 always rejects manual grants with MANUAL_GRANT_POLICY_PENDING. B21 permits reasoned, revisioned, audited **course enrollment revocation only**; unsupported book revocation remains explicitly gated. Revocation never changes capture truth or issues a refund. The full generic book/course manual-entitlement workflow is not marked complete.

## F. Coaching frontend

Catalogue, category/class filters, selector options, details, syllabus and both plan views consume actual APIs. Search cancellation prevents old catalogue responses replacing newer queries. The catalogue exposes pagination; local selector storage retains preferences only. There are no local enrollments, inferred 180-day expiry or replacement mock course arrays.

My Courses and dashboards show owned enrollments, server expiry/revocation, actual completion and unavailable states. Account changes remount private learning views and clear compatibility state. Student profile comes from the existing identity system. Published CMS my_courses banners replace invented partner promotions. Unconfigured catalogues show empty states; backend failures are not rendered as invented courses.

Plan views show configured prices/durations; purchase controls report the disabled Test Mode gate. Legacy client-price/payment-success callbacks have been retired. The reusable Stage 6 Checkout implementation remains the only Checkout implementation; Stage 7 does not launch it.

## G. Enrollment, commerce and standalone recovery

The existing Order product snapshot now supports course_plan with course ID, plan revision, explicit duration/eligibility and backend-resolved price. Product resolution runs inside the existing publishing coordination boundary. It verifies current course/plan and safe licensed delivery; client price/status/expiry is rejected. Existing payment signature, provider binding, amount/currency/capture checks, durable event receipt and reconciliation are retained.

Captured payment and fulfillment obligation remain one journaled Order commit. Enrollment is a separate unique source-order effect, with unique `(userId,courseId)` and unique orderId. Start is the server-recorded capture time; expiry is that immutable start plus the explicitly purchased day count. Retry after capture, before effect, after effect or before acknowledgment reuses the same effect. Existing revoked effects are never recreated. Order status requires the actual corresponding effect. Critical learning writes and shared audit delivery request journaled acknowledgment.

This remains the Stage 6 standalone failure model: intact unique indexes, healthy journal/storage, trusted writers, durable retry workers and operational dead-letter investigation. There is no universal exactly-once network promise or cross-document transaction. Disk loss, unauthorized edits, backup rollback and ambiguous/multiple captures require investigation.

A47 cannot grant free/paid rights; it returns PAID_ENROLLMENT_REQUIRED while free policy is absent. A48/A49 return owned enrollment state. Private access requires a published course/lesson, actual non-revoked unexpired enrollment, verified captured source order with matching owner/course/plan/simulation and a current active verified user. Existence of an Order or browser flag alone never suffices. Linked books require the exact course/book relationship and current enrollment, and do not create permanent BookEntitlements.

Renewal and repeat-purchase operations remain gated. No max(now,expiry), automatic extension, recurring subscription or free trial policy was inferred. A partial unique Order index on owner/course also prevents different plans creating duplicate chargeable first-purchase orders while switching/renewal policies are absent. Existing course orders must be resolved through their existing status/retry workflow; no automatic new order or extension is created. A second captured order cannot silently overwrite/extend an enrollment; the unique constraint forces investigation. Accordingly, successful renewal-extension verification is **not claimed**.

## H. Learning progress

LearningProgress is owner-scoped by unique partial user/book or user/lesson indexes. It records status, last activity, current page or supported resume state, completion time, bookmarks and wishlist. Explicit revision compare-and-set prevents lost progress updates; semantic retries return the existing state. No userId is accepted from a learner mutation.

Lesson completion requires the player's explicit **Mark as Completed** action. Merely loading the player may record in-progress/last activity after access validation, and never records completion. A course percentage is completed currently published lessons divided by all currently published lessons; locked/unpublished lessons do not count as completed. New accounts start empty. Last lesson/activity derive from persisted progress. Video seconds are not fabricated: unsupported nonzero positionSeconds is rejected while trustworthy video duration is unavailable.

## I. Book wishlist, progress, bookmarks and PDF reader

A37–A42 implement access-checked reading state, idempotent owner wishlist changes, validated current page and bookmarks. Wishlist does not require buying a book and grants no reading right. Personal reading state is shared for the same Book across authorized direct/course contexts. `courseId`, when supplied, must validate the actual published course link and current enrollment. Bookmark sets are bounded at 1,000; page numbers must be integers within the inspected PDF pageCount. No invented 100/195-page fallback remains.

The shared reader preserves back/page/contents/bookmark/zoom controls and loads actual protected PDF bytes through Stage 5 delivery. PDF.js 6.4.299 renders the selected page on a bounded canvas with authenticated range transport; the parsed page count must match inspected backend metadata. Page and bookmark controls save through the existing CSRF-aware client and restore after refresh. Access is periodically revalidated. The local worker, CMaps, standard fonts and WASM decoders are emitted by Vite; no third-party PDF resource CDN is required. Source URLs are restricted to the same-origin protected media route, eval is disabled, and pending renders/network tasks are cancelled on resource change/unmount.

An initial native embedded viewer was blank during visual inspection and was replaced with this renderer. Mobile title wrapping was corrected. Browser acceptance checks a rendered canvas and actual nonwhite page pixels, rather than merely an attached iframe. There are no generated textbook paragraphs, screenshot-prevention guarantees or clipboard overwrites in the active reader.

**Reader limitations:** the reader displays one selected page and persists explicit page controls. It does not yet provide PDF text selection, searchable text overlays, annotations or a complete PDF accessibility layer. The authorized original-PDF link supports browser reading/accessibility/download alternatives. Already delivered bytes cannot be revoked; this is not DRM. Production hosting must serve the locally emitted worker/font/CMap/WASM assets with correct MIME types and permit same-origin workers/resources in its tested CSP. Canvas/image/dimension limits may reject unusually large PDFs; no universal PDF compatibility or untrusted-document safety guarantee is claimed.

## J. Security

Stage 3 sessions, account status, exact Origin, signed CSRF and fixed RBAC protect mutations. Stage 7 adds bounded per-account mutation throttling, allowlisted inputs/sorts/IDs, parent membership, owner-scoped progress, publication snapshots and safe DTOs. UI permission controls supplement server checks. Account change and stale-result guards prevent another identity's private content being retained.

New `course_thumbnail` and private `lesson_document` purposes reuse existing signature/format/page inspection, ClamAV quarantine, checksum, storage and range delivery. Learning references are included in media deletion/publication checks. A referenced course thumbnail or private lesson document cannot be deleted through the media API. Private lesson media is not made public merely because a course is published; explicit preview access and protected enrollment are separate authorization paths. No private static mount, upload trust switch or production scanner bypass exists.

No configured secret was copied into source/docs/fixtures; no provider secret was placed in VITE_ variables. Final review compared configured values and the legacy exposed secret in memory across 271 shareable text files/generated bundles: zero matches. git diff --check passed. This is a targeted accidental-secret check, not a complete Git-history/security audit.

## K. Testing

| Check | Actual completed result |
|---|---|
| Baseline backend | 43 tests: 38 passed, 5 opt-in database suites skipped, 0 failed |
| Baseline frontend build | Passed; existing large-bundle warning |
| First Stage 7 configured-host isolated suite | 13 passed, 0 failed/skipped |
| Full configured-host Stage 3–7 regression | 103 tests: 102 passed, 1 optional replica-set test skipped, 0 failed |
| Final full standalone backend | 106 tests: 105 passed, 1 optional replica-set test skipped, 0 failed (before the final order-index addition; latest changed contracts retested below) |
| Final focused changed-code checks | 35 passed, 0 failed/skipped: Stage 7 MongoDB + Stage 6 MongoDB/offline contracts, including the final unique course-order index |
| Shared HTTP client | 8 passed, 0 failed/skipped |
| Auth browser | 16 passed, 0 failed/skipped |
| Stage 4 browser regression | 13 passed, 0 failed/skipped |
| Stage 5 browser regression | 12 passed, 0 failed/skipped |
| Stage 6 browser regression | 14 passed, 0 failed/skipped |
| Stage 7 real API/MongoDB browser | 14 passed, 0 failed/skipped; final local-renderer/full CRUD suite completed in 496.20 seconds |
| Final frontend build | Passed (36.96 seconds); existing large main-chunk warning remains; PDF renderer is a separate lazy chunk |
| Dependency audits | Backend 0, frontend 0 vulnerabilities; frontend PDF.js addition audited |
| Original application logical backup restore | 17 collections: rows/index counts matched, local-only restore |
| Actual configured-host restart/readiness | All recorded checks true; 26 required application collections initialized |

Browser matrix: 320/375/390/414/768/1024/1440px, covering catalogue/selector/details, course dashboard, authored lesson/PDF, direct and course-linked book readers, admin courses/enrollments and course/lesson/plan dialogs. Reader and plan-dialog screenshots at 320/1440px were visually inspected: actual fixture PDF text renders, mobile title/controls wrap, and forms fit. Canvas acceptance checks actual rendered pixels and page restoration. Tests use generated clearly labelled fixtures, fake SMTP/scanner/payment adapters only in isolated data, and block external browser requests. A fake captured order is not Razorpay acceptance. The optional legacy replica-set test is not counted as passed.

Failures were investigated rather than omitted. The Windows sandbox initially prevented Node startup; approved reruns executed outside that restriction. A browser completion assertion matched the still-visible completion button before the request completed; it now waits for the write response. Form selectors received explicit accessible labels. Wishlist verification now waits for the real response, and the compatibility context guards a late bootstrap read overwriting a committed update. Concurrent heavy browser runs caused cold-navigation timeouts and an existing bounded media parser deadline; affected checks were rerun sequentially without weakening timeout/security limits. Configured-host acceptance initially queried the wrong authentication path and assumed standalone metadata; the path was corrected and actual topology recorded. Expanded admin testing caught archive using a stale revision immediately after edit; actions now wait for the refreshed record. Visual inspection caught the blank native PDF viewer and narrow mobile title, both corrected with the local renderer and wrapping fix. Earlier interrupted/failed runs are not included as passing results.

Commands are from repository root using npm.cmd. Fresh guarded names are required for every isolated suite:

```powershell
# Set KITSS_AUTH_TEST_DB=kitss_stage3_test_<16hex> and
# KITSS_STAGE4_TEST_DB ... KITSS_STAGE7_TEST_DB=kitss_stageN_test_<16hex>.
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:client
# Set each KITSS_STAGE4_BROWSER_DB ... KITSS_STAGE7_BROWSER_DB separately.
npm.cmd --prefix frontend run test:auth
npm.cmd --prefix frontend run test:stage4
npm.cmd --prefix frontend run test:stage5
npm.cmd --prefix frontend run test:stage6
npm.cmd --prefix frontend run test:stage7
npm.cmd run build
npm.cmd --prefix backend audit
npm.cmd --prefix frontend audit
node backend/scripts/verify-stage7-development.js --confirm-development
git diff --check
```

The local standalone run overrides MONGODB_URI only for its command, uses a fresh ignored data directory and KITSS_REQUIRE_STANDALONE=true, and never replaces the developer .env URI. Backup/cleanup tools are deliberate operator actions, not startup or test side effects. See README for their safety boundaries.

## L. Actual configured development database

[Configured-host evidence](STAGE7-DEVELOPMENT-VERIFICATION.json) records startup/readiness, Stage 3 protection, Stage 4/5 public availability, Stage 6 payment gate, Stage 7 schemas, draft exclusion, persistence and backend restart. Required application collections total **26**. Retained Stage 7 verification fixtures are unpublished synthetic draft courses/lessons and unconfigured draft plans only. No new actual-host user, administrator, Enrollment or paid BookEntitlement was seeded. Existing application content and suspended verification actors were retained.

**Topology correction:** the actual configured host advertises a replica set in hello metadata. MONGODB_REQUIRE_REPLICA_SET=false means the application does not require one; it does not prove that the server is standalone. Earlier reports' inferred standalone description is superseded by this observed evidence. No topology was changed or transaction introduced. Configured-host success and separate local standalone compatibility are distinct evidence; neither substitutes for the other. If the owner requires the configured host itself to be standalone, that operational topology decision remains unresolved and was not silently executed.

The separate loopback-only standalone test MongoDB was shut down gracefully after verifying its recorded PID, data root and port, and confirming standalone metadata. Its private data/restore directory is retained. No recursive filesystem/database reset was performed as cleanup.

## M. Remaining gates

- Fresh compromised-credential revocation/rotation, deliberate provider Test Mode approval and real provider-connected acceptance remain mandatory before real Checkout. Razorpay stays disabled.
- Real SMTP app-password configuration/delivery and intended operator bootstrap remain pending. No real super admin was created.
- Actual scanner installation/signature updates, licensed course/book/media/instructor evidence and appropriate storage capacity/backup operations remain required before real publication/sale.
- Owner-approved plan prices, durations and eligibility must be configured explicitly. Free enrollment, renewals, manual grants, full book revocation policy and video inspection/delivery remain gated.
- Registration privacy/minors/retention/documents/review/activation, financial tax/refund/invoice compliance and production operations remain unresolved. No policies were invented.
- Canvas PDF accessibility/text-selection limitations and pinned runtime verification remain documented. The existing large frontend chunk warning persists.

## N. Stage 8 readiness and stop point

The Stage 7 API/data/learning slice is ready for review subject to the stated operational and policy gates; unsupported video, renewal and grant operations are not marked complete. Stage 8 additionally needs an approved trusted results source/provenance/privacy contract and notification/account requirements. No academic result, notification engine, assessment/certificate system, production deployment or Stage 8 implementation was started. Stop here and obtain separate owner approval before Stage 8.
