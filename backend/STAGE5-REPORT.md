# Stage 5 delivery report - 24 October 2026

## A. Implementation summary

Stage 5 implements persisted books, typed CMS, secure media and the existing public/admin frontend integrations on the approved JavaScript Express modular monolith. Stages 3/4 authentication, institutions and intake remain in place. No payment processing, student full-book access, coaching, results, notification delivery, cloud migration or production deployment was implemented.

Uploads remain quarantined on the actual development host because no malware daemon is installed. The scanner adapter fails closed; there is no trust bypass. Publication was verified with generated fixtures and explicitly injected scanner doubles only in isolated databases. Real educational publication requires operational scanning, licensed assets, approved prices and source evidence. Stage 5 functionality is delivered with these operational/business gates documented.

## B. Files changed and dependencies

Stage 5 additions/edits are listed below. The working tree already contained extensive uncommitted Stage 1-4 work; it was preserved and not reset, staged or committed. Git status therefore also lists files unrelated to this stage.

| Area | Created or changed paths |
|---|---|
| Backend publishing | src/modules/publishing/{index.js,publishing.models.js,publishing.service.js,publishing.routes.js,validation.js,coordination.js} (new) |
| Backend media | src/modules/media/{media.service.js,inspection.js,probe-worker.js} (new) |
| Backend integration | src/app.js, src/server.js, src/config/env.js, src/modules/auth/security.js, src/storage/StorageProvider.js |
| Dependencies/configuration | backend/package.json, backend/package-lock.json, backend/.env.example; existing ignored backend/.env appended only nonsecret scanner defaults |
| Backend tests | tests/{publishing-fixture.js,publishing.test.js,publishing.mongodb.integration.test.js} (new) |
| Development evidence | scripts/verify-stage5-development.js, STAGE5-DEVELOPMENT-VERIFICATION.json (new; safe retained record metadata) |
| Admin components | frontend/src/modules/admin/components/{BookEditor.jsx,MediaPicker.jsx} (new) |
| Admin pages | AdminBooksPage.jsx; new AdminContentPage.jsx, AdminMediaPage.jsx, AdminSiteSettingsPage.jsx; existing AdminRoutes.jsx and AdminLayout.jsx |
| Shared client/services | frontend/src/shared/api/{httpClient.js,httpClient.test.js}; user/services/{bookService.js,authService.js}; new contentService.js |
| Public books | BooksHomePage.jsx, BookDetailsPage.jsx, BookCard.jsx, BookFilterModal.jsx, BoardSelector.jsx, LibraryContext.jsx |
| Public CMS | HeroBannerCarousel.jsx, ServicesSection.jsx, UserLayout.jsx, AboutPage.jsx, CategoriesPage.jsx; new common/PublishedContent.jsx |
| Browser checks | frontend/tests/publishing.browser.test.js (new), frontend/package.json test:stage5 script |
| Documentation | backend/README.md, this report, development-plan documents 04-13; existing IDs and roadmap stages retained |

Paths in the public/admin rows are under the existing modules/user and modules/admin trees. No replacement application or HTTP client was introduced. Existing Vite proxy and user route inventory are retained; only approved Stage 5 admin screens were activated/added.

Exact new production dependencies: busboy 1.6.0 for streaming multipart; sharp 0.35.5 for bounded image decoding/re-encoding; pdf-lib 1.17.1 for PDF structure/page inspection. The initial Sharp candidate was updated before delivery after advisory review. No Razorpay SDK or new frontend dependency was installed. Final backend and frontend npm audits both report zero vulnerabilities. Node remains pinned to 22.23.4 in existing runtime files; tests ran on installed Node 22.15.0/npm 10.9.2, so the pinned patch is not claimed verified.

## C. Book management

Book supports draft creation, metadata/taxonomy references, authored descriptions, language, editions, bounded keywords/TOC, explicit INR minor-unit pricing, source/licensing attestations, compatible media, revisioned edits, publication/unpublication and archive retention. There are no seeded educational titles/authors/ISBNs/ratings/prices.

Publication requires author/category/language/description, ready clean cover and full PDF, recorded licensing rights/evidence, explicit price and pricing approval. Page counts are parsed from the document; TOC pages must fit. Active taxonomy and dependent parent references are validated. Pricing approval is staff attestation, not a newly invented financial policy. Zero-price metadata grants no full-reader rights.

A32-A35, G05 and B31 use the existing contracts. Public list/filter/facets/detail are authoritative, paginated and searchable, including taxonomy labels; sorting is title-based featured/name, newest or approved price. No fake sales or rating sort is supplied. Public reads use publishedSnapshot; draft edits remain private until republished. Archive/unpublish removes public visibility while retaining historical records and media references.

A35 returns separately designated preview assets. A public sample cannot point at the private original or a same-checksum/same-or-longer-page PDF. This is a structural safety rule; staff must still approve the actual excerpt rights/content. No automatic PDF extraction or arbitrary file access exists. Full document identifiers/provider paths/internal rights evidence are excluded from public catalogue DTOs. canReadFull=false; orders/entitlements/reader state remain later-stage contracts.

## D. CMS

PageContent supports bounded typed plain-text sections for home/about/categories/navigation. Banner supports approved placement, order, schedule, theme and fixed internal or credential-free HTTPS links. FacultyProfile supports sourced display/qualification/specialty fields and compatible portrait media; no academic identity/account/role is created. SiteSettings accepts typed brand/support/footer/publicFeatures groups only. Its updates are directly public and audited; revision 0 is the explicit initial-create revision.

G09-G11 canonical paths are /admin/content/pages, /admin/content/banners and /admin/content/faculty. Publish/unpublish uses /:id/publish and expectedRevision; page publication retains B33. A69-A71 and B35-B36 remain the original IDs. Banner/faculty publication uses the same explicit action pattern without duplicating CRUD. Pages/faculty/banners use immutable live snapshots. Missing approved content produces honest empty states. There is no arbitrary HTML, script evaluation, editable code route or security/financial setting.

The existing admin shell now hosts content, media and public-settings forms. Draft inspection occurs in staff editors; no unauthenticated draft-preview URL was introduced. The settings form disables editing during initial loading so a delayed response cannot overwrite staff input. Conflicts/errors/denied permissions remain visible.

## E. Media security and lifecycle

A72-A75 and B37 are implemented. Upload requires staff media.write, a valid session, exact Origin and CSRF. Send purpose and idempotencyKey fields before exactly one file in multipart. Purposes: book_cover/banner/faculty/cms images (5 MiB), book_preview PDF (10 MiB), book_full PDF (50 MiB), also bounded by configured storage limits. No profile/identity/admission/franchise/video upload purpose was enabled. Rate and outstanding-asset quotas are enforced.

Files receive safe generated provider keys, streamed bounded storage, actual size/checksum and owner/actor metadata. Names, extension/MIME/signature pairs, empty/malformed uploads and path traversal are rejected. Isolated child parsing has memory/time/output bounds. Images are fully decoded with pixel/dimension/animation limits and converted to metadata-free PNG. PDFs must parse with valid page bounds and no encryption, active script/actions, embedded files or forms. PDF inspection is defense in depth and does not replace malware scanning.

MediaAsset lifecycle is staged -> quarantined -> ready, or failed/deleting/deleted. Source/promotion IO intent keys are persisted before disk writes. Owner-scoped client idempotency hashes compare the actual payload; duplicate callbacks return the prior asset, mismatches conflict and temporary attempts are cleaned. Failed deletion and promotion source cleanup remain durably tracked for startup/hourly retry. A 15-minute stale-intent/protected-promotion window prevents cleanup racing active IO. No arbitrary disk sweep or unapproved retention purge exists.

MEDIA_CLAMAV_ENABLED=false and MEDIA_CLAMAV_PORT=3310 are optional nonsecret defaults. The adapter uses bounded loopback-only ClamAV INSTREAM. POST /admin/media/:id/scan retries a real configured scanner with expectedRevision and media.write; it cannot mark an asset clean manually. No local scanner executable/daemon was available. Pending/error/infected content remains inaccessible and unpublishable. Test-only injected fake scanners are never selected by environment or application startup.

Only ready+clean public-purpose assets referenced by a live published snapshot can be delivered anonymously. Banner scheduling also constrains byte visibility. Unlinked clean files and draft files remain protected. Full PDFs are always private; staff media.read may review them, while students receive no reader grant. Metadata requires media.read. Linking checks compatible purpose and owner or explicit media.write. References are derived from canonical draft/live-snapshot IDs under the shared Stage 4/5 mutex; shared/live/archived retained references block deletion. Replacing draft media does not delete the currently live asset.

Delivery validates state/authorization and SHA-256 integrity, supports bounded single HTTP byte ranges (200/206/416), safe content type/length/filename, sandbox/nosniff and private no-store. Missing/corrupt files fail safely. No physical key/path/private static mount appears in public DTOs. Per-request rehash favors integrity and needs capacity review before large-volume operation. Browser PDF embed support varies; the UI always offers an approved-sample link.

## F. Frontend integration

Existing book catalogue, dynamic facets/search/filters/sort/paging, detail/card/cover and preview components now use the shared real API client. AdminBooksPage persists CRUD/media/publication/archive with backend revisions and permissions. BookEditor and MediaPicker reuse existing modal/theme patterns. Full-reader/purchase buttons remain disabled; LibraryContext no longer treats a zero price as an entitlement. Wishlist/progress/reader persistence is deferred.

Home sections, banner carousel, about/founder/faculty, category copy and footer/support settings read published CMS APIs. No fabricated faculty achievements, reviews or marketing counters are populated from fixtures. Fixed navigation/UI structure stays code-controlled. Loading/empty/error states and abortable stale queries are provided. The shared HTTP client gained FormData support while retaining cookies, CSRF integration, request IDs, structured errors and abort/timeout behavior.

Later-stage coaching/course/reader/results/notifications/order mock datasets and preview-only admin screens remain outside Stage 5. These are not claimed as authoritative backend features or activated payment paths. Existing route aliases, colors, shell and animations remain; browser checks covered seven widths, and 320/1440 preview screenshots were inspected.

## G. Actual MongoDB verification

Before writes, the configured database was confirmed as development / kitss_education_dev. Baseline institutional/application/security collections were empty except the existing domainLocks record (1). No real user's account/session was used. Six new collections/indexes were added non-destructively. No replica set/transactions were required or initialized, and no collection/database/index was dropped or reset.

The explicitly authorized script created clearly labelled STAGE5_DEV_VERIFY_* drafts and a dedicated limited-permission verification actor. The first run failed during PDF upload; its safe IDs and partial outcome were preserved. A subsequent complete run verified draft API create/update/retrieval, public draft exclusion, actual frontend rendering, server restart/readiness and persistence. Neither run published content in the application database. Both temporary actors were suspended, security versions incremented and their own sessions revoked. No existing users/institutions/applications were modified/deleted. Failed test-owned upload cleanup affected only its own bytes and retained its logical deleted MediaAsset record.

Retained records:

| Record | First retained attempt | Successful smoke |
|---|---|---|
| Suspended verification actor | 6adc5e34a04caa67a3120dcd | 6adc5f6f5f481252de4bbee4 |
| Book draft | 6adc5e35a04caa67a3120dce | 6adc5f705f481252de4bbee5 |
| Banner draft | 6adc5e36a04caa67a3120dcf | 6adc5f705f481252de4bbee6 |
| Faculty draft | 6adc5e37a04caa67a3120dd0 | 6adc5f715f481252de4bbee7 |
| Page draft | 6adc5e37a04caa67a3120dd1 (home) | 6adc5f715f481252de4bbee8 (about) |
| Quarantined image | 6adc5e38a04caa67a3120dd2 | 6adc5f725f481252de4bbee9 |
| PDF media | 6adc5e3ea04caa67a3120dd3 (logical deleted failed upload) | 6adc5f765f481252de4bbeea (quarantined) |

Counts at smoke completion: books/banners/facultyProfiles/pageContents = 2 each; mediaAssets = 4 (3 quarantined, 1 logically deleted); siteSettings = 0; users = 2 suspended verification actors; sessions = 2 revoked verification sessions; auditlogs = 22; auththrottles = 5 (ephemeral TTL); domainLocks = 1 unchanged. Taxonomies, universities, colleges, programs, admissions and franchises remained at 0. No real product prices, licensing claims or contact settings were inserted. Time-dependent throttle counts may later expire.

[STAGE5-DEVELOPMENT-VERIFICATION.json](STAGE5-DEVELOPMENT-VERIFICATION.json) retains complete safe counts, checks and index names, including the earlier attempt. Its IDs are retained for owner review; the script is not an automatic startup seed and should not be routinely rerun. The exact original upload failure cause was not established; the successful repeat and durable cleanup are reported separately, not presented as a passing first attempt.

## H. Testing and commands

| Check | Actual result |
|---|---|
| Baseline backend | 35 tests: 32 passed, 3 explicitly skipped, 0 failed |
| Baseline frontend build | Passed; pre-existing large-chunk warning |
| Full backend, isolated real auth/Stage 4/Stage 5 databases enabled | 72 tests: 71 passed, 1 optional replica-set test skipped, 0 failed |
| Stage 5 integration rerun after canonical-path correction + taxonomy-label assertion | 10 passed, 0 failed/skipped |
| Shared HTTP client | 8 passed, 0 failed/skipped |
| Stage 3 desktop/mobile browser regression | 16 passed, 0 failed/skipped on independent rerun |
| Stage 4 real API/MongoDB browser regression | 13 passed, 0 failed/skipped |
| Stage 5 real API/MongoDB browser workflows + responsive widths | Final corrected run: 12 passed, 0 failed/skipped (all four workflows and seven viewport checks plus parent) |
| Frontend production build | Passed after final source changes; Vite 6.4.5, main bundle 1,640.00 kB / 436.57 kB gzip; existing >500 kB warning |
| npm dependency audits | Backend 0; frontend 0 vulnerabilities |
| Actual development smoke | Draft API/browser/restart/readiness/persistence passed; no actual-scanner/publication claim |

Commands executed from repository root:

~~~powershell
# Fresh unique names required; refuse pre-existing test collections
$env:KITSS_AUTH_TEST_DB = 'kitss_stage3_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE4_TEST_DB = 'kitss_stage4_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE5_TEST_DB = 'kitss_stage5_test_' + [Guid]::NewGuid().ToString('N').Substring(0,16)
npm.cmd --prefix backend test
# Focused repeat used a new KITSS_STAGE5_TEST_DB
node --test backend/tests/publishing.mongodb.integration.test.js
npm.cmd --prefix backend run test:client
npm.cmd --prefix frontend run test:auth
# Each browser suite uses its own fresh KITSS_STAGE4_BROWSER_DB / KITSS_STAGE5_BROWSER_DB
npm.cmd --prefix frontend run test:stage4
npm.cmd --prefix frontend run test:stage5
npm.cmd run build
npm.cmd --prefix backend audit --json
npm.cmd --prefix frontend audit --json
# Explicitly authorized non-disposable development smoke only:
node backend/scripts/verify-stage5-development.js --confirm-development
git diff --check
~~~

The optional legacy replica-set test was not executed and is not counted as passed. No live email or payment test occurred. Browser suites use installed Chrome and block external page requests. Integration fixtures refuse existing test databases and clean test-owned records/files only; they do not drop application collections. Empty test collections/indexes can remain. Browser artifacts are ignored.

Failures investigated: initial browser selectors were corrected to match the existing UI; running three browser suites concurrently caused an auth cold-load timeout, resolved by a standalone passing rerun. The canonical-path Stage 5 rerun exposed an initial-settings-load input race, which was fixed with guarded asynchronous loading, synchronous group/form initialization and controls disabled during loading. A stronger assertion verifies the persisted API email before public rendering. Windows sandbox EPERM prevented some Node commands before test execution; authorized execution outside the sandbox was used. None of these failed attempts is counted as a passing run. The final focused reruns verify the affected changes.

## I. Security and operations

Server-side sessions/grants, Origin/CSRF, allowlisted validation, CAS revisions, safe DTOs and actual media-reference checks protect every Stage 5 mutation. New code grants are content.publish/media.read/media.write; existing ordinary staff receive no automatic grant expansion. Fixed code permissions remain outside CMS. Requests cannot set internal lifecycle/security fields or arbitrary file keys.

All Stage 4/5 reference mutations share the existing durable standalone domain lock. No TTL/automatic lock theft exists; crash recovery requires stopping all writers and applying the documented exact-owner recovery procedure. Each mutation atomically appends its audit event; startup/hourly delivery upserts AuditLog by event ID and retries after failure. Outbox backlog limits fail closed. Durable media IO reconciliation does not pretend to be a distributed transaction or future payment consistency solution.

Existing .env credentials were preserved; only optional nonsecret scanner settings were appended. No credential was copied into this report, examples or fixtures. Sensitive storage keys and credentials are omitted from DTOs/logs. The existing compromised Razorpay credential remains subject to mandatory rotation. Final review scanned 227 shareable source/documentation/build files against configured secret values without printing values: zero matches. git diff --check passed; .env and browser artifacts are ignored. This checks the current working files and does not claim Git-history credential cleanup.

## J. Outstanding decisions and limitations

- Install/maintain a real loopback ClamAV daemon and signatures; verify actual scans, disk capacity, quarantine monitoring and backup/restore. Without it, actual uploads remain quarantined and publication is intentionally blocked.
- Supply licensed book/full/sample assets, rights evidence, accurate educational metadata and source-approved faculty/content. No real catalogue was invented.
- Confirm actual product prices, zero-price/free-reader policy, retention/deletion/privacy/minors policy and sensitive-document rules. No broad sensitive uploads or franchise approval was enabled.
- Configure SMTP app passwords and verify actual delivery; bootstrap the intended operator explicitly. SMTP was not needed for these isolated Stage 5 tests and no real email was sent.
- Verify the pinned Node runtime patch on the host. Existing large frontend bundle remains a performance limitation; no unrelated dependency/framework upgrade was made.
- Large files require realistic proxy/request-timeout/capacity tests; per-read checksum verification and a global durable mutex favor integrity with an availability/performance cost. No production deployment or disaster-recovery exercise was performed.
- Later-stage reader/wishlist/progress/entitlements and other business mocks remain deferred. Public feature flags are presentation metadata, not backend security controls.

## K. Stage 6 readiness and stop point

Stage 5 provides the catalogue/pricing/media boundaries needed for future commerce, with tests and operational gates recorded. Stage 6 is **not authorized or started**. Before implementation, obtain explicit owner approval, approved pricing/free-access rules, tax/refund/invoice policy and a standalone-compatible payment settlement/activation consistency decision (or explicit topology-change approval). Rotate the compromised Razorpay test key/secret and webhook secret before integration; do not reuse the exposed test credential.

Preserve PaymentService/RazorpayPaymentProvider abstraction and existing payment API IDs. Use Razorpay Standard Checkout with backend-created orders, verified provider capture/signatures/amount/currency/ownership, signed webhooks, durable reconciliation/idempotency and exactly-once activation when Stage 6 is approved. Test Mode only; no live charges without explicit approval. Prepaid time-limited passes do not imply recurring billing. Financial policies remain owner decisions.

The master checklist records the implemented Stage 5 operations and leaves actual-scanner/licensing/operational/payment gates unchecked. Work stops at Stage 5.
