# Stage 8 implementation report - 25 October 2026

Stage 8 adds the results preparation/access infrastructure, persisted targeted notifications, and secure profile/preferences/email-change integration to the existing JavaScript modular monolith. Existing routes, navy/orange styling, shared client, session/Origin/CSRF/RBAC and media/commerce boundaries are retained. No dependencies, environment secrets or payment settings were changed. Stage 9 has not started.

## Completed scope and boundaries

- **F22 / A62-A65, G12-G13, B25-B30:** issuer/exam configuration, private scanned JSON import with mandatory dry run, validated candidate records, exact account-owned lookup, history, immutable correction drafts, reasoned withdrawal and audit review. Marks/totals reconcile; grades/status come from the imported source. Current lookup conservatively requires an existing verified candidate account plus issuer verification fields. No public candidate search, generated marks, exam scraping or external issuer integration exists.
- **Official publication remains disabled.** No approved trusted issuer/source authorization was supplied. Admin source text and `sourceApproval` cannot enable it. Both exam/result publication and available-result lookup enforce the closed production source boundary. End-to-end published-result/print/PDF tests use an explicitly injected synthetic source adapter only in isolated databases. They do not establish real issuer verification or authorize release. Real access/source authorization, grading/privacy/retention rules and licensed provenance remain owner decisions.
- **F23 / A66-A68, G14/B34:** draft/edit/archive, targeted publication, owner receipts, pagination, authoritative unread totals, persistent read-one/all and real header/page integration. Targets are all students, explicit active users or currently entitled course learners. Category preferences apply; general targeted notices remain visible. Published notices are immutable. No push/WebSockets/platform was introduced.
- **F24 / A10-A14:** allowlisted profile updates, typed preferences on User, current-password email reauthentication, SMTP code to the new address, single-use/expiry/attempt/session/version checks, unique email update and session invalidation. Existing password and OTP authentication remains in use. Failed SMTP or invalid proof never changes identity. Profile/settings now show real save results; local cache clearing accurately removes only saved browser course-filter preferences. Avatar uploads and reward/streak systems are not implemented.

Results render only returned stored records. The marksheet retains table/summary and existing print/PDF controls while removing dummy identity photos and invented official/digital-signature/QR claims. Academic versions and mutation CAS tokens are separate (`revision` / returned `expectedRevision`). Source import files retain private candidate data and need an approved retention/deletion policy before real intake. A source checksum establishes file consistency, not issuer authenticity. JSON mapping v1 currently supports integer marks; CSV/external adapters and issuer-specific grade calculation are not implemented.

## Files and integration

| Area | Files |
|---|---|
| Results | New `src/modules/results/{results.models.js,results.service.js,results.routes.js}` |
| Notifications | New `src/modules/notifications/notifications.js` |
| Account | New `src/modules/auth/account.service.js`; existing auth models/service/security and SMTP message subjects |
| Composition | Existing `src/app.js`, `src/server.js` |
| Shared safety | Media service/probe worker add private `result_import`; publishing coordination serializes audit subdocuments explicitly; existing commerce Job supports completed import receipts and payment workers/summaries filter payment_event |
| User UI | Existing ResultsPage/ResultMarksheet/resultService, NotificationsPage/notificationService/AppHeader, ProfilePage/SettingsPage, authService/AuthContext; new EmailChangeForm |
| Admin UI | New AdminResultsPage/AdminNotificationsPage; existing AdminRoutes/AdminLayout/MediaPicker; frontend test script |
| Verification | New Stage 8 backend fixture/integration tests, browser suite, `scripts/verify-stage8-development.js`; existing guarded maintenance tool adds Stage 8 ownership/evidence mode; auth browser test double/synchronization |
| Documentation | Backend README/import runbook, this report, safe database evidence, master checklist |

Backend paths are relative to backend; frontend files remain in the existing application. Earlier uncommitted Stage 1-7 work was preserved; no reset, staging, commit or deployment occurred.

## Database and actual-host acceptance

Six collections are necessary: resultIssuers, exams, resultRecords, resultHistory, notifications, notificationReceipts. Unique indexes protect issuer keys, issuer/exam keys, candidate academic versions, one published version, owner history and notification receipts. User gains profile/preferences/embedded email-change proof; the existing Job stores completed import receipts. No duplicate identity/payment/queue system was added. Audit outboxes retry at startup and maintenance; source references protect deletion of imported files.

[Configured-host evidence](STAGE8-DEVELOPMENT-VERIFICATION.json): actual kitss_education_dev startup/restart/readiness passed; **32 application collections**, result publication and Razorpay disabled, notices/preferences protected. No real application user/result/notification/enrollment fixture was created. Environment URI/topology and existing application records were retained. After test writers stopped, verified private backups preceded removal of **11 disposable project test databases / 271 collections**. Post-cleanup checks found zero guarded test databases, 32 application collections with unchanged record/index counts, and the same two unrelated server resources retained. See [backup/cleanup evidence](STAGE8-DATABASE-CLEANUP.json). No application database reset occurred.

## Tests and review

| Check | Actual result |
|---|---|
| Baseline backend | 45 tests: 39 passed, 6 opt-in database suites skipped, 0 failed |
| Baseline frontend build | Passed |
| Final full backend, isolated Stage 3-8 MongoDB | **120 tests: 119 passed, 1 optional replica-set test skipped, 0 failed**; 552.69 seconds |
| Stage 8 slice within full regression | 13 passed (12 workflows plus parent), 0 failed/skipped |
| Shared HTTP client | 8 passed, 0 failed/skipped |
| Results/export/admin/recipient browser workflows | Each passed against real HTTP/MongoDB with isolated synthetic source/mail/scanner; broader runs also exposed reload synchronization defects in test assertions |
| Final focused Stage 8 browser | **5 passed, 0 failed/skipped**: profile/preferences persistence, 375/1440 layouts and email confirmation; selected with KITSS_STAGE8_BROWSER_FOCUS |
| Authentication browser regression | Mobile: 8 passed within the earlier combined run; final desktop-only rerun: 8 passed, 0 failed/skipped. Initial desktop navigation timeout is disclosed below. |
| Final frontend build | Passed; 24.70 seconds; existing large main-chunk warning |
| Backend/frontend dependency audits | 0 vulnerabilities each; no dependency changes |
| Secret/diff review | 286 shareable text source/documentation/bundle files compared against configured secrets and the exposed legacy secret in memory: zero matches; git diff --check passed. This targeted check is not a complete Git-history/security audit. |

The broader Stage 8 browser attempts are not reported as all-pass runs: each had one failing profile/preferences child (6 passed/2 failed counting parent). The first reloaded before save completed; the second asserted before refreshed preference controls loaded. The focused rerun waits for successful writes and hydrated controls, with unchanged persistence assertions. All seven distinct Stage 8 journeys were exercised across those runs. No large unchanged Stage 4-7 browser suites were repeated; full backend regressions cover their security/data contracts. Mobile/desktop forms were checked for overflow and screenshots visually inspected.

The initial auth browser run had a desktop staff navigation timeout (combined 14 passed/2 failed counting parent); its mobile portion passed. The desktop rerun represents the new notifications API in the HTTP double and waits for login responses, retaining session/RBAC assertions.

Initial backend failures exposed internal ObjectId normalization and a shared audit serializer that dropped Mongoose subdocument fields; both were fixed. The final regression verifies correction/withdrawal audit actions. The serializer correction applies to new audit deliveries; prior missing audit fields are not reconstructed or silently backfilled. A count-only actual-host check found zero existing application audit entries missing an action field. Failed/expired SMTP proofs, cross-account lookup/read denial, unapproved publication, invalid totals/source/candidate data, CSRF/Origin/RBAC, payment-worker isolation and payment/enrollment invariants are covered. No real provider calls, live payments or real email delivery occurred. The optional replica-set test was not executed; standalone compatibility from Stage 7 remains separate historical evidence.

Commands from repository root:

```powershell
# Supply fresh guarded KITSS_AUTH_TEST_DB and KITSS_STAGE4_TEST_DB ... KITSS_STAGE8_TEST_DB.
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:client
# Fresh KITSS_STAGE8_BROWSER_DB, optional explicit KITSS_STAGE8_BROWSER_FOCUS:
npm.cmd --prefix frontend run test:stage8
npm.cmd --prefix frontend run test:auth
npm.cmd run build
npm.cmd --prefix backend audit
npm.cmd --prefix frontend audit
node backend/scripts/verify-stage8-development.js --confirm-development
```

## Remaining gates and Stage 9

Owner-approved trusted result source/verification/privacy/retention and real issuer acceptance are required before enabling publication. Real SMTP/app-password delivery, scanner installation/signatures, licensed content, production backup/operations and existing financial/registration decisions remain pending. Razorpay requires compromised-key revocation/rotation and provider-connected acceptance; it remains disabled. No video, renewals, manual grants, certificates, external exam adapter or production deployment was added.

The implemented Stage 8 slice is ready for review after the recorded checks, with official results deliberately gated. Stage 9 integration/release review may be separately approved; unresolved production gates must remain explicit. **Stop after Stage 8; Stage 9 requires owner approval.**
