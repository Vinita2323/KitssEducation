# Dynamic franchise policy and end-to-end workflow

Date: 2026-10-27. Software implementation and isolated acceptance complete; real operational acceptance remains conditional.

## Decisions and initial setup

The owner confirmed verified signed-in applicants and prospective policy changes preserving accepted versions, and authorized editable starting defaults. The starting draft allows independent or linked University/College/School/Institute applicants, minimum years zero, required institution registration proof plus authorization letter, free joining, renewals disabled, and editable privacy/agreement wording. Supported uploads are private PDF/PNG/JPEG with a 5 MiB initial document limit, configurable down/up to the existing 10 MiB pipeline ceiling. The draft is presented from code when no saved policy exists; no policy, fee or agreement was automatically published into the application database. Main-admin review/publication is the remaining owner action.

The live local public franchise-policy route was checked read-only and returned `available: false`, as expected without a published policy. The fee endpoint returned HTTP 200 with `configuration_required`; the earlier transient HTTP 500 was not reproduced. No claim is made that a specific database/provider fault behind that earlier response has been diagnosed.

## Implemented journey

1. Main admin opens `/admin/settings#franchise-policy`, reviews editable supported eligibility/document/fee/agreement/renewal controls, saves a reasoned draft and publishes explicitly. Changed published terms require a new version; changed agreement text requires a new agreement version. Publishing future terms keeps them unavailable until effective. A policy can pause new applications while existing accepted workflows continue.
2. Verified active applicants open `/register?type=franchise`. Independent institutions need no fabricated university/college relationship. Linked applications validate a real active verified college and matching active university. Institution type and minimum years are enforced by the backend.
3. Applicants save an account-owned draft, upload scanned supporting documents, attach them to configured document keys, accept the versioned agreement/privacy notice, and submit. Required missing, wrong-purpose, foreign-owned, unavailable or unreviewed documents cannot lead to activation. Private-file reads are limited to the owner or authorized franchise reviewers. Referenced files cannot be deleted.
4. Staff use `/admin/franchise-requests` to inspect accepted policy/agreement, verify/reject documents with reasons, request corrections, reject, or approve eligibility. Corrections retain the submitted policy. Existing read/review/approve permissions and CSRF/revision checks apply. Free approved requests activate in the same atomic application update. Paid requests remain unactivated pending verified capture. Applicant status, reasoned review history and private documents remain retrievable after submission.
5. Joining and renewal products reuse existing internal orders, backend pricing, Razorpay Standard Checkout, signature/capture/amount/currency/ownership verification, webhook journal, reconciliation, admin orders, verified financial summaries and payment receipts. Unique application/kind/payment-period constraints and idempotent application effects prevent duplicate charges/activation. No mark-paid shortcut, client entitlement grant, manual payment override, live mode or recurring subscription engine was added.
6. Accepted renewal terms determine calendar-month due dates, grace and expiry. Status reads calculate current affiliation state immediately. The existing maintenance worker persists changes and emits deduplicated reminder/expiry events in hourly batches. Suspended affiliation and manual-review-required affiliation are separate states. Manual expiry requires authorized approval for that due period before renewal. Current renewal terms/agreement must be accepted; paid renewal quotes preserve those accepted terms. Zero-fee renewals preserve the full policy/agreement snapshot. Disabling renewals prospectively does not rewrite existing due periods; the existing period can be resolved with an accepted zero-fee renewal and no future due date. A pending paid order must be resolved before applying a free renewal to the same period.
7. Existing durable audit-event notifications deliver in-app submission, document review, approval, activation, renewal, reminder and expiry updates. Push delivery continues to follow existing configuration/preferences. No external mail/push was sent during this task.

## Architecture and changed files

New backend `src/modules/franchise/policy.js` and `workflow.js` implement bounded policy validation and workflow orchestration around the existing FranchiseApplication, SiteSettings, MediaAsset, Order, AuditLog and job systems. No new collection, dependency, SDK, environment variable or parallel authentication/payment engine was introduced.

Modified integration areas: institution schema/validators/routes/review DTOs; publishing module exposes its existing institution service; media private purpose/authorization/reference checks; commerce policy preservation/routes/model/payment resolution/fulfillment/worker; business-event notification mapping. Additive fields leave legacy data intact. The new unique order index applies only to franchise joining/renewal products.

Frontend: new `FranchisePolicyManager.jsx` and `FranchiseApplicationForm.jsx`; settings mounts the policy manager; RegisterPage uses the completed applicant form. Franchise admin review adds document checks, correction requests, affiliation/renewal status and period-specific renewal approval. Admin media supports franchise documents. Existing general financial controls point to the dedicated franchise policy controls instead of presenting a second editable fee policy. Other registration forms, existing page layout shell, academic taxonomy, books/coaching, results and authentication services are preserved. Earlier uncommitted category-management work was retained.

New tests: `backend/tests/franchise-workflow.test.js`, `frontend/tests/franchise-workflow.browser.test.js`. README contains operational/API setup and test commands. F08 in the requirements matrix is now CONDITIONAL with current evidence; the checklist includes the completed software follow-up and remaining operational gates.

## API contracts

Existing A28-A31 `/franchise-applications` create/edit/submit/status and existing admin franchise list/detail/status/notes remain the application endpoints. New workflows require verified active sign-in rather than new guest capabilities. Legacy admin review stays available, but legacy applications are not silently migrated or activated; signed-in owners are directed to submit a new policy-versioned application. Old guest capabilities do not authorize the new verified-account workflow.

Additional endpoints:

- GET `/api/v1/public/franchise-policy`
- GET/PATCH `/api/v1/admin/franchise-policy`; POST `/publish`
- GET `/api/v1/me/franchise-applications`
- POST `/api/v1/franchise-applications/:id/documents`
- POST `/api/v1/franchise-applications/:id/activate` (free pathway; paid capture cannot be bypassed)
- POST `/api/v1/franchise-applications/:id/renewal-agreement`
- POST `/api/v1/franchise-applications/:id/renew` (zero-fee renewal)
- POST `/api/v1/admin/franchise-applications/:id/documents/review`
- POST `/api/v1/admin/franchise-applications/:id/renewal-review`

Paid `product.kind` values are `franchise_joining` and `franchise_renewal`; they use the existing `/orders` and verification/reconciliation endpoints. Browser order recovery includes the immutable purchase-period slot. General business-policy saves cannot publish/replace managed franchise terms through a second route and preserve existing workflow policies when updating unrelated settings.

## Validation evidence

All database tests used fresh synthetic local databases on a task-owned MongoDB 8.0.34 instance at port 27323. Existing fixture cleanup removed synthetic records. No configured application/remote database was directly connected to or modified by test fixtures. Fake clean scanner and fake payment provider were used; these are not real scanner/provider acceptance. There were no external Razorpay, SMTP or FCM calls, live transactions, tunnels, deployments or pushes.

Final completed suites (TAP entries include parent tests):

| Suite | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| New franchise validators/DB/HTTP/recovery tests | 10 | 0 | 0 |
| New policy/mobile applicant/admin browser acceptance | 4 | 0 | 0 |
| Existing registration policy + commerce unit regressions | 20 | 0 | 0 |
| Existing commerce DB/signature/webhook/reconciliation suite | 15 | 0 | 0 |
| Existing business-rule + notification DB suites | 40 | 0 | 0 |
| Existing publishing/media DB + category validator regressions | 13 | 0 | 0 |

Total final evidence: 102 TAP entries passed, zero failed/skipped. This is focused regression evidence, not a claim that every repository test was rerun. The final combined publishing/category/franchise command reports 23 entries, comprising 10 franchise entries and 13 regression entries, counted once above.

Franchise tests cover policy gates, effective dates, immutable versions, auth/CSRF/permissions, ownership, partial invalid institution links, eligibility, revision conflicts, real private PDF bytes, foreign asset rejection, document requirements, corrections/resubmission, free approval activation, paid price authority, duplicate creation/callbacks, invalid signature/foreign order, calendar renewal, grace/manual expiry, duplicate reminders, current-term acceptance, free/paid renewals, suspension/reactivation, financial totals from captured records, duplicate signed webhooks, temporary fulfillment failure and reconciliation, prospective policy preservation and paused new applications.

Browser tests cover main-admin save/publish, independent application draft, actual multipart synthetic PDFs, agreement acceptance, submission, admin document verification, free activation and authoritative applicant refresh. Both 390px and 320px applicant widths fit without horizontal overflow. Desktop admin and mobile applicant screenshots were inspected locally; browser page-error collection was empty. No private account or credential screenshots were taken.

Frontend baseline and final `npm.cmd run build` succeeded. The existing large-bundle warning remains. Git whitespace validation passed; targeted changed-source scans found no private key/live credential literals. Backend/frontend .env and local bootstrap credentials remain Git-ignored and were not modified. No dependencies were changed.

Earlier development browser runs failed before completion: a new screen compared MongoDB owner ID with public account ID and hid the saved application; this was corrected while backend ownership remains enforced. The admin list also needed independent institution names instead of Unknown College. Initial assertion diagnostics and later successful full runs are distinguished above. One business-rule test invocation rejected an incorrectly prefixed synthetic database name before connecting; it was rerun successfully with the required fresh name.

## Remaining operational actions and limits

- Main admin must review and publish actual business policy, privacy notice and agreement. Starting terms are editable suggestions, not legal/invoice compliance certification.
- Existing scanner must be available and supervised for real uploads; infected/error/quarantined files remain blocked. Scan recheck in the applicant screen requires the same session's pending upload reference; clean attached documents persist across reloads.
- Paid flows remain behind the existing rotated-credential/operator Test Mode readiness gates. No real provider-connected franchise payment or external webhook acceptance was performed here. Separately approve operational acceptance when those prerequisites are met. No live mode is enabled.
- Existing background workers must run for durable reconciliation and in-app reminder delivery; affiliation status is computed on read even between worker runs. Email/SMS renewal reminders are not introduced; delivery uses the existing in-app notification system and optional configured push.
- There is no separate franchise staff portal, automatic University/College publication/verification, tax invoice engine, provider refund execution, arbitrary staff permission grant or automatic deletion of franchise evidence. Expiry changes franchise affiliation only and does not revoke unrelated paid student learning access.
- Legacy applications preserve their prior review-only meaning. They are not migrated or granted affiliation without new policy acceptance.
- The policy manager and general business-policy editor share a revision guard. Reload settings before editing a different panel after a save; stale saves fail with a conflict instead of overwriting terms.
- Code/tests/docs remain uncommitted, including preserved earlier category changes. No commit, push or deployment was requested/performed for this task.
