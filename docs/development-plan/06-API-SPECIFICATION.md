# Proposed REST API specification

## Stage 3 implemented identity contracts

A01-A08 and B17 are implemented at their existing paths. A02 additionally accepts kind=student|admin, validated against server roles, using distinct HttpOnly host-only cookies. No session token is returned in JSON. DEVICE_CONFLICT is HTTP 409 with the standard error envelope plus data containing a two-minute single-use challengeId/proof/expiry. A05 now explicitly requires confirmed:true.

Q03 supersedes the original A09 password-setting/intake contract: **POST /auth/activate {challengeId,otp} verifies email only**, returns a safe user/message and creates no session, fee-completed application or paid entitlement. Account password is chosen before verification; staff password is chosen during invitation acceptance. Full paid/business registration A15-A19 remains deferred.

Minimal additions are extensions of A09/B17; no existing IDs are renumbered:

| Parent | Additional contract | Access / response |
|---|---|---|
| A09 | POST /auth/accounts {name,email,password} | public identity-only creation; 202 generic message/challengeId; student role only |
| A09 | POST /auth/email/resend {email} | public throttled/cooldown; 202 generic message/challengeId |
| A09 | POST /auth/invitations/accept {challengeId,token,newPassword} | single-use emailed invitation proof; returns email-OTP challenge, requires verification before login |
| B17 | DELETE /admin/users/invitations/:publicId {} | accounts.roles.manage; idempotently revoke pending staff invitation |

B17 accepts {name,email,permissions?}; only ordinary admin invitations, grants validated against code/actor grants. Reposting resends only an unactivated invitation after cooldown and invalidates its former token. No public staff signup or client-selected roles. B14-B16/B18 broader management is deferred rather than added unnecessarily.

All browser mutations, including login/recovery, require exact Origin plus signed CSRF cookie/header from A01; the Stage 2 shared client now integrates it. A06 identifier is registered email only and returns an eligibility-safe delivery-request acknowledgment, never a guarantee of delivery. A07 consumes OTP and changes password atomically, revokes prior session versions and requires login again. A08 also invalidates all sessions. Unknown payload fields, operator objects and mass-assignment fields are rejected. Reference the executable contracts and setup in [backend README](../../backend/README.md). Remaining API tables are proposals unless explicitly checked in document 13.



All paths below are relative to `/api/v1`; the implemented Stage 2/3 subset is identified above. This inventory is a concrete proposed contract, not a claim of implementation. Shared rules and resource-family expansions are normative for each endpoint, avoiding repeated boilerplate. Confirm unresolved business rules in 12 before implementing the affected endpoints. Feature IDs map to 02; model fields map to 05.

Confirmed payment provider: Razorpay, using Standard Checkout and backend-created orders for every applicable paid registration fee, book purchase, prepaid coaching pass and renewal. Preserve A54-A61/A57 and B01/B22-B24 below; the decision introduces no new endpoint or API ID. All payment development/integration tests use Razorpay Test Mode after mandatory rotation of the compromised test credential. Live payments require explicit approval. Recurring billing is not part of these contracts; fee values and tax/refund/invoice policies remain unresolved business decisions.

## Common protocol

Success JSON: `{data:object|array,meta?:{page,pageSize,total,totalPages},requestId:string}`. Errors: `{error:{code,message,fields?:[{path,message}]},requestId}`. IDs use `id:string`; dates ISO UTC, DOB calendar strings, amounts integer minor units with currency. Lists default page=1,pageSize=20,max=100; sorting allowlist per resource, stable secondary id. Empty lists succeed. Single read missing/unpublished returns 404; never fall back to another item. Collections do not silently return all records.

Common errors on every endpoint: 400 malformed JSON/ID/query, 422 invalid fields, 429 rate limit, 500 internal, 503 dependency. Authenticated endpoints also return 401/403; object ownership is checked independently of role. Mutations return 409 for revision/state/idempotency conflict. Uploads add 413/415. Creates 201, reads/updates 200, DELETE without body 204; public recovery acknowledgments 202. Writes use `expectedRevision` (or If-Match) for mutable admin definitions. For idempotent operation retries, same key and same payload return prior result; same key with changed payload returns 409.

Cookie sessions send credentials with requests. All browser writes need CSRF+Origin checks, except unauthenticated recovery/login with appropriate origin/rate controls and the separately signed webhook. `P` = public; `S` = authenticated self; `C` = short-lived capability restricted to one draft/application/order; permission names imply authenticated staff. DTO field allowlists always apply. Default every staff endpoint is denied unless permitted. Do not accept raw MongoDB operators, arbitrary populate/select/sort, arbitrary regex or caller userId on self endpoints.

Query `q` is trimmed and length-bounded, escaped for any simple regex; use indexed search later when needed. Validate price ranges and reset dependent filters. Start with indexed token/prefix search across required fields; a dedicated search service is not required. Book search covers title/subtitle/author/board/class/subject/TOC/keywords; coaching covers title/subtitle/description/teacher/subjects; institution search covers name/location/program. Never leak protected lesson/document URLs via search.

## Identity, user state and registration

| ID | Method / endpoint | Body or query; response data | Auth / permission | Models; consumer | Additional errors |
|---|---|---|---|---|---|
| A01 | GET `/auth/csrf` | no body; `{csrfToken}` bound to request/session bootstrap | P, no shared caching | Session/challenge context; shared client | unavailable session store |
| A02 | POST `/auth/login` | `{identifier,password,rememberMe,deviceLabel}`; `{user,session:{expiresAt}}` + secure cookie; no token in JSON | P; rate limit | User/Session; LoginPage/admin login (staff kind server-validated) | generic invalid credentials 401; DEVICE_CONFLICT 409 with safe device info/transfer challenge |
| A03 | GET `/auth/me` | no query; `{user,permissions,session,summary}` | S | User/Session/derived learning; AuthContext/header/admin | revoked/session-pointer mismatch 401 |
| A04 | POST `/auth/logout` | `{}`; 204 + expired cookie; idempotent | S or already expired | Session; logout modals | stale logout safe |
| A05 | POST `/auth/session/transfer` | `{challengeId,proof}` from recent credential verification; current device label; new cookie/session | S or credential-validated transfer C | User/Session/AuthChallenge; conflict modal/Settings | stale/consumed proof 409, invalid proof 401 |
| A06 | POST `/auth/password/forgot` | `{identifier}`; `{message,challengeId}` generic whether account exists | P | AuthChallenge/Job; ForgotPasswordPage | delivery faults logged, do not enumerate users |
| A07 | POST `/auth/password/reset` | `{challengeId,otp,newPassword}`; `{message}`; revoke sessions | C | User/AuthChallenge/Session; ResetPasswordPage | expired/invalid/used challenge |
| A08 | POST `/auth/password/change` | `{currentPassword,newPassword}`; `{message}`; rotate/revoke per policy | S | User/Session; Profile password modal | wrong password 401 |
| A09 | POST `/auth/activate` | `{challengeId,otp}`; safe `{user,message}`, no session/paid access | C | User/embedded AuthChallenge | expired/consumed/invalid proof |
| A10 | PATCH `/me/profile` | allowed `{name,phone,avatarId,profile}`; email change requires separate challenge; `{user}` | S | User/MediaAsset; ProfilePage/StudentProfile | duplicate normalized contact 409 |
| A11 | POST `/me/email-change` | `{newEmail,currentPassword}`; generic challenge acknowledgment | S | User/AuthChallenge/Job; profile email field integration | invalid reauth/duplicate identity |
| A12 | POST `/me/email-change/confirm` | `{challengeId,otp}`; `{user}` | S+C | User/AuthChallenge; edit profile completion | consumed/expired proof |
| A13 | GET `/me/preferences` | `{notification,courseSelector}` | S | User; Settings/CourseSelector | none beyond common |
| A14 | PATCH `/me/preferences` | typed notification flags/courseSelector taxonomy IDs; preferences | S | User; Settings/CourseSelector | invalid dependency 422 |
| A15 | GET `/public/registration-config` | no private values; fees by intake/currency, options, declaration version, required docs | P | Taxonomy/SiteSettings; RegisterPage and four forms | missing approved fee/config 503 |
| A16 | POST `/registration-applications` | `{kind,applicant,academic?,addresses?,experience?,declaration?}`; `{id,reference,draftCapability,requiredDocuments,feeQuote}`; capability returned once | P with abuse limits / S | RegistrationApplication; Study/Tuition/Teacher/CoachingRegistration | duplicate retry key replay; invalid kind |
| A17 | PATCH `/registration-applications/:id` | allowlisted draft fields + asset IDs + expectedRevision; safe draft | C or owner S | Application/MediaAsset; registration steps | finalized/foreign asset 409/403 |
| A18 | POST `/registration-applications/:id/submit` | `{expectedRevision,declaration:{version,accepted:true}}`; `{reference,status,orderRequired}` | C or owner S | Application/media/config; four-step/five-step submit | missing documents/invalid full form 422; stale fee quote 409 |
| A19 | GET `/registration-applications/:id/status` | reference/status/payment/activation summary only | C or owner S | Application/Order; success/reload/recovery UI | wrong owner 404 |
| A20 | GET `/taxonomies` | `kind,parentId?,q?,status` public active only; list/facets | P | Taxonomy; all selects | invalid kind/parent |
| A21 | GET `/institutions/facets` | `view=colleges\|institutes,universityId?,stateId?`; categories/universities/states/districts/program levels | P | College/University/Programs/Taxonomy; both listings | inactive parent 404 |

Registration endpoints cover the existing separate coaching registration path as `kind=coaching-profile`; whether it is free and whether existing students only update a profile is Q02. Faculty applications use staff review, not immediate privileged account creation. Password setting/activation replaces stored plaintext credentials and requires Q03 approval. Email-change flow is a security dependency of the existing editable email field, not a new marketing feature.

## Institutions and public intake

| ID | Method / endpoint | Body/query; response | Auth / permission | Models; consumer | Additional errors |
|---|---|---|---|---|---|
| A22 | GET `/universities` | `q?,page?,pageSize?`; active university summaries | P | University; franchise and institute university selects | common |
| A23 | GET `/universities/:id/colleges` | `q?`; active child colleges with paging | P | University/College; franchise dropdown | inactive/missing parent 404 |
| A24 | GET `/colleges` | `q?,category?,universityId?,stateId?,district?,degree?,view=colleges\|institutes,page,sort=name\|newest`; published list/counts | P | University/College/CollegeProgram; CollegesListingPage/InstitutesListingPage, optional existing reusable sections | common |
| A25 | GET `/colleges/:id` | `{college,programSummary}` without internal evidence | P | College/University; CollegeDetailsModal/AdmissionApplicationModal | inactive 404 |
| A26 | GET `/colleges/:id/programs` | `degree?,page,sort=name`; active program list; admission selector keeps open entries | P | CollegeProgram/College; admission picker | closed definitions excluded from new admission |
| A27 | POST `/admission-applications` | `{collegeId,programId,studentDetails,idempotencyKey}`; `{reference,status}` | S verified; Q04 owner-confirmed | AdmissionApplication/User/CollegeProgram; AdmissionApplicationModal | parent mismatch/closed admission 422; duplicate retry replay |
| A28 | POST `/franchise-applications` | draft institution/contact/location/parent/program fields and idempotencyKey; `{id,reference,revision,draftCapability,expiresAt}` | P with abuse limits | FranchiseApplication; CollegeFranchiseForm | invalid hierarchy 422 |
| A29 | PATCH `/franchise-applications/:id` | draft form, pendingDocuments metadata and expectedRevision; safe draft (uploads deferred) | C / owner S | FranchiseApplication/MediaAsset | finalized 409 |
| A30 | POST `/franchise-applications/:id/submit` | persisted validated draft, declaration and expectedRevision; `{reference,status:pending}` | C / owner S | FranchiseApplication/parents/assets | full-form validation, pending selected files, inactive parent |
| A31 | GET `/franchise-applications/:id/status` | safe status/reference/rejection summary | C / owner S | FranchiseApplication; confirmation recovery | wrong capability 404 |

No seat reservation/payment for a college enquiry is implied. No public endpoint exposes admin notes. Institute visibility uses explicit verified relationships and Q06, not state/name guesses.

## Books, coaching and personal learning

| ID | Method / endpoint | Body/query; response | Auth / permission | Models; consumer | Additional errors |
|---|---|---|---|---|---|
| A32 | GET `/books` | `q,boardId,classId,subjectId,languageId,type=all/free/paid,minPriceMinor,maxPriceMinor,sort=featured/price_asc/price_desc/rating/newest,page,pageSize`; published books | P | Book/Taxonomy; BooksHomePage | inverted range 422 |
| A33 | GET `/books/facets` | selected board/class/language; available boards/classes/subjects/languages, count | P | Book/Taxonomy; HierarchyDropdowns/BookFilterModal | common |
| A34 | GET `/books/:id` | published metadata, calculated price/discount/rating source, TOC, permitted preview IDs; no full media key | P | Book/MediaAsset; BookDetailsPage/checkout | draft/archived 404 |
| A35 | GET `/books/:id/preview` | approved public sample-page metadata or URLs; bounded subset | P | Book/MediaAsset; BookPreviewModal | no samples -> empty list; never entire paid PDF |
| A36 | GET `/me/books` | paged entitlements with progress | S | BookEntitlement/Book/LearningProgress; MyPurchasedBooksPage/LibraryContext | revoked entries filtered |
| A37 | GET `/me/books/:id/state` | `{wishlisted,currentPage,bookmarks,progress,canRead}` | S | LearningProgress/Book/entitlements; reader/detail/cards | unavailable 404 |
| A38 | PUT `/me/books/:id/wishlist` | `{}`; `{wishlisted:true}` | S | LearningProgress/Book; detail/cards | draft 404 |
| A39 | DELETE `/me/books/:id/wishlist` | none; 204 | S | LearningProgress; detail/cards | idempotent |
| A40 | PUT `/me/books/:id/progress` | `{currentPage,expectedRevision}`; canonical progress/pageCount | S+canRead | LearningProgress/Book; both readers | page out of range 422, revision 409 |
| A41 | PUT `/me/books/:id/bookmarks/:page` | `{}`; bookmark set | S+canRead | LearningProgress/Book; reader toolbar | out-of-range 422 |
| A42 | DELETE `/me/books/:id/bookmarks/:page` | none; 204 | S+canRead | LearningProgress; both readers | idempotent |
| A43 | GET `/coaching/courses` | `q,categoryId,boardId,stateId,classId,subjectId,programId,languageId,page,sort=featured/newest/title`; published courses | P | CoachingCourse/Taxonomy; CoachingHome/selector | common |
| A44 | GET `/coaching/facets` | same selected taxonomy subset; valid dependent options | P | CoachingCourse/Taxonomy; CourseSelectorPage | no raw mock store reads |
| A45 | GET `/coaching/courses/:id` | metadata/faculty/benefits/summary, safe previews | P | CoachingCourse/FacultyProfile; CourseDetailsPage | unpublished 404 |
| A46 | GET `/coaching/courses/:id/plans` | active plans with explicit duration/amount | P | CoursePlan; both checkout variants | no active plan -> empty/unavailable purchase |
| A47 | POST `/coaching/courses/:id/enroll` | `{}` + idempotency key; free-course entitlement | S; free/policy eligible only | Enrollment/CoachingCourse; selector join | paid requires checkout 409; missing policy -> denied |
| A48 | GET `/me/enrollments` | `state=active/expired/all,page`; course and actual expiry/progress | S | Enrollment/Course/Progress; MyCoursesPage/aliases | common |
| A49 | GET `/me/enrollments/:courseId` | course access summary and current progress | S | Enrollment; dashboard/renewal | absent 404, expired state returned |
| A50 | GET `/coaching/courses/:id/syllabus` | subject/chapter/book/lesson DTO incl locks + current user state | S+entitlement; safe previews separately | Course/Lesson/Book/Progress; dashboard/legacy player | expired 403, relationship mismatch 404 |
| A51 | GET `/coaching/courses/:id/lessons/:lessonId` | allowed lesson metadata/resource descriptors | S+entitlement or published preview | Lesson/Course; LecturePlayerPage | missing/foreign/locked 404/403 |
| A52 | PUT `/me/lessons/:lessonId/progress` | `{status,positionSeconds?,expectedRevision}`; progress | S+entitlement | Lesson/Enrollment/LearningProgress; players completion/checkpoints | excessive position 422, revision 409 |
| A53 | GET `/coaching/courses/:id/books/:bookId` | linked Book descriptor/current state | S+entitlement | Course/Book/Progress; BookReaderPage | foreign/expired/locked 403/404 |

Book bytes and lesson streams use the media authorization endpoints below. No public catalogue JSON includes private provider URLs. Legacy `/player` maps syllabus subjects/chapters into its existing accordion structure without creating a second backend catalogue. Progress completion PUT sets a desired state; retries must not toggle it twice.

## Commerce, results, notifications and content

| ID | Method / endpoint | Body/query; response | Auth / permission | Models; consumer | Additional errors |
|---|---|---|---|---|---|
| A54 | POST `/orders` | `{product:{kind,id},applicationId?,idempotencyKey}`; order snapshot and allowed next step | S or application C | Order/Book/Plan/Application/settings; book/course/fee checkouts | invalid price/publication/ownership 409; no caller amounts |
| A55 | POST `/orders/:id/payment-attempts` | `{idempotencyKey}`; `{attemptId,providerOrderId,keyId,amountMinor,currency,merchant,prefill}` only after backend-created Razorpay order is durably bound; unresolved creation returns 202 pending without launchable Checkout | owner S/C | PaymentAttempt/Order; Standard Checkout launcher via razorpayService | wrong owner 404; existing attempt replay; uncertain provider outcome reconciled before creation retry |
| A56 | POST `/payments/razorpay/verify` | `{orderId,attemptId,razorpay_payment_id,razorpay_order_id,razorpay_signature}`; `{orderStatus,activationStatus}` after shared settlement or 202 pending capture/reconciliation | owner S/C | PaymentAttempt/Order/Enrollment/BookEntitlement/Application/Job | signature verified against stored provider order ID; captured status, ownership, order binding, amount/currency/mode required; duplicates return authoritative state |
| A57 | POST `/webhooks/razorpay` | raw bytes + provider signature + x-razorpay-event-id; 2xx only after durable verified event receipt or completed settlement | provider HMAC, no browser session | PaymentAttempt/Order/Job + entitlements; same settlement service as A56/B24 | invalid signature 400; DB/receipt failure retryable 5xx; duplicate acknowledged without repeated effect; never downgrade capture |
| A58 | GET `/orders/:id/status` | authoritative `{orderStatus,paymentStatus,activationStatus,updatedAt}`; safe failure/retry guidance and bounded polling, no promise based solely on callback | owner S/C | Order/PaymentAttempt/application fulfillment; pending/success modals | wrong owner 404; provider-paid but blocked activation is distinct from completed purchase |
| A59 | GET `/me/orders` | `status?,type?,page,sort=newest`; order summaries | S | Order; MyOrdersPage | common |
| A60 | GET `/me/orders/:id` | full owned order/items/provider-safe status | S+owner | Order/PaymentAttempt; detail modal | wrong owner 404 |
| A61 | GET `/me/orders/:id/invoice` | authorized PDF download/stream | S+owner+paid | Order/MediaAsset; invoice button | pending invoice 409, unpaid 403 |
| A62 | GET `/results/config` | types, published issuer summaries and approved UI copy | P | ResultIssuer/settings; ResultsPage | common |
| A63 | GET `/results/issuers/:id` | type/fullName/field schema/published exams | P | ResultIssuer/Exam; BoardSelector/ResultSearchForm | inactive 404 |
| A64 | POST `/results/lookup` | `{issuerId,examId,rollNumber,verificationFields:{...}}`; authorized ResultRecord DTO | S + verification by default; final public policy Q07 | Issuer/Exam/ResultRecord/History; ResultsPage | exact no-match 404, wrong verification generic no-match, unauthorized 403 |
| A65 | GET `/me/results` | paged authorized history summaries | S | ResultHistory/ResultRecord; dormant history if approved | withdrawn records unavailable |
| A66 | GET `/me/notifications` | `read?,page`; targeted notices + unreadCount | S | Notification/Receipt; page/header | common |
| A67 | PUT `/me/notifications/:id/read` | `{}`; receipt | S+audience | Receipt/Notification; item click | untargeted 404 |
| A68 | POST `/me/notifications/read-all` | `{through:ISO date}`; `{updatedCount,unreadCount}` | S | Receipt/Notification; mark all | bounded cutoff prevents racing new arrivals |
| A69 | GET `/public/content/:key` | allowlisted home/about/categories/navigation; published sections/faculty projection/placements | P | PageContent/FacultyProfile/Banner; marketing/category components | unknown key 404 |
| A70 | GET `/public/banners` | `placement`; active scheduled ordered banners | P | Banner/College/media; carousels/result ads | common |
| A71 | GET `/public/settings` | brand/support/footer/public feature switches only | P | SiteSettings; UserLayout/SideDrawer | no secrets |

Course renewals use A54 with the selected course plan; verification extends the enrollment. There is no free 'renew' mutation. Marksheet print/PDF remains client-side formatting, so no redundant PDF-creation API is needed. Official verification QR/signatures are blocked pending issuer support Q07. Payments follow [Razorpay server verification guidance](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/); the private secret remains server-side and a browser callback alone never grants access.

### Payment contract invariants and recovery

A54 resolves current approved pricing from Book, CoursePlan or registration fee settings; it accepts product identifiers, not payable amounts, payment-success flags or entitlement IDs from the frontend. Store the approved quote snapshot and its revision. The same owner-scoped idempotency key and canonical input return the existing Order; changed input under that key returns 409. A55 serializes creation for that Order/creation key, persists provider-order correlation, and returns only launchable backend-created order information. Do not assume Razorpay automatically deduplicates an uncertain create call: an external timeout enters reconciliation, not blind re-creation.

A56 first checks the caller owns the internal Order/attempt and the supplied provider IDs match the stored binding. Signature validity alone is insufficient: adapter-fetched payment/order evidence must prove capture and exact immutable amount/currency, payment-to-order relation and Test/Live environment. Signed A57 events use the same validation/settlement path; retain durable event processing state keyed by mode/event ID and conditionally apply each source order once. Neither callback replay, webhook retry nor B24 can grant/renew twice. Duplicate captures become operational exceptions. A58 is the frontend's truth after success, dismissal, reload or network loss.

| Failure or retry | Required contract behavior |
|---|---|
| Checkout cancelled/dismissed or provider attempt failed | no access grant; show retry/cancelled attempt state; dismissal alone does not prove final financial failure or suppress a later verified capture |
| Authorized / pending capture | return pending; no activation; reconcile provider status, with no assumed capture policy or auto-capture side effect |
| Delayed webhook / lost callback / browser interruption | bounded status polling, persisted order recovery and scheduled reconciliation; no second charge merely because UI timed out |
| Duplicate callbacks or webhook retries | return/acknowledge existing state using payment/order and event keys; same atomic fulfillment check |
| Out-of-order events | record history but do not regress captured/fulfilled state on stale failure/authorization |
| Temporary MongoDB failure | rollback partial settlement; webhook accepts only durable receipt, otherwise 5xx; scheduled unresolved-order scan recovers after restoration |
| Unknown provider-order creation outcome | keep creation correlation/lease state and investigate/reconcile before another create call; no launchable Checkout until binding is persisted |

No duplicate capture/renewal/payment-history endpoint is required. Admin history is part of B23; summaries are B01; prices remain G05/G08/B36. Refund execution, tax rules, invoice compliance and recurring mandates need separately approved policies rather than being invented here. See [Razorpay webhook guidance](https://razorpay.com/docs/webhooks/best-practices/) for asynchronous duplicate/out-of-order delivery semantics.

## Media and server operations

| ID | Method / endpoint | Body/query; response | Auth / permission | Models; consumer | Additional errors |
|---|---|---|---|---|---|
| A72 | POST `/media` | multipart `{file,purpose,draftKind?,draftId?}`; `{assetId,status,safeMetadata}` | media.write staff or draft C restricted purpose; S only allowed profile purposes | MediaAsset + LocalStorageProvider; all upload forms/admin | signature/MIME mismatch, 413/415, quota 429, volume 503 |
| A73 | GET `/media/:id/content` | Range allowed for private PDF/video; optional approved course context; bytes, 200/206 | canReadAsset policy: public ready asset or current entitled/owner/reviewer | Asset/Book/Lesson/Entitlements/Application; both readers/video/document reviewer | invalid range 416; private no-store; revoked/expired 403 |
| A74 | GET `/media/:id/metadata` | safe MIME/bytes/dimensions/pages/status, never local path | owner C/S or media.read staff | MediaAsset; uploader/preview | foreign 404 |
| A75 | DELETE `/media/:id` | staged/unreferenced only, 204 | owner C/S for own staged asset or media.write | MediaAsset/Job; remove attachment/media manager | attached reference 409 |
| A76 | GET `/health/live` | `{status}` | operational public minimal | process; infrastructure | 503 if unavailable |
| A77 | GET `/health/ready` | `{status}` no secret detail | infrastructure/rate-limited | DB/storage readiness; load balancer | 503 if not ready |

No `express.static` over private uploads. Public assets may have a distinct immutable public URL; A73 must independently enforce entitlement for private bytes even if the UI fetched metadata earlier. See 09 for range/provider contract and migration.

## Admin catalogue endpoint families

Each resource row below expands into **GET collection** (q, status, paging, allowlisted sorting plus listed filters), **GET /:id**, **POST collection**, **PATCH /:id**, **DELETE /:id** (archive, dependency checked). POST/PATCH body is that model's allowlisted editable fields from 05, references and expectedRevision; never `_id`, creator identity, timestamps, derived counts or permission grants. GET returns admin-safe resource DTO or paginated list; create/update returns resource; archive returns 204. Default success/errors above apply individually. All routes start `/admin/` and require a server session plus the named read/write permission. Staff lacking write may view only. DELETE archive is not physical deletion.

| Family ID | Resource path | Filters and write payload specialization | Read / write permissions | Models / consumers |
|---|---|---|---|---|
| G01 | `/admin/universities` | name,shortName,logo URL,status (asset lifecycle deferred) | institutions.read / institutions.write | University; AdminUniversitiesPage; College/Franchise selectors refresh |
| G02 | `/admin/colleges` | universityId,stateId,district,category; full public fields/contact/verification evidence | institutions.read / institutions.write | College; AdminCollegesPage; public listings |
| G03 | `/admin/colleges/:collegeId/programs` | degree/admissionStatus; fields name,degreeType,duration,eligibility,feeMinor,availableSeats,status | institutions.read / institutions.write | CollegeProgram/College; AdminCollegeCoursesPage |
| G04 | `/admin/taxonomies` | kind,parentId; key,label,parents,sortOrder,status | content.read / content.write | Taxonomy; new taxonomy screens, all user filters |
| G05 | `/admin/books` | boardId,classId,subjectId,type; fields metadata/prices/TOC/cover/document/preview IDs | learning.read / learning.write | Book; AdminBooksPage upgraded uploads |
| G06 | `/admin/coaching/courses` | taxonomy refs; metadata,faculty refs,syllabus,bookLinks | learning.read / learning.write | CoachingCourse; new course editor |
| G07 | `/admin/coaching/courses/:courseId/lessons` | subjectKey,chapterKey; lesson metadata/resource refs/order/preview flag | learning.read / learning.write | Lesson; syllabus editor |
| G08 | `/admin/coaching/courses/:courseId/plans` | status; priceMinor,durationDays,benefits/popular/order | commerce.read / commerce.plans.write | CoursePlan; plans editor |
| G09 | `/admin/content/pages` | key; bounded sections and published draft handling | content.read / content.write | PageContent; CMS |
| G10 | `/admin/content/banners` | placement,schedule; copy,media,link,variant,order | content.read / content.write | Banner; promotions editor |
| G11 | `/admin/content/faculty` | trackTags; display fields/photo/evidence/source | content.read / content.write | FacultyProfile; about/coaching faculty |
| G12 | `/admin/result-issuers` | type,status; source approval and bounded field schema | results.read / results.manage | ResultIssuer; results configuration |
| G13 | `/admin/exams` | issuerId,year; title/session/level/course/semester/status | results.read / results.manage | Exam; result ingestion |
| G14 | `/admin/notifications` | category,status; copy/link/typed audience/schedule | notifications.read / notifications.write | Notification; announcements composer |

Families are 14 x 5 = 70 concrete method/path operations. UI status toggles use explicit `PATCH {status,expectedRevision}`; no nondeterministic 'toggle' endpoint. Publishing endpoints below enforce stronger checks. A generic create/PATCH cannot bypass them: transition to published/active requires the corresponding publish permission and exactly the same validation service. Book/course/page/notification publication uses B31-B34; other publication transitions require content.publish or results.publish in addition to resource write. Generic archive of ResultIssuer/Exam with published records is rejected until withdraw/archive dependencies are resolved. Program IDs must belong to the parent in the URL.

## Admin special operations

| ID | Method / endpoint | Query/body; response | Permission | Models; admin consumer / validation |
| B01 | GET `/admin/dashboard` | date range?,paymentMode?; verified captured-payment totals grouped by currency/mode and payment-status counts with asOf timestamp; no invented net revenue/tax totals | dashboard.read | aggregates from verified Order/PaymentAttempt; AdminDashboardPage; bounded dates and no Test/Live mixing |
| B02 | GET `/admin/admission-applications` | status,collegeId,q,page; paged private summaries | admissions.read | AdmissionApplication; existing review |
| B03 | GET `/admin/admission-applications/:id` | detail + notes/history | admissions.read | application and parent snapshots; review modal |
| B04 | PATCH `/admin/admission-applications/:id/status` | `{status,reason?,note?,expectedRevision}`; updated detail | admissions.review | validate transition; actor from session; publish safe notifications only |
| B05 | POST `/admin/admission-applications/:id/notes` | `{text,idempotencyKey}`; note | admissions.review | atomic append, no caller author; fixes absent addAdminNote |
| B06 | GET `/admin/franchise-applications` | status,universityId,collegeId,q,page | franchises.read | FranchiseApplication; existing requests |
| B07 | GET `/admin/franchise-applications/:id` | private detail/doc refs/notes | franchises.read | private document access separately authorized |
| B08 | PATCH `/admin/franchise-applications/:id/status` | `{status,rejectionReason?,note?,expectedRevision}` | franchises.review | reject reason required; approved relationship policy Q06 |
| B09 | POST `/admin/franchise-applications/:id/notes` | `{text,idempotencyKey}`; note | franchises.review | atomic authenticated append |
| B10 | GET `/admin/registration-applications` | kind,status,q,page | registrations.read | typed study/tuition/faculty list; new intake screens |
| B11 | GET `/admin/registration-applications/:id` | private detail/payment/doc state | registrations.read | Application/Order; never plaintext identity number |
| B12 | PATCH `/admin/registration-applications/:id/status` | `{status,reason?,expectedRevision}` | registrations.review | cannot activate unpaid required fee; no role escalation |
| B13 | POST `/admin/registration-applications/:id/notes` | `{text,idempotencyKey}` | registrations.review | internal notes only |
| B14 | GET `/admin/users` | q,status,role,page | accounts.read | User; accounts screen; sanitized profile |
| B15 | GET `/admin/users/:id` | safe profile, status, enrollment/order summaries | accounts.read | no password/session tokens/identity plaintext |
| B16 | PATCH `/admin/users/:id/status` | `{status,reason,expectedRevision}` | accounts.manage | suspend/revoke sessions; prevent locking last super admin |
| B17 | POST `/admin/users/invitations` | `{email,name,roles}` | accounts.roles.manage | only super_admin; activation link, no default admin password |
| B18 | PATCH `/admin/users/:id/roles` | `{roles,reason,expectedRevision}` | accounts.roles.manage | prevent self-escalation/last-admin removal |
| B19 | GET `/admin/enrollments` | userId,courseId,state,page | learning.read | Enrollment; access support screen |
| B20 | POST `/admin/entitlements` | `{kind,userId,resourceId,expiresAt?,reason,idempotencyKey}` | learning.grants.manage | exceptional audited free/manual grant; not a paid-order marker |
| B21 | POST `/admin/entitlements/:id/revoke` | `{kind,reason,expectedRevision}` | learning.grants.manage | revoke book/course rights with history |
| B22 | GET `/admin/orders` | status,paymentStatus,paymentMode,type,userId,date range,page; failed/pending/captured filters | commerce.read | Order/PaymentAttempt; commerce operations; allowlisted filters |
| B23 | GET `/admin/orders/:id` | order, Razorpay order/payment references, attempt/payment history, verification source/timestamps, reconciliation and activation detail | commerce.read | redacted financial metadata; no secrets/card data/private signature material |
| B24 | POST `/admin/orders/:id/reconcile` | `{reason,idempotencyKey}`; persisted job summary/status, replay returns same job | commerce.reconcile | adapter fetches Razorpay evidence and invokes shared settlement; no admin-supplied paid status or direct entitlement activation; rate-limited |
| B25 | GET `/admin/results/records` | issuerId,examId,status,q,page | results.read | ResultRecord; tightly scoped PII query |
| B26 | GET `/admin/results/records/:id` | trusted record/provenance | results.read | ResultRecord; reviewer |
| B27 | POST `/admin/results/imports` | `{examId,assetId,mappingVersion,idempotencyKey}`; validation batch summary/job | results.manage | private structured import file, no arbitrary URLs; errors per row, dry-run first |
| B28 | POST `/admin/results/records/:id/publish` | `{expectedRevision,sourceApproval}` | results.publish | publish only complete trusted draft; audit |
| B29 | POST `/admin/results/records/:id/corrections` | `{correctedFields,reason,source,expectedRevision}`; new draft revision | results.manage | original published record immutable |
| B30 | POST `/admin/results/records/:id/withdraw` | `{reason,expectedRevision}` | results.publish | withdrawal audited, access revoked |
| B31 | POST `/admin/books/:id/publish` | `{expectedRevision}` | learning.publish | ready PDF/pages/TOC/price/preview checks |
| B32 | POST `/admin/coaching/courses/:id/publish` | `{expectedRevision}` | learning.publish | ready syllabus/media/valid active plans |
| B33 | POST `/admin/content/pages/:id/publish` | `{expectedRevision}` | content.publish | publish validated snapshot; public cache invalidation |
| B34 | POST `/admin/notifications/:id/publish` | `{expectedRevision}` | notifications.publish | targeting validation, durable receipt fan-out/lookup |
| B35 | GET `/admin/settings` | allowed editable settings groups | settings.read | SiteSettings; settings UI; no provider secrets |
| B36 | PATCH `/admin/settings/:key` | `{value,expectedRevision}` | settings.write | typed allowlist; no weakening security floors |
| B37 | GET `/admin/media` | purpose,status,ownerId,page | media.read | Asset; media manager; no filesystem paths |
| B38 | GET `/admin/audit-logs` | actor,action,resource,date range,page | audit.read | append-only redacted logs; no public access |
| B39 | GET `/admin/jobs` | kind,state,page | operations.read | redacted jobs/reconcile/failed uploads; operational page |

Inventory: 77 numbered public/self/media/health operations, 70 expanded catalogue operations and 39 admin special operations = **186 proposed method/path contracts**. This is an inventory count, not 186 distinct screens or implementation phases. The breadth comes from CRUD and secure intake/media/payment lifecycle operations. Defer gated result-source operations until Q07 is settled; do not add assessment/refund/recurring-billing endpoints without scope decisions. Route matching must register literal paths (`facets`, `invitations`, `imports`) before parameter routes.

## Integration adapter mapping

Replace implementations behind existing `authService`, `collegeService`, `bookService`, `coachingService`, `orderService`, `notificationService` and `adminService` with the shared client, preserving view-facing DTOs while transitioning. `subscriptionService` and legacy `mockCourses` are unmounted/duplicate; consolidate into enrollment APIs rather than building parallel subscriptions. Fix `getCourses` -> program API and missing note-only API. LibraryContext becomes a compatibility facade over current-user book/progress/wishlist/enrollment queries; no entitlement-granting local setter remains authoritative.

Use query keys containing resource, ID, filters and user identity. On logout/transfer clear private query state. Admin mutations invalidate list/detail/facets/CMS placements; payment settlement invalidates orders/entitlements/profile summaries; progress invalidates dashboards; notices invalidate unread counts. Initial refetch-on-navigation/focus plus bounded payment polling is sufficient. No real-time infrastructure is justified. Public cache lifetime must be defined; proposed <=60 seconds plus ETag/revision, with immediate fresh response to the author after publication. Private data uses no shared caching.
## Stage 4 implemented contracts — 24 October 2026

Existing IDs are preserved: A20/G04 taxonomy; A21 facets; A22-A26/G01-G03 institutions/programs; A27/B02-B05 admissions; A28-A31/B06-B09 franchise intake. Routes are under /api/v1; existing JSON/error/requestId envelopes and paginated meta are reused.

Public GET paths: /taxonomies, /institutions/facets, /universities, /universities/:id/colleges, /colleges, /colleges/:id, /colleges/:id/programs. Public queries cannot request draft/inactive data. Published colleges require active university/state/district and explicit verification evidence; programs also require active parent college. Search/filter/pagination are authoritative on the backend.

Admin GET/POST/PATCH/DELETE families: /admin/taxonomies, /admin/universities, /admin/colleges, /admin/colleges/:collegeId/programs. PATCH and DELETE carry expectedRevision; DELETE archives and returns 200 with the updated record, never cascades. Stale edits return 409.

POST /admission-applications requires a verified session, collegeId, programId, studentDetails and idempotencyKey. Franchise POST /franchise-applications creates a draft with idempotencyKey; PATCH /franchise-applications/:id edits with expectedRevision; POST /:id/submit validates declaration and complete fields; GET /:id/status returns authoritative owner-safe state. Guest recovery uses X-Draft-Capability; keep it out of logs/URLs except a private fragment consumed by the frontend. Selected-file metadata blocks submission with DOCUMENT_UPLOAD_PENDING; document-free submission is permitted.

Review GET list/detail paths: /admin/admission-applications and /admin/franchise-applications. PATCH /:id/status uses expectedRevision; POST /:id/notes uses text and idempotencyKey. Notes never implicitly update status. Franchise approval always returns APPROVAL_POLICY_PENDING (409); rejection requires a reason. Exact implemented fields and enums are validated in institutions/validation.js. No duplicate payment or upload endpoints were added.


## Stage 5 implementation status - 24 October 2026

A32-A35, G05, B31, A69-A75, G09-G11, B33 and B35-B37 are implemented. Preserve all original IDs. Canonical G10/G11 paths are /admin/content/banners and /admin/content/faculty. DELETE content archives; PATCH and DELETE require expectedRevision. Publish accepts {expectedRevision,publish:true|false}; an explicit false unpublishes. Banner/faculty publication uses the same /:id/publish suffix as page/book publication, with content.publish permission.

A32 accepts q, taxonomy IDs/category, language, type=free|paid, minPriceMinor/maxPriceMinor in minor units, sort=featured|newest|name|price_asc|price_desc and pagination; only supported validated query fields are allowed. No fabricated ratings/sales ranking. A35 returns safe separately approved sample asset descriptors/content URLs, not private full-book bytes. Public book DTOs report canReadFull=false. A69 supports home/about/categories/navigation and published faculty on about. A71 returns only allowlisted public settings; missing configuration has honest empty values.

A72 Stage 5 refinement: multipart must send purpose and client-generated idempotencyKey fields before exactly one file field. Supported purposes: book_cover, book_preview, book_full, banner, faculty, cms. Response is the normal data envelope with safe asset id/status/revision/scan/metadata. Retries with identical owner/key/payload return the same asset; changed payload conflicts. Guest/student/profile/identity-document upload purposes remain disabled. A74 is staff media.read only in this stage. A75 requires media.write and expectedRevision, with 204 only after safe logical deletion/cleanup scheduling; referenced media returns 409.

A73 grants anonymous bytes only for ready, clean, public-purpose assets referenced by a currently published snapshot; banner windows apply. Private full books require media.read staff for review; no student reader entitlement exists yet. Range is a single bytes range (200/206; invalid 416), with safe headers and no filesystem path. Additional lifecycle action POST /admin/media/:id/scan accepts expectedRevision and requires media.write; it retries the configured scanner only. B37 includes scannerConfigured. Permissions/RBAC/Origin/CSRF remain server enforced. No payment, order, webhook or entitlement endpoints were activated.

## Stage 6 adopted implementation - 24 October 2026

Preserve A54=POST /orders (internal backend-priced order), A55=POST /orders/:id/payment-attempts (provider binding), A56=POST /payments/razorpay/verify, A57=POST /webhooks/razorpay, A58=GET /orders/:id/status, A59-A60=/me/orders[/id], B01=/admin/dashboard and B22-B24=/admin/orders[/id[/reconcile]]. No parallel quote/order API was invented. A54 currently accepts only {product:{kind:book,id},idempotencyKey}; registration/course_plan/renewal products return PRODUCT_NOT_ENABLED. Client amounts/owners/status/discounts are rejected.

A55 returns checkout only after durable provider binding; unapproved credentials return 503 PAYMENTS_UNAVAILABLE without any provider call. An in-flight/uncertain creation returns non-launchable 202. A56 verifies stored-order signature, ownership, authenticated-provider order/payment relation, exact immutable amount/currency, provider scope and complete captured/paid evidence. Authorized/failed observations grant nothing. A57 is bounded raw application/json before JSON parsing/session/CSRF, with HMAC, required event identity, durable Job receipt and retryable DB failure. All settlement paths share PaymentService. Duplicate/out-of-order failures cannot regress capture.

A58 distinguishes orderStatus, last verified paymentStatus, activationStatus, creationStatus and reconciliation; simulated records are labelled. A59/B22 are paginated and support validated status/type/fulfillment/reconciliation filters. B24 accepts an empty body and schedules verification; no paid override/status/amount mutation exists. B01 groups Test Mode pending/authorized/gross captured value and fulfillment, keeps simulated groups separate and counts failed attempts; no net revenue/profit/tax/settlement claim.

A61 official invoice remains gated (409 INVOICE_POLICY_PENDING). Minimal truthful extension GET /me/orders/:id/receipt returns owner-only captured Test Mode JSON receipt, explicitly not a tax invoice. No refund API. GET /me/books implements the minimum A36 entitlement projection/secure content link; no progress/bookmarks/reader-state APIs were added. A73 also admits verified direct-book entitlements while retaining all Stage 5 scan/license/state/integrity/range guards.

A15 returns safe registration configuration with submissionEnabled/paymentEnabled=false and outstanding document/policy reasons. A16/A17/A19 implement authenticated verified-owner drafts only; no guest capability or new identity is minted. A18 always blocks unsupported submission. B10/B11/B13 enable staff draft review and idempotent notes; B12 approval/activation is blocked. B36 extends the allowlist with typed registrationFees {kind:{amountMinor,approved}}, revision/audit required; price configuration does not enable an unfulfillable registration. G05 remains book pricing/publication authority. G08/A43-A50/renewal activation remain deferred to the course domain. GET /public/payment-config reports gate availability only, with no secret or publishable key; only an authorized bound A55 response may expose the Test Key ID.


## Stage 7 implementation and superseding evidence - 24 October 2026

A37-A42, A43-A46, A48-A53, G06-G08, B19 and B32 now use the existing /api/v1 paths and shared data/meta/requestId protocol. G06/7 require learning.read/write; G08 uses commerce.read/commerce.plans.write; publication uses learning.publish. Parent IDs are immutable and matched on child reads/mutations. Draft courses are 404 publicly; safe syllabus metadata exposes locks without private resources. A51 admits explicitly published previews separately from enrollment-protected lessons. A52 requires {status:in_progress|completed,expectedRevision,positionSeconds?:0}; unsupported video timing is rejected. A37 accepts validated optional courseId context; A40-A42 accept expectedRevision (0 for a new state), currentPage for progress, and optional courseId. Bookmark pages are bounded by actual inspected PDF count; semantic retries are idempotent. Minimal owner-only GET /me/wishlist supplies persisted wishlist IDs for UI hydration. A47 requires an idempotency key but always returns PAID_ENROLLMENT_REQUIRED while free policy is absent; A54 resolves real approved course_plan snapshots through the existing commerce boundary, but provider-connected Checkout remains disabled. B20 always rejects unapproved grants; B21 supports audited course revocation only, with generic book revocation still gated. Renewal success and real provider acceptance are not implied by implemented routes. Course publication supports authored text/scanned PDF lessons as an explicit safe refinement; video returns VIDEO_DELIVERY_UNAVAILABLE.

See [Stage 7 report](../../backend/STAGE7-REPORT.md) and [current backend runbook](../../backend/README.md). Historical earlier-stage status paragraphs remain snapshots, not current operational acceptance.

## Stage 10 implemented operational refinements

Stage 10 owner authorization is original-scope implementation/acceptance, explicitly excluding deployment. B14/B15 now use `/admin/users[/:id]` with `accounts.read`, safe profile/status/permission data and count-only order/enrollment/registration summaries. List filters are q/status/role/page with bounded literal search. B16 uses `accounts.manage` and `{status:active|suspended,reason,expectedRevision}`; only verified active/suspended targets, no self/super-admin/pending/archived activation. Existing sessions become invalid through securityVersion. B18 is super-admin-only `accounts.roles.manage`, accepts `{roles:["admin"],permissions,reason,expectedRevision}` only for existing ordinary staff, and rejects student promotion, super-admin mutation and unrecognized/role-manager grants. Staff creation still requires B17 invitation and OTP; operator bootstrap/recovery is unchanged. Account admin revisions start at zero, including existing documents without the new field.

B38 `/admin/audit-logs` uses audit.read and exact actor/action/resource plus validated from/to/page filters; returns event identity/action/time/resource/reason/request ID only. B39 `/admin/jobs` uses operations.read, kind/state/page and returns safe status/attempt/schedule metadata without tokens, hashes, source/candidate payloads or raw result summaries. Both are read-only. B01 keeps the existing verified financial shape and adds `operations:{asOf,totals}` from existing collections, explicitly including draft/inactive records. B19 adds `kind=book` to the existing enrollment endpoint for read-only purchase-rights/source-order inspection; it adds no grant/revocation path. B20 and unsupported book B21 stay gated; course B21 is unchanged. Existing IDs/paths are preserved; no duplicate payment endpoints or collections were introduced.

CMS cards now preserve an optional allowlisted linkKey in the existing card editor. Category page/sheet use these published headings/bodies on actual navigation cards, and the public header reads the existing brand name setting. All search services now escape regex metacharacters as literal user text. See Stage 10 reports for actual tests and limits.
