# Dynamic business content audit

Source paths below are relative to `frontend/src/modules/user/` unless prefixed otherwise. E = administrator-editable content, C = administrator-configurable business value with validation/audit, S = server/system/user-owned state. None of these sources should be copied automatically into production as verified truth. Every imported mock record and inline business object in the listed locations must be reviewed before an approved seed migration. Implementation constants remain code.

## Data stores and structured mocks

| Source / component | Current hardcoded structure and usage | Proposed source | API | Managing admin / ownership |
|---|---|---|---|---|
| `data/mockBooks.js` | mockBoards/classes/subjects; 26 literal book records book-101..126; title/subtitle, board/class/subject IDs and duplicated labels, prices, discounts, rating/reviewCount, cover styles, description, pages/format/size/year/author/language/status, keywords, chapters and sample-page text | Taxonomy, Book, MediaAsset; price integer paise, derived size/discount; actual samples | books/list/detail/facets/preview | Books + Taxonomy; E/C; aggregate ratings S unless source-approved editorial value |
| `data/mockCoachingData.js` | five literal coaching courses plus 16 generated degree-program entries; subjectsData/lectures/books, teacher/benefits, counts, sample video, some subscriptionPlans, shared expiry/progress; INITIAL_STUDENT_PROFILE | CoachingCourse, Lesson, CoursePlan, Book refs, Enrollment and LearningProgress; User | coaching catalogue, syllabus, plans; current-user learning APIs | Coaching/Plans/Enrollments; definitions E/C, user expiry/progress S |
| `data/mockCourses.js` | four legacy courses course-201..204, chapter/lecture/resources/tests counts and isSubscribed; used by LibraryContext | canonical CoachingCourse/Lesson IDs; compatibility view for legacy player | same coaching/learning APIs | no second admin catalogue; legacy duplicate migration needs review |
| `data/mockColleges.js` | STATE_DISTRICT_MAP (partial locations); INITIAL_UNIVERSITIES/COLLEGES/COURSES/APPLICATIONS/FRANCHISE_REGISTRATIONS; hardcoded affiliations, contacts/ratings/verified flags, fees/seats and fabricated records | University, College, CollegeProgram, AdmissionApplication, FranchiseApplication, Taxonomy | institutions/programs/admissions/franchises | Institutions and Intake; E/C; real applications S |
| `data/mockBoards.js` | RESULT_TYPES, MOCK_BOARDS school/university/institute configurations with field schemas, defaults/validation/options, DEMO_PRESETS | ResultIssuer with versioned approved field configuration; Exam | results/config + issuers | Results admin; E/C under bounded schema; no executable validation from DB |
| `data/mockResults.js` | mockResults marks, parents, DOB, official-sounding verification, issue dates, QR strings; mockMyResultsHistory | trusted ResultRecord + ResultHistory linked to Exam/source | exact result lookup/history | Results import/review/publication; record values from authorized issuer S, not arbitrary CMS copy |
| `data/mockUser.js` | Rohan Sharma, mock ID/contact/avatar, coins 450, streak 14, completed 38, read 9 and target exam; Math.random credentials | User profile; metrics derived from progress/activity or hide unsupported metrics after approval | me/profile/summary | Accounts; profile S, account status C; no invented reward economy |
| `data/mockOrders.js` | fake paid/failed/pending orders, amounts, method/transaction and invoiceUrl '#' | immutable Order snapshots and PaymentAttempt | me/orders/detail/invoice | Commerce read/reconcile; S; admin cannot mark paid arbitrarily |
| `data/mockSubscriptions.js` | two subscriptions, next lecture, dates/days, progress and feature lists | Enrollment + CoursePlan + Lesson/Progress | me/enrollments | Enrollments; S; no automatic one-year renewal |
| `data/mockNotifications.js` | mockNotifications and mockAnnouncements, dates/time/icons/status/links/summary/tag | Notification + NotificationReceipt; announcements as notification/content subtype | me/notifications, public/content announcements only if mounted | Notifications; E target/publication, read state S |

## Inline content and configuration

| File / component | Value or structure to replace | Destination/API | Admin / classification |
|---|---|---|---|
| `components/dashboard/HeroBannerCarousel.jsx` | four banner objects with 2026 tags, headlines, subtitles, CTA copy/links, decorative content claims | Banner placements=home, PageContent; public/content/home | CMS banners; E; safe variant/icon keys, no stored JSX |
| `components/dashboard/ServicesSection.jsx` | serviceCards, features, success headings/descriptions, labels and route CTA copy | PageContent home.sections/services; content/home | CMS home; E; vector illustrations stay code |
| `components/dashboard/HomeAboutSection.jsx` | about teaser and CTA text | PageContent home.about | CMS; E |
| `pages/about/AboutPage.jsx` | six facultyMembers, founder portrait/name/awards, mission/vision/values, registration/accreditation claims, 50,000+ students | FacultyProfile and PageContent about; media IDs | Faculty + About CMS; E, claims need owner verification |
| `pages/categories/CategoriesPage.jsx`, `components/layout/CategorySheet.jsx` | domain titles/descriptions/tags/badges, year labels; duplicated category content | PageContent categories and navigation configuration | CMS navigation; E; route registry stays code |
| `components/layout/UserLayout.jsx` | footer board/coaching links, brand description, copyright/business text and helpline | SiteSettings publicProjection/footer/navigation | Platform settings; E/C |
| `components/layout/SideDrawer.jsx` | menu display labels, static support email/phone/help text | SiteSettings support/navigation | Platform settings; E/C; visibility from permissions S |
| `components/layout/AppHeader.jsx`, `BottomNavigation.jsx` | business labels/branding and static notification dot; search copy promises courses but routes books | site settings + current unread count | settings E; unread S; search behavior code/decision |
| `components/coaching/CollegePromoCarousel.jsx` | BANNERS with college names, websites, images and admissions-open-2026 tags | Banner placement=my-courses linked to College | CMS promotions; E/C with safe URL validation |
| `pages/results/ResultsPage.jsx` | two banner src/to references | Banner placement=results-top/results-bottom | CMS banners; E; preserve default local assets until migrated |
| `pages/institutes/InstitutesListingPage.jsx` | five hardcoded universityOptions | University list API | Institutions; E; no duplicated root options |
| `pages/college/CollegesListingPage.jsx` | category names and state/district map | taxonomy/location facets | Taxonomy; E; filters include only approved taxonomy/data |
| `pages/coaching/CoachingHomePage.jsx`, `services/coachingService.js:getCategories` | class 8-12 choices and board/foundation/senior category objects | Taxonomy + course facets | Taxonomy; E/C |
| `pages/coaching/CourseSelectorPage.jsx` | boardsByState (four states), program options, languages, banner and fixed target course, stored selection | Taxonomy associations, Banner; user preference | Taxonomy/CMS E; preferences S; custom input never auto-publishes taxonomy |
| `pages/coaching/CourseDetailsPage.jsx` | fallback 12/6/3-month plans, 1499/899/499 prices, original prices, discounts and exam-specific benefits | CoursePlan explicit durationDays/priceMinor/features | Plans; C; course-specific plan data shared with subscribe page |
| `pages/coaching/CourseSubscribePage.jsx` | independent annual/semester/quarterly plans (course price/699/399), hardcoded Rohan prefill | CoursePlan and session user | Plans C; identity S; no fallback public price for missing plan |
| `components/auth/StudyRegistrationForm.jsx` | available courses/states, fee 299, mock transaction and fallback credentials/application ID | Taxonomy, SiteSettings.registrationFees, RegistrationApplication and server auth | Intake/settings; E/C/S respectively |
| `components/auth/TuitionCoachingForm.jsx` | states/boards/classes, fee 499, default locations, independent credentials | same typed application source; User | Intake/settings C; no synthesized successful identity |
| `components/auth/TeacherProfessorForm.jsx` | languages/courses/experience/title options, verification fee 199, generated faculty ID | Taxonomy/settings + faculty RegistrationApplication | Faculty intake C/S; application ID is system-generated |
| `components/auth/CollegeFranchiseForm.jsx` | program/type/designation/state options, preset programs, year upper bound 2026, declaration and approval promises | Taxonomy + versioned declaration content; runtime current year validation | Franchises/settings E/C; required security checks stay code |
| `components/college/AdmissionApplicationModal.jsx` | qualification options, profile defaults and result text | Taxonomy/real user + AdmissionApplication | Admissions E/C; applicant input S |
| `pages/auth/LoginPage.jsx`, `RegisterSuccessPage.jsx`, `ForgotPasswordPage.jsx` | demo ID/password, fabricated fallback credentials, default OTP 123456 | no production defaults; auth challenge + activation response | server-controlled S; credentials never admin-editable CMS |
| `pages/coaching/CourseRegistrationPage.jsx` | default board/class/state/city/gender; generated credentials | taxonomy defaults + actual auth response | Settings C / S; default choices must not create purchased access |
| `pages/books/PdfReaderPage.jsx` | mock student fallback, fallback page/chapter list, resource/geography and generic maths content, evenly approximated TOC pages | Book media and actual TOC offsets; authenticated user | Books E; progress S; reader shell in code |
| `components/coaching/OnlineBookViewer.jsx` | `getPageContent` generated paragraphs for any page, footer 'Verified' claim | real Book/PDF bytes with page metadata | Books; E; provenance-controlled labels |
| `components/results/ResultMarksheet.jsx` | replacement candidate names/photos, fallback school IDs/verification/signature/QR labels | only actual ResultRecord and authorized issuer branding | Results; S; never manufacture identity or signature |
| `pages/profile/ProfilePage.jsx`, `SettingsPage.jsx` | local editable board/class options, default toggles, hardcoded version/support policy prose | Taxonomy + User.preferences + public settings | Accounts/settings C/S; app version remains build constant |
| `pages/library/MyLibraryPage.jsx` (unmounted) | mockTests, fake 63% progress, first-course fallback | no active migration until Q08; canonical progress if later activated | no test admin assumed |
| `pages/auth/OnboardingPage.jsx`, `SplashScreen.jsx` (unmounted) | slide/features copy, marketing claims | CMS only if later activated | currently no public requirement |
| `components/dashboard/HeroGreeting.jsx`, `QuickAccessGrid.jsx`, `FeaturedSection.jsx` (unmounted home sections) | welcome/continue card, quick items/pills, first-three selection, fallback images | real identity/progress, CMS placements, explicit featured order | CMS only for confirmed mounted placements; no restoration implied |
| `frontend/index.html` | title/brand/font/favicon references | public brand defaults; runtime document title from CMS where appropriate | Settings E for business branding; font loader stays implementation |

## Service-level fake behavior and admin defaults

`authService.js`: default registered user, plaintext browser registry, last credentials, fake token, device/session simulation, synthesized avatar/coins and fake reset/change responses must be removed. `AuthContext.jsx` must stop injecting a user. `LibraryContext.jsx` seeded book IDs, progress, bookmarks, subscribed IDs, completed lectures and wishlist become per-user queries/mutations. Current browser keys are not scoped by user, risking cross-account contamination.

`bookService.js` automatically merges seed books back into storage, forces standard classes/subjects even without matching content, fabricates purchase receipts and sample pages, defaults ratings/counts/discounts on new books and allows reset-to-default. Replace with database queries, actual facets, verified orders and publication validation. Its detail lookup must reject drafts for public callers.

`coachingService.js` inherits seeded enrollments at registration, allows direct join, infers duration from plan-name substring, renews for 999 and changes shared course expiry; use canonical registration, plan ID and server-owned Enrollment. `collegeService.js` infers university affiliation from names/state and substitutes course counts (including 3); use verified references and true aggregate counts. The college data store also assigns parents heuristically. `resultService.js` synthetic names/marks/dates/verification, partial roll matching and fallback generation must never survive in production. Order/subscription/notification services mutate imported arrays, so behavior is inconsistent across reloads and devices.

`admin/services/adminService.js`: generated IDs, default Unsplash logos/status, client-selected author labels and local aggregation are temporary. Account/session actor comes from server; no backend note API trusts `author`. Existing admin pages have preset university/college logos, location/fees/eligibility/seats, book price 199/original 299, discount 33%, and code-level color/icon presets. Blank form defaults may be configured if business-owned; keep safe color/icon enum implementations in code. AdminBooksPage's '16 mock books' reset label is stale relative to the 26 literal book records; remove production factory reset rather than rebuilding it as business functionality.

## Migration policy and editable boundaries

1. Inventory all content in this document and source-evidence appendix; assign an owner and publication approval. Legal/accreditation/official-result claims require real evidence.
2. Map old string IDs to canonical ObjectIds and stable public identifiers. Keep an explicit migration manifest for college/coaching/book links, samples and media ownership.
3. Import approved catalogue/CMS data only; never import demo users/passwords, payment records, marksheets, earned metrics or entitlements as production truth.
4. Import licensed media through the storage service, not as hardcoded filesystem paths. Store asset IDs, allowlisted display variant and real metadata.
5. Public APIs read published projections; admin APIs manage draft/revisioned content; mutations invalidate matching queries. Never repopulate deleted content from frontend mocks.
6. Keep route IDs, icon components, layout templates, Tailwind classes, animation timing, role enforcement, password/upload limits and payment verification logic in code. Admin business configuration cannot weaken minimum security controls.

CMS coverage includes headings/descriptions, founder/faculty, banners, service/category cards, public branding/contact/footer and business defaults. Images from external hosts require ownership review/import or a documented trusted-URL policy. Static error labels and generic button text do not need a database row unless localization is separately approved.

## Named static-data source anchors

Automated locators complement the classified inventory above. They intentionally name structures, not secret values. Technical style/icon maps and UI step constants in this ledger remain code; only their business data belongs in managed content. State initialized from a literal and anonymous inline JSX content is covered by the page/component inventory, not falsely counted as a named catalogue.

| Source file | Named literal structures (source line) |
|---|---|
| `frontend/src/modules/admin/components/layout/AdminLayout.jsx` | `navItems` L21 |
| `frontend/src/modules/admin/pages/AdminApplicationsPage.jsx` | `statusColors` L114, `statuses` L122 |
| `frontend/src/modules/admin/pages/AdminBooksPage.jsx` | `COLOR_PRESETS` L23, `ICON_PRESETS` L32, `initialFormState` L51 |
| `frontend/src/modules/admin/pages/AdminCollegeCoursesPage.jsx` | `initialForm` L31 |
| `frontend/src/modules/admin/pages/AdminCollegesPage.jsx` | `INDIAN_STATES` L22, `initialForm` L50, `payload` L188 |
| `frontend/src/modules/admin/pages/AdminDashboardPage.jsx` | `statCards` L50 |
| `frontend/src/modules/admin/pages/AdminUniversitiesPage.jsx` | `initialForm` L36 |
| `frontend/src/modules/admin/services/adminService.js` | `adminService` L45, `applicationStatusCounts` L62, `franchiseStatusCounts` L75, `newUni` L143, `updated` L166, `newCollege` L269, `updated` L293, `newCourse` L359, `updated` L381 |
| `frontend/src/modules/user/components/auth/CollegeFranchiseForm.jsx` | `INDIAN_STATES` L39, `INSTITUTION_TYPES` L48, `DESIGNATIONS` L57, `DEFAULT_PROGRAM_OPTIONS` L67, `STEPS` L80, `next` L206, `newErrors` L313, `payload` L419, `next` L999, `next` L1104, `next` L2000 |
| `frontend/src/modules/user/components/auth/StudyRegistrationForm.jsx` | `INDIAN_STATES` L35, `AVAILABLE_COURSES` L44, `STEP_DEFINITIONS` L61, `errs` L191, `userCredentials` L279 |
| `frontend/src/modules/user/components/auth/TeacherProfessorForm.jsx` | `STUDY_LANGUAGES` L33, `COACHING_COURSES` L41, `EXPERIENCE_YEARS` L53, `STEP_DEFINITIONS` L61, `errs` L202 |
| `frontend/src/modules/user/components/auth/TuitionCoachingForm.jsx` | `INDIAN_STATES` L34, `BOARDS` L43, `CLASSES` L52, `STEP_DEFINITIONS` L60, `errs` L158, `creds` L237 |
| `frontend/src/modules/user/components/books/BookCard.jsx` | `iconMap` L7 |
| `frontend/src/modules/user/components/coaching/CoachingSidebar.jsx` | `tabs` L20 |
| `frontend/src/modules/user/components/coaching/CollegePromoCarousel.jsx` | `BANNERS` L11 |
| `frontend/src/modules/user/components/coaching/ProtectedVideoPlayer.jsx` | `positions` L120, `rates` L203 |
| `frontend/src/modules/user/components/college/AdmissionApplicationModal.jsx` | `QUALIFICATION_OPTIONS` L23, `payload` L228 |
| `frontend/src/modules/user/components/common/PrimaryButton.jsx` | `variants` L19, `sizes` L25, `sizes` L64 |
| `frontend/src/modules/user/components/common/SectionHeader.jsx` | `sizeMap` L55, `colorMap` L131 |
| `frontend/src/modules/user/components/dashboard/HeroBannerCarousel.jsx` | `banners` L22 |
| `frontend/src/modules/user/components/dashboard/QuickAccessGrid.jsx` | `items` L7, `quickPills` L54 |
| `frontend/src/modules/user/components/dashboard/ServicesSection.jsx` | `serviceCards` L162, `features` L225 |
| `frontend/src/modules/user/components/layout/AppHeader.jsx` | `navLinks` L11 |
| `frontend/src/modules/user/components/layout/BottomNavigation.jsx` | `navItems` L9 |
| `frontend/src/modules/user/components/layout/CategorySheet.jsx` | `categories` L26 |
| `frontend/src/modules/user/components/layout/SideDrawer.jsx` | `menuItems` L35 |
| `frontend/src/modules/user/components/results/BoardSelector.jsx` | `titleByType` L15 |
| `frontend/src/modules/user/components/results/ResultMarksheet.jsx` | `names` L32 |
| `frontend/src/modules/user/components/results/ResultSearchForm.jsx` | `initial` L26, `next` L50, `next` L92, `newErrors` L104 |
| `frontend/src/modules/user/components/results/ResultTypeSelector.jsx` | `options` L9 |
| `frontend/src/modules/user/data/mockBoards.js` | `RESULT_TYPES` L6, `MOCK_BOARDS` L33, `DEMO_PRESETS` L795 |
| `frontend/src/modules/user/data/mockBooks.js` | `mockBoards` L1, `mockClasses` L8, `mockSubjects` L10, `mockBooks` L21 |
| `frontend/src/modules/user/data/mockCoachingData.js` | `INITIAL_COACHING_COURSES` L4, `DEGREE_PROGRAMS` L657, `INITIAL_STUDENT_PROFILE` L701, `initial` L778 |
| `frontend/src/modules/user/data/mockColleges.js` | `STATE_DISTRICT_MAP` L4, `INITIAL_UNIVERSITIES` L13, `INITIAL_COLLEGES` L66, `INITIAL_COURSES` L493, `INITIAL_APPLICATIONS` L1095, `INITIAL_FRANCHISE_REGISTRATIONS` L1126, `initial` L1296 |
| `frontend/src/modules/user/data/mockCourses.js` | `mockCourseCategories` L1, `mockCourses` L8 |
| `frontend/src/modules/user/data/mockNotifications.js` | `mockNotifications` L1, `mockAnnouncements` L59 |
| `frontend/src/modules/user/data/mockOrders.js` | `mockOrders` L1 |
| `frontend/src/modules/user/data/mockResults.js` | `mockResults` L7, `mockMyResultsHistory` L401 |
| `frontend/src/modules/user/data/mockSubscriptions.js` | `mockSubscriptions` L1 |
| `frontend/src/modules/user/data/mockUser.js` | `mockStudentUser` L1 |
| `frontend/src/modules/user/pages/about/AboutPage.jsx` | `facultyMembers` L24 |
| `frontend/src/modules/user/pages/auth/OnboardingPage.jsx` | `slides` L10 |
| `frontend/src/modules/user/pages/auth/RegisterPage.jsx` | `registrationOptions` L38 |
| `frontend/src/modules/user/pages/auth/SplashScreen.jsx` | `features` L9 |
| `frontend/src/modules/user/pages/books/BookDetailsPage.jsx` | `iconMap` L29 |
| `frontend/src/modules/user/pages/books/BooksHomePage.jsx` | `parts` L168 |
| `frontend/src/modules/user/pages/books/MyPurchasedBooksPage.jsx` | `coverIconMap` L17 |
| `frontend/src/modules/user/pages/categories/CategoriesPage.jsx` | `filterTabs` L19, `categoryTabs` L29 |
| `frontend/src/modules/user/pages/coaching/CourseDetailsPage.jsx` | `defaultPlans` L77 |
| `frontend/src/modules/user/pages/coaching/CourseRegistrationPage.jsx` | `errs` L49 |
| `frontend/src/modules/user/pages/coaching/CourseSelectorPage.jsx` | `boardsByState` L84, `hasChoice` L131 |
| `frontend/src/modules/user/pages/coaching/CourseSubscribePage.jsx` | `plans` L52 |
| `frontend/src/modules/user/pages/college/CollegesListingPage.jsx` | `categories` L40, `states` L41 |
| `frontend/src/modules/user/pages/institutes/InstitutesListingPage.jsx` | `universityOptions` L42, `states` L51 |
| `frontend/src/modules/user/pages/library/MyLibraryPage.jsx` | `mockTests` L59 |
| `frontend/src/modules/user/pages/notifications/NotificationsPage.jsx` | `iconMap` L17 |
| `frontend/src/modules/user/services/authService.js` | `defaultRegisteredUsers` L12, `authService` L52, `sessionData` L118, `studentUser` L143, `creds` L148, `newUser` L229, `updated` L298 |
| `frontend/src/modules/user/services/bookService.js` | `bookService` L47, `result` L199, `newBook` L313, `updated` L360 |
| `frontend/src/modules/user/services/coachingService.js` | `coachingService` L40, `list` L54, `names` L134, `newStudent` L230 |
| `frontend/src/modules/user/services/collegeService.js` | `collegeService` L5, `newApp` L251, `newFranchise` L330 |
| `frontend/src/modules/user/services/notificationService.js` | `notificationService` L5 |
| `frontend/src/modules/user/services/orderService.js` | `orderService` L5, `newOrder` L20 |
| `frontend/src/modules/user/services/razorpayService.js` | `RAZORPAY_CONFIG` L4, `options` L75 |
| `frontend/src/modules/user/services/resultService.js` | `INDIAN_STUDENT_NAMES` L20, `MOTHER_NAMES` L37, `FATHER_NAMES` L48, `resultService` L274 |
| `frontend/src/modules/user/services/subscriptionService.js` | `subscriptionService` L5 |
