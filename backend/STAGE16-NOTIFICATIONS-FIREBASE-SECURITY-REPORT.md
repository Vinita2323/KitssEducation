# Stage 16 - Notifications, Firebase security and integration acceptance

Date: 26 October 2026. Repository: KITSS Education, local main. Baseline: f47897f.

## Outcome

Notification architecture: COMPLETE for the supported software scope. In-app notifications, security and isolated MongoDB acceptance: PASSED. Optional Firebase adapter and browser wiring: tested with synthetic transport / disabled delivery. Real Firebase integration acceptance: BLOCKED pending separately authorized project/device delivery. Firebase dependency findings: RESOLVED in the final audited lockfile. No production-release acceptance is claimed.

## Initial worktree and ownership

The worktree was dirty before Stage 16. The owner explicitly answered: Yes, include and safely modify all existing notification/Firebase work. No reset, clean, stash, checkout-over, amend or unrelated work removal was used.

Pre-existing tracked modifications reviewed and included:

- .gitignore; backend/.env.example; backend/package.json and package-lock.json.
- backend/src/config/env.js; backend/src/modules/notifications/notifications.js; backend/src/server.js.
- frontend/.env.example; frontend/package.json and package-lock.json; frontend/src/App.jsx; frontend/src/modules/user/pages/notifications/NotificationsPage.jsx.

Pre-existing untracked files reviewed and included:

- PUSH_NOTIFICATIONS_SOP.md.
- backend/src/modules/notifications/fcm.service.js, fcmToken.model.js and firebaseAdmin.js; backend/tests/fcm.test.js.
- frontend/public/firebase-messaging-sw.js; frontend/src/modules/user/components/notifications/PushNotificationManager.jsx.
- frontend/src/modules/user/services/pushNotificationService.js; frontend/src/shared/push/firebase.js.

The notification feature intent, existing UI, API contracts and modular monolith were preserved. Unsafe token logging, account-agnostic token caching, direct non-CSRF writes, unconditional permission-driven activation, sensitive push bodies, arbitrary worker navigation, non-durable microtask delivery and misleading fallback test counts were replaced. The generic SOP was rewritten to describe this repository's actual implementation and gates. The legacy CDN worker is retained as a harmless retired stub; the active worker is bundled from source.

Additional Stage 16 changes are the business-event mapper, durable delivery/event handling, safe logger redaction, existing Job kind extension, logout integration, test fixture options, focused MongoDB tests, expanded browser tests, read-only Operations API/UI notification-kind filters, README/report/matrix/checklist. No business payment/authentication system was duplicated. Private .env files, media settings, real application records, existing ClamAV service and unrelated business/UI functionality were left untouched. Lockfile review found no upgrades to existing dependencies relative to baseline HEAD; Firebase additions/remediation are separately described below.

## Existing architecture and changes

Notification and NotificationReceipt already provide published announcements, typed audiences, pagination, preference filtering, current-course eligibility, unread counts, unique owner receipts, idempotent read/read-all, safe links, archive, revision conflicts, audit and backend notification read/write/publish permissions. Existing admin composer and header remain in use (F23, A66-A68, G14, B34).

Business writes continue to commit their existing embedded audit outbox atomically with state. Existing maintenance drains AuditLog. The notification consumer reads eligible committed events and records processed event markers in the existing jobs collection. A persistent first-activation timestamp deliberately excludes historical backfill. Unique source event IDs and semantic order capture/fulfillment keys prevent repeated provider observations from creating duplicate in-app notices. A database failure before the event marker remains retryable; duplicate notice upserts are safe. Delivery never participates in, rolls back or authorizes a payment/registration decision.

Published notices enumerate recipients in bounded pages. Current audiences, category preferences, course access and account/session eligibility are checked before enqueue/send. Only devices registered before publication are considered, so a new opt-in does not replay historical notices. Device jobs reuse jobs, unique keys, atomic leases, bounded backoff, eight-attempt dead lettering and sanitized failure codes. Existing permissioned Operations Jobs exposes safe state/attempt metadata; its API and existing selector now accept notification_event / notification_push filters without exposing job payloads. The existing 15-second worker loop catches payment and notification processing failures separately. No new queue service or duplicate business model was introduced.

In-app creation is idempotent. External FCM acceptance and database acknowledgement cannot be atomic: push is at least once, with stable notification tags to reduce duplicate tray entries. A crash after provider acceptance can repeat a push. Dead-job investigation, retention, production query/index/capacity profiling and any authorized replay remain operational tasks.

## Business workflow evidence

| Supported event | Implemented semantics / evidence |
|---|---|
| Registration submitted, needs changes, rejected, approved, activated | Real policy-gated services and audit consumption exercised on isolated records; history-derived notices reflect committed state. Fee/guardian/document/review gates are unchanged. |
| Payment verified; book/course entitlement applied | Synthetic signed capture evidence passes the existing verification service; capture and fulfillment have separate deduplicated messages; messages explicitly identify simulated test payments. No optimistic client success grants access. |
| Free book/course access | Actual audited free access services exercised; notices do not fabricate paid orders. Course preferences apply to course notices; book notices use general category. |
| Refund requested/reviewed | Real review workflow exercised; providerStatus remains not_executed and capture/access are preserved. No provider-completed refund message exists. |
| Franchise reviewed | Persisted synthetic pending review exercised through existing review service; notice explicitly retains the official affiliation block. This does not certify the complete franchise submission workflow anew. |
| Academic result submitted/approved/rejected | Mapper targets main-admin submission review and linked candidate/submitter review notices. Actual submission/approval exercised, with publication still rejected by the trusted-source gate. Existing full regression also covers rejection/RBAC. No marks, proofs or private source documents enter push. |
| Staff invitation/account changes | Actual invitation with fake mail and actual account suspension exercised; notices consume existing audit events. Session invalidation remains authoritative. Email invitation remains the private activation mechanism. |
| Course expiry reminder | No existing scheduler was identified; no new reminder policy or scheduler was invented. |

## Device and browser security

FCM tokens are bounded, validated, globally unique, hidden by default in Mongoose queries and absent from HTTP DTOs/job summaries/logs. Registration accepts only token/platform/device label, uses authenticated session identity and rate limits, and caps devices per user at ten. Active cross-account takeover is rejected; removal requires the same account/session. Every send checks user status/email verification, security version, session owner/expiry/idle/revocation and the current student session pointer. Invalid provider tokens are deleted; other failures retry without raw errors.

Browser writes use the shared authenticatedWrite CSRF/Origin/session mechanism and identity epoch. Pending registration cannot bind a token after an account change. No localStorage shortcut treats another account's token as already registered. Enable requires an explicit user action and successful backend registration; browser permission alone never displays active status. No automatic permission request or token registration runs on login. Explicit Disable deregisters/deletes the SDK token. Logout attempts server deregistration before session revocation and does not wait on Firebase; failed deregistration cannot restore a revoked session. Messages already accepted by FCM cannot be recalled.

Foreground messages trigger an authoritative in-app refresh event without logging payloads or displaying private provider content. Async listener teardown handles an unmount/account change. Push uses only a generic KITSS prompt, opaque notification ID and fixed /notifications navigation. The bundled worker cannot open a payload-supplied external URL. Notification text uses React text rendering; script-like content is inert. List items now support Enter/Space and keyboard focus. Unsupported/denied browser push never prevents in-app use. Existing page styling and routes were preserved.

Known consent limitation: Enable is explicit again after a reload; Firebase may retain its own IndexedDB registration. This is not shown as proof of active server binding. Real browser/device permission and background receipt acceptance remain unexecuted.

## Dependency investigation and remediation

Initial side-work tree: firebase 13.1.0, @firebase/app 0.16.4, @firebase/messaging 0.13.3, @firebase/firestore 4.19.0, @firebase/firestore-compat 0.4.16, @grpc/grpc-js 1.9.16. The installed App component required Node >=24.12, conflicting with the existing pinned Node 22 runtime. Backend firebase-admin was 14.5.0 and its audited dependency tree was clean.

The four frontend high audit entries represented the Firebase -> Firestore/compat -> gRPC dependency chain and two upstream advisories, not four independent exploitable browser defects:

- [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j): server-side certificate auth context issue, upstream high severity; fixed in 1.13.6 / 1.14.5.
- [GHSA-f596-whhp-79r4](https://github.com/advisories/GHSA-f596-whhp-79r4): server-handler error-detail disclosure, upstream low severity; same fixed releases. npm's aggregate chain entries inherited the higher severity.

The application imports App/Messaging only. It does not import Firestore, run a gRPC server or use the affected server configurations. Source/import review supports low reachability here; this inference did not justify leaving the vulnerable installed tree untouched.

Final choice: pinned public firebase **12.19.0**, with App **0.16.2** (Node >=20) and Messaging **0.13.3**, preserving Node **22.15.0**. Its transitive Firestore **4.17.2** / compat **0.4.14** use a targeted npm override to patched **@grpc/grpc-js 1.14.6** (Node >=12.10). Backend firebase-admin is pinned **14.5.0** (Node >=22). No unrelated dependency upgrades, forced audit fix, audit suppression or Node runtime migration occurred. Both lockfiles were regenerated using npm.

A temporary direct-component approach was rejected during review because those packages document themselves as internal-only. Final source uses the [official public Firebase entry points](https://firebase.google.com/docs/web/setup), and the active worker bundles the same component versions. Removing the umbrella would require retaining internal-only dependencies; the final override instead fixes the unused installed server path. The override exceeds Firestore's declared older minor range within gRPC 1.x: the app does not execute this path, so no Firestore/server acceptance is claimed. Reassess/remove the override when upstream permits a patched dependency; separately validate it before any future Firestore feature.

Final npm audits: backend **0** vulnerabilities; frontend **0** vulnerabilities, including zero high/critical. Installed-tree inspection confirmed the patched override. Existing large frontend chunk warning remains; it is not a vulnerability or failed build.

## Firebase and local configuration

backend/.env.example documents FIREBASE_SERVICE_ACCOUNT_PATH or server-only FIREBASE_CONFIG, FIREBASE_PUSH_ENABLED=false and NOTIFICATION_BUSINESS_EVENTS_ENABLED=true. frontend/.env.example documents public VITE_FIREBASE_* identifiers/VAPID key and VITE_FIREBASE_PUSH_ENABLED=false. Central validation rejects malformed boolean gates. Private Firebase fields are covered by structured-log redaction.

Both local .env files remain ignored and were not edited. Existing backend private Firebase configuration is present but was neither validated against a live project nor used. Both live-delivery gates remain false by default; no production credentials were added. Common private service-account file patterns are ignored. Custom credential paths still require explicit ignore/access-control review. Supported HTTPS/localhost, browser Push API, authorized Firebase project/domain/API settings and actual device receipt remain prerequisites. See [operations](../PUSH_NOTIFICATIONS_SOP.md) for consent, rollover and queue details.

## Real MongoDB and regression evidence

Task-created MongoDB **7.0.24** ran only on **127.0.0.1:27246**, with a fresh ignored task-owned dbpath and fresh guarded synthetic databases. Existing application MongoDB was never selected. On final resumption the task MongoDB was already stopped and the previously recorded ClamAV PID was absent. No Stage 16 action terminated ClamAV. Its existing daemon was restored using the unchanged Stage 15 loopback configuration; readiness was checked separately from media acceptance tests. Fixtures refused occupied test databases and cleaned only synthetic records/temp media. No collection limit workaround deleted existing application data.

| Executed run | Actual result | Qualification |
|---|---|---|
| Complete backend regression, npm test | **217 passed, 0 failed, 3 skipped**, 220 TAP entries including parents | Real isolated auth/institution/publishing/commerce/coaching/result/account/policy/RBAC/video workflows; payment/mail/scanner doubles except explicitly supplied actual FFmpeg/FFprobe tool test. |
| Shared HTTP client, npm run test:client | **8 passed, 0 failed, 0 skipped** | Separate shared-client suite. |
| Final Stage 16 focused FCM + real MongoDB acceptance | **29 passed, 0 failed, 0 skipped** | Includes parent entries, five adapter/config/payload units and two database parents with 22 child workflows. Covers ownership, reads, replay, retry, lease recovery, simulated database outage, preferences, session/account revocation, expiration/security versions, invalid-token cleanup, CSRF/RBAC, private payloads, business lifecycles and operation without Firebase. |
| Expanded full Stage 8 Chrome suite | **17 passed, 0 failed, 0 skipped** | 16 child scenarios plus parent; all eight widths 320/375/390/414/768/1024/1280/1440. Synthetic mail/source/scanner; external browser traffic blocked. |
| Final public-package Chrome focused run | **5 passed, 0 failed, 0 skipped** | Four child scenarios plus parent: long/inert text + keyboard read; denied/unsupported Notification API; registration/book/course/orders/admin navigation + real session logout; failed notification service. |
| Final admin Operations MongoDB/HTTP regression | **6 passed, 0 failed, 0 skipped** | Includes notification-kind filters, private-field exclusion and existing account/RBAC behavior; overlaps the broad regression. |
| Final frontend production build | **PASSED** | Public Firebase entry points and bundled worker; existing chunk-size warning only. |
| Backend / frontend npm audit | **0 / 0 vulnerabilities** | Final compatible dependency choices; no suppressed findings. |

Focused runs overlap the broad runs and are not added into one passing-test total. The full backend run preceded the last focused coverage additions/category refinement and Operations kind-filter correction; final focused notification acceptance and the six-entry Operations regression cover those changes. The eight-width browser run used the same App/Messaging component versions before the public-wrapper correction; the final focused run/build verify the corrected imports. Earlier focused/permission/navigation runs also passed and are superseded by the final focused evidence, not added again. Across browser runs there are 18 distinct child scenarios; TAP parent entries and reruns are not distinct extra workflows.

The three backend skips were the optional replica-set connection (no replica-set opt-in), separate real-media acceptance (not opted in for this standalone regression), and live SMTP (deliberately disabled). They are not reported as passes. Stage 15 real-scanner evidence remains separate and was not rerun/claimed here; its daemon/configuration was preserved. No real Razorpay or Firebase acceptance occurred. Local audit JSON decoding and source-scan encoding handling were corrected before final checks. On final resumption the absent scanner was restored: an early PING occurred during signature loading and failed, then configured readiness returned PONG. A standalone version diagnostic without the explicit configuration reported the missing default config; it was not treated as media acceptance. No application test failure was concealed. Source/build/stage-specific log secret scanning and staged review are described below.

Commands (set fresh isolated DB opt-ins first; never use application database):

```powershell
# backend; full run additionally sets each suite's unique guarded KITSS_*_TEST_DB
npm.cmd test
npm.cmd run test:client
node --test tests/fcm.test.js tests/notifications.mongodb.integration.test.js
# frontend; set fresh KITSS_STAGE8_BROWSER_DB and local MongoDB override
npm.cmd run test:stage8
# final focused browser run used KITSS_STAGE8_BROWSER_FOCUS with the four named cases
npm.cmd run build
npm.cmd --prefix ../backend audit --json
npm.cmd audit --json
```

Final targeted admin browser rerun also verifies notification_push selection returns HTTP 200 and logout revokes the actual session; this repeats the navigation child scenario rather than adding a distinct scenario.

Full-run suite opt-ins: KITSS_AUTH_TEST_DB (stage3 prefix), KITSS_STAGE4_TEST_DB (stage4 prefix), KITSS_STAGE5_TEST_DB, KITSS_STAGE6_TEST_DB, KITSS_STAGE7_TEST_DB, KITSS_STAGE8_TEST_DB, KITSS_STAGE10_TEST_DB, KITSS_DASHBOARD_TEST_DB, KITSS_VIDEO_TEST_DB, KITSS_STAGE13_TEST_DB, KITSS_STAGE14_TEST_DB, KITSS_STAGE10_INTAKE_TEST_DB, KITSS_RAZORPAY_ACCEPTANCE_DB and KITSS_NOTIFICATIONS_TEST_DB (fresh guarded stage10 prefixes for the remaining suites). MONGODB_URI, MONGODB_AUTH_TEST_URI and MONGODB_STAGE4_TEST_URI explicitly targeted this task's loopback instance. Actual installed MEDIA_FFMPEG_PATH / MEDIA_FFPROBE_PATH were exported only for the regression process. Live SMTP/media/FCM opt-ins stayed false. The synthetic Razorpay adapter acceptance never made provider requests.

## Security review and local commit

Real .env/runtime/storage/build/browser artifact paths remain ignored; no private configuration or test artifacts belong in the commit. Source, built assets and Stage 16 logs were scanned in memory against configured private credential values and private-key markers, without displaying any values. Common service account files are ignored. No configured secret match was found. Commit staging additionally checks excluded paths, configured/legacy credentials and git diff --cached --check.

The local commit includes only explicitly owner-approved notification/Firebase work and the Stage 16 hardening/tests/docs. The commit hash and final clean/dirty status are reported in the task completion response; the report does not embed its own future commit hash. No unrelated paths are intended to remain uncommitted. Ignored private runtime evidence, synthetic MongoDB data and existing .env files remain outside Git.

## Remaining gates and next stage

1. Separately authorize actual Firebase project/device acceptance, approved recipient/device and delivery budget; privately validate least-privilege credentials/domain/VAPID configuration. Confirm foreground/background receipt on supported physical browsers/devices. No real FCM receipt is verified by this stage.
2. Before starting against an existing application DB, review collection capacity and legacy token index conflicts/session-less rows. No automatic deletion/migration was performed. Existing legacy device rows are ineligible and require safe re-enrollment; duplicate tokens deliberately fail unique-index startup rather than silently changing owners.
3. Review queue backlog/dead jobs, retention, query indexes/capacity, monitoring, provider at-least-once behavior and authorized retry procedures before production. Initial activation does not backfill historical business events.
4. Preserve Stage 12 real Razorpay acceptance, business/legal/tax/refund-provider/franchise-affiliation/result-source/privacy gates and Stage 15 licensed-content/scanner-maintenance/backup/deployment gates. Notifications do not close any of them.

Recommended next stage: owner-approved operational acceptance and rollout planning for optional real FCM, existing-data compatibility and remaining provider/business gates. No automatic next-stage work is authorized. No push to GitHub, deployment, public tunnel, live SMTP, real payment, live FCM or Firebase project changes occurred. Stop after Stage 16.
