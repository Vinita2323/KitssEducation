# Routes, pages and interaction inventory

Paths below are relative to `frontend/src/modules/`. U = `user/`, A = `admin/`. Every route was inspected in `U/routes/UserRoutes.jsx` or `A/routes/AdminRoutes.jsx`; these are existing paths, not proposed new routes. Complexity: L = presentation/small query, M = CRUD/stateful integration, H = security/payment/document workflow. Authentication column states the proposed production requirement: current route files have no authentication guards. `P` public, `S` signed-in student, `A` authorized administrator. A free book may be readable publicly only after Q04 is decided.

Each entry combines the requested audit dimensions: purpose, components, data source/mock values, inputs/actions/state, auth, APIs/models/admin/media, dependencies/gaps and complexity. Model definitions are in 05; endpoint contracts are in 06. Feature IDs remain stable across documents.

## Existing user paths

| Path | Component / file under U/pages | Feature | Existing behavior and state | Production dependencies / gap | Auth; complexity |
|---|---|---|---|---|---|
| `/` | Navigate | F01 | redirect `/home` | Preserve; no API/model/admin | P; L |
| `/splash` | Navigate | F26 | redirect `/home`; SplashScreen file unused | Do not restore without decision | P; L |
| `/onboarding` | Navigate | F26 | redirect `/home`; OnboardingPage unused | Do not restore without decision | P; L |
| `/login` | auth/LoginPage.jsx | F04 | demo-prefilled ID/password, show/hide, remember, forgot/register links, busy/error state, AuthContext.login | session login/me/device conflict; no default credentials | P; H |
| `/register` | auth/RegisterPage.jsx | F05-F08 | four selectable form cards; `?type=study/tuition/teacher/franchise`; animated state and back handling | validate type; shared public form configuration; see four intakes below | P; H |
| `/register-success` | auth/RegisterSuccessPage.jsx | F04 | copies/reveals credentials, login with route-state password, dashboard link; fake fallback | server-owned reference/activation result; replace persistent password display subject to Q03 | P/recent registration; M |
| `/forgot-password` | auth/ForgotPasswordPage.jsx | F04 | identifier input, submits mock reset request, navigates reset | generic response; actual delivery, throttling and challenge | P; H |
| `/reset-password` | auth/ForgotPasswordPage.jsx: ResetPasswordPage | F04 | prefilled OTP, new/confirm password; length check; mock success | challenge-bound single-use recovery; revoke sessions; no default OTP | P/challenge; H |
| `/home` | dashboard/HomeDashboardPage.jsx | F01 | HeroBannerCarousel + ServicesSection + HomeAboutSection; inline business copy | CMS page and scheduled banners; preserve swipe/hover/animation and CTA routes | P; M |
| `/about` | about/AboutPage.jsx | F02 | organization, founder, mission/vision, faculty list; all/JEE/NEET/other filter; static claims/images | PageContent, FacultyProfile, media; CMS and faculty admin | P; M |
| `/categories` | categories/CategoriesPage.jsx | F03 | five domain cards, tags/badges; category search/tab/reset | CMS category content; routes/icons stay allowlisted code identifiers | P; L |
| `/institutes` | institutes/InstitutesListingPage.jsx | F10 | collegeService.getInstitutes; query submit, university/state/district filters, clear controls, detail/apply modals | real university-college refs, active tie-up visibility policy, facets; no inferred affiliation | P; M |
| `/institutes/:id` | Navigate | F10 | redirects `/institutes` | preserve alias; details currently modal | P; L |
| `/colleges` | college/CollegesListingPage.jsx | F09/F11 | collegeService list; search submit, category/state/district selects, reset chips, details/apply | Institution and CollegeProgram APIs; preserve modals, verified flag requires evidence | P; M |
| `/colleges/:id` | Navigate | F09 | redirects `/colleges`; CollegeDetailPage file unused | do not silently activate standalone details | P; L |
| `/books` | books/BooksHomePage.jsx | F12 | service results, board/class/subject/language cascading dropdowns, text search, chips/reset, skeleton/empty; q/board/class/subject/lang initial params | real taxonomy/facets, pagination, preserve visible filters; sort/type/price state exists but controls not mounted here | P; M |
| `/books/:id` | books/BookDetailsPage.jsx | F13 | bookService detail; wishlist/share, sample modal, chapters/specs/rating/price, buy/read CTA; LibraryContext ownership | public published detail/preview; server wishlist; book media/sample pages; aggregates have no review-write UI | P (wishlist S); M |
| `/books/:id/checkout` | books/BookCheckoutPage.jsx | F14 | payment-method choice, simulated purchase then mutable order then local ownership; success modal; owned/free shortcut | authoritative order + verified provider payment; grant BookEntitlement once; actual invoice | S; H |
| `/books/:id/read` | books/PdfReaderPage.jsx | F15 | local ownership check, page prev/next, chapter sheet/jump, bookmarks, zoom, resume, watermark, screenshot/blur overlays; generic text | protected real PDF delivery, server reader state, true TOC page offsets; no screenshot prevention guarantee | S or free-policy; H |
| `/my-books` | books/MyPurchasedBooksPage.jsx | F15 | fetches all stored books then filters context IDs; progress and read/details links | query current user's entitlements directly; no leakage of all drafts | S; M |
| `/library` | Navigate | F15 | redirects `/my-books` | legacy MyLibraryPage not mounted | S target; L |
| `/coaching` | coaching/CoachingHomePage.jsx | F16 | service courses and categories, query/category/class filters, reset and selector/my-course links | CoachingCourse list/facets; real publication; async race handling | P; M |
| `/coaching/register` | coaching/CourseRegistrationPage.jsx | F17 | name/phone/email/DOB/gender/state/city/board/class form; coachingService register; generated credential copy/login/selector | one canonical auth user; distinct enrollment vs paid registration fee rules; no inherited mock enrollments | P; H |
| `/coaching/select` | coaching/CourseSelectorPage.jsx | F16 | state->board, searchable/custom course, dependent subject, language; browser-saved preferences, `choose=1`; join modal; direct store reads | taxonomy/facet API; save preferences; join must respect price/policy | P browse / S join; H |
| `/coaching/my-courses` | coaching/MyCoursesPage.jsx | F19 | service enrolled cards, progress/expiry, choose-more link, CollegePromoCarousel | Enrollment+Progress and CMS banners; no seeded enrollment | S; M |
| `/coaching/:id` | coaching/CourseDetailsPage.jsx | F18 | teacher/benefits/subjects, share, plans, payment confirmation/success modal; Razorpay callback calls joinCourse and local order | unify plans with subscribe page, captured server payment and actual expiry grant | P / S checkout; H |
| `/coaching/:id/dashboard` | coaching/CourseDashboardPage.jsx | F19 | course/student/my-courses parallel loads; sidebar tabs lectures/books/progress/overview/profile; renew, lecture/read links | enrollment-protected metadata; per-user expiry/progress, real media references | S+entitlement; H |
| `/coaching/:id/lecture/:lectureId` | coaching/LecturePlayerPage.jsx | F20 | course lookup in subjectsData; playlist, selected lecture, completion toggle; expiry guard; ProtectedVideoPlayer | validate lecture belongs to course, deny unenrolled and locked media, no first-lecture fallback | S+entitlement or explicit preview; H |
| `/coaching/:id/book/:bookId` | coaching/BookReaderPage.jsx | F21 | lookup course book with first-book fallback, OnlineBookViewer, writes page progress | actual linked Book, course relationship and authorization; persist bookmarks; no unrelated fallback | S+entitlement; H |
| `/coaching/:id/subscribe` | coaching/CourseSubscribePage.jsx | F18 | separate hardcoded annual/semester/quarterly prices, Razorpay, hardcoded student, local subscribe+order | same server plan IDs/order flow as details; verified renewal policy | S; H |
| `/coaching/:id/player` | coaching/CoursePlayerPage.jsx | F20/F26 | expects legacy chapters, VideoPlayerView/ChapterAccordion, overview/lectures/notes/tests tabs; completion/share; download/test toast | adapt canonical syllabus; real allowed notes download; tests unresolved, no assessment engine | S+entitlement; H |
| `/subscriptions` | coaching/MyCoursesPage.jsx | F19 | alias same MyCourses; imported MySubscriptionsPage unused | preserve alias and unify entitlement source | S; L |
| `/results` | results/ResultsPage.jsx | F22 | landing type->board->dynamic form->loading/result/not-found; back/reset; ads; history fetched but not rendered | trusted result pipeline, issuer/exam/config and exact private lookup; PDF/print retain layout | P configuration / authorized lookup; H |
| `/orders` | orders/MyOrdersPage.jsx | F14 | mock orders, detail modal/items/status and invoice toast | current user order list/detail and authorized invoice download | S; M |
| `/notifications` | notifications/NotificationsPage.jsx | F23 | mutable mock list, read one/all and navigate link, unread badge/count | per-user persisted receipt state, audience publication, safe links | S; M |
| `/profile` | profile/ProfilePage.jsx | F24 | AuthContext user, local library counts; edit modal, password modal (toast only), logout confirmation and links | profile/password/session APIs; derived metrics; no fake coins/streak claims | S; M |
| `/settings` | profile/SettingsPage.jsx | F24 | local exam/course/promo toggles, device transfer and fake cache-clear toast | persisted preferences, real transfer with reauthentication; clear only genuine disposable cache | S; M |

## Registration forms: all are part of `/register`

| Feature | Components, fields and actions | Current data and missing behavior | Production models/APIs/admin/media |
|---|---|---|---|
| F05 Study intake | `components/auth/StudyRegistrationForm.jsx`; five steps + success; student/parents, DOB/derived age, calling/WhatsApp/email, address/state/district/city/PIN, apply course/institute, certificate/result, Aadhaar number/card, passport photo; same-as-phone, searchable/custom selects, uploads/previews, stepper/back/next, payment choices/copy/login | React/FileReader, fee 299, account register omits documents; direct completion bypass; displayed ID/password generated independently of auth result | RegistrationApplication(kind=study), User, Order/PaymentAttempt, MediaAsset; public draft/upload/submit/payment/activation; admin registrations; private identity/certificate/photo |
| F06 Tuition intake | `TuitionCoachingForm.jsx`; five steps + success; student/parents/DOB/contacts/guardian, board/class/school/address, current/home address same-as switch, Aadhaar/photo/class ID; payment/copy/next/back/login | fee 499; no durable full intake; unverified direct completion; guardian/school/home/document fields not all persisted | same application kind=tuition with typed academic/address/guardian payload; registration admin; private identity, photo and class ID |
| F07 Faculty application | `TeacherProfessorForm.jsx`; four steps + success; title/name/DOB/age/language, institute/start/end/continuing/coaching course/address/contact/experience/notes, contact/WhatsApp/email, photo/experience proof/Aadhaar; payment methods, ID copy | fee 199; Razorpay callback or direct completion only creates React faculty ID; no persisted application, approval/account/authoring workflow | RegistrationApplication(kind=faculty), Order/PaymentAttempt, private MediaAsset; faculty intake/review admin; no teacher login role unless later approved |
| F08 Franchise | `CollegeFranchiseForm.jsx`; five steps + review/success; university->college searchable dropdowns, institution name/type/year/website/logo, programs multiselect/custom add/remove, contact/designation, address/map, four documents, declaration, edit/review/jump/back/copy | collegeService local store; 3MB logo, 5MB document client limits; payload keeps filenames, drops file bytes; review jump can bypass earlier validation; fixed 2026 year limit | FranchiseApplication + University/College + MediaAsset, public upload/submit; admin review/status/notes/rejection; declaration version and submitted snapshot; private certificates/auth letter/PAN-GST; logo separately public after approval |

File previews are not file uploads. Card/UPI/bank fields in registration pages are custom presentation; never send card PAN/CVV to this backend. Provider-hosted checkout must own payment instrument entry.

## Existing admin routes (F25 plus domain IDs)

| Path | Component | Existing actions / source | Missing or planned |
|---|---|---|---|
| `/admin` | AdminDashboardPage | local counts and recent applications/franchises, linked stat cards | authenticated aggregate API; true global rather than filtered metrics; books/coaching/payment/intake operational counts |
| `/admin/universities` | AdminUniversitiesPage | search/status filter, create/edit modal name/shortName/logo/status, toggle, delete confirmation, college links; adminService | server validation, media upload, revision conflicts, dependencies and audit |
| `/admin/colleges` | AdminCollegesPage | university URL filter/search/status, cards, create/edit fields incl parent/location/type/description/facilities/contact/media defaults, toggle/delete, program link | form does not expose every stored field (notably district/contact/media controls); complete minimal fields, no destructive cascade against applications |
| `/admin/colleges/:collegeId/courses` | AdminCollegeCoursesPage | list/create/edit/toggle/delete; name/degree/duration/eligibility/fee/seats/admission/status | missing getCourses service method; CollegeProgram API and integrity rules |
| `/admin/applications` | AdminApplicationsPage | search/status tabs, student/program detail, status update, internal note and note-only action | missing addAdminNote service; actor must come from authenticated session; private data access |
| `/admin/franchise-requests` | AdminFranchiseRequestsPage | search/status filters, review, approval/rejection/reason/note | real document access, safe transitions, explicit public eligibility rule; approval does not itself imply portal creation |
| `/admin/books` | AdminBooksPage | search/board/class/subject/type/status, stats, add/edit/delete/publish, cover style/icon, keywords/chapters, reset-to-mock | real cover/PDF/sample uploads absent; no production reset-to-mock; persisted publication, entitlement-safe archive |

All current admin pages require permission checks, loading/empty/error feedback, server paging and responsive QA. Existing modal closure, cancel, drawer toggles and student-portal links are local UI behaviors and need no independent database or API.

## Shared interaction audit

| Feature | Implementations and interactive behavior | Backend / admin implication |
|---|---|---|
| F01 shell | AppHeader links/search shortcut (goes to books, not global search), profile avatar, static notification dot, hamburger; SideDrawer navigation, admin link, support/logout modals; BottomNavigation; footer resource/helpline links | public site settings/navigation content; authenticated unread count; permission-aware admin entry; no global search product assumed |
| F01 home | HeroBannerCarousel timed rotation, swipe, hover pause and prev/next CTA; ServicesSection and HomeAboutSection links | publishable ordered CMS; no API for slide animation state |
| F03 navigation | CategorySheet close/backdrop/category navigation; SearchBar change/clear/filter; category search/tab reset | allowlisted links and editable copy; no server API for purely local tab/modal state |
| F09-F11 institution components | CollegeCard click, CollegeDetailsModal website/banner/title external links, close; AdmissionApplicationModal locked preselection, college/course radio choices, validation, student prefill, next/back/review/submit/copy reference | list/detail/child programs/application API; safe external URL; enquiry does not reserve seats or enroll |
| F12-F15 books | BoardSelector exports Board/Class/Subject/Language selectors and resets; BookFilterModal contains sort/free-paid/language/price + apply/reset but full filter modal is not mounted by BooksHomePage; BookPreviewModal is mounted; BookCard wishlist/details/read/pay/library progress | API supports existing latent filter fields without automatically adding UI; true samplePages/page data; wishlist not a review feature |
| F19-F21 learning | CoachingSidebar desktop/mobile tabs; LectureList expandable subjects, LectureCard lock/selection; BookList/BookCard read; CourseProgress; CourseExpiry renewal; StudentProfile enrolled links; ChapterAccordion legacy expand/select | course structure and current-user state; locks calculated by backend; expiry comes from enrollment |
| F20 video | ProtectedVideoPlayer play/pause, scrub, +/-10s, mute/volume, speed cycle, fullscreen/orientation, controls timeout, moving watermark, blur/visibility overlay/resume, ended/manual completion; VideoPlayerView simpler legacy controls | authenticated ranged media; persist resume/checkpoints; completion explicit/idempotent; watermark discourages copying but is not DRM |
| F21 course reader | OnlineBookViewer next/prev/jump, zoom/reset, local bookmark; ProtectedContentWarning shortcut overlay/return | persist per-book state; replace fake page generator; no claim of OS capture prevention |
| F22 results | ResultTypeSelector three types, BoardSelector list/search/custom institute; ResultSearchForm schema defaults/validation/touched state/change board, submit; ResultNotFound retry/reset; ResultMarksheet/Card, table, summary, ResultActions real browser print and multi-page PDF export | approved field schema, exact authenticated lookup/source truth; export is client formatting and does not digitally sign a record; Lucide QR icon is not a working verification QR |
| F24 common UI | Modal/BottomSheet backdrop/close/scroll locking; SearchableSelect portal positioning/search/custom selection/Escape/outside click; buttons disabled/loading; EmptyState/ErrorState/SkeletonLoader; ToastContext close/timers | no domain models for controls; add focus trapping, accessible listbox navigation and validation messages; fix absent warning method |

## Unmounted and incomplete features (F26)

Inspected but not active routes: SplashScreen, OnboardingPage, CollegeDetailPage, MyLibraryPage and MySubscriptionsPage. The reset route is a second export, not a separate file. MySubscriptionsPage is imported by UserRoutes but `/subscriptions` mounts MyCoursesPage. MyLibraryPage contains mock test cards and seeded progress/fallback enrollment. Dashboard HeroGreeting, QuickAccessGrid, FeaturedSection and college HomeCollegeSection exist but are not mounted by the current HomeDashboardPage. Preserve their status until explicit scope approval; do not count them as live pages.

CoursePlayerPage notes downloads and practice tests are toasts; marketing mentions live classes, mentorship and assessments without corresponding workflows. Certificate uploads in study registration are applicant documents, not platform-issued course certificates. Ratings are display data without review submission. No dedicated cart, coupon, quiz attempt, certification, instructor portal, blog, FAQ CRUD or contact-ticket system was found. Support is static contact/modal content. These omissions are documented, not silently filled with generic EdTech modules.

## Cross-feature dependency rules

F05-F07 depend on taxonomy, private uploads, fee configuration and verified commerce; F08 depends on University/College validity; F11 depends on a valid CollegeProgram under the selected College; F14/F18 depend on server prices and payments; F15/F19-F21 depend on authenticated entitlements and media access; F22 depends on approved result provenance and privacy rules. F23/F24 depend on one identity and server preferences. CMS publication affects F01-F03, promotions and support, but must not change technical route identifiers or security rules.

## Source interaction evidence ledger

This static ledger records every JSX event-binding location and local component/service contract anchor in the 103 JSX files. Line numbers refer to the inspected source, before any implementation changes. Repeated render branches count separately; binding locations are evidence, not proof a control is reachable or functional. Handler bodies and data sources were reviewed in the domain audit above. Files with no events are pure composition/display or data consumers.

### `frontend/src/App.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/main.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/admin/components/layout/AdminLayout.jsx`

- L44 onClick={() => setSidebarOpen(!sidebarOpen)}
- L131 onClick={() => setSidebarOpen(false)}
- L138 onClick={() => setSidebarOpen(false)}
- L153 onClick={() => setSidebarOpen(false)}
- L171 onClick={() => setSidebarOpen(false)}

### `frontend/src/modules/admin/pages/AdminApplicationsPage.jsx`

Service calls: `adminService.addAdminNote`, `adminService.getApplications`, `adminService.updateApplicationStatus`.

- L138 onSubmit={handleSearchSubmit}
- L144 onChange={(e) => setSearch(e.target.value)}
- L159 onClick={() => setStatusFilter(st)}
- L267 onClick={() => handleOpenDetail(app)}
- L287 onClick={() => setSelectedApp(null)}
- L301 onClick={() => setSelectedApp(null)}
- L391 onClick={() => setNewStatus(st)}
- L439 onChange={(e) => setNewNote(e.target.value)}
- L445 onClick={handleAddNoteOnly} loading={updating}>
- L473 onClick={() => setSelectedApp(null)}>
- L480 onClick={handleStatusUpdate}

### `frontend/src/modules/admin/pages/AdminBooksPage.jsx`

Service calls: `bookService.addBook`, `bookService.deleteBook`, `bookService.getAllBooksForAdmin`, `bookService.resetToDefaults`, `bookService.togglePublishStatus`, `bookService.updateBook`.

- L220 onClick={handleResetCatalog}
- L230 onClick={handleOpenAddModal}
- L268 onChange={(e) => setSearchQuery(e.target.value)}
- L277 onClick={() => {
- L300 onChange={(e) => setFilterBoard(e.target.value)}
- L316 onChange={(e) => setFilterClass(e.target.value)}
- L332 onChange={(e) => setFilterSubject(e.target.value)}
- L348 onChange={(e) => setFilterType(e.target.value)}
- L363 onChange={(e) => setFilterStatus(e.target.value)}
- L464 onClick={() => handleTogglePublish(book.id)}
- L489 onClick={() => handleOpenEditModal(book)}
- L498 onClick={() => setDeleteConfirmId(book.id)}
- L520 onClick={() => setModalOpen(false)}
- L534 onClick={() => setModalOpen(false)}
- L542 onSubmit={handleSaveBook}
- L555 onChange={(e) => setFormData({ ...formData, board: e.target.value })}
- L570 onChange={(e) => setFormData({ ...formData, class: e.target.value })}
- L585 onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
- L606 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
- L619 onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
- L635 onChange={(e) => setFormData({ ...formData, author: e.target.value })}
- L646 onChange={(e) => setFormData({ ...formData, language: e.target.value })}
- L663 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
- L679 onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
- L696 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
- L709 onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
- L721 onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
- L739 onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
- L751 onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
- L763 onChange={(e) => setFormData({ ...formData, status: e.target.value })}
- L777 onChange={(e) => setFormData({ ...formData, coverColor: e.target.value })}
- L796 onChange={(e) => setFormData({ ...formData, chapters: e.target.value })}
- L809 onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
- L820 onClick={() => setModalOpen(false)}
- L842 onClick={() => setDeleteConfirmId(null)}
- L857 onClick={() => setDeleteConfirmId(null)}
- L864 onClick={() => handleDeleteBook(deleteConfirmId)}

### `frontend/src/modules/admin/pages/AdminCollegeCoursesPage.jsx`

Service calls: `adminService.createCourse`, `adminService.deleteCourse`, `adminService.getCourses`, `adminService.toggleCourseStatus`, `adminService.updateCourse`.

- L164 onClick={handleOpenCreate} icon={Plus}>
- L238 onClick={() => handleToggleStatus(crs)}
- L253 onClick={() => handleOpenEdit(crs)}
- L260 onClick={() => handleDelete(crs)}
- L282 onClick={() => setModalOpen(false)}
- L291 onClick={() => setModalOpen(false)}
- L299 onSubmit={handleSubmit}
- L308 onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
- L321 onChange={(e) => setFormData({ ...formData, degreeType: e.target.value })}
- L338 onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
- L353 onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
- L365 onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })}
- L378 onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
- L391 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
- L404 onChange={(e) => setFormData({ ...formData, admissionStatus: e.target.value })}
- L419 onChange={(e) => setFormData({ ...formData, status: e.target.value })}
- L429 onClick={() => setModalOpen(false)}>

### `frontend/src/modules/admin/pages/AdminCollegesPage.jsx`

Service calls: `adminService.createCollege`, `adminService.deleteCollege`, `adminService.getColleges`, `adminService.getUniversities`, `adminService.toggleCollegeStatus`, `adminService.updateCollege`.

- L266 onClick={handleOpenCreate}
- L279 onSubmit={handleSearchSubmit}
- L285 onChange={(e) => setSearch(e.target.value)}
- L298 onChange={(e) => handleUniFilterChange(e.target.value)}
- L315 onClick={() => setStatusFilter(st)}
- L344 onClick={handleOpenCreate}
- L373 onClick={() => handleToggleStatus(college)}
- L450 onClick={() => handleOpenEdit(college)}
- L457 onClick={() => handleDelete(college)}
- L488 onClick={() => setModalOpen(false)}
- L495 onSubmit={handleSave}
- L503 onChange={(e) =>
- L527 onChange={(e) =>
- L543 onChange={(e) =>
- L561 onChange={(e) =>
- L576 onChange={(e) =>
- L596 onChange={(e) =>
- L618 onChange={(e) =>
- L634 onChange={(e) =>
- L649 onChange={(e) =>
- L663 onClick={() => setModalOpen(false)}

### `frontend/src/modules/admin/pages/AdminDashboardPage.jsx`

Service calls: `adminService.getDashboardStats`.

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/admin/pages/AdminFranchiseRequestsPage.jsx`

Service calls: `adminService.getFranchiseRegistrations`, `adminService.updateFranchiseStatus`.

- L154 onSubmit={handleSearchSubmit}
- L160 onChange={(e) => setSearch(e.target.value)}
- L170 onClick={() => setStatusFilter(st)}
- L223 onClick={() => handleOpenDetail(fran)}
- L279 onClick={(e) => {
- L319 onClick={() => setSelectedFranchise(null)}
- L496 onChange={(e) => {
- L510 onClick={() => handleStatusChange("Approved")}
- L520 onClick={() => handleStatusChange("Rejected", adminNote \|\| rejectionReason)}
- L530 onClick={() => setSelectedFranchise(null)}

### `frontend/src/modules/admin/pages/AdminUniversitiesPage.jsx`

Service calls: `adminService.createUniversity`, `adminService.deleteUniversity`, `adminService.getUniversities`, `adminService.toggleUniversityStatus`, `adminService.updateUniversity`.

- L165 onClick={handleOpenCreate}
- L178 onSubmit={handleSearchSubmit}
- L184 onChange={(e) => setSearch(e.target.value)}
- L194 onClick={() => setStatusFilter(st)}
- L222 onClick={handleOpenCreate}
- L258 onClick={() => handleToggleStatus(uni)}
- L309 onClick={() => handleOpenEdit(uni)}
- L316 onClick={() => handleDelete(uni)}
- L347 onClick={() => setModalOpen(false)}
- L354 onSubmit={handleSave}
- L363 onChange={(e) =>
- L380 onChange={(e) =>
- L400 onChange={(e) =>
- L415 onChange={(e) =>
- L429 onClick={() => setModalOpen(false)}

### `frontend/src/modules/admin/routes/AdminRoutes.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/auth/CollegeFranchiseForm.jsx`

Service calls: `collegeService.getCollegesByUniversity`, `collegeService.getUniversities`, `collegeService.submitFranchiseRegistration`.

- L527 onClick={copyApplicationId}
- L600 onClick={onBack}
- L625 onClick={handleBackStep}
- L663 onClick={() => isClickable && jumpToStep(step.id)}
- L757 onChange={(e) => handleInputChange("institutionName", e.target.value)}
- L778 onChange={(e) => handleInputChange("institutionType", e.target.value)}
- L802 onChange={(e) => handleInputChange("yearEstablished", e.target.value)}
- L829 onChange={(e) => handleInputChange("website", e.target.value)}
- L860 onClick={() => handleInputChange("institutionLogo", null)}
- L879 onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
- L891 onClick={handleBackStep}
- L898 onClick={handleContinue}
- L940 onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
- L978 onChange={(e) => setUniSearch(e.target.value)}
- L979 onClick={(e) => e.stopPropagation()}
- L993 onClick={() => {
- L1052 onClick={() => setColDropdownOpen(!colDropdownOpen)}
- L1083 onChange={(e) => setColSearch(e.target.value)}
- L1084 onClick={(e) => e.stopPropagation()}
- L1098 onClick={() => {
- L1157 onClick={() => toggleProgram(prog)}
- L1182 onClick={(e) => {
- L1197 onClick={() => setShowOtherInput(!showOtherInput)}
- L1219 onChange={(e) => setCustomCourseInput(e.target.value)}
- L1220 onKeyDown={(e) => {
- L1231 onClick={handleAddCustomCourse}
- L1240 onClick={() => {
- L1263 onClick={handleBackStep}
- L1270 onClick={handleContinue}
- L1311 onChange={(e) => handleInputChange("contactPerson", e.target.value)}
- L1330 onChange={(e) => handleInputChange("designation", e.target.value)}
- L1356 onChange={(e) => handleInputChange("email", e.target.value)}
- L1381 onChange={(e) => handleInputChange("mobile", e.target.value)}
- L1405 onChange={(e) => handleInputChange("alternateMobile", e.target.value)}
- L1418 onClick={handleBackStep}
- L1425 onClick={handleContinue}
- L1462 onChange={(e) => handleInputChange("address", e.target.value)}
- L1483 onChange={(e) => handleInputChange("city", e.target.value)}
- L1501 onChange={(e) => handleInputChange("state", e.target.value)}
- L1521 onChange={(e) => handleInputChange("pincode", e.target.value)}
- L1548 onChange={(e) => handleInputChange("googleMapsLocation", e.target.value)}
- L1560 onClick={handleBackStep}
- L1567 onClick={handleContinue}
- L1614 onClick={() => removeDocument("registrationCert")}
- L1627 onChange={(e) => e.target.files?.[0] && handleFileUpload("registrationCert", e.target.files[0])}
- L1653 onClick={() => removeDocument("affiliationCert")}
- L1666 onChange={(e) => e.target.files?.[0] && handleFileUpload("affiliationCert", e.target.files[0])}
- L1692 onClick={() => removeDocument("authLetter")}
- L1705 onChange={(e) => e.target.files?.[0] && handleFileUpload("authLetter", e.target.files[0])}
- L1731 onClick={() => removeDocument("panGstCert")}
- L1744 onChange={(e) => e.target.files?.[0] && handleFileUpload("panGstCert", e.target.files[0])}
- L1756 onClick={handleBackStep}
- L1763 onClick={handleContinue}
- L1807 onClick={() => jumpToStep(1)}
- L1847 onClick={() => jumpToStep(2)}
- L1889 onClick={() => jumpToStep(3)}
- L1927 onClick={() => jumpToStep(4)}
- L1954 onClick={() => jumpToStep(5)}
- L1996 onChange={(e) => {
- L2021 onClick={handleBackStep}
- L2029 onClick={handleSubmitApplication}

### `frontend/src/modules/user/components/auth/StudyRegistrationForm.jsx`

- L353 onClick={onBack}
- L393 onClick={() => {
- L467 onClick={() => copyCred(credentials?.userId, "userId")}
- L484 onClick={() => copyCred(credentials?.password, "password")}
- L517 onClick={() => navigate("/login")}
- L525 onClick={onBack}
- L534 onSubmit={(e) => {
- L574 onChange={handleChange}
- L594 onChange={handleChange}
- L630 onChange={handleChange}
- L646 onChange={handleChange}
- L686 onChange={handleChange}
- L706 onChange={handleChange}
- L722 onChange={handleSameAsCalling}
- L735 onChange={handleChange}
- L754 onChange={handleChange}
- L770 onChange={(val) => handleSelectChange("state", val)}
- L785 onChange={handleChange}
- L801 onChange={handleChange}
- L817 onChange={handleChange}
- L853 onChange={(val) => handleSelectChange("applyCourseName", val)}
- L871 onChange={handleChange}
- L925 onChange={(e) => handleFileChange("courseCertificate", e.target.files[0])}
- L957 onChange={(e) => handleFileChange("passportPhoto", e.target.files[0])}
- L983 onChange={handleChange}
- L1014 onChange={(e) => handleFileChange("aadharCard", e.target.files[0])}
- L1085 onClick={() => setPaymentMethod(pm.id)}
- L1117 onClick={() => setUpiApp(app.id)}
- L1187 onChange={setSelectedBank}
- L1202 onClick={() => completeStudyRegistration()}
- L1218 onClick={handlePrev}
- L1231 onClick={handleNext}
- L1240 onClick={handleNext}

### `frontend/src/modules/user/components/auth/TeacherProfessorForm.jsx`

- L324 onClick={onBack}
- L364 onClick={() => {
- L436 onClick={copyFacultyId}
- L471 onClick={onBack}
- L480 onSubmit={(e) => {
- L515 onChange={(val) => handleSelectChange("title", val)}
- L527 onChange={handleChange}
- L546 onChange={handleChange}
- L575 onChange={(val) => handleSelectChange("studyLanguage", val)}
- L592 onChange={handleChange}
- L610 onChange={handleChange}
- L626 onChange={handleSameAsContact}
- L639 onChange={handleChange}
- L679 onChange={handleChange}
- L695 onChange={handleChange}
- L709 onChange={handleContinuingToggle}
- L725 onChange={handleChange}
- L741 onChange={(val) => handleSelectChange("coachingCourse", val)}
- L758 onChange={handleChange}
- L774 onChange={handleChange}
- L790 onChange={(val) => handleSelectChange("coachingExperience", val)}
- L842 onChange={(e) => handleFileChange("passportPhoto", e.target.files[0])}
- L874 onChange={(e) => handleFileChange("experienceDoc", e.target.files[0])}
- L900 onChange={handleChange}
- L931 onChange={(e) => handleFileChange("aadharCard", e.target.files[0])}
- L1002 onClick={() => setPaymentMethod(pm.id)}
- L1034 onClick={() => setUpiApp(app.id)}
- L1104 onChange={setSelectedBank}
- L1119 onClick={() => completeRegistrationSuccess()}
- L1135 onClick={handlePrev}
- L1148 onClick={handleNext}
- L1157 onClick={handleNext}

### `frontend/src/modules/user/components/auth/TuitionCoachingForm.jsx`

- L311 onClick={onBack}
- L351 onClick={() => {
- L432 onClick={() => copyText(createdCredentials.userId, "userId")}
- L450 onClick={() => copyText(createdCredentials.password, "password")}
- L483 onClick={() => navigate("/home")}
- L491 onClick={() =>
- L509 onSubmit={(e) => {
- L555 onChange={handleChange}
- L574 onChange={handleChange}
- L590 onChange={handleChange}
- L610 onChange={handleChange}
- L629 onChange={handleChange}
- L651 onChange={handleChange}
- L667 onChange={handleSameAsContact}
- L680 onChange={handleChange}
- L699 onChange={handleChange}
- L743 onChange={(val) => handleCustomSelectChange("studentClass", val)}
- L757 onChange={(val) => handleCustomSelectChange("studyBoard", val)}
- L777 onChange={handleChange}
- L795 onChange={handleChange}
- L838 onChange={(val) => handleCustomSelectChange("stateName", val)}
- L855 onChange={handleChange}
- L874 onChange={handleChange}
- L891 onChange={handleChange}
- L907 onChange={handleSameAsAddress}
- L918 onChange={handleChange}
- L961 onChange={handleChange}
- L974 onChange={(e) => handleFileChange("aadharCard", e.target.files[0])}
- L1013 onChange={(e) => handleFileChange("passportPhoto", e.target.files[0])}
- L1042 onChange={(e) => handleFileChange("classIdCard", e.target.files[0])}
- L1110 onClick={() => setPaymentMethod(pm.id)}
- L1142 onClick={() => setUpiApp(app.id)}
- L1212 onChange={setSelectedBank}
- L1227 onClick={() => completeTuitionRegistration()}
- L1243 onClick={handlePrev}
- L1256 onClick={handleNext}
- L1265 onClick={handleNext}

### `frontend/src/modules/user/components/books/BoardSelector.jsx`

- L29 onClick={() => onSelect("All")}
- L41 onChange={(e) => onSelect(e.target.value)}
- L82 onClick={() => onSelect("All")}
- L94 onChange={(e) => onSelect(e.target.value)}
- L135 onClick={() => onSelect("All")}
- L147 onChange={(e) => onSelect(e.target.value)}
- L187 onClick={() => onSelect("All")}
- L199 onChange={(e) => onSelect(e.target.value)}
- L245 onSelect={onSelectBoard}
- L250 onSelect={onSelectClass}
- L255 onSelect={onSelectSubject}
- L259 onSelect={onSelectLanguage}

### `frontend/src/modules/user/components/books/BookCard.jsx`

- L185 onClick={() => toggleWishlist(book.id)}

### `frontend/src/modules/user/components/books/BookFilterModal.jsx`

Service calls: `bookService.getAvailableClasses`, `bookService.getAvailableSubjects`.

- L107 onClose={onClose} title="Filter & Refine Books">
- L124 onClick={() => setSort(s.id)}
- L151 onClick={() => setType(t.id)}
- L172 onClick={() => setBoard("All")}
- L185 onClick={() => setBoard(b.id)}
- L206 onClick={() => setCls("All")}
- L219 onClick={() => setCls(c)}
- L240 onClick={() => setSub("All")}
- L253 onClick={() => setSub(s.id)}
- L276 onClick={() => setLanguage(lang)}
- L300 onChange={(e) => setMinPrice(e.target.value)}
- L308 onChange={(e) => setMaxPrice(e.target.value)}
- L317 onClick={handleReset}>
- L320 onClick={handleApply}>
- L333 onClose={onClose} title={\`Sample: ${book.title}\`}>
- L364 onClick={onClose}

### `frontend/src/modules/user/components/coaching/BookCard.jsx`

- L97 onClick={() => onReadOnline && onReadOnline(book)}

### `frontend/src/modules/user/components/coaching/BookList.jsx`

- L62 onReadOnline={onReadOnline}

### `frontend/src/modules/user/components/coaching/ChapterAccordion.jsx`

- L16 onClick={onSelect}
- L112 onClick={() => setIsOpen((prev) => !prev)}
- L139 onSelect={() => onSelectLecture(lecture)}

### `frontend/src/modules/user/components/coaching/CoachingSidebar.jsx`

- L76 onClick={() => onTabChange && onTabChange(tab.id)}
- L106 onClick={() => onTabChange && onTabChange(tab.id)}

### `frontend/src/modules/user/components/coaching/CollegePromoCarousel.jsx`

- L94 onMouseEnter={() => setIsHovered(true)}
- L95 onMouseLeave={() => setIsHovered(false)}
- L96 onTouchStart={handleTouchStart}
- L97 onTouchMove={handleTouchMove}
- L98 onTouchEnd={handleTouchEnd}
- L153 onClick={handlePrev}
- L161 onClick={handleNext}
- L180 onClick={() => setCurrent(i)}

### `frontend/src/modules/user/components/coaching/CourseCard.jsx`

- L299 onClick={() => onJoinClick && onJoinClick(course)}

### `frontend/src/modules/user/components/coaching/CourseExpiry.jsx`

- L72 onClick={() => onRenew && onRenew()}

### `frontend/src/modules/user/components/coaching/CourseProgress.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/coaching/LectureCard.jsx`

- L31 onClick={handleClick}

### `frontend/src/modules/user/components/coaching/LectureList.jsx`

- L53 onClick={() => toggleSubject(subj.subjectName)}
- L109 onSelectLecture={onSelectLecture}

### `frontend/src/modules/user/components/coaching/OnlineBookViewer.jsx`

- L100 onClick={handleZoomOut}
- L109 onClick={handleZoomIn}
- L118 onClick={resetZoom}
- L130 onClick={() => setIsBookmarked(!isBookmarked)}
- L154 onContextMenu={(e) => e.preventDefault()}
- L223 onClick={handlePrevPage}
- L243 onChange={(e) => {
- L258 onClick={handleNextPage}

### `frontend/src/modules/user/components/coaching/ProtectedContentWarning.jsx`

- L71 onClick={handleReturn}

### `frontend/src/modules/user/components/coaching/ProtectedVideoPlayer.jsx`

- L54 onChange = (e) => setIsPortrait(e.matches);
- L66 onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
- L248 onContextMenu={handleContextMenu}
- L267 onTimeUpdate={handleTimeUpdate}
- L268 onLoadedMetadata={handleLoadedMetadata}
- L269 onPlay={() => setIsPlaying(true)}
- L270 onPause={() => setIsPlaying(false)}
- L271 onError={(e) => {
- L277 onEnded={() => {
- L282 onClick={togglePlay}
- L293 onClick={togglePlay}
- L334 onClick={() => {
- L357 onChange={handleSeek}
- L369 onClick={togglePlay}
- L382 onClick={() => skipTime(-10)}
- L391 onClick={() => skipTime(10)}
- L402 onClick={toggleMute}
- L418 onChange={handleVolumeChange}
- L434 onClick={cyclePlaybackRate}
- L446 onClick={onLectureComplete}
- L461 onClick={toggleFullscreen}

### `frontend/src/modules/user/components/coaching/StudentProfile.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/coaching/VideoPlayerView.jsx`

- L101 onTimeUpdate={handleTimeUpdate}
- L102 onLoadedMetadata={handleLoadedMetadata}
- L103 onEnded={() => {
- L108 onClick={togglePlay}
- L117 onClick={togglePlay}
- L138 onChange={handleSeek}
- L146 onClick={togglePlay}
- L154 onClick={() => skipTime(-10)}
- L163 onClick={() => skipTime(10)}
- L172 onClick={toggleMute}
- L186 onClick={toggleFullscreen}

### `frontend/src/modules/user/components/college/AdmissionApplicationModal.jsx`

Service calls: `collegeService.getCollegeById`, `collegeService.getColleges`, `collegeService.submitApplication`.

- L267 onClick={handleModalClose}
- L268 onTouchMove={(e) => e.preventDefault()}
- L284 onClick={handleModalClose}
- L332 onClick={handleCopyId}
- L353 onClick={handleModalClose}>
- L385 onClick={() => {
- L412 onChange={() => {}}
- L460 onClick={() => setSelectedCourseId(crsId)}
- L501 onChange={() => {}}
- L532 onChange={(e) => handleInputChange("fullName", e.target.value)}
- L545 onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
- L558 onChange={(e) => handleInputChange("email", e.target.value)}
- L571 onChange={(e) => handleInputChange("dob", e.target.value)}
- L583 onChange={(e) => handleInputChange("city", e.target.value)}
- L595 onChange={(e) => handleInputChange("educationalQualification", e.target.value)}
- L614 onChange={(e) => handleInputChange("passingYear", e.target.value)}
- L627 onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
- L702 onClick={handlePrevStep} icon={ArrowLeft}>
- L713 onClick={handleNextStep}
- L723 onClick={handleSubmitApplication}

### `frontend/src/modules/user/components/college/CollegeCard.jsx`

- L28 onClick={handleCardClick}

### `frontend/src/modules/user/components/college/CollegeDetailsModal.jsx`

- L65 onClick={(e) => e.stopPropagation()}
- L70 onClick={onClose}
- L81 onClick={handleOpenWebsite}
- L113 onClick={handleOpenWebsite}
- L202 onClick={(e) => e.stopPropagation()}
- L219 onClick={onClose}
- L229 onClick={(e) => e.stopPropagation()}

### `frontend/src/modules/user/components/college/HomeCollegeSection.jsx`

Service calls: `collegeService.getColleges`.

- L107 onViewCollege={handleOpenCollege}
- L140 onClose={handleCloseModal}

### `frontend/src/modules/user/components/common/EmptyState.jsx`

- L23 onClick={onAction}>
- L50 onClick={onRetry}

### `frontend/src/modules/user/components/common/Modal.jsx`

- L30 onClick={onClose}
- L42 onClick={onClose}
- L76 onClick={onClose}
- L90 onClick={onClose}

### `frontend/src/modules/user/components/common/PrimaryButton.jsx`

- L34 onClick={onClick}
- L73 onClick={onClick}

### `frontend/src/modules/user/components/common/SearchableSelect.jsx`

- L212 onChange={(e) => setSearchTerm(e.target.value)}
- L213 onKeyDown={(e) => {
- L220 onClick={(e) => e.stopPropagation()}
- L225 onClick={(e) => {
- L244 onClick={handleSelectCustom}
- L265 onClick={() => handleSelect(opt.value)}
- L298 onClick={handleToggle}
- L299 onKeyDown={(e) => {

### `frontend/src/modules/user/components/common/SearchBar.jsx`

- L21 onChange={(e) => onChange(e.target.value)}
- L28 onClick={onClear}
- L39 onClick={onFilterClick}
- L60 onClick={onClick}

### `frontend/src/modules/user/components/common/SectionHeader.jsx`

- L36 onClick={onViewAll}

### `frontend/src/modules/user/components/dashboard/FeaturedSection.jsx`

Service calls: `coachingService.getCourses`, `collegeService.getColleges`.

- L82 onClick={() => { setSelectedCollege(college); setIsModalOpen(true); }}>
- L149 onClose={() => {

### `frontend/src/modules/user/components/dashboard/HeroBannerCarousel.jsx`

- L166 onMouseEnter={() => setIsHovered(true)}
- L167 onMouseLeave={() => setIsHovered(false)}
- L168 onTouchStart={handleTouchStart}
- L169 onTouchMove={handleTouchMove}
- L170 onTouchEnd={handleTouchEnd}
- L220 onClick={handlePrev}
- L228 onClick={handleNext}

### `frontend/src/modules/user/components/dashboard/HeroGreeting.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/dashboard/HomeAboutSection.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/dashboard/QuickAccessGrid.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/dashboard/ServicesSection.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/layout/AppHeader.jsx`

- L34 onError={(e) => {
- L121 onError={(e) => {

### `frontend/src/modules/user/components/layout/AuthLayout.jsx`

- L28 onClick={handleBack}

### `frontend/src/modules/user/components/layout/BottomNavigation.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/layout/CategorySheet.jsx`

- L93 onClick={onClose}
- L126 onClick={onClose}
- L145 onClick={() => handleNavigate(cat.path)}

### `frontend/src/modules/user/components/layout/SideDrawer.jsx`

- L74 onClick={onClose}
- L106 onClick={onClose}
- L145 onClick={() => handleLinkClick("/login")}
- L161 onClick={() => handleLinkClick(item.path)}
- L190 onClick={() => handleLinkClick("/admin")}
- L198 onClick={() => setShowHelpModal(true)}
- L207 onClick={() => setShowLogoutModal(true)}
- L223 onClose={() => setShowLogoutModal(false)}
- L240 onClick={() => setShowLogoutModal(false)}
- L248 onClick={handleConfirmLogout}
- L259 onClose={() => setShowHelpModal(false)}
- L286 onClick={() => setShowHelpModal(false)}

### `frontend/src/modules/user/components/layout/UserLayout.jsx`

- L29 onOpenDrawer={() => setDrawerOpen(true)} unreadCount={2} />
- L33 onClose={() => setDrawerOpen(false)} />

### `frontend/src/modules/user/components/results/BoardSelector.jsx`

- L48 onChange={(value) => {
- L90 onClick={() => onSelectBoard(board.id)}

### `frontend/src/modules/user/components/results/ResultActions.jsx`

- L201 onClick={onBack}
- L212 onClick={onNewSearch}
- L224 onClick={handlePrint}
- L235 onClick={handleDownload}

### `frontend/src/modules/user/components/results/ResultAdBanner.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/results/ResultLoading.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/results/ResultMarksheet.jsx`

- L99 onClick={onView}
- L128 onBack={onBack}
- L129 onNewSearch={onNewSearch}
- L289 onError={(e) => {

### `frontend/src/modules/user/components/results/ResultMarksTable.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/results/ResultNotFound.jsx`

- L58 onClick={onTryAgain}
- L69 onClick={onReset}

### `frontend/src/modules/user/components/results/ResultSearchForm.jsx`

- L155 onClick={onChangeBoard}
- L164 onSubmit={handleSubmit}
- L189 onChange={(e) => handleChange(field.id, e.target.value)}
- L190 onBlur={() => handleBlur(field.id)}
- L215 onChange={(e) => handleChange(field.id, e.target.value)}
- L216 onBlur={() => handleBlur(field.id)}
- L231 onChange={(e) => handleChange(field.id, e.target.value)}
- L232 onBlur={() => handleBlur(field.id)}

### `frontend/src/modules/user/components/results/ResultSummary.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/components/results/ResultTypeSelector.jsx`

- L44 onClick={() => onSelectType(opt.id)}
- L70 onClick={() => onSelectType(opt.id)}

### `frontend/src/modules/user/context/AuthContext.jsx`

Service calls: `authService.getCurrentDeviceInfo`, `authService.getCurrentUser`, `authService.getLastRegisteredCredentials`, `authService.login`, `authService.logout`, `authService.register`, `authService.transferSessionToCurrentDevice`, `authService.updateProfile`, `authService.validateDeviceSession`.

- L141 onClick={handleTransferDeviceSession}
- L150 onClick={logout}

### `frontend/src/modules/user/context/LibraryContext.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/context/ToastContext.jsx`

- L61 onClick={() => removeToast(toast.id)}

### `frontend/src/modules/user/pages/about/AboutPage.jsx`

- L334 onError={(e) => {
- L395 onClick={() => setActiveFacultyFilter(tab.key)}
- L421 onError={(e) => {

### `frontend/src/modules/user/pages/auth/ForgotPasswordPage.jsx`

Service calls: `authService.forgotPassword`, `authService.resetPassword`.

- L48 onSubmit={handleSubmit}
- L60 onChange={(e) => setIdentifier(e.target.value)}
- L138 onSubmit={handleSubmit}
- L146 onChange={(e) => setOtp(e.target.value)}
- L161 onChange={(e) => setNewPassword(e.target.value)}
- L175 onChange={(e) => setConfirmPassword(e.target.value)}

### `frontend/src/modules/user/pages/auth/LoginPage.jsx`

- L80 onSubmit={handleSubmit}
- L91 onChange={(e) => setUserId(e.target.value)}
- L109 onChange={(e) => setPassword(e.target.value)}
- L116 onClick={() => setShowPassword((prev) => !prev)}
- L131 onChange={(e) => setRememberMe(e.target.checked)}

### `frontend/src/modules/user/pages/auth/OnboardingPage.jsx`

- L63 onClick={handleSkip}
- L107 onClick={() => setCurrentStep(idx)}
- L125 onClick={handleNext}

### `frontend/src/modules/user/pages/auth/RegisterPage.jsx`

- L130 onClick={() => setSelectedType(opt.id)}
- L194 onBack={() => setSelectedType(null)} />
- L210 onBack={() => setSelectedType(null)} />
- L226 onBack={() => setSelectedType(null)} />
- L242 onBack={() => setSelectedType(null)} />

### `frontend/src/modules/user/pages/auth/RegisterSuccessPage.jsx`

- L88 onClick={() => copyToClipboard(credentials.userId, "userId")}
- L114 onClick={() => setShowPassword(!showPassword)}
- L125 onClick={() => copyToClipboard(credentials.password, "password")}
- L141 onClick={copyAll}
- L152 onClick={handleGoToLogin}
- L161 onClick={() => navigate("/home")}

### `frontend/src/modules/user/pages/auth/SplashScreen.jsx`

- L86 onClick={() => navigate("/onboarding")}

### `frontend/src/modules/user/pages/books/BookCheckoutPage.jsx`

Service calls: `bookService.getBookById`, `bookService.purchaseBook`, `orderService.createOrder`.

- L87 onRetry={() => navigate("/books")}
- L131 onClick={() => navigate(-1)}
- L196 onClick={() => setPaymentMethod(method.id)}
- L266 onClick={handlePayNow}
- L277 onClose={() => {
- L318 onClick={() => {

### `frontend/src/modules/user/pages/books/BookDetailsPage.jsx`

Service calls: `bookService.getBookById`.

- L86 onRetry={() => navigate("/books")}
- L103 onClick={() => navigate(-1)}
- L113 onClick={() => toggleWishlist(book.id)}
- L126 onClick={handleShare}
- L174 onClick={() => setShowPreviewModal(true)}
- L348 onClose={() => setShowPreviewModal(false)}

### `frontend/src/modules/user/pages/books/BooksHomePage.jsx`

Service calls: `bookService.getAvailableClasses`, `bookService.getAvailableSubjects`, `bookService.getBoards`, `bookService.getBooks`.

- L204 onClick={handleResetFilters}
- L216 onChange={setQuery}
- L217 onClear={() => setQuery("")}
- L230 onSelectBoard={handleBoardClick}
- L231 onSelectClass={handleClassClick}
- L232 onSelectSubject={handleSubjectClick}
- L233 onSelectLanguage={handleLanguageClick}
- L242 onClick={() => setSelectedBoard("All")}
- L251 onClick={() => setSelectedClass("All")}
- L260 onClick={() => setSelectedSubject("All")}
- L269 onClick={() => setSelectedLanguage("All")}
- L278 onClick={() => setQuery("")}
- L323 onAction={handleResetFilters}

### `frontend/src/modules/user/pages/books/MyPurchasedBooksPage.jsx`

Service calls: `bookService.getMyLibraryBooks`.

- L59 onClick={() => navigate("/profile")}
- L88 onAction={() => navigate("/books")}

### `frontend/src/modules/user/pages/books/PdfReaderPage.jsx`

Service calls: `bookService.getBookById`, `coachingService.getStudentProfile`.

- L234 onAction={() => navigate("/books")}
- L366 onClick={() => navigate(-1)}
- L389 onClick={() => setShowToc(true)}
- L399 onClick={handleToggleBookmark}
- L413 onClick={handleZoomOut}
- L425 onClick={handleZoomIn}
- L440 onClick={() => setIsWindowBlurred(false)}
- L457 onClick={() => setIsWindowBlurred(false)}
- L636 onClick={handlePrevPage}
- L664 onClick={handleNextPage}
- L678 onClick={() => setShowToc(false)}
- L690 onClick={() => setShowToc(false)}
- L706 onClick={() => handleJumpToChapter(idx)}
- L781 onClick={() => setShowScreenshotModal(false)}

### `frontend/src/modules/user/pages/categories/CategoriesPage.jsx`

- L141 onChange={(e) => setSearchQuery(e.target.value)}
- L147 onClick={() => setSearchQuery("")}
- L163 onClick={() => setSelectedTab(tab.id)}
- L253 onClick={() => {

### `frontend/src/modules/user/pages/coaching/BookReaderPage.jsx`

Service calls: `coachingService.getCourseById`, `coachingService.getStudentProfile`, `coachingService.updateBookProgress`.

- L119 onPageChange={handlePageChange}

### `frontend/src/modules/user/pages/coaching/CoachingHomePage.jsx`

Service calls: `coachingService.getCategories`, `coachingService.getCourses`.

- L77 onSubmit={handleSearchSubmit}
- L83 onChange={(e) => setQuery(e.target.value)}
- L106 onClick={() => setSelectedCategory("All")}
- L118 onChange={(e) => setSelectedCategory(e.target.value)}
- L149 onClick={() => setSelectedClass("All")}
- L161 onChange={(e) => setSelectedClass(e.target.value)}
- L240 onClick={() => {

### `frontend/src/modules/user/pages/coaching/CourseDashboardPage.jsx`

Service calls: `coachingService.getCourseById`, `coachingService.getMyCourses`, `coachingService.getStudentProfile`.

- L122 onTabChange={setActiveTab}
- L136 onRenew={() => navigate(\`/coaching/${id}/subscribe\`)}
- L205 onSelectLecture={handleSelectLecture}
- L226 onReadOnline={handleReadOnline}
- L246 onRenew={() => navigate(\`/coaching/${id}/subscribe\`)}

### `frontend/src/modules/user/pages/coaching/CourseDetailsPage.jsx`

Service calls: `coachingService.getCourseById`, `coachingService.joinCourse`, `orderService.createOrder`.

- L236 onClick={handleShare}
- L481 onClick={() => setShowConfirmModal(true)}
- L555 onClick={() => setShowConfirmModal(false)}
- L576 onClick={() => setShowConfirmModal(false)}
- L605 onClick={() => setSelectedPlanId(plan.id)}
- L685 onClick={() => setShowConfirmModal(false)}
- L692 onClick={handleRazorpayPayment}

### `frontend/src/modules/user/pages/coaching/CoursePlayerPage.jsx`

Service calls: `coachingService.getCourseById`.

- L85 onRetry={() => navigate("/coaching")}
- L98 onClick={() => navigate(\`/coaching/${course.id}\`)}
- L108 onClick={handleShare}
- L121 onComplete={handleMarkComplete}
- L160 onClick={() => setActiveTab(tab.id)}
- L187 onSelectLecture={handleSelectLecture}
- L233 onClick={() => showSuccess(\`Downloading ${res.name}...\`)}
- L260 onClick={() => showInfo("Starting practice test session...")}
- L273 onClick={handleMarkComplete}

### `frontend/src/modules/user/pages/coaching/CourseRegistrationPage.jsx`

Service calls: `coachingService.registerStudent`.

- L149 onClick={() => copyCred(createdCredentials.userId, "userId")}
- L167 onClick={() => copyCred(createdCredentials.password, "password")}
- L187 onClick={() => navigate("/coaching/select")}
- L197 onClick={() =>
- L217 onSubmit={handleSubmit}
- L231 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
- L250 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
- L267 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
- L286 onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
- L300 onChange={(val) => setFormData({ ...formData, gender: val })}
- L323 onChange={(val) => setFormData({ ...formData, state: val })}
- L339 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
- L361 onChange={(val) => setFormData({ ...formData, board: val })}
- L374 onChange={(val) => setFormData({ ...formData, class: val })}

### `frontend/src/modules/user/pages/coaching/CourseSelectorPage.jsx`

Service calls: `coachingService.getCourses`, `coachingService.joinCourse`.

- L220 onChange={(e) => handleStateChange(e.target.value)}
- L238 onChange={(e) => setSelectedBoard(e.target.value)}
- L259 onChange={setSelectedType}
- L295 onChange={(e) => setSelectedSubject(e.target.value)}
- L314 onChange={(e) => setSelectedLanguage(e.target.value)}
- L331 onClick={() => {
- L374 onJoinClick={handleJoinClick}
- L408 onClick={() => navigate(\`/coaching/${selectedCourseForJoin.id}/dashboard\`)}
- L444 onClick={() => setSelectedCourseForJoin(null)}
- L451 onClick={handleConfirmEnrollment}

### `frontend/src/modules/user/pages/coaching/CourseSubscribePage.jsx`

Service calls: `coachingService.getCourseById`, `coachingService.subscribeCourse`, `orderService.createOrder`.

- L156 onRetry={() => navigate("/coaching")}
- L167 onClick={() => navigate(-1)}
- L211 onClick={() => setSelectedPlan(plan.id)}
- L281 onClick={handleSubscribe}
- L292 onClose={() => {
- L333 onClick={() => {

### `frontend/src/modules/user/pages/coaching/LecturePlayerPage.jsx`

Service calls: `coachingService.getCourseById`, `coachingService.getStudentProfile`, `coachingService.updateLectureProgress`.

- L134 onClick={() => navigate(\`/coaching/${courseId}/subscribe\`)}
- L176 onClick={() => {
- L250 onClick={handleToggleCompletion}
- L276 onLectureComplete={handleToggleCompletion}

### `frontend/src/modules/user/pages/coaching/MyCoursesPage.jsx`

Service calls: `coachingService.getMyCourses`.

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/pages/coaching/MySubscriptionsPage.jsx`

Service calls: `subscriptionService.getSubscriptions`, `subscriptionService.renewSubscription`.

- L63 onClick={() => setActiveTab("active")}
- L78 onClick={() => setActiveTab("expired")}
- L104 onAction={() => {}}
- L194 onClick={() => handleRenew(sub.id)}

### `frontend/src/modules/user/pages/college/CollegeDetailPage.jsx`

Service calls: `collegeService.getCollegeById`.

- L96 onRetry={() => navigate("/colleges")}
- L117 onClick={handleShare}
- L176 onClick={() => handleApplyClick("")}
- L183 onClick={() => handleApplyClick("")}
- L278 onClick={() => handleApplyClick(crsId)}
- L344 onClick={() => handleApplyClick("")}
- L350 onClick={() => handleApplyClick("")}
- L417 onClose={() => setIsModalOpen(false)}

### `frontend/src/modules/user/pages/college/CollegesListingPage.jsx`

Service calls: `collegeService.getColleges`.

- L127 onSubmit={handleSearchSubmit}
- L133 onChange={(e) => setSearchQuery(e.target.value)}
- L140 onClick={() => {
- L170 onClick={() => setSelectedCategory("All")}
- L183 onChange={(e) => setSelectedCategory(e.target.value)}
- L217 onClick={() => {
- L233 onChange={handleStateChange}
- L267 onClick={() => setSelectedDistrict("All")}
- L280 onChange={(e) => setSelectedDistrict(e.target.value)}
- L338 onAction={handleClearFilters}
- L414 onClick={() => openDetailsModal(college)}
- L422 onClick={() => openApplyModal(collegeId)}
- L438 onClose={() => setApplyModalOpen(false)}
- L446 onClose={() => setDetailsModalOpen(false)}

### `frontend/src/modules/user/pages/dashboard/HomeDashboardPage.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.

### `frontend/src/modules/user/pages/institutes/InstitutesListingPage.jsx`

Service calls: `collegeService.getInstitutes`.

- L136 onSubmit={handleSearchSubmit}
- L142 onChange={(e) => setSearchQuery(e.target.value)}
- L149 onClick={() => {
- L179 onClick={() => setSelectedUniversity("All")}
- L191 onChange={(e) => setSelectedUniversity(e.target.value)}
- L222 onClick={() => {
- L237 onChange={handleStateChange}
- L268 onClick={() => setSelectedDistrict("All")}
- L280 onChange={(e) => setSelectedDistrict(e.target.value)}
- L339 onAction={handleClearFilters}
- L434 onClick={() => openDetailsModal(institute)}
- L442 onClick={() => openApplyModal(instId)}
- L482 onClose={() => setApplyModalOpen(false)}
- L490 onClose={() => setDetailsModalOpen(false)}

### `frontend/src/modules/user/pages/library/MyLibraryPage.jsx`

Service calls: `bookService.getMyLibraryBooks`, `coachingService.getCourses`.

- L111 onClick={() => navigate(-1)}
- L139 onClick={() => {
- L169 onChange={(e) => setSearchQuery(e.target.value)}
- L187 onAction={() => navigate("/books")}
- L205 onAction={() => navigate("/coaching")}

### `frontend/src/modules/user/pages/notifications/NotificationsPage.jsx`

Service calls: `notificationService.getNotifications`, `notificationService.markAllAsRead`, `notificationService.markAsRead`.

- L74 onClick={() => navigate(-1)}
- L93 onClick={handleMarkAllRead}
- L133 onClick={() => handleItemClick(item)}

### `frontend/src/modules/user/pages/orders/MyOrdersPage.jsx`

Service calls: `orderService.getOrders`.

- L94 onClick={() => setSelectedOrder(order)}
- L109 onClose={() => setSelectedOrder(null)}
- L177 onClick={() => handleDownloadInvoice(selectedOrder)}

### `frontend/src/modules/user/pages/profile/ProfilePage.jsx`

- L92 onClick={() => setShowEditModal(true)}
- L113 onClick={() => setShowEditModal(true)}
- L217 onClick={() => setShowPasswordModal(true)}
- L308 onClick={() => setShowLogoutModal(true)}
- L324 onClose={() => setShowEditModal(false)}
- L327 onSubmit={handleSaveProfile}
- L333 onChange={(e) => setEditData({ ...editData, name: e.target.value })}
- L344 onChange={(e) => setEditData({ ...editData, email: e.target.value })}
- L355 onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
- L366 onChange={(e) => setEditData({ ...editData, board: e.target.value })}
- L380 onChange={(e) => setEditData({ ...editData, class: e.target.value })}
- L392 onClick={() => setShowEditModal(false)}>
- L405 onClose={() => setShowPasswordModal(false)}
- L408 onSubmit={handleChangePassword}
- L414 onChange={(e) => setCurrPass(e.target.value)}
- L426 onChange={(e) => setNewPass(e.target.value)}
- L434 onClick={() => setShowPasswordModal(false)}>
- L447 onClose={() => setShowLogoutModal(false)}
- L461 onClick={() => setShowLogoutModal(false)}>
- L464 onClick={handleLogout}>

### `frontend/src/modules/user/pages/profile/SettingsPage.jsx`

- L27 onClick={() => navigate(-1)}
- L58 onChange={(e) => setExamAlerts(e.target.checked)}
- L71 onChange={(e) => setCourseUpdates(e.target.checked)}
- L84 onChange={(e) => setPromoAlerts(e.target.checked)}
- L127 onClick={() => {
- L153 onClick={handleClearCache}

### `frontend/src/modules/user/pages/results/ResultsPage.jsx`

Service calls: `resultService.getBoardConfig`, `resultService.getBoards`, `resultService.getMyResults`, `resultService.searchResult`.

- L183 onClick={handleGoBack}
- L205 onSelectType={handleSelectResultTypeFromLanding}
- L215 onSelectBoard={handleSelectBoard}
- L226 onSubmit={handleSearchSubmit}
- L228 onChangeBoard={() => setFlowStep("board_selection")}
- L243 onBack={() => setFlowStep("search_form")}
- L244 onNewSearch={handleResetToLanding}
- L255 onTryAgain={() => setFlowStep("search_form")}
- L256 onReset={handleResetToLanding}

### `frontend/src/modules/user/routes/UserRoutes.jsx`

No JSX event binding in this file; inspect props/composition and links in the feature inventory.
