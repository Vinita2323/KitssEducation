# Admin panel implementation plan

## Stage 3 protected shell update

All existing /admin/* routes are guarded during session loading, require authenticated staff, and check domain permissions before mounting content. Header uses the server identity; desktop/mobile navigation filters by server-authorized permissions. An unauthorized student cannot render admin pages. Backend invitation endpoints independently enforce accounts.roles.manage; UI guards are presentation only.

Existing business pages are visibly preview-only, with disabled controls so their mock operations cannot be represented as persisted successes. Full institutional/book/application CRUD and dashboard aggregation remain later stages. An operational Staff invitations section, outside preview-disabled content and visible only to accounts.roles.manage, supports ordinary staff invitation/resend, permission selection and pending invitation revocation. No public staff registration or super-admin promotion endpoint is exposed. Initial super admin uses the explicit audited CLI in backend README; it was not run on the application database. Staff accepts a fragment-based expiring emailed token, chooses a password and verifies email OTP before login. Live SMTP verification remains pending credentials.



The existing seven-page admin shell is a prototype to complete, not evidence of a secure administrative application. Keep `/admin/*` in the existing React/Vite application, reuse the present branding and useful CRUD layouts, and add the missing modules. A separate admin build would add deployment/theme duplication without a demonstrated need. Permission checks on the API remain authoritative even though the bundle contains admin UI code.

Razorpay is now confirmed for applicable paid registrations, book purchases, prepaid coaching passes and renewals. The existing proposed commerce/admin screens remain the management surface; do not add a second Razorpay-specific order system or recurring-subscription dashboard. Development demonstrations use Test Mode only, clearly labeled and separated from Live records; initiating a live payment requires explicit approval.

## Feature -> admin -> data -> API mapping

| Feature IDs / user surface | Admin route/module (proposed routes unless already present) | Manageable behavior and data | Models / API contracts |
|---|---|---|---|
| F01 home/header/footer/support | `/admin/content/pages`, `/admin/content/banners`, `/admin/settings` | home sections/service copy, brand/contact/footer, safe business navigation labels/order, scheduled placement copy/images/links | PageContent/Banner/SiteSettings; G09/G10/B33/B35-B36; A69-A71 |
| F02 about/founder/faculty | `/admin/content/pages`, `/admin/content/faculty` | about/mission/vision/claims, founder and faculty tags/portraits/verified experience | PageContent/FacultyProfile/MediaAsset; G09/G11; no teacher portal implied |
| F03 category cards/sheet | `/admin/content/pages`, `/admin/taxonomies` | domain card copy/badges/tags, curriculum filters, route target allowlist | PageContent/Taxonomy; G04/G09 |
| F04 authentication | `/admin/login`, `/admin/account`; `/admin/users` | staff sign-in/account recovery/logout/device/session; student status and invitation, roles only super admin | User/Session/AuthChallenge; A01-A12/B14-B18 |
| F05 Study / F06 Tuition | `/admin/registrations`, `/admin/registrations/:id` | typed submissions, full-field snapshots, private documents, fee/captured order status, notes/review/activation readiness | RegistrationApplication/Order/MediaAsset; B10-B13, A72-A74 |
| F07 faculty application | `/admin/registrations?kind=faculty` | experience and document review, verification fee reconciliation, reasoned review; optional separate sidebar view of same module | RegistrationApplication; B10-B13, B22-B24 |
| F08 franchise | `/admin/franchise-requests` (existing), `/admin/franchise-requests/:id` deep-link support optional | university/college validation, document review, reasons/notes, approval without implicit account privileges | FranchiseApplication/University/College; B06-B09 |
| F09 colleges / F10 institutes | `/admin/universities`, `/admin/colleges` (existing) | parent hierarchy, category/state/district/address/contact/facilities/logo/banner, verification evidence, public eligibility, archive | University/College/Taxonomy; G01/G02/G04 |
| F11 admission modal | `/admin/colleges/:collegeId/courses`, `/admin/applications` (existing) | degree programs/eligibility/fees/seats/admission state; enquiries/status/history/notes | CollegeProgram/AdmissionApplication; G03/B02-B05 |
| F12 books / F13 detail | `/admin/books` (existing) | metadata/curriculum/price/author/language/edition/TOC/keywords, actual cover/PDF/sample assets, draft/publish/archive | Book/Taxonomy/MediaAsset; G05/B31/A72-A75 |
| F13 wishlist / F15 reading | `/admin/books`, `/admin/enrollments` access support | manage source content/access exceptions; no ability to fabricate a student's bookmarks/progress | BookEntitlement/LearningProgress; B19-B21; personal state has no editorial CRUD |
| F14 checkout/orders/invoices | `/admin/orders`, `/admin/orders/:id` | order/payment status and Test/Live filters, Razorpay order/payment transaction references, failed/pending review, chronological attempt/payment history, verification timestamps, audited reconciliation and invoice availability | Order/PaymentAttempt; B22-B24; no 'mark paid' button |
| F16 coaching catalogue/selector | `/admin/coaching/courses`, `/admin/taxonomies` | taxonomy/subjects, course descriptions/teacher/benefits/thumb/banner, sort/featured config | CoachingCourse/Taxonomy/FacultyProfile; G04/G06 |
| F17 coaching registration | `/admin/registrations?kind=coaching-profile`, `/admin/users` | canonical student record; identify duplicates and profile completion, no inherited access | Application/User; B10-B18 |
| F18 plans/subscription/renewal | `/admin/coaching/courses/:id/plans`, `/admin/orders` | explicit days/price/features, availability/popular display; retain purchased snapshots | CoursePlan/Enrollment/Order; G08/B22-B24 |
| F19 my courses/dashboard | `/admin/enrollments` | account/course entitlement list, expiry, audited manual grant/revoke with reason; derived counts only | Enrollment/BookEntitlement; B19-B21 |
| F20 lectures/legacy player | `/admin/coaching/courses/:id/syllabus` | subject/chapter ordering, lesson upload/metadata/preview/lock, actual resources/download permissions | CoachingCourse/Lesson/MediaAsset; G06/G07/B32 |
| F21 course study books | same syllabus + books | link/reorder canonical books; course-only access mapping, actual private document | Book/course bookLinks; G05/G06/A73 |
| F22 results | `/admin/results/issuers`, `/admin/results/exams`, `/admin/results/records` | schema/source configuration, approved exam import validation, provenance, review/publish/correction/withdrawal | ResultIssuer/Exam/ResultRecord; G12/G13/B25-B30; gated Q07 |
| F23 notifications/header badge | `/admin/notifications` | compose/category/links/audience/publish; per-user read receipts remain user-owned | Notification/Receipt; G14/B34 |
| F24 profile/settings | `/admin/users`, `/admin/settings`, `/admin/account` | account status/contact verification operations, approved fees/options/declarations/support; personal toggles not business-wide | User/SiteSettings; B14-B18/B35-B36/A10-A14 |
| F25 operations | `/admin` (existing), `/admin/media`, `/admin/audit-logs`, `/admin/operations` | actual aggregates, upload status/reference cleanup, redacted audit search, failed job/payment reconciliation state | aggregate queries/MediaAsset/AuditLog/Job; B01/B37-B39 |
| F26 unmounted/marketing placeholders | decision register only | no quiz/live-class/franchise portal/module expansion until approved; no production mock-reset | no extra collections or admin modules |

Pure UI actions (swipe, share, zoom, dropdown state, browser print, modal closure and local navigation) require no separate admin module: content configuration and access are managed by their parent domain; presentation state remains in React. Read state/bookmarks/progress are user-owned, not editorial business data. Admin roles are a code-defined permission matrix with controlled account grants, not a public editable permissions engine.

## Shared admin frontend architecture

```text
frontend/src/shared/                  proposed, only during implementation
  api/httpClient.js, api/queryKeys.js
  ui/                                reusable accessible controls
  theme/                             semantic tokens derived from index.css
frontend/src/modules/admin/
  routes/AdminRoutes.jsx             staff login + protected nested routes
  components/layout/AdminLayout.jsx  existing shell extended
  components/                        DataTable, FilterBar, FormField,
                                     StatusBadge, ConfirmDialog, MediaPicker,
                                     PermissionGate, ErrorSummary, Pagination
  pages/                             domain screens from mapping
  services/                          HTTP adapters by domain
```

Reuse working PrimaryButton/SecondaryButton, EmptyState, SectionHeader/StatusBadge, Modal patterns and ToastContext after compatibility/accessibility fixes. Prefer a small shared control layer over introducing a second component library. Do not move or restyle user components in a broad refactor. Module detail routes permit refresh/deep linking where complex editors outgrow existing modals. Complex syllabus editing can use child panels; do not cram a full editor into a narrow modal.

Theme: navy #0A1D3F navigation/primary text; orange #FF8A00 action/accent; teal #0D9488 supportive status; white surfaces on #F8FAFC; existing Plus Jakarta Sans, 4px spacing scale, 8-16px card radii consistent with existing layouts. Keep existing legacy color appearances during integration. New body/form text at least a readable 14px, 44px interactive targets, labels separate from placeholder, visible focus, non-color status indicators. Preserve the user application's current layout, images, typography and motion except separately documented fixes.

## Responsive and accessibility behavior

Test every admin route at 320, 375, 390, 414, 768, 1024, 1280 and 1440px+ widths. At 320-414: header compact, sidebar off-canvas with focus trap/overlay/Escape/return focus, one-column cards/forms, filters wrapping with clear-all, primary action full width. At 768: collapsed rail or drawer where a 256px sidebar leaves insufficient form space; do not assume current md sidebar works for wide tables. At 1024+: persistent sidebar and flexible content, bounded form widths; 1280/1440+ use wider grids and split editor preview where useful.

Data tables switch to labeled cards/priority columns on narrow screens. If a genuine dense table requires horizontal scrolling, confine it to a labeled keyboard-accessible region; never body overflow. Pagination visible and operable on all widths. Dialogs use max-width and max-height with internal scroll, sticky action area, no clipped submit/error, virtual keyboard testing. SearchableSelect portals clamp to viewport and support arrows/Enter/Escape plus active descendant semantics. Upload UI shows actual filename/type/size/progress/retry/remove and authorized preview without exposing paths. Rich text editing is unnecessary for plain structured content; introduce only when a confirmed section needs it, with sanitized bounded schema.

Dashboard cards wrap, charts only if approved operational questions need them; no fake charts. If added, charts require textual values and resize containers. Date/status filters work as form submissions, preserve URL state and reset predictably. Loading/empty/error/success/permission-denied/session-expired/conflict states are mandatory. Preserve unsaved form data on transient errors; show field error summary and move focus appropriately. Destructive archive dialogs name the resource and dependent history; they must not imply permanent cascade deletion.

## Operational dashboard and workflow acceptance

Dashboard displays true counts of active institutions/programs/books/courses, pending typed registrations/admissions/franchises, captured orders and failed jobs over an explicit range. Financial values derive only from captured reconciled payments; no fake revenue or enrollment counts. Recent cards link to permitted records. Permission-hidden modules are also backend-denied on direct requests. A staff user with read permission can inspect but cannot mutate via API. Publication surfaces a validation checklist (missing media/plan/taxonomy), successful revision and link to the public page. Concurrent edits return a conflict and refetch/compare, not silent overwrite.

Commerce acceptance: B22 filters pending/authorized/captured/failed states and mode; B23 shows internal order -> Razorpay order -> payment/attempt history, redacted failure codes, verified amounts/currency, activation state and reconciliation result. B24 enqueues idempotent reconciliation and displays pending/retry/failure/completion; it never accepts an admin assertion that payment succeeded. Even super admins cannot mark an unpaid order paid or invoke the paid-purchase fulfillment path without provider verification. Exceptional manual access grants B20 remain separately permissioned, reasoned and audited, labeled `admin_grant`, and excluded from paid totals.

Book pricing uses G05, coaching plan pricing/duration G08, and applicable approved registration fees B36; all edits require appropriate permissions, expected revisions and audit. New prices apply to new quotes/orders and never rewrite purchase history. The confirmed gateway does not approve the prototype fees. Financial summaries B01 derive from verified captured records, group by currency and Test/Live mode, deduplicate transaction/order totals, expose date range/asOf, and distinguish payment receipts from fulfillment. Do not label summaries profit, taxable revenue, refund-adjusted net receipts or compliant tax invoices until Q09 establishes those definitions. No admin payment-secret editor is planned.

Do not deploy the current unauthenticated admin while building incrementally. Roll out behind authenticated staff access and a feature flag. Scope existing CRUD features for completion first, then add typed intake, coaching, commerce, CMS, results and operations in dependency order (11).
## Stage 4 delivered admin slice — 24 October 2026

Existing university, college/program, admission and franchise screens now use real paginated APIs with errors, filters, revision checks, archive confirmation, server-authored notes and persisted details. /admin/taxonomies adds kind/parent/status/order management using the existing theme. Permissions are enforced on the server and controls: institutions.read/write, content.read/write, admissions.read/review and franchises.read/review. Assign the explicit review permissions to ordinary staff; legacy write names alone do not authorize review.

Verification requires explicit evidence before college publication. Archival cannot remove historical applications or bypass active child checks. Admission notes can be saved without a status change. Franchise draft/pending/rejected details are reviewable, note-only saving works, and approval is visibly disabled pending policy. No reviewer can grant staff access, affiliation, payment or enrollment through this workflow. Books, dashboard aggregates and other later-stage admin modules remain disabled previews.


## Stage 5 implementation status - 24 October 2026

Existing AdminBooksPage is now connected to persisted CRUD, revisions, metadata/taxonomies, real cover/sample/full-document selection, explicit licensing/pricing attestations and publish/unpublish/archive. The mock reset control is removed. Missing prices remain unconfigured; purchase/full-read controls remain disabled.

Within the same AdminLayout, /admin/content manages pages/banners/faculty, /admin/media manages upload/status/rescan/unreferenced deletion, and /admin/settings manages typed public settings. Existing colors, layout and responsive shell are reused. CMS uses plain-text fields and bounded section/TOC editors; it cannot edit code routes, roles, secrets or financial policies. Page editing is staff-only draft inspection; there is no public draft-preview URL.

learning.read/write/publish, content.read/write/publish, media.read/write and settings.read/write are enforced at the backend. Existing ordinary staff need explicitly assigned new grants; no migration silently expands them. Screens show loading, empty, error, conflict, quarantine and permission states. Later-stage admin controls remain preview-only/disabled. Financial summaries and payment reconciliation remain Stage 6.

## Stage 6 adopted implementation - 24 October 2026

The existing admin shell now activates /admin/orders for persisted order/attempt/payment references, historical amounts, filters, fulfillment, pending/dead reconciliation state and verification requests. commerce.read and commerce.reconcile are fixed backend-enforced grants. No ordinary admin receives new permissions implicitly. Financial dashboard replaces mock financial figures with Test Mode aggregate groups, explicitly separating simulated records and gross captured from pending value/profit/settlements. No order status/amount override or refund control exists.

/admin/registrations supports actual draft review, safe fields/outstanding document slots and notes, not approval or paid activation. Existing book pricing stays under G05/revision/publication controls. Existing public-settings screen adds approved registration fee metadata via B36/settings.write; submission/charging stays blocked. Course plan pricing G08 is not activated before real CoursePlan and validity rules exist. Existing shell/theme/responsiveness are retained; no second panel or arbitrary permissions/secrets editor was added.


## Stage 7 implementation and superseding evidence - 24 October 2026

The existing admin shell activates /admin/coaching and /admin/enrollments. Course editors manage draft metadata, taxonomy, published instructor/book references, thumbnails and keyed syllabus sections. Child lesson and prepaid plan editors use revisioned APIs; a published course must be unpublished before child edits. Publication validates licensing and ready media; no arbitrary instructor or qualification is seeded. Plans require explicit price/days/eligibility/rules approval, with no monthly/yearly/lifetime inference. Enrollment review displays source order, user/course references, expiry/revocation/simulation and progress; safe audit history is available in B19 DTOs. Course revocation requires learning.grants.manage, a reason and expected revision, and never changes payment truth. Manual grants and generic book revocation remain disabled. Existing role/invitation architecture is retained; no ordinary staff grant was expanded automatically. Forms/tables include empty/error/conflict/loading states and responsive layouts.

See [Stage 7 report](../../backend/STAGE7-REPORT.md) and [current backend runbook](../../backend/README.md). Historical earlier-stage status paragraphs remain snapshots, not current operational acceptance.
