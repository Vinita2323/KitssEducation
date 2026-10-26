# Master implementation checklist and traceability

Phase 1 documentation is delivered; Stage 2 implementation status is recorded separately below. Stage 3 completion is recorded below; broader business implementation remains unchecked. Feature IDs from 02, API IDs from 06, test IDs from 10, risks/decisions from 01/12. A checked item requires actual implementation/test evidence, not merely this specification.

Payment decision update, 23 October 2026: Razorpay is confirmed for applicable paid registration fees, books, prepaid coaching passes and renewals, using Standard Checkout and backend-created orders. Existing F05-F07/F14/F18/F25, A54-A61/A57, B01/B22-B24 and pricing G05/G08/B36 remain the traceability surface; no new API/feature IDs or collections are introduced. This documentation update does not authorize implementation, credential/account changes or live payments.

## Confirmed payment decision and implementation gates

- [x] Document Razorpay selection for all applicable paid flows and preserve existing architecture, API IDs and roadmap.
- [x] Document backend-only pricing/verification/entitlement authority, provider abstraction and prepaid scope.
- [x] Keep Q01/Q02/Q09 fee, access/validity, tax, refund and invoice questions unresolved; recurring billing out of scope.
- [ ] Authorized owner revokes/rotates compromised exposed test credentials and confirms fresh configuration **before payment integration**; record evidence without secret values.
- [ ] PaymentService/RazorpayPaymentProvider contains SDK calls; registration/books/learning depend only on commerce services.
- [ ] A54 resolves approved current pricing, persists pending internal order and deduplicates owner-scoped key/request hash.
- [ ] A55 backend-creates/binds Razorpay order; serializes creation, reconciles uncertain external outcomes before retry, returns only publishable Key ID and necessary Standard Checkout data.
- [ ] A56 verifies Checkout signature against stored provider order ID plus ownership, provider order/payment relation, captured state, amount/currency and environment.
- [ ] A57 verifies raw-body signature, durably records mode/event-ID receipt before acknowledgment, deduplicates retries and tolerates out-of-order events.
- [ ] MongoDB commits verified payment/order, fulfillment marker, registration fee effect or book/coaching rights, audit and outbox atomically once per source order; renewals extend once.
- [ ] A58 supplies authoritative payment/activation state after callback, dismissal, reload or network interruption; invalidate relevant user queries only from server state.
- [ ] Cancelled/failed payments and pending capture grant nothing; delayed webhook/lost callback recover through polling/reconciliation.
- [ ] Duplicate callbacks/concurrent webhooks/reconciliation produce one effect; stale failure never regresses capture; duplicate captures flagged without invented refunds.
- [ ] Temporary DB failure rolls back partial access; unpersisted events return retryable failure; unresolved-order scans and leased jobs recover after restoration.
- [ ] All three Razorpay credential variables remain backend-managed; neither secret enters frontend, VITE_ env, public settings, logs, source or fixtures.
- [ ] Development and provider integration tests use fresh Razorpay Test Mode only; no live payment during implementation/testing without explicit approval.
- [ ] B22/B23 show order/payment status filters, transaction references, failed/pending review, payment history, verified timestamps and activation status.
- [ ] B24 reconciliation is idempotent and provider-verified; even super admins cannot mark unpaid orders paid; manual nonpayment access grants cannot alter paid status/totals.
- [ ] G05/G08/B36 pricing management is permissioned/revisioned/audited; historical order prices unchanged.
- [ ] B01 financial summaries use verified records only, separated by currency/mode, with date/asOf and no duplicate totals or unapproved net/tax claims.
- [ ] T03/T07/T09/T14/T16 include payment resilience matrix from 10; offline fakes and Test Mode contracts pass before production review.

## Phase 1 deliverables

- [x] 01 repository/framework/state/deployment/dependency audit.
- [x] 02 all 37 explicit user paths, 30 routed page components, seven admin pages, unmounted page files and shared interactions.
- [x] 03 mock/inline content and browser store replacement inventory.
- [x] 04 modular JavaScript backend proposal and boundaries.
- [x] 05 collection fields, constraints, relationships, lifecycle and concurrency.
- [x] 06 public/self/admin/media/health API contracts and integration consumers.
- [x] 07 existing admin reuse, missing modules, theme and responsive behavior.
- [x] 08 authentication/roles/session/permission/security design.
- [x] 09 local server storage, future provider contract and documented env examples.
- [x] 10 frontend preservation, end-to-end flows/test/acceptance strategy.
- [x] 11 dependency-aware stages with deliverables, gates and definition of done.
- [x] 12 confirmed-versus-proposed decisions, blockers and limitations.
- [x] 13 traceability and future implementation checklist.
- [x] Explicit user approval for Stage 2 implementation only (23 October 2026); Stage 3 was subsequently approved separately; Stage 4 was subsequently approved separately; Stage 5+ remains unapproved.

## Stage 2 delivered foundation â€” 23 October 2026

- [x] Read all 13 plans, inspect initial Git/config/package state and preserve pre-existing untracked planning docs.
- [x] Establish passing frontend baseline; final build also passes with the same pre-existing bundle-size warning.
- [x] JavaScript-only backend app/server split, minimal config/middleware/storage/utils and health module; no empty business-model scaffolding.
- [x] Pin Express 5.3.0, Mongoose 9.11.3, Helmet 8.3.0 and Pino 10.4.0 with lockfile and scripts; backend dependency audit found zero known vulnerabilities.
- [x] Document Node 22.23.4 LTS pin in `.nvmrc`/`.node-version`; disclose actual tests on installed 22.15.0/npm 10.9.2, not a claimed runtime upgrade.
- [x] Central env parser/validation with precedence, bounded limits, exact origins, safe proxy settings and required URI/absolute storage root; optional blank Razorpay Test Mode placeholders.
- [x] Create credential-free local backend/frontend `.env` files without overwrite; ignore real env/uploads/dependencies and retain `.env.example` files.
- [x] Mongoose connection/timeouts/replica-set topology validation, readiness ping, safe connection failure and graceful disconnect; no business models or unknown/production DB connection.
- [x] Versioned A76/A77 health routes; request IDs, Helmet, strict bounded JSON, exact-origin credentialed CORS, JSON 404/error and redacted logs.
- [x] Fail startup before HTTP listen if DB/storage initialization fails; draining/one-shot shutdown and tested deadline/SIGINT/SIGTERM behavior.
- [x] Local StorageProvider implementation: server disk, public/private/staging/quarantine areas, generated keys, root/path/junction validation, streams/limits/SHA-256/ranges, no overwrite, deletion and failed-stream staging cleanup.
- [x] No HTTP upload/media/static-private exposure; explicit Stage 3/6 middleware integration comments without fake auth or permission bypass.
- [x] New reusable frontend HTTP client with cookie credentials, request IDs, structured errors, timeout/AbortController, JSON envelope checks and future CSRF getter; not integrated into existing mock services.
- [x] Backend automated tests: **25 passed, 1 skipped, 0 failed/cancelled**; all five HTTP client tests passed.
- [x] Root frontend dev command smoke-tested: `/home`, `/books`, `/admin` returned SPA shell; stopped temporary server. Root backend startup against local absent MongoDB failed safely with sanitized logs as expected.
- [x] Review scope/ignore rules and scan new files for copied exposed secrets; existing tracked frontend/root package files unchanged.
- [x] Document commands, local replica-set setup, storage semantics/limits and Stage 3/Stage 6 dependencies in [backend README](../../backend/README.md).
- [ ] Real local replica-set connection/readiness integration: **not executed**, no `MONGODB_TEST_URI` or local MongoDB/Docker listener available. Run opt-in test after setup; do not treat the skip as a pass.
- [ ] Execute verification on pinned Node 22.23.4 (host runtime not changed in Stage 2).
- [x] Stage 3 approval and Q03 decisions subsequently received; fake SMTP used, live delivery remains pending.

The broader foundation/T01-T16 items below include later-stage auth, audit, transactions and business behavior; they remain unchecked rather than treating Stage 2 completion as whole-platform completion. Stage 2 is delivered with the real-DB/runtime verification limitations above, and the separately authorized Stage 3 work is recorded below.

## Stage 3 implementation and acceptance â€” 23 October 2026

- [x] Explicit Stage 3-only authorization and approved Q03-A/B/C/D/E; SMTP/app-password decision recorded.
- [x] Audit plans/source/config/Git, baseline tests/build, preserve pre-existing Stage 1/2 untracked work.
- [x] Modular JavaScript architecture retained; exact Argon2/Nodemailer dependencies and lockfile.
- [x] Owner MongoDB URI preserved; standalone default/local setting, safe explicit development DB selection; connection/startup/readiness pass; no resets/drops/transactions.
- [x] User/Session, normalized unique email/backend ID, Argon2id hashing, safe DTOs, no caller role assignment.
- [x] Embedded durable AuthChallenge atomic consume/effect, expiry/five attempts/cooldown/resend/invalidation/cleanup.
- [x] Hashed opaque persistent HttpOnly sessions, student pointer CAS, expiry/idle/version revocation and logout.
- [x] Email/ID login; invalid/unverified/suspended rejection; explicit single-use two-minute transfer with concurrent winner enforcement.
- [x] A01-A09 and B17 implemented; minimal A09/B17 extensions documented without renumbering.
- [x] OTP verification/recovery/password change, no pre-verification session or paid grants.
- [x] Authoritative requireSession/requirePermission/requireOwner; code-managed permissions and default deny.
- [x] Invitation-only ordinary admin, server grants, expiring link/password choice/email OTP, audited resend/revoke and super-admin UI controls.
- [x] Explicit audited initial super-admin CLI, unique singleton, no default/startup seed; tested only in isolated data.
- [x] SMTP/app-password EmailService, TLS/templates/blank placeholders/fake transport/safe failures.
- [x] Exact Origin/signed CSRF and existing shared HTTP-client integration.
- [x] Atomic durable audit outbox, deduplication/retry, persistent account/IP throttles, redacted logs.
- [x] Real AuthContext/me/login/logout/expiry, blank credential/OTP defaults, verification/recovery/confirmed transfer UI.
- [x] All admin routes guard loading/staff/domain permissions; server identity/nav; visibly disabled preview business pages.
- [x] Identity-keyed library reset/legacy credential cleanup; mock payment/enrollment shortcuts reject, no seeded paid grants.
- [x] Backend final: **44 passed, 1 skipped, 0 failed** of 45, including real dedicated MongoDB and HTTP/concurrency tests. Only legacy replica-set check skipped.
- [x] Shared client **7 passed**; baseline/final build pass with existing bundle warning; final desktop/mobile browser **16 passed**, including staff accept/invite/revoke controls.
- [x] Configured DB startup smoke live/ready=200, me=401, graceful close; no real bootstrap/mail/payment.
- [x] Backend audit 0 advisories; frontend 2 high affected packages documented; current exposed secret field cleared without copying; ignored env/artifacts and diff checked.
- [ ] Configure SMTP/app-password and verify live delivery to explicitly authorized development recipients.
- [ ] Operator bootstrap against intended application DB, email verification and real staff login; not run by implementation.
- [ ] Validate pinned Node 22.23.4, resolve frontend advisories, calibrate production abuse/hash policy and operational security/MFA.
- [x] Owner accepted Stage 3 and separately approved Stage 4; Stage 4 implementation is recorded below.
- [ ] Stage 6 owner credential rotation and separately approved payment consistency strategy; no payments implemented.

## Feature coverage matrix

| ID | Existing frontend -> backend behavior | Models | API IDs / families | Admin responsibility (or reason none) | Integration work -> acceptance tests |
|---|---|---|---|---|---|
| F01 | HomeDashboard/UserLayout/header/drawer/carousels -> published content/branding/support | PageContent/Banner/SiteSettings/NotificationReceipt | A69-A71/A66; G09/G10/B33/B35-B36 | CMS and settings; carousel/toggle state stays client | dynamic sections/footer/links/unread -> T01/T12 |
| F02 | About/faculty filters -> verified editable founder/faculty/about | PageContent/FacultyProfile/MediaAsset | A69; G09/G11/B33/A72 | About and faculty editor | preserve filters/portraits/theme -> T01 |
| F03 | Categories/CategorySheet -> safe domain navigation/curriculum config | PageContent/Taxonomy | A20/A69; G04/G09 | CMS taxonomy/category copy; route registry stays code | search/tab/reset remain local -> T01/T06 |
| F04 | Login/reset/success/AuthContext -> secure canonical identity and session/device lifecycle | User/Session/AuthChallenge/Job | A01-A12/B14-B18 | staff/account management; no credential CMS | guest/bootstrap/activation/transfer/cache clearing -> T02/T03/T13 |
| F05 | StudyRegistrationForm -> full durable typed fee intake | RegistrationApplication/User/Order/PaymentAttempt/MediaAsset | A15-A19/A54-A58/A72; B10-B13 | study intake + fees/orders | no discarded docs/fake success/credentials -> T03/T07 |
| F06 | TuitionCoachingForm -> full academic/guardian/address/document intake | same + Taxonomy | same as F05/A20 | tuition intake + fees | full field readback and correct identity -> T03 |
| F07 | TeacherProfessorForm -> persisted experience/identity/verification fee review | RegistrationApplication/MediaAsset/Order/PaymentAttempt | same as F05/B22-B24 | faculty application review; no implicit educator portal | real ID/status/payment; no auto staff role -> T03/T14 |
| F08 | CollegeFranchiseForm -> valid parent hierarchy/draft/documents/pending review | FranchiseApplication/University/College/MediaAsset | A22-A23/A28-A31/A72; B06-B09 | franchise review/notes/decision | real uploads, submit validates all steps -> T04 |
| F09 | CollegesListing/DetailsModal -> active directory/program metadata | University/College/CollegeProgram/Taxonomy | A21-A26; G01-G04 | institutions CRUD/verification/archive | real filtering/reset/details/external links -> T05 |
| F10 | InstitutesListing -> explicit tie-ups, no guessed affiliations | same + FranchiseApplication relationship policy | A21-A26; G01-G03/B08 | institutions/franchise eligibility | dynamic university options and correct parents -> T04/T05 |
| F11 | AdmissionApplicationModal -> durable enquiry/status/notes | AdmissionApplication/College/CollegeProgram/User | A27/B02-B05/G03 | admissions + programs | preselection/review/notes and server membership -> T05 |
| F12 | BooksHome/filters/cards -> published catalogue/search/facets | Book/Taxonomy/MediaAsset | A32-A35; G04/G05/B31 | book publishing/taxonomy | replace local seeds/dependent filters -> T06 |
| F13 | BookDetails/wishlist/preview/share -> safe detail/sample/personal wishlist | Book/LearningProgress/MediaAsset | A34-A35/A37-A39 | books for metadata; wishlist owned by user, share local | real samples, server wishlist, no fake ratings -> T06 |
| F14 | BookCheckout/Course checkout/MyOrders/invoice -> server-priced verified capture/order/fulfillment | Order/PaymentAttempt/BookEntitlement/Enrollment/MediaAsset/Job | A54-A61/A57; B22-B24 | commerce reconciliation, no manual paid flag | pending/error/success and real invoice -> T07 |
| F15 | MyPurchasedBooks/PdfReader/LibraryContext -> authorized real PDF/progress/bookmarks | Book/BookEntitlement/LearningProgress | A36-A42/A73; G05/B20-B21 | content/access support; reading state owned by user | actual pages/TOC and warning contract -> T08 |
| F16 | CoachingHome/Selector -> real filters and saved choices | Course/Taxonomy/User.preferences | A13-A14/A43-A47; G04/G06 | coaching + taxonomy | no getCoachingStore imports, no paid join bypass -> T09 |
| F17 | CourseRegistrationPage -> canonical account profile without inherited enrollment | User/RegistrationApplication/AuthChallenge | A15-A19/A09 | accounts/intake | same credentials/profile across portals -> T03/T09 |
| F18 | CourseDetails/Subscribe/renew -> one plan/price/expiry and verified order | CoursePlan/Enrollment/Order/PaymentAttempt | A45-A46/A54-A58; G08/B24 | plans + commerce | both plan screens consistent -> T07/T09 |
| F19 | MyCourses/Dashboard/Expiry/Profile -> current-user entitlement/summary | Enrollment/LearningProgress/Course/Book/Lesson | A48-A50/A03; B19-B21/G06 | enrollment support/content; progress system-derived | no seeded/shared expiry/progress -> T10 |
| F20 | LecturePlayer/legacy CoursePlayer/players/accordion -> canonical syllabus + byte authorization | Course/Lesson/Enrollment/Progress/MediaAsset | A50-A52/A73; G06/G07/B32 | syllabus/lesson/media/preview publishing | exact ID, same completion, mobile playback -> T10 |
| F21 | BookReader/OnlineBookViewer -> linked real book read | Course.bookLinks/Book/Enrollment/Progress | A40-A42/A53/A73; G05/G06 | linked books; bookmarks user-owned | no first-book fallback/generated text -> T08/T10 |
| F22 | ResultsPage/form/marksheet/export -> genuine authorized records | ResultIssuer/Exam/ResultRecord/ResultHistory/MediaAsset | A62-A65; G12/G13/B25-B30 | source configuration/import/review/publication | no fabrication/partial match/false signature, print preserved -> T11 |
| F23 | Notifications/header -> targeted notices/read state | Notification/NotificationReceipt | A66-A68; G14/B34 | notices compose/publish; receipts user-owned | real counts/read persistence/navigation -> T12 |
| F24 | Profile/Settings -> validated profile/password/preferences | User/Session/AuthChallenge/derived Progress | A03-A14/B14-B18/B35-B36 | accounts/settings; personal toggles user-owned | no fake password/cache success; no seeded reward data -> T13 |
| F25 | AdminLayout/seven pages -> protected real CRUD/review/aggregate operations | all managed models + AuditLog/Job | G01-G14/B01-B39 | admin modules in 07 | fix missing service calls/permissions/responsive routes -> T14/T16 |
| F26 | inactive/advertised tests/live/certificates/portals and redirects -> scope control | none until approved | no speculative APIs | none; unmounted or unsupported product workflows | Q08 accepted treatment, aliases retained -> T15 |

Every discovered active feature has a proposed owner, data/API mapping and test. No active feature is silently omitted; **business coverage is conditional** on Q01-Q12. Gaps not yet implementable: trusted results without source, actual educational files without licensed assets, privacy policy for IDs/minors, conflicting paid join/registration semantics, unsupported marketing promises. These are blockers/decisions, not completed functional coverage.

## Foundation and backend checklist

- [ ] Approve scope and record Q01-Q12 decisions relevant to next slice.
- [ ] Supported runtime/dependency versions pinned and compatibility/security checked.
- [ ] App/server split, DB transaction setup, graceful shutdown/readiness.
- [ ] Startup env validation, exact origins, secure proxy/cookies, bounded parsers.
- [ ] Shared HTTP client/errors/request IDs and redacted logs/audit.
- [ ] Per-module validation/controller/service/model ownership with no duplicate global trees.
- [ ] Every model in 05 has validation/indexes/projection/retention/CRUD policy tested.
- [ ] Parent membership, publication and concurrent-edit rules enforced server-side.
- [ ] Idempotent commerce/session/media operations with transactional/failure tests.
- [ ] Persisted jobs/lease/retry/dead-letter inspection and operational ownership.

## Admin checklist

- [ ] Secure admin login, session/logout/recovery and permission navigation/actions.
- [ ] Existing University/College/Program CRUD with media/district/contact gaps completed.
- [ ] Existing admission review and note-only method fixed.
- [ ] Existing franchise review with actual private documents and explicit eligibility rules.
- [ ] Existing Book CRUD with actual cover/PDF/sample/TOC and publish validation.
- [ ] Study/Tuition/Faculty/Coaching-profile typed intake review and payment state.
- [ ] Course/syllabus/lesson/book-link and plan management.
- [ ] Enrollment/book access support with audited grants/revocations.
- [ ] Orders/attempts/invoice availability/reconciliation.
- [ ] Home/about/categories/founder/faculty/banner/footer/support settings CMS.
- [ ] Taxonomy and location dependent options, safe custom value moderation.
- [ ] Trusted results issuer/exam/import/correction/withdrawal (only approved source).
- [ ] Targeted notification publication and real read-count integration.
- [ ] User status/invitations/roles safeguards; no self escalation.
- [ ] Media lifecycle/audit/job screens and true dashboard totals.
- [ ] No production mock factory reset or editable secrets/security floors.
- [ ] All admin routes loading/empty/error/conflict/denied/success states.
- [ ] All admin routes at required eight viewport widths and keyboard/zoom/long data.

## Frontend and storage checklist

- [ ] Preserve all active paths/aliases/layout/theme/animations; capture baseline first.
- [ ] Stop mock-user fallback and cross-account browser data leaks.
- [ ] Replace every business-data source in 03 and audit appendix, with explicitly approved exceptions only.
- [ ] Replace local entitlement grant setters and client price/payment authority.
- [ ] Canonical course/identity DTO adapters support both player interfaces.
- [ ] Real uploads persist file IDs, all intake fields survive reload.
- [ ] Real PDFs/video/ranges, access guards and per-user progress/bookmarks/wishlist.
- [ ] Query cancellation/debounce/paging/filter resets and cache invalidation.
- [ ] Marksheet renderer uses exact source identity/marks, truthful verification labels.
- [ ] Profile/email/password/preferences/notifications/invoice actions do actual work.
- [ ] Missing toast warning and dormant undefined history setter resolved by approved scope.
- [ ] Local provider isolated private/public/staging/quarantine, no filesystem path leakage.
- [ ] MIME/signature/decode/scan/size/quota/stream-abort validation and cleanup.
- [ ] Persistent volume/free-space monitoring and matching file+DB backups/restores.
- [ ] Future provider contract migration tested with checksum/visibility/rollback, no cloud implementation now.
- [ ] Frontend/backend env examples only placeholders, real secrets ignored/injected/rotated.

## Test/release milestones

- [ ] T01 CMS publication reflects on user frontend.
- [ ] T02 authentication/session/reset/transfer and private cache isolation.
- [ ] T03 complete registrations/documents/fees/canonical activation.
- [ ] T04 franchise review/hierarchy/private assets.
- [ ] T05 institution/program/enquiry/notes transitions.
- [ ] T06 book search/facets/draft protection/preview/wishlist.
- [ ] T07 verified capture/replay/reconcile/invoice/ownership.
- [ ] T08 real PDF access/progress/bookmarks/TOC/warnings.
- [ ] T09 course filter/join/plan/renewal consistency.
- [ ] T10 both players/course books/expiry/progress/mobile ranges.
- [ ] T11 real results/no-match/provenance/privacy/print/PDF.
- [ ] T12 notifications targeting/read state/counts.
- [ ] T13 profile/password/email/preferences/true cache behavior.
- [ ] T14 admin CRUD/permissions/revisions/no fake reset.
- [ ] T15 unmounted/advertised feature scope decisions and route regression.
- [ ] T16 startup/logs/storage/backups/jobs/restore/rollback.
- [ ] Provider sandbox contracts, no unauthorized live charges.
- [ ] All implemented API operations have authentication/permission/ownership and validation negatives.
- [ ] Production mock import/default secret/credential/bundle scans clean.
- [ ] Source/asset/provenance/retention approvals and operator ownership recorded.
- [ ] Staging release candidate review and applicable deployment authorization.

## API operation checklist

The operation-by-operation list below is generated from the reviewed inventory in 06. Catalogue families explicitly expand five operations. Each operation requires request validation, permission/ownership, correct DTO/error handling, consumer integration where applicable and meaningful verification before checking it off.

- [x] A01: `GET /api/v1/auth/csrf`.
- [x] A02: `POST /api/v1/auth/login`.
- [x] A03: `GET /api/v1/auth/me`.
- [x] A04: `POST /api/v1/auth/logout`.
- [x] A05: `POST /api/v1/auth/session/transfer`.
- [x] A06: `POST /api/v1/auth/password/forgot`.
- [x] A07: `POST /api/v1/auth/password/reset`.
- [x] A08: `POST /api/v1/auth/password/change`.
- [x] A09: `POST /api/v1/auth/activate`.
- [x] A10: `PATCH /api/v1/me/profile`.
- [x] A11: `POST /api/v1/me/email-change`.
- [x] A12: `POST /api/v1/me/email-change/confirm`.
- [x] A13: `GET /api/v1/me/preferences`.
- [x] A14: `PATCH /api/v1/me/preferences`.
- [x] A15: `GET /api/v1/public/registration-config`.
- [x] A16: `POST /api/v1/registration-applications`.
- [x] A17: `PATCH /api/v1/registration-applications/:id`.
- [ ] A18: `POST /api/v1/registration-applications/:id/submit`.
- [x] A19: `GET /api/v1/registration-applications/:id/status`.
- [x] A20: `GET /api/v1/taxonomies`.
- [x] A21: `GET /api/v1/institutions/facets`.
- [x] A22: `GET /api/v1/universities`.
- [x] A23: `GET /api/v1/universities/:id/colleges`.
- [x] A24: `GET /api/v1/colleges`.
- [x] A25: `GET /api/v1/colleges/:id`.
- [x] A26: `GET /api/v1/colleges/:id/programs`.
- [x] A27: `POST /api/v1/admission-applications`.
- [x] A28: `POST /api/v1/franchise-applications`.
- [x] A29: `PATCH /api/v1/franchise-applications/:id`.
- [x] A30: `POST /api/v1/franchise-applications/:id/submit`.
- [x] A31: `GET /api/v1/franchise-applications/:id/status`.
- [x] A32: `GET /api/v1/books`.
- [x] A33: `GET /api/v1/books/facets`.
- [x] A34: `GET /api/v1/books/:id`.
- [x] A35: `GET /api/v1/books/:id/preview`.
- [x] A36: `GET /api/v1/me/books`.
- [x] A37: `GET /api/v1/me/books/:id/state`.
- [x] A38: `PUT /api/v1/me/books/:id/wishlist`.
- [x] A39: `DELETE /api/v1/me/books/:id/wishlist`.
- [x] A40: `PUT /api/v1/me/books/:id/progress`.
- [x] A41: `PUT /api/v1/me/books/:id/bookmarks/:page`.
- [x] A42: `DELETE /api/v1/me/books/:id/bookmarks/:page`.
- [x] A43: `GET /api/v1/coaching/courses`.
- [x] A44: `GET /api/v1/coaching/facets`.
- [x] A45: `GET /api/v1/coaching/courses/:id`.
- [x] A46: `GET /api/v1/coaching/courses/:id/plans`.
- [ ] A47: `POST /api/v1/coaching/courses/:id/enroll`.
- [x] A48: `GET /api/v1/me/enrollments`.
- [x] A49: `GET /api/v1/me/enrollments/:courseId`.
- [x] A50: `GET /api/v1/coaching/courses/:id/syllabus`.
- [x] A51: `GET /api/v1/coaching/courses/:id/lessons/:lessonId`.
- [x] A52: `PUT /api/v1/me/lessons/:lessonId/progress`.
- [x] A53: `GET /api/v1/coaching/courses/:id/books/:bookId`.
- [x] A54: `POST /api/v1/orders`.
- [x] A55: `POST /api/v1/orders/:id/payment-attempts`.
- [x] A56: `POST /api/v1/payments/razorpay/verify`.
- [x] A57: `POST /api/v1/webhooks/razorpay`.
- [x] A58: `GET /api/v1/orders/:id/status`.
- [x] A59: `GET /api/v1/me/orders`.
- [x] A60: `GET /api/v1/me/orders/:id`.
- [ ] A61: `GET /api/v1/me/orders/:id/invoice`.
- [x] A62: `GET /api/v1/results/config`.
- [x] A63: `GET /api/v1/results/issuers/:id`.
- [x] A64: `POST /api/v1/results/lookup`.
- [x] A65: `GET /api/v1/me/results`.
- [x] A66: `GET /api/v1/me/notifications`.
- [x] A67: `PUT /api/v1/me/notifications/:id/read`.
- [x] A68: `POST /api/v1/me/notifications/read-all`.
- [x] A69: `GET /api/v1/public/content/:key`.
- [x] A70: `GET /api/v1/public/banners`.
- [x] A71: `GET /api/v1/public/settings`.
- [x] A72: `POST /api/v1/media`.
- [x] A73: `GET /api/v1/media/:id/content`.
- [x] A74: `GET /api/v1/media/:id/metadata`.
- [x] A75: `DELETE /api/v1/media/:id`.
- [x] A76: `GET /api/v1/health/live` (Stage 2 HTTP tests passed).
- [x] A77: `GET /api/v1/health/ready` (Stage 2 success/failure/deadline/draining tests passed with dependency doubles; real MongoDB integration skipped).
- [x] G01: `GET /api/v1/admin/universities`.
- [x] G01: `GET /api/v1/admin/universities/:id`.
- [x] G01: `POST /api/v1/admin/universities`.
- [x] G01: `PATCH /api/v1/admin/universities/:id`.
- [x] G01: `DELETE /api/v1/admin/universities/:id`.
- [x] G02: `GET /api/v1/admin/colleges`.
- [x] G02: `GET /api/v1/admin/colleges/:id`.
- [x] G02: `POST /api/v1/admin/colleges`.
- [x] G02: `PATCH /api/v1/admin/colleges/:id`.
- [x] G02: `DELETE /api/v1/admin/colleges/:id`.
- [x] G03: `GET /api/v1/admin/colleges/:collegeId/programs`.
- [x] G03: `GET /api/v1/admin/colleges/:collegeId/programs/:id`.
- [x] G03: `POST /api/v1/admin/colleges/:collegeId/programs`.
- [x] G03: `PATCH /api/v1/admin/colleges/:collegeId/programs/:id`.
- [x] G03: `DELETE /api/v1/admin/colleges/:collegeId/programs/:id`.
- [x] G04: `GET /api/v1/admin/taxonomies`.
- [x] G04: `GET /api/v1/admin/taxonomies/:id`.
- [x] G04: `POST /api/v1/admin/taxonomies`.
- [x] G04: `PATCH /api/v1/admin/taxonomies/:id`.
- [x] G04: `DELETE /api/v1/admin/taxonomies/:id`.
- [x] G05: `GET /api/v1/admin/books`.
- [x] G05: `GET /api/v1/admin/books/:id`.
- [x] G05: `POST /api/v1/admin/books`.
- [x] G05: `PATCH /api/v1/admin/books/:id`.
- [x] G05: `DELETE /api/v1/admin/books/:id`.
- [x] G06: `GET /api/v1/admin/coaching/courses`.
- [x] G06: `GET /api/v1/admin/coaching/courses/:id`.
- [x] G06: `POST /api/v1/admin/coaching/courses`.
- [x] G06: `PATCH /api/v1/admin/coaching/courses/:id`.
- [x] G06: `DELETE /api/v1/admin/coaching/courses/:id`.
- [x] G07: `GET /api/v1/admin/coaching/courses/:courseId/lessons`.
- [x] G07: `GET /api/v1/admin/coaching/courses/:courseId/lessons/:id`.
- [x] G07: `POST /api/v1/admin/coaching/courses/:courseId/lessons`.
- [x] G07: `PATCH /api/v1/admin/coaching/courses/:courseId/lessons/:id`.
- [x] G07: `DELETE /api/v1/admin/coaching/courses/:courseId/lessons/:id`.
- [x] G08: `GET /api/v1/admin/coaching/courses/:courseId/plans`.
- [x] G08: `GET /api/v1/admin/coaching/courses/:courseId/plans/:id`.
- [x] G08: `POST /api/v1/admin/coaching/courses/:courseId/plans`.
- [x] G08: `PATCH /api/v1/admin/coaching/courses/:courseId/plans/:id`.
- [x] G08: `DELETE /api/v1/admin/coaching/courses/:courseId/plans/:id`.
- [x] G09: `GET /api/v1/admin/content/pages`.
- [x] G09: `GET /api/v1/admin/content/pages/:id`.
- [x] G09: `POST /api/v1/admin/content/pages`.
- [x] G09: `PATCH /api/v1/admin/content/pages/:id`.
- [x] G09: `DELETE /api/v1/admin/content/pages/:id`.
- [x] G10: `GET /api/v1/admin/content/banners`.
- [x] G10: `GET /api/v1/admin/content/banners/:id`.
- [x] G10: `POST /api/v1/admin/content/banners`.
- [x] G10: `PATCH /api/v1/admin/content/banners/:id`.
- [x] G10: `DELETE /api/v1/admin/content/banners/:id`.
- [x] G11: `GET /api/v1/admin/content/faculty`.
- [x] G11: `GET /api/v1/admin/content/faculty/:id`.
- [x] G11: `POST /api/v1/admin/content/faculty`.
- [x] G11: `PATCH /api/v1/admin/content/faculty/:id`.
- [x] G11: `DELETE /api/v1/admin/content/faculty/:id`.
- [x] G12: `GET /api/v1/admin/result-issuers`.
- [x] G12: `GET /api/v1/admin/result-issuers/:id`.
- [x] G12: `POST /api/v1/admin/result-issuers`.
- [x] G12: `PATCH /api/v1/admin/result-issuers/:id`.
- [x] G12: `DELETE /api/v1/admin/result-issuers/:id`.
- [x] G13: `GET /api/v1/admin/exams`.
- [x] G13: `GET /api/v1/admin/exams/:id`.
- [x] G13: `POST /api/v1/admin/exams`.
- [x] G13: `PATCH /api/v1/admin/exams/:id`.
- [x] G13: `DELETE /api/v1/admin/exams/:id`.
- [x] G14: `GET /api/v1/admin/notifications`.
- [x] G14: `GET /api/v1/admin/notifications/:id`.
- [x] G14: `POST /api/v1/admin/notifications`.
- [x] G14: `PATCH /api/v1/admin/notifications/:id`.
- [x] G14: `DELETE /api/v1/admin/notifications/:id`.
- [x] B01: `GET /api/v1/admin/dashboard`.
- [x] B02: `GET /api/v1/admin/admission-applications`.
- [x] B03: `GET /api/v1/admin/admission-applications/:id`.
- [x] B04: `PATCH /api/v1/admin/admission-applications/:id/status`.
- [x] B05: `POST /api/v1/admin/admission-applications/:id/notes`.
- [x] B06: `GET /api/v1/admin/franchise-applications`.
- [x] B07: `GET /api/v1/admin/franchise-applications/:id`.
- [x] B08: `PATCH /api/v1/admin/franchise-applications/:id/status`.
- [x] B09: `POST /api/v1/admin/franchise-applications/:id/notes`.
- [x] B10: `GET /api/v1/admin/registration-applications`.
- [x] B11: `GET /api/v1/admin/registration-applications/:id`.
- [ ] B12: `PATCH /api/v1/admin/registration-applications/:id/status`.
- [x] B13: `POST /api/v1/admin/registration-applications/:id/notes`.
- [x] B14: `GET /api/v1/admin/users`.
- [x] B15: `GET /api/v1/admin/users/:id`.
- [x] B16: `PATCH /api/v1/admin/users/:id/status`.
- [x] B17: `POST /api/v1/admin/users/invitations`.
- [x] B18: `PATCH /api/v1/admin/users/:id/roles`.
- [x] B19: `GET /api/v1/admin/enrollments`.
- [ ] B20: `POST /api/v1/admin/entitlements`.
- [ ] B21: `POST /api/v1/admin/entitlements/:id/revoke`.
- [x] B22: `GET /api/v1/admin/orders`.
- [x] B23: `GET /api/v1/admin/orders/:id`.
- [x] B24: `POST /api/v1/admin/orders/:id/reconcile`.
- [x] B25: `GET /api/v1/admin/results/records`.
- [x] B26: `GET /api/v1/admin/results/records/:id`.
- [x] B27: `POST /api/v1/admin/results/imports`.
- [ ] B28: `POST /api/v1/admin/results/records/:id/publish`.
- [x] B29: `POST /api/v1/admin/results/records/:id/corrections`.
- [x] B30: `POST /api/v1/admin/results/records/:id/withdraw`.
- [x] B31: `POST /api/v1/admin/books/:id/publish`.
- [x] B32: `POST /api/v1/admin/coaching/courses/:id/publish`.
- [x] B33: `POST /api/v1/admin/content/pages/:id/publish`.
- [x] B34: `POST /api/v1/admin/notifications/:id/publish`.
- [x] B35: `GET /api/v1/admin/settings`.
- [x] B36: `PATCH /api/v1/admin/settings/:key`.
- [x] B37: `GET /api/v1/admin/media`.
- [x] B38: `GET /api/v1/admin/audit-logs`.
- [x] B39: `GET /api/v1/admin/jobs`.
## Stage 4 implementation â€” 24 October 2026

- [x] Owner accepted Stage 3 and explicitly approved Stage 4 only; preserve previous user work.
- [x] Confirm Q04 verified signed-in admission accounts; Q06 document-free submission with approval blocked.
- [x] Add validated taxonomy/university/college/program/admission/franchise models and additive indexes; no seed/reset or transactions.
- [x] Document one operational DomainLock collection for fail-closed standalone hierarchy integrity and operator recovery.
- [x] A20-A31/G01-G04/B02-B09 implemented with existing IDs, publication filters, server pagination, ownership, RBAC, Origin/CSRF, revisions and archive retention.
- [x] Reuse existing admin institution/program/admission/franchise screens; add taxonomy management; implement real APIs, errors, note-only review and server actors.
- [x] Public college/institute directories/details/facets use authoritative data; admission confirmation uses a persisted reference.
- [x] Franchise drafts/submission/status are persisted and recoverable; pending files block submit; approval cannot bypass policy.
- [x] Per-record durable audit outbox/retries; idempotent intake/notes; concurrent stale edits fail safely.
- [x] Real standalone MongoDB/HTTP and existing backend suite: 59 tests, 58 passed, 1 optional replica-set check skipped, 0 failed.
- [x] Shared frontend client regression: 7 passed; backend/frontend dependency audits: 0 vulnerabilities each.
- [x] Compatible Vite 6.4.5/source-map-js 1.2.2 patch remediation; no framework major upgrade or Razorpay SDK.
- [x] Final real API/MongoDB browser suite: 13 passed, 0 failed/skipped, including five workflows and 320/375/390/414/768/1024/1440px checks; auth browser regression 16 passed; production build passed with existing bundle warning; diff/secret checks passed.
- [ ] A72 complete authorized upload/scanning/MediaAsset lifecycle: deferred; no files claimed uploaded.
- [ ] Q06 approval evidence/criteria/affiliation effect and Q05 real-data consent/retention decisions.
- [ ] Real SMTP delivery and intended operator bootstrap; no live email/admin created by Stage 4.
- [ ] Pinned Node 22.23.4 verification and future approved payment consistency/credential rotation.
- [ ] Separate owner approval for Stage 5; no later-stage implementation is authorized by this checklist.


## Stage 5 implementation - 24 October 2026

- [x] Owner approved Stage 5 and non-destructive configured development database verification; pre-existing working tree preserved.
- [x] Book/PageContent/Banner/FacultyProfile/SiteSettings/MediaAsset schemas and additive indexes, standalone operation with existing shared durable lock.
- [x] A32-A35/G05/B31 catalogue, facets, draft/public snapshots, metadata, revisioned CRUD/archive and safe preview descriptors.
- [x] A69-A71/G09-G11/B33/B35-B36 typed CMS, scheduling, faculty evidence and allowlisted public settings.
- [x] A72-A75/B37 staff-only uploads, signature/decode validation, metadata/checksum, quarantine, ranges, default-deny private delivery, references and durable cleanup/retry.
- [x] Scanner adapter and explicit rescan; absent/failed/infected scanner fails closed. This does not mean a real scanner is installed or operationally verified.
- [x] Existing book/public CMS/admin layouts consume persisted APIs; no mock catalogue reset, fabricated rating or frontend purchase/free-reader grant.
- [x] RBAC/Origin/CSRF, revisions, compatible media ownership, snapshot reference protection and durable audit outbox verified.
- [x] Backend: 71 passed, 1 optional replica-set test skipped, 0 failed (72 tests); shared client 8 passed; auth browser 16 passed; Stage 4 browser 13 passed; Stage 5 browser 12 passed.
- [x] Development smoke: actual draft API/browser persistence and restart/readiness verified; labelled IDs retained; both temporary actors suspended and sessions revoked; no drops/resets/existing-record deletion.
- [x] Build passes with existing large-chunk warning; backend/frontend audits 0 vulnerabilities; report and runbook updated.
- [ ] Real local scanner installation/signature updates and actual-daemon operational verification; licensed educational content publication.
- [ ] Approved book prices/free-reader policy, real faculty/licensing evidence, privacy/retention/capacity/backup decisions.
- [ ] Real SMTP app-password delivery and intended operator bootstrap; sensitive application uploads and franchise approval remain blocked.
- [ ] Pinned runtime verification; Stage 6 owner approval, compromised Razorpay credential rotation, financial policy and standalone payment consistency decision.

The earlier Stage 4 A72 deferral and Stage 5 approval entries above are historical. Stage 5 now implements the approved staff media lifecycle, with actual scanning/publication still gated. Broad full-platform checklist items (entitlements, full reader, all-module media, jobs, production operation) remain unchecked.

## Stage 6 verification checklist - 24 October 2026

- [x] Owner authorized safely achievable Stage 6; preserve work and all old credentials; no real provider calls until fresh confirmation.
- [x] Audit source/plans/current environment; baseline backend 35 passed/4 opt-in skips, frontend build passed.
- [x] Authoritative standalone Order with journaled CAS, embedded attempts, unique provider/owner references, durable capture/fulfillment intent and audit outbox.
- [x] PaymentService/provider abstraction and offline HTTPS/HMAC contracts; unapproved credentials/Live Mode fail closed.
- [x] Internal backend-priced book orders, historical snapshots, owner idempotency and recoverable status; no client payment authority.
- [x] External create intent and uncertain-outcome lookup; no blind create retry.
- [x] Raw signed webhook durable Job receipts/dedup; expiring lease/fencing, backoff/eight-claim dead letters and staff investigation.
- [x] Unique source-order BookEntitlement recovery; actual entitlement + captured source + secure licensed media required; no zero-price grant.
- [x] Registration verified-owner drafts/all safe existing fields, explicit blocked document slots, notes/fee metadata; no identity number/file collection or teacher roles.
- [x] Existing Checkout/order/registration/admin UI integration; financial summaries/receipts derived from verified records, exercised with simulated Test Mode records; no official invoice/refund or manual paid override.
- [x] Separate local standalone test/development server used without modifying the configured database URI/topology; labelled local smoke retained and actor retired.
- [ ] Configured-host Stage 6 indexes/persistence/restart smoke: blocked by 500-collection host capacity; no application fixture IDs created.
- [ ] Fresh Razorpay Test credentials/webhook rotation, deliberate operator validation and real provider-connected order/capture/webhook tests.
- [ ] Registration document/privacy/eligibility/activation policy; charges remain blocked.
- [ ] Actual CoursePlan/enrollment/renewal domain and approved validity rules; G08/A43-A50 renewal success remains deferred to Stage 7.
- [ ] Tax/refund/legal invoice policy (A61 official invoice remains gated); actual scanner/licensing/SMTP/backup/runtime gates remain.
- [ ] Separate owner approval before Stage 7.

API completion marks below describe implemented offline/simulated verification only, not provider-connected acceptance. A18/B12 registration submission/activation and A61 official invoices stay unchecked. Stage 6 final test counts are maintained in backend/STAGE6-REPORT.md.

Stage 6 final evidence:

- [x] Full backend regression: 89 tests, 88 passed, 1 optional replica-set skip, 0 failed; final focused commerce/failure-injection suite: 18 passed (including the additional credential-scope case).
- [x] Shared HTTP client 8 passed; auth browser 16 passed; real local Stage 4 browser 13 passed; Stage 5 browser 12 passed; Stage 6 browser 14 passed. Final sequential completed runs, not earlier interrupted attempts.
- [x] Seven-width browser checks 320/375/390/414/768/1024/1440; 320/1440 screenshots inspected; production build passed with existing large-bundle warning.
- [x] Backend/frontend dependency audits 0 vulnerabilities; configured-host final read-only counts unchanged and no Stage 6 application collections/fixture IDs there.
- [x] Separate local retained fake-provider smoke has eight true checks including state survival after isolated MongoDB restart; no entitlement was granted for its draft product.
- [x] Final diff check passed; configured-secret scan found zero matches in 230 shareable text files. Recorded temporary MongoDB PID is absent and port 27186 has no listener; retained test data was not deleted.

Provider-connected verification, actual-host Stage 6 smoke, financial/registration/course policies and operational scanner/licensing/SMTP gates remain unchecked above. No Stage 7 implementation is authorized by this evidence.


## Stage 7 implemented slice - 24 October 2026

Earlier Stage 6 statements about missing CoursePlan/Enrollment, blocked actual-host schema initialization and awaiting Stage 7 approval are historical. The owner explicitly authorized Stage 7 and backed-up development cleanup. Full generic B20/B21, free enrollment success, renewal success and video remain unchecked.

- [x] Preserve earlier working tree; baseline tests/build and existing source/architecture audit.
- [x] Development environment/ownership inventory; current application plus selected test rows/indexes privately backed up and read back before deletion.
- [x] Delete only 41 confirmed obsolete project test databases (483 collections); preserve current application/unrelated data and server security.
- [x] Original logical application backup restored into a fresh local database; 17 collections matched rows/index counts.
- [x] Course, CoursePlan, Lesson, Enrollment and shared book/lesson LearningProgress schemas/indexes.
- [x] A43-A46/G06-G08/B32 real catalogue/facets/metadata/plan/lesson CRUD/publication with revisions, source/media gates and parent integrity.
- [x] Captured course-plan snapshots use existing commerce/provider/reconciliation; unique durable enrollment effect and audit recovery; no second Checkout.
- [x] A48-A53 current-user enrollment, exact syllabus/lesson/book access, expiry/revocation and explicit owner progress.
- [x] A37-A42 real inspected PDF page state, wishlist and idempotent bookmarks; local PDF.js rendering and account isolation.
- [x] Existing coaching/cards/sidebar/accordion/player/admin integration; no active coaching mock store, fake textbook pages or first-item fallback.
- [x] Read-only enrollment review plus reasoned revisioned course revocation; no payment truth override.
- [x] Actual configured-host Stage 3-7 startup/index/readiness/persistence/backend restart; 26 application collections; Razorpay disabled.
- [x] Record actual replica-set advertisement without changing topology; separately verify local standalone compatibility.
- [ ] Real Razorpay credential rotation/operator/provider-connected Test Mode acceptance; no live payments authorized.
- [ ] Free enrollment/renewal/manual grant/book-revocation business rules; no unsupported success marked complete.
- [ ] Video inspection/delivery/transcoding and real playback acceptance; current lessons are authored text/scanned PDF only.
- [ ] Real scanner/licensed course/book/instructor content, SMTP delivery, production backup/retention/runtime and fiscal/privacy gates.
- [ ] Separate owner approval before Stage 8.

Final Stage 7 counts, responsive evidence, cleanup status and limitations are in [STAGE7-REPORT.md](../../backend/STAGE7-REPORT.md). A47 exists as a safe rejection boundary; B20 and generic B21 remain incomplete by policy. Implemented API marks above cover text/PDF and simulated-provider verification, not real payment/video/renewal acceptance.

- [x] Final standalone backend: 105 passed, 1 optional skip; latest changed contracts: 35 passed, no skips.
- [x] Shared client: 8 passed; auth/Stage 4/5/6 browser regressions: 16/13/12/14 passed.
- [x] Final Stage 7 browser: 14 passed, zero skips/failures, all seven widths; actual PDF pixels and full admin workflows verified.
- [x] Final frontend build passed; backend/frontend audits zero vulnerabilities; targeted source/bundle secret scan and git diff --check passed.
- [x] Post-test verified backup and cleanup: 15 additional disposable databases/310 collections removed; 26 application collections and record/index counts unchanged, zero guarded test databases remaining.
- [x] Separate local standalone test process shut down gracefully; private backup/restore data retained.

## Stage 8 implemented slice - 25 October 2026

The owner explicitly authorized Stage 8 only. Checked API families below represent the implemented secure infrastructure and isolated synthetic acceptance; official result publication remains blocked. B28 is deliberately unchecked for real issuer publication. Earlier pending Stage 8 descriptions are historical.

- [x] F22/A62-A65: real issuer/exam configuration, exact verified-account lookup, stored marks/totals and current-user results; no fabricated academic records or false digital signatures.
- [x] G12-G13/B25-B27/B29-B30: admin definitions, private scanned JSON import with dry run/idempotency, review/audit, separate correction drafts and reasoned withdrawal.
- [x] Enforce B28/exam source-approval gate; client/admin source assertions cannot enable official publication.
- [x] F23/A66-A68/G14/B34: targeted persisted notices, owner receipts, unread totals/bell, idempotent read state, cutoff-based mark-all, category preferences and admin compose/publish/archive.
- [x] F24/A10-A14: real profile/preferences saves; current-password and SMTP proof email change; expiry/attempt/session/version/unique identity checks and old-session revocation.
- [x] Existing JavaScript monolith, auth/Origin/CSRF/RBAC, media quarantine/licensing and payment/enrollment protections retained; no dependencies or environment secrets changed.
- [x] Actual configured development database startup/restart/readiness; 32 application collections, official result publication and Razorpay disabled; no real application fixtures created.
- [x] Full backend: 120 tests, 119 passed, 1 optional replica-set test skipped, zero failures; Stage 8 slice 13 passed.
- [x] Shared client: 8 passed; result/export/admin/recipient browser journeys passed, final profile/email/layout focus 5 passed at 375/1440; auth mobile 8 passed and corrected desktop rerun 8 passed. Earlier failed runs are disclosed in the report.
- [x] Frontend build passed; both dependency audits report zero vulnerabilities; actual pass/skip/cleanup/security evidence is recorded in STAGE8-REPORT.md.
- [ ] Real trusted issuer/source authorization and official academic publication acceptance; privacy/retention/issuer grading/source rules.
- [ ] Real SMTP/scanner/licensing and existing Razorpay/financial/production gates; no operational gate is treated as passed by fake adapters.
- [ ] Separate owner approval before Stage 9.

See [Stage 8 report](../../backend/STAGE8-REPORT.md) and [backend runbook/import format](../../backend/README.md). Completed checks do not imply production deployment or provider acceptance.

- [x] Stage 8 final backup/readback and cleanup: 11 disposable test databases / 271 collections removed; 32 application collections and record/index counts unchanged; zero guarded test databases remain.
- [x] Final source/bundle configured/legacy secret scan: zero matches; git diff --check passed.

## Stage 9 integration and release-candidate QA - 25 October 2026

The owner explicitly authorized Stage 9. Earlier statements awaiting Stage 9 approval are historical. This slice stabilizes existing supported flows; it does not approve production deployment or activate gated features. Exact results and failed-run disclosures are maintained in [Stage 9 report](../../backend/STAGE9-REPORT.md).

- [x] Preserve the existing working tree; review active route/API registrations, environment examples and Stage 8 limitations without redesign or dependency upgrades.
- [x] Fix the missing mobile drawer trigger, unpublished support-contact fallback, profile unavailable states and inaccurate browser-filter/cache labels.
- [x] Fix My Courses and lesson access error states; suppress notification empty-success messaging on API failure.
- [x] Make notification mark-all tolerate competing unique receipt insertion; meaningful database regression included in the full backend run.
- [x] Full backend regression: 121 tests, 120 passed, 1 optional replica-set test skipped, 0 failed. Shared HTTP client: 8 passed, 0 failed/skipped.
- [x] Institutions/admissions/franchise browser workflows: 6 passed, 0 failed/skipped; unchanged responsive loops omitted.
- [x] All 40 registered student route patterns and 17 admin sections load/redirect; no captured browser exceptions or unexpected API 5xx responses.
- [x] Changed navigation and high-risk PDF/lesson/admin surfaces pass all seven widths; 320/1440 reader screenshots inspected.
- [x] Corrected payment-gate focused rerun: 2 passed including parent, 10 explicitly excluded, 0 failed; earlier full-route test failure disclosed separately.
- [x] Publishing/CMS, commerce and coaching browser workflows: 5/7/7 passed, no failures/skips; unchanged responsive loops omitted.
- [x] Complete combined Stage 8 results/notification/profile/preferences/email-change/browser-form suite: 10 passed, no failures/skips, no focus filter.
- [x] Authentication browser: 16 passed, no failures/skips, desktop and mobile HTTP contract/guard interactions; real backend security covered separately.
- [x] Actual configured development acceptance: all 13 checks passed, 19 public/guest routes, 32 application collections and two retained course drafts across backend restart; no application fixture creation.
- [x] Verified private backup/readback and cleanup: 17 disposable databases / 410 collections removed; 32 application collections and document/index counts unchanged; unrelated databases preserved, zero guarded project test databases remain.
- [x] Final frontend production build passed (24.52 seconds), existing large-bundle warning retained; backend/frontend audits zero vulnerabilities; configured/legacy source/build secret scan and git diff --check passed.
- [ ] Real SMTP, scanner/licensing/content approval, trusted official-result source, Razorpay rotation/provider acceptance and financial/privacy/registration policies.
- [ ] Production host/TLS/proxy/cookie/secrets/backup/restore/capacity/runtime acceptance and operator ownership.
- [ ] Separate owner approval before Stage 10; no production deployment or live payment authorization.

## Stage 10 original-scope completion and acceptance - 25 October 2026

The owner authorized original F01-F26 functionality/admin completion and final acceptance. This supersedes historical Stage 10 deployment preparation: no hosting/domain setup, deployment or production release is authorized. Earlier pending Stage 10 approval statements are historical. See [Stage 10 report](../../backend/STAGE10-REPORT.md) and [feature traceability](../../backend/STAGE10-FEATURE-TRACEABILITY.md) for precise partial/gated/out-of-scope status; endpoint checkmarks do not imply operational acceptance.

- [x] Preserve existing architecture/worktree/application data; baseline frontend production build passed.
- [x] Trace F01-F26 to actual user handlers, API validation, MongoDB, admin controls, propagation, security, responsive/evidence requirements and remaining actions.
- [x] Implement B14/B15 safe account list/search/details; B16 reasoned verified-account suspension/restoration with revision/security-version invalidation; B18 existing ordinary-staff permission management only.
- [x] Enforce self/super-admin/pending activation/student-promotion protections, fixed grants, CSRF/Origin/RBAC and durable bounded audit reasons; tests cover stale/concurrent writes.
- [x] Implement read-only B38 audit and B39 job monitoring with redacted paginated projections, actual B01 platform totals, and read-only book-rights/source inspection through existing B19.
- [x] Connect existing CMS card editor/link keys to actual category cards and sheet, header to existing branding, and footer links to existing settings; remove unsupported active marketing claims; reserved publicFeatures switch is explicitly unavailable.
- [x] Fix order pagination, literal text search, initial-session draft clearing, owner exposure of internal registration notes and exact-binding concurrent fulfillment recovery; preserve account-switch clearing and all payment/publication/PII gates.
- [x] Full backend regression before final commerce/privacy refinements: 128 tests, 127 passed, 1 optional replica-set test skipped, 0 failed; additional exact four-form field audit 1 passed. Final commerce 15 passed and post-privacy all-field intake child suite 5 passed; previous failed runs disclosed.
- [x] Existing institution/publishing/commerce browser mutation workflows: 6/5/7 passed, no failures/skips; unchanged responsive loops omitted.
- [x] Stage 10 full run: four non-registration mutation children and all seven navigation widths passed; earlier registration failure and parent failure disclosed. Final corrected four-form focused rerun: 2 passed including parent, 11 explicitly excluded, 0 failed.
- [x] Final coaching/combined Stage 8/authentication/route browser: 7/10/16/12 passed, no failures/skips; route audit covers 40 student patterns and 20 admin sections, all seven PDF/lesson widths, zero browser exceptions/unexpected API 5xx.
- [x] Configured development: all 16 startup/proxy/security/restart/persistence checks passed, 32 application collections and two retained drafts; final frontend build exit 0, client 8 passed, backend/frontend audits zero vulnerabilities. Final secret/diff review recorded in report.
- [x] Verified private backup/readback and scoped cleanup: 25 disposable databases/638 collections across backend-only capacity and final passes; 32 application collections and document/index counts match both verified backups, unrelated databases preserved, zero guarded test databases remain.
- [ ] A18/B12 real registration submission/review/activation: Q01/Q05 identity/documents/minors/consent/retention/fees/eligibility rules are missing.
- [ ] Franchise approval/public affiliation, free access/enrollment, renewals/manual grants/book revocation, tax/refunds/official invoices and trusted official-result source/access rules.
- [ ] Real SMTP app-password acceptance, maintained scanner/licensed content/instructor rights, Razorpay compromised-key rotation/operator setup/authorized Test Mode acceptance.
- [ ] Stage 10 historical remaining items: video delivery (superseded by the separately authorized final-gap implementation below), PDF text-selection/accessibility overlays, optional avatar upload and reserved publicFeatures runtime enforcement. Real publication acceptance remains separate.
- [ ] No deployment or production release approval is implied; stop after Stage 10 owner review.

## Final gap closure - private video lessons, 25 October 2026

Owner authorization explicitly requires directly uploaded video in the existing coaching player. This supersedes the earlier unsupported-video classification, without authorizing deployment, production payments, new engines or policy changes. Evidence and exact test outcomes: [FINAL-GAP-CLOSURE-REPORT.md](../../backend/FINAL-GAP-CLOSURE-REPORT.md).

- [x] Reuse existing MediaAsset, Lesson, LearningProgress, private StorageProvider, modular monolith and API IDs/contracts; no collection added.
- [x] Stream bounded private MP4 uploads; verify container framing, codec/profile/pixel format/resolution/frame-rate/duration via installed FFprobe, and complete decode via installed FFmpeg. No automatic transcoding.
- [x] Enforce configurable video size/time limits, disk-capacity reserve, server keys, scanner quarantine, safe failed-upload cleanup and referenced-asset deletion protection.
- [x] Extend existing admin lesson editor with upload byte progress, validation status, authorized ready-file preview, attachment/replacement, publication and existing Media Management rescan/deletion.
- [x] Support authenticated 200/206 byte streaming, bounded/suffix ranges, safe 416 Content-Range, actual seeking and current account/publication/license/enrollment/source-order/expiry/revocation checks on every new request.
- [x] Integrate native video in both existing players with controls/speed/loading/buffering/error states and current lesson/syllabus; retain text/PDF.
- [x] Persist owner/course/lesson/current-video position, inspected duration, last activity and completion with revision checks; bounded saves and resume; reset displayed old progress on replacement.
- [x] Final focused video/storage/env/shared-client run: 27 passed, 0 failed/skipped; backend coaching/publishing/HTTP/shutdown regression: 38 passed, 0 failed/skipped. Additional codec/corruption/config tests passed; earlier failures are disclosed in report.
- [x] Initial complete video browser: 11 passed, 0 failed/skipped, all seven widths/touch emulation. Added completion full run: 11 passed, 2 failed (ambiguous cancellation heading plus parent), with all widths/queue/mobile passed. Final guarded workflow rerun: 7 passed, 0 failed/skipped; unchanged width loop deliberately omitted, completion queue/navigation cancellation/account-change guard verified. Existing text/PDF/coaching browser: 7 passed, 0 failed/skipped, unchanged width loop omitted. Actual decoded frames, protected 206 requests and saved/reloaded position verified.
- [x] Final frontend build exit 0 (41.29 seconds, existing bundle warning), backend/frontend audits zero vulnerabilities; 317 reviewed shareable text files with zero configured/legacy secret matches; git diff --check passed.
- [x] Verified private backup/readback and scoped cleanup removed 11 test databases / 277 collections across initial/follow-up passes after writers stopped; 32 application collections and document/index counts match both cleanup backup and Stage 10 baseline; unrelated databases preserved, zero guarded test databases remain. Separate FINAL-GAP-DATABASE-CLEANUP.json and FINAL-GAP-INITIAL-DATABASE-CLEANUP.json evidence preserves earlier stage reports.
- [ ] Real scanner/signatures/stream-size/time configuration and acceptance, application executable paths, licensed real content and operational capacity/long-file/real-device acceptance. No scanner bypass or real video publication acceptance.
- [ ] Previously recorded business gates remain: intake/identity/minors, franchise approval, free access/renewals/manual grants/book revocation, tax/refunds/invoices, official results, real SMTP and Razorpay rotation/explicit Test Mode acceptance.
- [ ] PDF text-selection/accessibility overlay, optional avatar and reserved publicFeatures runtime semantics remain partial/not implemented; do not infer completion from video support.
- [ ] Deployment/hosting/domains/production release and unrelated further development are not authorized. Stop after this review.
# Current final-audit status — 25 October 2026

The original checklist and earlier stage evidence are historical and retain their original scope/counts. Current assessment: [final audit](../../backend/FINAL-PROJECT-COMPLETENESS-AUDIT.md), [requirement matrix](../../backend/FINAL-PROJECT-REQUIREMENTS-MATRIX.md). The older PDF text-overlay deferral is superseded by the completed item here. Earlier API checkmarks do not assert real provider acceptance or completion of policy-gated outcomes. Deployment remains excluded.

- [x] Compare F01–F26, all 186 A/B/G method/path contracts, actual 32 collections, all 40 user route patterns/20 admin sections, active interaction-bearing source files and original shared checklist composites.
- [x] Home CMS About teaser, mounted structured-content refresh/error recovery and neutral footer defaults.
- [x] Persist signed-in course choices via A13/A14, expose catalogue pagination, fix published taxonomy/instructor and admin plan-name search, aggregate bounded owner enrollment pages.
- [x] Implement course outcomes/benefits and plan benefits/highlight/order with schema/validation/admin/public projections; no financial policy invented.
- [x] Actual protected selectable PDF text and accessible current-page expansion, image-only limitation and original-file alternative; enable viewport zoom.
- [x] Shared modal/drawer focus management and searchable-selector keyboard semantics; focused real browser check passed.
- [x] F25 software accessibility acceptance superseded by the 26 October focused stage: all 20 sections, native 200% Chrome zoom/eight widths, axe and representative keyboard saves. Physical-device/real virtual-keyboard/assistive-technology acceptance remains independently unverified; no WCAG certification.
- [x] B01 optional UTC date/environment filters on the existing API/UI; current stored mode is Test Mode, not a verified payment-method breakdown. Captured versus other order/attempt timestamps, lifetime counts and gross-value labels remain explicit.
- [ ] Registration activation/sensitive documents/consent/fees, franchise approval, free/manual rights/book revocation/renewals, official invoice/tax/refund and official result-source policies.
- [ ] Actual SMTP app-password delivery, real scanner/signatures/licensed publication, rotated Razorpay credentials plus authorized Test Mode provider acceptance, pinned-runtime/operational recovery acceptance.
- [ ] Optional avatar purpose/privacy/upload policy and reserved publicFeatures operational semantics.

The final report records the actual complete and rerun test results, exclusions and failures, final build/audits, application data preservation and local commit. No production deployment or live payment is implied by this checklist.

- [x] Final complete backend/shared-client rerun: 152 passed, 1 optional legacy replica-set check skipped, 0 failed/cancelled; actual local standalone MongoDB and generated media tools used.
- [x] Final browser scopes: institutions 6, publishing 5, completeness 5, commerce 7, final editorial coaching 7, results/account 10, Stage 10 operations 13, complete route/eight-width matrix 14, full video/seven-width 14, final video-copy workflows 7, auth HTTP-double desktop/mobile 16 passed; unchanged width omissions and earlier failures are explicitly recorded in final evidence.
- [x] Final frontend build native exit 0 (1m 59s; existing large-chunk warning); backend/frontend dependency audits 0 vulnerabilities; source/build secret scan and diff checks passed.
- [x] Guarded private backup/readback/cleanup removed 19 disposable host test databases / 446 collections. All 32 application collection document/index counts match the Stage 10 baseline; zero guarded host test databases remain. Dedicated loopback-only local test MongoDB shut down gracefully; its ignored test data is retained.

## Focused F25/B01 closure — 26 October 2026

The [focused report](../../backend/FINAL-TWO-GAPS-REPORT.md) supersedes the earlier F25/B01 partial classifications and records exact final/failed/skipped runs. Current primary matrix: 162 implemented/tested, 0 partial, 49 gated, 0 missing, 1 outside scope (212 entries). Representative software acceptance does not mean production or assistive-technology certification.

- [x] Existing B01 API: validate UTC from/to/test environment, inclusive end day, correct per-metric timestamps, indexed/time-bounded groups, lifetime count distinction, protected financial access and no captured-order double counting.
- [x] Existing dashboard summary: labelled Apply/Clear, URL/reload persistence, loading/empty/errors, active filters, abort/stale-response protection and mobile reflow.
- [x] Review all 20 admin sections; named modal/inline editors, focus isolation/trapping/return, labels/native validation, status announcements, contrast/text/targets, current navigation/skip link, reduced motion and keyboard-scrollable tables.
- [x] Verify all eight widths, native Chrome 200% page zoom, reduced-height viewport emulation, axe and real persisted keyboard workflows; run relevant existing institution/publishing/shared regressions and backend tests. Exact counts and earlier failures are in the report.
- [x] Build frontend, audit both dependency trees, review diff/source/build for configured secrets and preserve the application database by using loopback-only isolated synthetic databases.
- [ ] Physical-device, actual mobile keyboard/IME and screen-reader/switch/cross-browser assistive-technology acceptance. No WCAG certification is claimed.
- [ ] Existing business/provider/scanner/SMTP/runtime/deployment gates remain; unavailable payment-method rails and incidental zero-fee program validation are disclosed, not silently redefined.

Stop after the focused local commit. No push, deployment or next stage is authorized.

## Stage 11 - Gmail SMTP and Razorpay Test Mode, 26 October 2026

Evidence and exact test outcomes: [Stage 11 report](../../backend/STAGE11-SMTP-RAZORPAY-REPORT.md). Historical blank/unverified SMTP descriptions are superseded only by the evidence here. Current primary matrix counts remain unchanged.

- [x] Inspect existing backend env loading, SMTP/auth/account challenges, payment provider/order/verification/webhook/reconciliation/entitlement services and frontend auth/checkout; reuse the modular monolith.
- [x] Preserve unrelated local environment fields; configure authorized Gmail identity, STARTTLS 587 and backend-only password, with structured display name and header-injection validation. No real env file or credential is committed.
- [x] Real Gmail authentication and six accepted workflow messages: registration/verification, resend after actual cooldown, reset, email-change and staff invitation/following verification. Owner confirmed all six received; no inbox API inspection is claimed.
- [x] Enforce an explicit live-test opt-in, recipient/budget/loopback guards and atomic reservation preventing blind repeat delivery. OTPs/tokens stay in memory, never browser responses or evidence.
- [x] Actual read-only Razorpay Test Mode authentication through the existing provider boundary. No provider order/payment/approval created; existing payment activation gate remains closed.
- [x] Offline SMTP/TLS/error/config/operator safety and Razorpay read-only gate tests; local fake-provider/mail MongoDB regressions; relevant browser/build/dependency/security checks, with exact final and failed counts in the report.
- [x] Use informational feedback for non-enumerating, uncertain recovery delivery; preserve existing layouts and security boundaries.
- [ ] Rotate the disclosed Gmail and Razorpay credentials, configure independently rotated webhook secret and complete existing operator approval. The owner's temporary credential-use instruction is not rotation evidence.
- [ ] Real provider-connected book/coaching Checkout, capture, callback/webhook/reconciliation, exactly-once paid entitlement and admin financial acceptance. A real webhook testing endpoint/tunnel needs separate explicit exposure approval.
- [ ] Real scanner/licensed-content/publication and existing business/runtime/operational/device gates remain unchanged. No live payments, deployment or next stage is authorized.

Stage 11 final evidence: offline unit/config/HTTP/logging 25/0/0; isolated MongoDB with fake mail/provider 63/0/0; real Gmail workflow suite 4/0/0 with exactly six messages, owner-confirmed received; final book/coaching browser 7/0/0 each and auth HTTP-double desktop/mobile 16/0/0. Ordinary live-mail test invocation deliberately skips one test. Earlier book-browser 5 passed/2 failed due to login load timeout is disclosed and superseded by the verified rerun. Frontend build exit 0; both audits zero vulnerabilities. Local test MongoDB shut down, ignored synthetic data retained. These counts do not claim any real Razorpay payment or webhook acceptance.

## Stage 12 — Razorpay independent integration verification, 26 October 2026

Exact evidence, commands and limitations: [Stage 12 report](../../backend/STAGE12-RAZORPAY-ACCEPTANCE-REPORT.md). Primary requirement classifications/counts remain unchanged. This stage does not complete real-payment operational acceptance.

- [x] Inspect/reuse existing payment architecture and configured Test Mode API credentials; successful real read-only authentication, separately recorded from payment acceptance.
- [x] Configure a cryptographically random local webhook secret only in ignored backend environment; preserve SMTP settings and send zero additional live emails.
- [x] Preserve the false rotation flag and missing approval record honestly; verify unapproved local HTTP webhook returns 503 with zero provider transport calls.
- [x] Test actual Razorpay adapter HMAC/HTTPS response handling through synthetic HTTP transport responses, real Express/MongoDB, book/course capture-to-fulfillment, current private access, duplicate callbacks/webhooks, reconciliation and protected simulated admin totals. Final 6 passed, 0 failed/skipped; intermediate assertion failure is disclosed.
- [x] Existing provider/commerce/coaching/dashboard tests: 39 passed, 0 failed/skipped. Book/coaching browser workflows: 14 passed, 0 failed/skipped using mocked Checkout and blocked external traffic; unchanged width loops deliberately omitted.
- [x] Frontend build passed; both dependency audits zero vulnerabilities. Review source/build/staged content for secrets, keep private files excluded, gracefully stop the verified dedicated synthetic MongoDB and preserve existing application data.
- [ ] Existing operator approval prerequisite: rotation flag remains false and approval record absent. No approval was fabricated and no gate bypassed.
- [ ] Real Test Mode positive-priced book/course provider orders, Checkout/capture, authoritative persisted payment/entitlements, admin totals and provider reconciliation acceptance remain unexecuted.
- [ ] Actual Razorpay-delivered webhook acceptance; matching dashboard configuration and a separately approved reachable HTTPS testing method are required. Local signed-request tests are not provider delivery.

Stop after the Stage 12 local commit. No push, deployment, live payments or next stage is authorized.
