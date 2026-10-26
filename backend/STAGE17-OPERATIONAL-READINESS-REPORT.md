# Stage 17 - Database safety and local operational readiness

Date: 27 October 2026 (Asia/Calcutta; work began 26 October). Baseline: `5d4cbba`, branch `main`. Initial tracked/untracked working tree: clean.

## 1. Outcome and scope

The authorized local software and synthetic recovery acceptance is complete. Backup/restore, migration compatibility, device safety, startup/shutdown, background queues, real media tools/storage checks, browser QA, build and regression passed at the scopes below. **Existing application-database inventory, backup, restore and compatibility remain BLOCKED:** its configured connection is non-loopback, and this stage explicitly excluded remote/shared/insufficiently identified databases. No existing application database or media files were changed. This report does not claim production disaster recovery or real-provider acceptance.

## 2. Application database inventory

The configured database name is `kitss_education_dev` (configuration only). No connection was attempted to it. The owner confirmed development/test data, but the explicit remote-database exclusion still applies, and a development-looking name alone does not prove safety. Its current version, collections/counts/indexes, size, actual legacy shapes and collection capacity are **not verified**. Previous collection-limit concerns were not re-queried. No URI, hostname, credential, user identity or record contents are included here.

A task-created MongoDB 7.0.24 instance on loopback port 27247 was used instead. Every ordinary fixture used a fresh guarded namespace and refused an occupied database. Restores used separate `kitss_stage17_restore_<16 hex>` namespaces. An additional task-owned process on port 27248 was used only for abrupt-interruption/restart tests. No topology change, microservice or permanent service was introduced. After acceptance, the recorded Stage 17 MongoDB process was verified against its command/data root/port and stopped; the interruption-test child was closed by its test. Existing ClamAV PID 2612 remained running, and database archives were retained.

## 3. Synthetic inventory and backup coverage

The final real-scanned recovery fixture contained **34 collections / 114 documents**, **42285 logical data bytes** and **139264 allocated storage bytes** at the backup checkpoint. Roles were counted, not identified: two students and one super admin. The fixture included three orders (two synthetically verified captured, one unpaid pending), one book entitlement, one enrollment, one unapproved registration, one draft result, two device rows (one legacy/unbound), seven notices, nine jobs and six media records. This is fixture evidence, not an application-data inventory.

| Collection | Documents | Indexes before restored-copy retirement |
|---|---:|---:|
| accessRequests | 0 | 2 |
| admissionApplications | 0 | 4 |
| auditlogs | 53 | 1 |
| auththrottles | 13 | 2 |
| banners | 0 | 2 |
| bookEntitlements | 1 | 4 |
| books | 1 | 3 |
| coachingCourses | 1 | 2 |
| collegePrograms | 0 | 3 |
| colleges | 0 | 5 |
| coursePlans | 1 | 2 |
| domainLocks | 1 | 1 |
| enrollments | 1 | 5 |
| exams | 1 | 2 |
| facultyProfiles | 1 | 2 |
| fcmTokens | 2 | 3 |
| franchiseApplications | 0 | 4 |
| jobs | 9 | 3 |
| learningProgress | 0 | 3 |
| lessons | 2 | 2 |
| mediaAssets | 6 | 5 |
| notificationReceipts | 0 | 3 |
| notifications | 7 | 4 |
| orders | 3 | 14 |
| pageContents | 0 | 2 |
| registrationApplications | 1 | 3 |
| resultHistory | 0 | 2 |
| resultIssuers | 1 | 2 |
| resultRecords | 1 | 4 |
| sessions | 3 | 4 |
| siteSettings | 1 | 2 |
| taxonomies | 1 | 3 |
| universities | 0 | 3 |
| users | 3 | 9 |

The retained manifest includes actual source server version, collection options, complete index definitions, counts and canonical BSON fingerprints of every document. Relationship checks compare order/user, book/user/order entitlement, course/user enrollment, registration/user and book/media references without exposing identifiers. Settings, audits, jobs, embedded outboxes and optional legacy fields are covered by exact restore fingerprints.

## 4. Backup tooling, location and integrity

Installed MongoDB Database Tools **100.14.1** (`mongodump`, `mongorestore`) were exercised successfully against MongoDB **7.0.24**. No dependency or system-wide tool installation/upgrade occurred. Tool/server compatibility was verified for this actual pair; compatibility with other versions is not claimed. Official references: [Database Tools](https://www.mongodb.com/docs/database-tools/), [mongodump](https://www.mongodb.com/docs/database-tools/mongodump/), [mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/). Revalidate current tool security/support before operational rollout and accept only trusted archives.

Final accepted synthetic archive directory, relative to repository root:

`.runtime/backups/2026-10-26T18-53-11-218Z-a5229f04-ea6e-402c-9875-7b12fb6c3558`

Archive: `database.archive.gz`, **13558 bytes**. SHA-256:

`c230018db092a884b00dee025e8123d6fd00a9840e4c2fe441df627aefa43744`

Backups are retained outside Git/public serving under `.runtime/backups/`. Completed manifests are written only after successful official-tool exit, nonempty archive, and matching before/after collection/document/index fingerprints. Archive hashing streams data. Failed dumps leave incomplete private artifacts without a completed manifest; they are not called successful backups. This is a **quiesced standalone logical backup**: writers must be stopped; the flag is an operator assertion, not an online snapshot/lock mechanism.

## 5. Restore evidence and exclusions

Restore checks the archive hash/size, refuses unsafe/same/occupied namespaces, reserves a fresh destination atomically, uses namespace mapping and `--stopOnError`, and never uses `--drop`. All 34 source collections, counts, options, index definitions and BSON document fingerprints matched before application startup. The one intentional additional collection is `_kitss_restore_guard`, retained as recovery evidence. Relationships, settings, audit and job records were preserved.

A corrupt copied archive was rejected before restore. A failed tool left only its owned reservation; retry into that occupied target was rejected. Recovery is to preserve archive/partial target, investigate privately and select a **new** guarded destination. No existing namespace is automatically emptied. The source fixture's records/indexes were unchanged by backup/restore/migration at its comparison checkpoint; ordinary fixture cleanup later removed only task-created synthetic records/temp files.

This is not a complete system backup. Filesystem media, private environment/secret configuration, external services, replica-set oplog and point-in-time recovery are excluded. A separate synthetic media copy was used for restored startup/destructive tests and cleaned as task-owned temporary data; it is not a retained application-media backup. Production retention, encryption/access-control verification, RPO/RTO, replica-set/PITR and full-system restore drills remain open.

## 6. Compatibility implementation

Existing architecture/models and business semantics were reused. Added local recovery helpers and a narrow CLI with no implicit .env database fallback. It only accepts explicitly confirmed credential-free loopback kitss namespaces; authenticated/remote URI support is deliberately unavailable. Restored application startup injected the synthetic payment provider, disabled private mail configuration and disabled Firebase delivery. No configured real-provider worker was started.

Restored startup was executed twice. Protected snapshots compared roles/permissions, order capture/amount/fulfillment, entitlement sources/owners, registration states, draft result review/publication, token ownership/binding and job states. They remained unchanged. The unpaid order remained pending and had no book entitlement; no registration approval, result publication or account escalation was introduced. Expected authentication/maintenance metadata updates are distinguished from authority changes; exact pre-start restore fingerprints are stronger than the later targeted authority comparison.

## 7. Legacy-index safety

The previous code retired indexes by name/uniqueness alone. A verified synthetic unexpected-definition case showed that could discard a differently defined operator constraint with the same name. The shared helper now verifies exact key order and explicitly allowed partial/sparse options. Replacement constraints are installed first; only known old order/book/enrollment indexes are retired. Unexpected definitions fail safely with `INDEX_COMPATIBILITY`, without deleting documents or broad `syncIndexes` calls.

Four deliberately seeded legacy unique constraints were preserved in the source backup and retired only on the restored copy; second startup was idempotent. Existing Stage 13 legacy-index regression passed in the complete backend run. No original application index migration was executed.

## 8. Notification-token compatibility

Read-only compatibility reporting counts duplicate token groups, unbound legacy rows, duplicate job keys, missing policy configuration and known obsolete indexes without printing token values. A legacy row without session/security version remained ineligible and unchanged through two startups. A duplicate ownership conflict deliberately introduced on the restored copy blocked startup with safe `PUSH_INDEX_COMPATIBILITY`; both conflicting rows/owners were preserved. No automatic deletion or reassignment occurs. Actual application token/index data remains uninspected.

## 9. Startup, shutdown and interruption

Background interval work now has explicit in-flight ownership and drain state. Shutdown stops future ticks, waits for active worker work and in-flight HTTP, then disconnects MongoDB. Existing bounded deadline and signal-handler behavior remain. Worker tasks catch safe failures individually so a payment-processing failure does not starve notification/audit maintenance. State exposes timestamps/failure counts without raw errors.

Tests covered dependency startup failure, idempotent close, actual HTTP draining, worker drain, malformed delivery flags, missing optional Firebase, unavailable processors/scanner, safe recovery connection errors and installed SIGINT/SIGTERM handler logic. A task-owned real MongoDB process was interrupted and restarted using the same journaled directory; durable data survived, unavailable startup failed safely, and connectivity/readiness recovered. Both spawned process identity and port ownership were checked; unrelated services were not killed.

Signal handlers are exercised with emitted events and actual in-process runtime close. Native Windows console/service/supervisor control delivery is not certified by those tests. Stuck-dependency shutdown is bounded and requests CLI failure exit; graceful completion is not falsely claimed for an intentionally stuck dependency.

## 10. Queue/outbox reliability

Existing Job kinds, payment reconciliation, result import isolation, audit journals and notification idempotency remain authoritative. Real MongoDB tests exercised: persisted pending work before processing; provider failure; two contenders for one lease; expired lease reclamation; eight-attempt dead lettering/backoff; a new worker service instance; duplicate business-event handling; audit flush failure; actual Mongoose driver disconnect/reconnect; and successful retry without losing committed notices. No double paid fulfillment/access grant was observed in existing and focused commerce/notification regressions.

Worker-instance restarts are synthetic service-lifecycle tests, separately from the actual MongoDB process interruption. External provider delivery remains synthetic/unexecuted. Exactly-once FCM delivery is not claimed: a crash between provider acceptance and DB acknowledgement can repeat a generic push. The standalone publication mutex intentionally fails closed for an unknown interrupted writer; no unsafe automatic lock-owner clearing was added.

## 11. ClamAV readiness

The existing Stage 15 daemon/configuration was preserved; Stage 17 did not install a service/scheduled task or restart unrelated services. Observed engine: **1.4.6**, signature age approximately **0.52 days** at measurement, local readiness healthy. Existing official FreshClam mirror, seven-day startup signature-age enforcement, scan deadlines/resource bounds and maintenance procedures remain in use. No signature download was necessary or claimed in this stage.

Actual clean-file scans, harmless in-memory detection, unavailable scanner rejection/quarantine, rescan recovery and absolute deadline behavior passed in the separate real-media suite. This is distinct from ordinary regression scanner doubles. Ongoing signature updates/age monitoring and production service supervision remain operator duties; startup age enforcement alone is not an update schedule.

## 12. FFmpeg/FFprobe readiness

Existing absolute paths were reused without editing .env. Both tools reported **9.0** (installed full build). Actual self-generated MP4 metadata probing and complete decoding passed. Invalid/unsupported media, missing processor, timeout/limit, protected range access and cleanup behavior were exercised. No HLS, transcoding platform or new media architecture was introduced. Physical-device/bandwidth/capacity acceptance remains separate.

## 13. Storage integrity and cleanup

Final source fixture dry run: six assets; **zero missing files, checksum mismatches, unsafe references, orphan/staging/symlink findings and deletions**. Copied-root tests independently introduced an orphan, a missing file and checksum corruption; the counts detected each, repairs used only the task copy, and audit itself deleted nothing. Existing referenced-media deletion protections, upload cleanup, quarantine recovery, book/course/private-document authorization and 206/416 tests passed.

No application-storage cleanup occurred. Existing application media was never deleted/copied/rewritten by this stage. Task-created copies and generated fixture roots were safely cleaned using verified temporary-root guards. The dry-run report is candidate evidence, not deletion authorization or a complete cross-module retention policy.

## 14. Monitoring and diagnostics

Extended existing Admin Operations and added permission-protected `GET /api/v1/admin/operations/health`, reusing the shared HTTP client and existing server/router. It reports safe database/storage/free-space readiness, scanner signature status, processor versions/availability, current worker state/failure timestamps, grouped job counts, expired leases, payment-reconciliation counts and pending audit totals across compiled outbox models. No tokens, job payloads, credentials, private documents or full filesystem paths enter that response. Existing Operations/Orders screens remain read-only for queue/financial investigation; no force-paid/grant/retry endpoint was added.

The panel has honest loading/error/degraded states and keyboard refresh. `operations.read` is required by backend, including direct URL access. Public live/ready contracts retain generic process/core database-storage semantics; a ready core API is not certification of media or external delivery. Existing upload/publishing checks remain fail-closed. Diagnostic probes are bounded and briefly cached; deployment monitoring/capacity/SLOs are not supplied by this local panel.

## 15. Browser acceptance

Expanded actual Chrome checks covered Admin Operations/queues, media management, registration review, notification management and existing result screens at **320/375/390/414/768/1024/1280/1440** pixels. Verified readiness panel, simulated diagnostics outage/recovery, keyboard filter/refresh, backend permission denial, responsive forms and no document overflow. Existing UI layouts/routes were preserved.

Separate real-tool browser acceptance exercised actual scanned PDF upload/publication/rendered canvas and MP4 upload/publication/playback/seek/resume/completion with current authorization, touch/mobile and eight-width checks. Browser traffic to external origins was blocked. Synthetic fixtures do not authorize real licensed content or prove physical-device accessibility certification.

## 16. Executed tests and build

| Run | Actual result | Qualification |
|---|---|---|
| Complete backend `npm test` | **239 passed, 0 failed, 3 skipped**, 242 TAP entries | Fresh isolated DBs; synthetic external providers/scanner except explicitly supplied tool unit cases. Includes existing commerce, registration, result/RBAC, media and notification regressions. |
| Shared HTTP client | **8 passed, 0 failed, 0 skipped** | Separate `npm run test:client`. |
| Initial completed Stage 17 focused lifecycle/recovery/process run | **23 passed, 0 failed, 0 skipped** | Real dump/restore and scanner-backed fixture, real MongoDB interrupted process, drain/signal logic. |
| Final restored-authority/tool/media-copy negative cases | **12 passed, 0 failed, 0 skipped** | Includes parent; current connection cleanup and explicit unpaid-order preservation, missing/corrupt copied media, failed dump/restore and occupied partial target. |
| Final lifecycle/config/connection-error unit rerun | **13 passed, 0 failed, 0 skipped** | Existing startup cases plus final worker, connection failure and malformed flag checks. |
| Real media backend/tool/HTTP suite | **21 passed, 0 failed, 0 skipped** | Actual ClamAV/FFmpeg/FFprobe, generated PDF/MP4, private HTTP and failure/cleanup checks. |
| Operations/admin eight-width Chrome suite | **10 passed, 0 failed, 0 skipped** | Nine child workflows plus parent; no external browser delivery. |
| Real-media Chrome suite | **16 passed, 0 failed, 0 skipped** | Fifteen child workflows plus parent, actual tool-backed media. |
| Baseline frontend production build | **PASSED**, 26.61 seconds | Before operational UI changes. |
| Final frontend production build | **PASSED**, about 1m33s | Existing large-chunk warning only. |

Focused cases/TAP parents overlap broad runs and are **not added** into one inflated total. Full regression preceded the final narrowly scoped connection-cleanup, conservative index-option rejection and unpaid-order fixture assertions; final focused reruns cover those changes. The three broad skips were optional replica-set connection without opt-in, separately exercised real-media mode not enabled in the broad run, and deliberately disabled live SMTP. No skipped check is counted as passed. Real FCM/Razorpay provider acceptance was not executed.

The first new focused command reported 11 passed/1 failed because of a syntax error in the new test helper; it was corrected, then complete focused and full runs passed. An initial read-only baseline probe also used the wrong nested media-config shape and was corrected without a DB connection. Failed attempts are not included in passing totals or hidden as skips.

Commands used backend `npm test`, `npm run test:client`, and explicit `node --test` paths for operational-readiness, startup, operational-recovery.mongodb.integration, process-recovery, real-media.mongodb.integration, video.mongodb.integration, video, scanner-deadline and publishing tests. Frontend commands were `node --test tests/stage8.browser.test.js` with operational/eight-width focus and `node --test tests/video.browser.test.js`, followed by `npm run build`. All opt-in DB names were fresh guarded stage3/stage4/stage10 test/browser names; the task-only loopback MongoDB override was supplied, actual installed tool paths were explicitly exported where required, and live SMTP/FCM/provider traffic stayed disabled. See [runbook](LOCAL-OPERATIONS-RUNBOOK.md) for reproducible recovery commands and exclusions.

## 17. Dependencies and security verification

Backend and frontend `npm audit --json`: **zero vulnerabilities**, including zero high/critical. No dependencies, lockfiles or Node runtime were changed. The existing Firebase/gRPC remediation is preserved. No real .env file was edited or staged. Source/build/report/log and staged content scanning checks configured private credential matches, private-key markers, excluded paths and whitespace without displaying secret values. Private backups, databases, logs, media and browser artifacts remain ignored.

## 18. Remaining operational gates

- Actual remote application inventory, verified backup/restored-copy compatibility and legacy/capacity review remain blocked by the current authorization boundary.
- Owner-approved production backup protection/retention, full media/config recovery, RPO/RTO, replica-set/PITR, load/capacity, permanent service supervision and native Windows deployment signal/control acceptance remain open.
- Actual Firebase recipient/device/project delivery approval and receipt, Stage 12 Razorpay Test Mode capture/webhook/reconciliation acceptance, and production deployment are not authorized by local fixture results.
- Existing business/legal/tax/refund-provider/franchise-affiliation/official result-source/privacy/licensing gates remain unchanged. Queue retention/backlog/replay and stale-lock recovery must be deliberately approved and operated, not inferred from a development queue test.

## 19. Owner approvals and Git disposition

No additional approval was required for the guarded local work completed. A future remote-database stage needs explicit scope identifying that development deployment and approved read/backup/restore-copy operations; do not infer authorization from the database name or development-data statement. Permanent services/schedules, application data/media cleanup, external delivery and deployment need separate approval.

Initial tree was clean. Only Stage 17 source/tests/docs are intended for the local commit; unrelated work is preserved. Retained synthetic archives and partial negative-test destinations are ignored, not committed or automatically deleted. Final commit hash and final working-tree status are supplied in the completion response so this report need not embed its own future hash.

## 20. Exact next-stage recommendation

First approve a narrowly scoped **remote development database inventory/backup/restored-copy compatibility stage** or provide a positively identified local application copy. Then separately authorize final Razorpay Test Mode and optional FCM operational acceptance, followed by project-wide QA and production planning. Local synthetic acceptance does not close those gates. No push, deployment, public tunnel, real payment, SMTP/FCM delivery, production configuration or original application-data/media mutation occurred. Stop after the Stage 17 local commit.
