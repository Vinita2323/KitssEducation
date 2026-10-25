# KITSS Education: repository audit

Audit date: 23 October 2026 (Asia/Calcutta). Phase 1: analysis and planning only. All proposed code, folders, dependencies and environment examples in this documentation are future work; no implementation is authorized by this plan.

## Evidence and scope

The repository is a React frontend prototype, with an existing partial admin UI. This contradicts the initial assumption that no admin panel exists. Preserve and complete useful admin components rather than automatically replacing them. There is no backend directory, database implementation, server authentication, API server, upload server or automated test suite in the inspected repository.

Inspection covered route definitions, all page files, shared component implementations and event bindings, the three contexts, all service modules, all ten mock-data files, styles, assets inventory, manifests, lockfile metadata and deployment configuration. Large JSX files were inspected in passes separating state/handlers, interactive bindings and business content. This is a static source audit: no browser session, responsive screenshot review, live payment, production API, build, dependency audit or test execution was performed. Binary image/video content was inventoried by path and size, not visually or audiovisually validated. Dependency lockfile package metadata was inspected; integrity blobs and Git internals are not application features and were not audited. No source access limitation was encountered. Automated evidence appendices in documents 02 and 03 supplement the semantic findings, rather than constituting runtime verification.

The working tree was clean before documentation work. No existing `docs/development-plan/` directory was present. No applicable `AGENTS.md` was found in the workspace or its parent during discovery. No source/configuration edits, installs, backend folders, real environment files or commits are part of this phase.

## Repository and architecture

```text
package.json                  root convenience scripts; server targets absent backend
frontend/
  package.json, package-lock.json
  vite.config.js              React + Tailwind plugins; /api -> 127.0.0.1:5000
  vercel.json                 all paths rewrite to SPA root
  index.html                  branding, Google font, viewport
  public/                     logo, two result banners, sample video, dummy photos, SVGs
  src/
    main.jsx                  StrictMode + createRoot
    App.jsx                   BrowserRouter and providers; /admin/* and /*
    index.css, App.css        Tailwind v4 theme, utilities, print/export styles
    modules/user/
      routes/ context/ services/ data/ pages/ components/
    modules/admin/
      routes/ services/ pages/ components/layout/
```

`src/` contains 127 files: 103 JSX, 20 JavaScript, two CSS and two SVG files. There are 34 user page files and seven admin page files. `ForgotPasswordPage.jsx` exports two pages. Thirty distinct user page components are routed, with 31 rendering path entries because `/subscriptions` aliases `MyCoursesPage`. There are 37 explicit user paths, six redirect-only paths and one additional wildcard. Admin has seven rendering entries and one wildcard. The two outer `App.jsx` mount routes and layout-only routes are not counted as pages.

`App.jsx` nests AuthProvider -> ToastProvider -> LibraryProvider around both portals. State is React state/effects/context, with localStorage/sessionStorage and mutable imported arrays. No Redux, query cache, custom hooks directory, shared HTTP client, actual application fetch/axios API boundary or server route guards were found. Custom hooks `useAuth`, `useToast`, `useLibrary` are exported from contexts. Services simulate latency and mutate local state. The Razorpay service loads an external Checkout script, which is a real third-party boundary but not a complete verified payment integration.

UserLayout supplies header, drawer, mobile bottom navigation and desktop footer. Its immersive check is `pathname.includes('/read')`, which matches book `/read` but does not match coaching `/book/:bookId`. AuthLayout provides back navigation and registration outlet context. AdminLayout already supplies a navy header, desktop sidebar, mobile drawer and student-portal link, but displays a static Super Admin identity without authentication.

## Dependencies and styling

| Dependency | Declared | Lockfile observation | Purpose |
|---|---|---|---|
| React / React DOM | ^19.0.0 | 19.2.8 | SPA rendering |
| react-router-dom | ^7.18.3 | 7.18.3 | browser routes |
| Vite | ^6.2.0 | manifest reviewed; no upgrade assessed | build/dev proxy |
| Tailwind / @tailwindcss/vite | ^4.3.3 | 4.3.3 | utility styling and theme |
| framer-motion | ^13.4.0 | 13.4.0 | animations |
| lucide-react | ^1.39.0 | 1.39.0 | icons |
| html-to-image | ^1.11.13 | 1.11.13 | marksheet capture |
| html2canvas | ^1.4.1 | 1.4.1 | installed export-related dependency; verify necessity before changes |
| jspdf | ^4.2.1 | 4.2.1 | marksheet PDF export |

Only dev/build/preview scripts exist in the frontend. No test/lint scripts are declared. `README.md` is Vite template documentation, not project setup guidance. Root scripts `server` and `server:dev` reference an absent backend. Existing dependency declarations are observations, not a security endorsement or an instruction to upgrade in Phase 1.

Theme source: `src/index.css`: navy #0A1D3F, orange #FF8A00, teal #0D9488, background #F8FAFC, border #E2E8F0, secondary text #64748B, Plus Jakarta Sans. Components additionally use #133C8B, #667085, #E6E8EC and #17B26A. Preserve appearance; consolidate compatible semantic tokens during approved admin work. `App.css` contains only the Tailwind import and is not imported by main. Styles include touch targets, safe-area spacing, card effects and A4 print/export rules. Global overflow hiding can mask layout defects. The viewport disables user scaling; document an accessibility correction for approval.

## Current capabilities and missing infrastructure

Confirmed UI domains: marketing/about/faculty; four registration types; student login/reset; university-college-program hierarchy; institute directory; admission enquiries; digital book catalogue/filter/detail/checkout/readers; coaching catalogue/selection/plans/enrollment/dashboard/video/progress/study materials; orders; notifications; profile and settings. Admin implements local university/college/program/book CRUD, application/franchise review and basic counts.

Not established as working products: live classes, test series/quiz execution, certificates, teacher authoring portal, franchise dashboard, subscriptions with automatic recurring billing, reviews submission, blog, standalone FAQ/contact page, real-time chat or push notifications. Some are advertised or placeholder buttons; see F26 and decision register. Do not create these systems based on marketing copy alone.

Missing backend foundations: Node/Express application, MongoDB/Mongoose models and migrations, persistent sessions, permissions, verified payment orders/webhooks, authoritative entitlements, uploads, real educational media, trusted results ingestion, email/OTP delivery, validation, audit trail, production logging, startup configuration validation, health checks, backups and deployment operations.

## Verified defects and release blockers

| ID | Severity | Evidence | Consequence / planned resolution |
|---|---|---|---|
| R01 | Critical | `user/context/AuthContext.jsx` initializes a mock user and true authentication, then falls back to the mock on bootstrap | Logged-out state is not trustworthy; replace with server session bootstrap |
| R02 | Critical | `user/services/authService.js`, `data/mockUser.js`, login/success pages | Plaintext local passwords, demo defaults and fake JWT; replace and remove credential persistence |
| R03 | Critical | `user/services/razorpayService.js` configuration | Frontend contains a test key secret; treat as exposed, have authorized owner rotate it, remove in approved implementation; never reproduce its value in docs |
| R04 | Critical | Checkout, registration payment callbacks and direct completion buttons; `coachingService.joinCourse` | Client can grant ownership/enrollment and fabricate payment success; server must verify captured payment and grant once |
| R05 | Critical | `services/resultService.js` exact/suffix matching and `generateDynamicResult` | Unknown rolls receive fabricated verified marksheets; disable fallback in production and require an approved data source |
| R06 | Critical | `admin/routes/AdminRoutes.jsx`, AdminLayout | Unprotected admin UI and local mutable data; backend authorization and admin login required |
| R07 | Important | `AdminCollegeCoursesPage.jsx:48`; admin service exposes `getCollegeCourses`, not `getCourses` | Course list call fails; repair contract during integration |
| R08 | Important | `AdminApplicationsPage.jsx:100`; `adminService.js` | `addAdminNote` is called but absent; add a dedicated note contract |
| R09 | Important | Study/Tuition completion handlers use `registeredUser?.id` but AuthContext returns a result with `.user`/`.credentials`, and generate another password | Displayed credentials may not log in; unify response and activation flow |
| R10 | Important | `mockCourses.js`, `mockCoachingData.js`, LibraryContext, CoursePlayerPage | Chapter-based legacy course shape conflicts with active subjectsData; unify IDs and adapt both players |
| R11 | Important | `PdfReaderPage.jsx`, `OnlineBookViewer.jsx` | Render generated educational text rather than real PDF bytes; retain reader shell, supply actual documents |
| R12 | Important | PdfReaderPage calls `showWarning`; ToastContext exports success/error/info only | Warning interactions can throw; repair toast contract |
| R13 | Important | `ResultsPage.jsx:134` | History handler calls undefined `setActiveTab`; history not rendered in current return tree; resolve dormant flow before exposing |
| R14 | Important | local store getters auto-reinsert seeds; `bookService.getBookById` has no publication check | Deleted demos can return; drafts can be read by ID; enforce server visibility and stop reseeding |
| R15 | Important | `coachingService.subscribeCourse/computeSubscriptionExpiry` | Expiry is written to shared course, inferred from plan name, or defaults to now+180 days; move to per-user enrollment with explicit duration |
| R16 | Important | Franchise payload includes document names, not bytes; Study/Tuition account payloads omit collected documents and fields; Teacher success only updates React state | Collected applications/media are lost or incomplete; durable application lifecycle and file IDs required |
| R17 | Important | LecturePlayerPage and BookReaderPage fallback to first content; course readers rely on partial client guards | Invalid IDs can show unrelated material; validate hierarchy and entitlement on every protected request |
| R18 | Important | Profile password handler, Settings cache handler, orders invoice handler, tests/download buttons | Success toasts without underlying operation; wire real behavior or seek removal approval |
| R19 | Recommended | catalogue requests on typing without unified cancellation; college clear-search state does not necessarily retrigger fetch when filters stay unchanged | Stale responses/search reset defects; shared query boundary and regression tests |

## Deployment and media observations

Public assets: `KitssLogo.png` (1,007,208 bytes), two result JPG banners, dummy student JPG/SVG, favicon/icons SVG, and `videos/sample-lecture.mp4` (1,128,375 bytes). Source assets are the unused template React/Vite SVGs. External Unsplash/placehold images are widely referenced. No actual PDF asset exists in the inventoried public tree. Sample video in `public/` is public to anyone; never place paid media there.

No `.env*` files or CI/test configuration were found by file discovery. Frontend `.gitignore` ignores `*.local` but not all `.env` variants; root has no `.gitignore`. Existing Vercel SPA rewrite does not deploy an Express server or guarantee durable disk. Recommended backend deployment is a Node service behind TLS with MongoDB replica set and persistent local volume; frontend hosting can remain independent with explicit API routing.

Read documents 02-13 for feature evidence, specifications, decisions and implementation gates.

## Source coverage manifest

Full source file inventory used for the static passes (line counts establish inspection scope; binary assets listed above).

| Source path | Lines |
|---|---:|
| `frontend/src/App.css` | 1 |
| `frontend/src/App.jsx` | 29 |
| `frontend/src/assets/react.svg` | 1 |
| `frontend/src/assets/vite.svg` | 1 |
| `frontend/src/index.css` | 266 |
| `frontend/src/main.jsx` | 10 |
| `frontend/src/modules/admin/components/layout/AdminLayout.jsx` | 189 |
| `frontend/src/modules/admin/pages/AdminApplicationsPage.jsx` | 492 |
| `frontend/src/modules/admin/pages/AdminBooksPage.jsx` | 875 |
| `frontend/src/modules/admin/pages/AdminCollegeCoursesPage.jsx` | 442 |
| `frontend/src/modules/admin/pages/AdminCollegesPage.jsx` | 685 |
| `frontend/src/modules/admin/pages/AdminDashboardPage.jsx` | 269 |
| `frontend/src/modules/admin/pages/AdminFranchiseRequestsPage.jsx` | 542 |
| `frontend/src/modules/admin/pages/AdminUniversitiesPage.jsx` | 451 |
| `frontend/src/modules/admin/routes/AdminRoutes.jsx` | 27 |
| `frontend/src/modules/admin/services/adminService.js` | 565 |
| `frontend/src/modules/user/components/auth/CollegeFranchiseForm.jsx` | 2049 |
| `frontend/src/modules/user/components/auth/StudyRegistrationForm.jsx` | 1262 |
| `frontend/src/modules/user/components/auth/TeacherProfessorForm.jsx` | 1179 |
| `frontend/src/modules/user/components/auth/TuitionCoachingForm.jsx` | 1287 |
| `frontend/src/modules/user/components/books/BoardSelector.jsx` | 269 |
| `frontend/src/modules/user/components/books/BookCard.jsx` | 272 |
| `frontend/src/modules/user/components/books/BookFilterModal.jsx` | 372 |
| `frontend/src/modules/user/components/coaching/BookCard.jsx` | 108 |
| `frontend/src/modules/user/components/coaching/BookList.jsx` | 70 |
| `frontend/src/modules/user/components/coaching/ChapterAccordion.jsx` | 146 |
| `frontend/src/modules/user/components/coaching/CoachingSidebar.jsx` | 122 |
| `frontend/src/modules/user/components/coaching/CollegePromoCarousel.jsx` | 193 |
| `frontend/src/modules/user/components/coaching/CourseCard.jsx` | 329 |
| `frontend/src/modules/user/components/coaching/CourseExpiry.jsx` | 83 |
| `frontend/src/modules/user/components/coaching/CourseProgress.jsx` | 144 |
| `frontend/src/modules/user/components/coaching/LectureCard.jsx` | 129 |
| `frontend/src/modules/user/components/coaching/LectureList.jsx` | 124 |
| `frontend/src/modules/user/components/coaching/OnlineBookViewer.jsx` | 278 |
| `frontend/src/modules/user/components/coaching/ProtectedContentWarning.jsx` | 80 |
| `frontend/src/modules/user/components/coaching/ProtectedVideoPlayer.jsx` | 502 |
| `frontend/src/modules/user/components/coaching/StudentProfile.jsx` | 212 |
| `frontend/src/modules/user/components/coaching/VideoPlayerView.jsx` | 198 |
| `frontend/src/modules/user/components/college/AdmissionApplicationModal.jsx` | 736 |
| `frontend/src/modules/user/components/college/CollegeCard.jsx` | 134 |
| `frontend/src/modules/user/components/college/CollegeDetailsModal.jsx` | 239 |
| `frontend/src/modules/user/components/college/HomeCollegeSection.jsx` | 144 |
| `frontend/src/modules/user/components/common/EmptyState.jsx` | 114 |
| `frontend/src/modules/user/components/common/Modal.jsx` | 102 |
| `frontend/src/modules/user/components/common/PrimaryButton.jsx` | 87 |
| `frontend/src/modules/user/components/common/SearchableSelect.jsx` | 344 |
| `frontend/src/modules/user/components/common/SearchBar.jsx` | 80 |
| `frontend/src/modules/user/components/common/SectionHeader.jsx` | 148 |
| `frontend/src/modules/user/components/dashboard/FeaturedSection.jsx` | 156 |
| `frontend/src/modules/user/components/dashboard/HeroBannerCarousel.jsx` | 245 |
| `frontend/src/modules/user/components/dashboard/HeroGreeting.jsx` | 90 |
| `frontend/src/modules/user/components/dashboard/HomeAboutSection.jsx` | 67 |
| `frontend/src/modules/user/components/dashboard/QuickAccessGrid.jsx` | 134 |
| `frontend/src/modules/user/components/dashboard/ServicesSection.jsx` | 440 |
| `frontend/src/modules/user/components/layout/AppHeader.jsx` | 147 |
| `frontend/src/modules/user/components/layout/AuthLayout.jsx` | 48 |
| `frontend/src/modules/user/components/layout/BottomNavigation.jsx` | 74 |
| `frontend/src/modules/user/components/layout/CategorySheet.jsx` | 183 |
| `frontend/src/modules/user/components/layout/SideDrawer.jsx` | 294 |
| `frontend/src/modules/user/components/layout/UserLayout.jsx` | 114 |
| `frontend/src/modules/user/components/results/BoardSelector.jsx` | 131 |
| `frontend/src/modules/user/components/results/ResultActions.jsx` | 246 |
| `frontend/src/modules/user/components/results/ResultAdBanner.jsx` | 13 |
| `frontend/src/modules/user/components/results/ResultLoading.jsx` | 45 |
| `frontend/src/modules/user/components/results/ResultMarksheet.jsx` | 354 |
| `frontend/src/modules/user/components/results/ResultMarksTable.jsx` | 152 |
| `frontend/src/modules/user/components/results/ResultNotFound.jsx` | 79 |
| `frontend/src/modules/user/components/results/ResultSearchForm.jsx` | 272 |
| `frontend/src/modules/user/components/results/ResultSummary.jsx` | 116 |
| `frontend/src/modules/user/components/results/ResultTypeSelector.jsx` | 94 |
| `frontend/src/modules/user/context/AuthContext.jsx` | 170 |
| `frontend/src/modules/user/context/LibraryContext.jsx` | 196 |
| `frontend/src/modules/user/context/ToastContext.jsx` | 80 |
| `frontend/src/modules/user/data/mockBoards.js` | 911 |
| `frontend/src/modules/user/data/mockBooks.js` | 1109 |
| `frontend/src/modules/user/data/mockCoachingData.js` | 793 |
| `frontend/src/modules/user/data/mockColleges.js` | 1313 |
| `frontend/src/modules/user/data/mockCourses.js` | 277 |
| `frontend/src/modules/user/data/mockNotifications.js` | 74 |
| `frontend/src/modules/user/data/mockOrders.js` | 71 |
| `frontend/src/modules/user/data/mockResults.js` | 438 |
| `frontend/src/modules/user/data/mockSubscriptions.js` | 34 |
| `frontend/src/modules/user/data/mockUser.js` | 38 |
| `frontend/src/modules/user/pages/about/AboutPage.jsx` | 462 |
| `frontend/src/modules/user/pages/auth/ForgotPasswordPage.jsx` | 196 |
| `frontend/src/modules/user/pages/auth/LoginPage.jsx` | 166 |
| `frontend/src/modules/user/pages/auth/OnboardingPage.jsx` | 143 |
| `frontend/src/modules/user/pages/auth/RegisterPage.jsx` | 248 |
| `frontend/src/modules/user/pages/auth/RegisterSuccessPage.jsx` | 169 |
| `frontend/src/modules/user/pages/auth/SplashScreen.jsx` | 103 |
| `frontend/src/modules/user/pages/books/BookCheckoutPage.jsx` | 338 |
| `frontend/src/modules/user/pages/books/BookDetailsPage.jsx` | 353 |
| `frontend/src/modules/user/pages/books/BooksHomePage.jsx` | 335 |
| `frontend/src/modules/user/pages/books/MyPurchasedBooksPage.jsx` | 168 |
| `frontend/src/modules/user/pages/books/PdfReaderPage.jsx` | 792 |
| `frontend/src/modules/user/pages/categories/CategoriesPage.jsx` | 270 |
| `frontend/src/modules/user/pages/coaching/BookReaderPage.jsx` | 123 |
| `frontend/src/modules/user/pages/coaching/CoachingHomePage.jsx` | 305 |
| `frontend/src/modules/user/pages/coaching/CourseDashboardPage.jsx` | 295 |
| `frontend/src/modules/user/pages/coaching/CourseDetailsPage.jsx` | 716 |
| `frontend/src/modules/user/pages/coaching/CoursePlayerPage.jsx` | 286 |
| `frontend/src/modules/user/pages/coaching/CourseRegistrationPage.jsx` | 396 |
| `frontend/src/modules/user/pages/coaching/CourseSelectorPage.jsx` | 465 |
| `frontend/src/modules/user/pages/coaching/CourseSubscribePage.jsx` | 346 |
| `frontend/src/modules/user/pages/coaching/LecturePlayerPage.jsx` | 340 |
| `frontend/src/modules/user/pages/coaching/MyCoursesPage.jsx` | 179 |
| `frontend/src/modules/user/pages/coaching/MySubscriptionsPage.jsx` | 212 |
| `frontend/src/modules/user/pages/college/CollegeDetailPage.jsx` | 423 |
| `frontend/src/modules/user/pages/college/CollegesListingPage.jsx` | 450 |
| `frontend/src/modules/user/pages/dashboard/HomeDashboardPage.jsx` | 27 |
| `frontend/src/modules/user/pages/institutes/InstitutesListingPage.jsx` | 494 |
| `frontend/src/modules/user/pages/library/MyLibraryPage.jsx` | 294 |
| `frontend/src/modules/user/pages/notifications/NotificationsPage.jsx` | 186 |
| `frontend/src/modules/user/pages/orders/MyOrdersPage.jsx` | 188 |
| `frontend/src/modules/user/pages/profile/ProfilePage.jsx` | 472 |
| `frontend/src/modules/user/pages/profile/SettingsPage.jsx` | 172 |
| `frontend/src/modules/user/pages/results/ResultsPage.jsx` | 269 |
| `frontend/src/modules/user/routes/UserRoutes.jsx` | 116 |
| `frontend/src/modules/user/services/authService.js` | 343 |
| `frontend/src/modules/user/services/bookService.js` | 413 |
| `frontend/src/modules/user/services/coachingService.js` | 467 |
| `frontend/src/modules/user/services/collegeService.js` | 377 |
| `frontend/src/modules/user/services/notificationService.js` | 28 |
| `frontend/src/modules/user/services/orderService.js` | 39 |
| `frontend/src/modules/user/services/razorpayService.js` | 129 |
| `frontend/src/modules/user/services/resultService.js` | 359 |
| `frontend/src/modules/user/services/subscriptionService.js` | 21 |
