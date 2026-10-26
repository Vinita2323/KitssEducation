# Stage 13 — Business policies, registrations and granular staff permissions

26 October 2026. Baseline: `main`, `90bd30f`. This stage implements the approved software workflows using the existing modular monolith. **Actual category fees, required evidence, privacy/guardian/retention terms, exceptional-access policy and fiscal compliance still require owner configuration and acceptance.** No existing application record was approved, repriced, promoted or migrated into a privileged state.

## Implemented decisions and registration lifecycle

Business registration is distinct from email/account verification. Existing verified identities and administrator login remain valid. Study, tuition, teacher and coaching-profile applications retain their typed field allowlists, verified owner, idempotency key, revision checks and private internal notes. Teacher approval never creates staff permissions.

The existing submit/review endpoints now support:

`draft → submitted → pending_verification → under_review → approved → activated`

Review can instead request changes or reject with a reason. Rejected/activated applications are terminal; request-changes records may be edited, reuploaded and resubmitted. Every transition is revision checked and audited. Approval checks current category policy, current verified active owner, required clean documents and their verification, and applicable guardian verification. Activation additionally checks the exact captured registration fee order when payable. It cannot mark an order paid. Capture records verified fee eligibility; it does not silently approve or activate the application.

Category configuration lives in the existing private SiteSettings record `businessPolicies`. Main-admin-only approval uses `GET/PATCH /api/v1/admin/business-policies` with `settings.read/write`, an explicit reason and `expectedRevision`. Settings keep bounded policy history plus durable audit events. Categories select draft/active/retired status, explicit fee-required boolean, INR minor-unit amount, effective UTC dates, approved document requirements, privacy approval, optional versioned guardian wording and optional retention days. Active paid policies require a positive amount; active free policies require explicit zero. Missing fees never become free. No real fee, tax rate or retention period was seeded. Legacy `registrationFees` metadata remains readable but cannot enable submission or free treatment.

Public registration configuration exposes category readiness and approved user-facing requirements, independently of the payment-provider gate. The user can save/resume, attach the configured documents, submit, refresh status and launch the existing payment flow when a submitted fee is payable. Administrators review evidence, verify/reject documents, request changes, approve/reject/activate and see review history. Unsupported old form payment shortcuts remain blocked; the shared submission controls perform the authoritative lifecycle.

## Documents, consent and retention

`registration_document` reuses authenticated `/media` multipart upload, private local storage, bounded PDF/PNG/JPEG inspection, image sanitization, integrity checks and mandatory clean scanning. Its engineering cap is 10 MiB, subject to the configured storage limit. Collection is unavailable without an effective approved document/privacy configuration. Full identity numbers remain excluded. No new public upload endpoint or publicly readable document URL was added.

Attachment requires the exact configured requirement, current owner-owned clean asset and an editable application. Required documents must be clean and reviewer-verified before approval. Rejection supplies readable reupload feedback; resubmission resets that document to pending verification. Owners may read their own clean files; staff need `registrations.documents.review`. General `media.read` does not disclose these private bytes or metadata, and generic media lists exclude registration documents for unrelated staff. Referenced assets cannot be deleted. Scanner maintenance cannot mark an unscanned file trusted.

The implementation conservatively requires a valid DOB to determine whether guardian review is needed and uses an under-18 safety threshold. It is not a legal determination. Minor activation requires an explicitly approved versioned guardian workflow, submitted guardian name/relationship/acceptance and an authorized reviewer attestation. No legal consent wording, legal retention period or binding compliance policy is invented. Final live-data privacy/consent acceptance remains pending owner/legal approval.

Authorized reviewers can place/release a legal hold with a reason. Retention deletion is explicit, never an automatic guessed TTL: an approved category retention interval, terminal state, elapsed interval and absence of a hold are required. Redaction and a durable list of exact file IDs commit before deletion. Legal-hold changes and redaction share existing domain coordination. A disk failure leaves resumable cleanup; retry handles a `deleting` asset safely. Other applications' live references still prevent file deletion. The retained financial/audit skeleton is not a claim of whole-system legal erasure or backup erasure.

## Free content and expired paid repurchase

An active verified user can claim a published licensed book only when the backend's explicitly approved price is exactly zero and the current full document is clean/ready. The existing BookEntitlement records `source=free`, has no fabricated paid Order and uses a durable audit outbox. Missing prices are rejected. Changing the current product away from eligible free status stops free-source access; existing genuine purchased rights retain their paid source.

Free course enrollment uses an active approved zero-priced CoursePlan with explicit duration and verified-account eligibility, current licensed published course and delivery checks. Enrollment records `source=free` with the configured validity; no Razorpay order or fake capture is created. Current plan eligibility and expiry are rechecked on access. Paid/manual history is never overwritten by a free claim. The existing reader, syllabus and lesson UIs consume these server grants.

An expired, non-revoked paid course can be purchased again through the existing order/attempt/Checkout/verification flow. Active or revoked rights cannot be repurchased. A server-generated purchase-period slot serializes chargeable orders across plans for the same expired period. Each new capture starts a fresh configured-duration period at its verified capture timestamp; it does not extend an old period silently. A revision-checked update preserves prior order/plan/start/expiry history in the single current Enrollment. Replaying any previous source order cannot replace or extend the current period. Repeated fulfillment grants once. The UI shows expiry and offers a new purchase; capture and applied fulfillment remain server authoritative. There is no recurring billing engine.

## Franchise, refunds, invoices and exceptional access

Franchise intake retains the existing verified parent hierarchy, document-free submission and applicant status/history. `franchises.review` permits notes/rejection; explicit `franchises.approve` permits reasoned manual review approval. `affiliationState=blocked_pending_policy` stays closed. Review approval does not publish a tie-up, modify a college's verification or create an account. Exact agreement/eligibility/evidence and official affiliation activation remain unapproved. No speculative franchise document categories were imposed.

Captured-order owners can submit a reasoned refund request and supporting explanation. The bounded request/review state is embedded in Order, with an idempotency key, pending/approved/rejected review status and explicit `providerStatus=not_executed`. The admin refund queue is permissioned and paginated. Approval does not execute a provider refund, change captured payment history, deduct captured totals or revoke content. No refund window or refund-completion evidence was invented. Users see the review/provider distinction in order details.

Captured receipts now include a deterministic unique `DRAFT-<order reference>` invoice foundation: configured seller metadata, current owner/customer identity, immutable item/amount/currency and verified payment reference. Tax fields remain unset; status is draft, compliance approval is false and official tax-invoice delivery remains gated. This is not a tax invoice. Issuer identity, tax handling, numbering/compliance and refund-access policy still need owner/finance approval.

The existing BookEntitlement and Enrollment models also support separately labelled expiring manual sources. Exceptional requests require a valid existing verified user, published resource, expiry, idempotency key and mandatory reason. A separate authorized issue/reject operation needs an explicit main-admin-approved exceptional policy; a subadmin's request or permission alone cannot create payment-equivalent access. Issuance cannot overwrite existing source-linked rights. Access checks require the issued request, its exact user/resource binding, current policy, expiry, revocation, publication/licensing and secure delivery. No Order is fabricated. Book/course revocation is reasoned and audited; paid/book revocation requires its explicit policy approval and never changes payment truth. Current rights remain visible in existing enrollment/book review. The historical immediate-grant endpoint remains closed; the new request/review flow is deliberately two-phase.

## Subadmin permission matrix and security

The existing User/staff invitation/session system is extended; there is no parallel staff table or authentication system. Main admin invites ordinary staff, who choose a password and verify email through the existing secure workflow. Permissions default to none. The main admin can edit/revoke grants, suspend/restore staff, see account status/last login and inspect audit history. Self/super-admin targets, student-to-staff promotion, super-admin creation and ordinary-staff permission management are denied. Existing staff grants are retained; no automatic account migration occurs.

| Module | Backend permissions and effect |
|---|---|
| Dashboard/users/audit | Existing `dashboard.read`, `accounts.read/manage`, `audit.read`; `accounts.roles.manage` is main-admin-only. Ordinary account managers cannot modify other staff. |
| Books | Separate `books.read/create/edit/publish/archive`; direct API and navigation/action checks. |
| Coaching | Separate `coaching.read/create/edit/publish/archive`; existing `commerce.read/plans.write` controls plan pricing. |
| Registration | Existing `registrations.read`; `registrations.review`, `registrations.approve`, `registrations.documents.review` separate general review, approval and sensitive evidence. |
| Franchise | Existing `franchises.read/review`; `franchises.approve` is separate and never activates affiliation. |
| Refunds | `refunds.read/review`; no provider refund execution permission is introduced. |
| Exceptional access | `access.read/request/issue/revoke`; issuance/revocation still requires the independently approved policy. |
| CMS/media/notices/settings | Existing content/media/notification/settings read/write/publish grants retained with existing guards. Business-policy approval additionally requires main-admin identity. |
| Results | Existing draft/manage controls retained. No new official publication grant is offered in invitations/permission selection; existing assigned grants are preserved. Official source/publication policy remains gated. |

Legacy `learning.read/write/publish` continue authorizing their former book/coaching actions without expanding a new granular grant into a broad grant. Legacy registration-write review/approval and grant-manager revocation remain compatible. `access.read` allows entitlement review, not catalogue editing. Grouped selectors offer individual actions and select-all per permission group, with none checked by default. Legacy broad grants are still broad and should be assigned deliberately.

Staff invitation/revocation and account status/permission changes require a staff sign-in issued within 15 minutes; older sessions must sign in again. Permission changes increment securityVersion and administrative revision, invalidate old sessions immediately and clear outstanding challenges. Backend authorization is reloaded on every request; frontend navigation does not confer authorization. Audit records preserve before/after permission sets, reason, actor and request ID. Last login is recorded for new staff logins; no historical timestamp was fabricated.

## Persistence, compatibility and file changes

One justified collection, `accessRequests`, stores independently reviewed, idempotent exceptional-access requests. Refunds remain embedded in Order; policies reuse SiteSettings; documents/history/guardian/retention intent reuse RegistrationApplication. No separate Payment, Staff or recurring-subscription collection was added.

Startup first installs replacement unique indexes, then removes only the named obsolete blanket purchase/order-source indexes. Book purchases remain unique per user/book; paid source references remain uniquely indexed while free/manual rows may omit an order. Course orders are unique per user/course/purchase period; one current Enrollment remains unique per user/course. The migration is tested with legacy indexes and persisted synthetic records, including repeated startup. It does not delete or rewrite application documents. No configured application database was connected to for this stage; operators should back up and review these known index changes before running a real application's updated backend.

Changed areas: auth models/routes/security/service and operations administration; commerce models/routes/composition/payment/business-policy service; coaching models/validation/service/routes; institutions manual-review state/routes; media/publishing purpose authorization, private settings and retry handling; existing admin/user pages, permission selector, policy/queue/submission/purchase/refund components and route guards. Existing test fixtures accept explicitly injected fake mail, and affected legacy tests retain security negatives under the new contracts. No dependency installation or upgrade, real environment edit, application-data migration, official result adapter connection or redesign was performed.

## Verification

All database runs use fresh guarded names against a separately started loopback-only MongoDB 7.0.24 on port 27243. Synthetic scanner/payment/mail fixtures are explicit; no actual provider or live email call occurs. Existing application data is untouched. Browser tests block external requests. The expired-purchase widget bridge is test-only presentation code; persisted records and dashboard groups remain labelled simulated and the actual backend signature/capture/ownership checks still run.

| Final verification scope | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Complete backend plus shared HTTP client | 181 | 0 | 3 |
| Final focused policy/access/retention/RBAC/index follow-up | 16 | 0 | 0 |
| Expanded Stage 13 browser workflows and eight requested widths | 9 | 0 | 0 |
| Existing book/coaching browser workflows | 14 | 0 | 0 |

Scopes overlap and must not be summed as independent test coverage. The three complete-suite skips are the optional replica-set connectivity test, explicitly unapproved live SMTP test, and explicit standalone FFprobe/FFmpeg tool-path test. The separate existing video integration suite did run and pass. The backend suite includes actual authentication/OTP/invitation, typed intake round trips, institutions, publishing/private media, payment HMAC/webhook/reconciliation/entitlement, coaching, dashboard, account management, notifications/results gates, startup/storage/logging and shared-client tests.

New browser coverage includes UI policy save, owner submit and admin activation, keyboard-selected staff invite, eight-width reflow, granular read-only route/action denial, real free reader/lesson access, expired paid repurchase with simulated Checkout, refund request/review and exceptional request/policy-denied issuance followed by explicitly configured synthetic issuance. Existing book/coaching workflow-only mode deliberately omits unchanged responsive loops; the new staff controls explicitly test all 320/375/390/414/768/1024/1280/1440 widths. These are headless Chrome software checks, not physical devices, screen-reader certification or a new whole-admin WCAG audit.

Earlier failures were investigated rather than hidden: initial focused policies 10 passed/3 failed (fixture publication sequence and audit public-ID assertion); intermediate integration 42/5/0 (superseded legacy expectations); expanded integration 78/3/0 (retention retry defect and incomplete synthetic franchise taxonomy); initial browser 1/6/0 (label lookup and cascading prerequisites), corrected browser 4/3/0 (real settings-form revision mismatch plus dependent submit), then complete corrected browser 7/0/0 and expanded browser 9/0/0. Initial full backend/shared suite 173/7/3 exposed upload denial error serialization and four legacy submit assertions plus parent failures. Final full suite passed 181/0/3 after correction. The deletion retry, settings save and HTTP denial defects were fixed in application code; fixture assumptions and old contract assertions were corrected in tests.

Frontend baseline build passed (27.83 seconds). Intermediate builds passed (43.17 and 44.56 seconds) with the existing large-chunk warning; the final build passed in 31.18 seconds, with the same existing large-chunk warning. Backend and frontend dependency audits both exited 0 with zero vulnerabilities. Source/build review scanned 358 shareable text artifacts with zero configured credential matches; diff whitespace checks passed. Staged review checked 59 legitimate source/test/documentation files: zero unsafe findings and cached whitespace check passed. A separate scan of 21 private Stage 13 log/evidence files found zero configured credential matches; none is staged. All real environment files remain ignored and unchanged. The verified task-created MongoDB process was shut down after all writers finished; its ignored synthetic files are retained.

### Reproduction

Use a dedicated local MongoDB, never application data, and process-local overrides:

```powershell
$env:MONGODB_URI='mongodb://127.0.0.1:27243/kitss_stage13_local'
$env:MONGODB_DB_NAME='kitss_stage13_local'
$env:MONGODB_REQUIRE_REPLICA_SET='false'
$env:KITSS_STAGE13_TEST_DB='kitss_stage10_test_'+[guid]::NewGuid().ToString('N').Substring(0,16)
node --test backend/tests/business-policies.mongodb.integration.test.js
$env:KITSS_STAGE13_BROWSER_DB='kitss_stage10_browser_'+[guid]::NewGuid().ToString('N').Substring(0,16)
node --test frontend/tests/business-policies.browser.test.js
npm.cmd --prefix frontend run build
npm.cmd --prefix backend audit --json
npm.cmd --prefix frontend audit --json
```

The full run used `node --test --test-concurrency=1 backend/tests/*.test.js frontend/src/shared/api/httpClient.test.js`. Each of KITSS_STAGE13_TEST_DB, KITSS_STAGE5/6/7/8_TEST_DB, KITSS_STAGE10_TEST_DB, KITSS_STAGE10_INTAKE_TEST_DB, KITSS_VIDEO_TEST_DB, KITSS_DASHBOARD_TEST_DB and KITSS_RAZORPAY_ACCEPTANCE_DB received its own fresh `kitss_stage10_test_<16 hex>` name; KITSS_AUTH_TEST_DB and KITSS_STAGE4_TEST_DB used their guarded stage3/stage4 prefixes. Live SMTP opt-in was removed. Existing browser regression used distinct stage6/stage7 browser names and `KITSS_BROWSER_WORKFLOWS_ONLY=true`. Never reuse an occupied fixture database name.

## Remaining decisions and operational gates

- Owner must configure which registration categories are paid/free, actual approved amounts, exact document/eligibility requirements, current privacy/guardian terms, retention and legal-hold operations. No application category was enabled against real data. The under-18 conservative guard needs legal acceptance alongside the full guardian process.
- Franchise official affiliation criteria, agreements and any required live verification evidence remain undefined. Manual review acceptance is not official affiliation activation.
- Exceptional-grant eligibility/duration and paid access revocation must be explicitly approved/configured. Refund eligibility/provider execution, refund-access treatment, tax/seller identity and invoice compliance remain gated. No automatic refund or tax invoice was implemented.
- Stage 12 Razorpay operator approval remains unsatisfied; Test Mode payment operational acceptance is unchanged. Real SMTP Stage 11 evidence is preserved; no more emails were sent. Maintained real scanner/signatures, licensed publication, deployment/backups/capacity and runtime/device acceptance remain separate.
- Official academic result publication, public verification, external issuer/candidate privacy/correction rules and future third-party provider selection remain gated. No external result API or fabricated records were introduced.

No push, deployment, live payment or public tunnel occurred. Stop after the Stage 13 local commit; no later stage is started.
