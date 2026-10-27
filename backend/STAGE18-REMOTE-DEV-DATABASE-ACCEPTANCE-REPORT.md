# Stage 18 - Remote development database recovery acceptance

Date: 27 October 2026 (Asia/Calcutta). Baseline: `04dc583`, branch `main`, initially clean working tree. Work began before a usage-limit interruption and resumed on the same baseline.

## 1. Outcome and authorization

**Remote namespace inventory, database-only backup, exact isolated restore and current-data startup compatibility: VERIFIED.** This does not certify complete-system media recovery, live-provider acceptance or production readiness.

Before connecting, local-only configuration inspection identified the remote SRV namespace `kitss_education_dev`; permissions and infrastructure isolation could not be inferred from .env. The owner explicitly answered **Approve this specific scope** to read-only inventory/logical backup of only that configured namespace using its existing account, then fresh local-copy recovery testing, with no remote writes/startup/media copying/.env edits. The owner subsequently stated all writers were stopped. Broader informal permission was not used to expand that scope.

Read-only connection/privilege metadata showed a replica set and an account with the required read actions plus write privileges and broader database scope. The existing account was the approved account, but is not least privilege. Shared versus dedicated infrastructure remains independently unverified; no other database was enumerated or backed up. Future operations should use a narrowly scoped read/backup account and reconfirm infrastructure identity. No original collections, indexes, users, documents or settings were changed. The application was never started against the original.

## 2. Actual inventory

MongoDB **8.0.34**; approved namespace **kitss_education_dev**; **34 collections, 44 documents, 111 indexes**. Logical data: **15,751 bytes**; allocated collection storage: **589,824 bytes**. Two user records carry the admin role; identities and private fields are not exported here.

| Collection | Documents | Indexes |
|---|---:|---:|
| accessRequests | 0 | 2 |
| admissionApplications | 0 | 4 |
| auditlogs | 22 | 1 |
| auththrottles | 0 | 2 |
| banners | 2 | 2 |
| bookEntitlements | 0 | 3 |
| books | 2 | 3 |
| coachingCourses | 2 | 2 |
| collegePrograms | 0 | 3 |
| colleges | 0 | 5 |
| coursePlans | 2 | 2 |
| domainLocks | 1 | 1 |
| enrollments | 0 | 4 |
| exams | 0 | 2 |
| facultyProfiles | 2 | 2 |
| fcmTokens | 0 | 3 |
| franchiseApplications | 0 | 4 |
| jobs | 1 | 3 |
| learningProgress | 0 | 3 |
| lessons | 2 | 2 |
| mediaAssets | 4 | 5 |
| notificationReceipts | 0 | 3 |
| notifications | 0 | 4 |
| orders | 0 | 12 |
| pageContents | 2 | 2 |
| registrationApplications | 0 | 3 |
| resultHistory | 0 | 2 |
| resultIssuers | 0 | 2 |
| resultRecords | 0 | 4 |
| sessions | 0 | 4 |
| siteSettings | 0 | 2 |
| taxonomies | 0 | 3 |
| universities | 0 | 3 |
| users | 2 | 9 |

Known obsolete unique indexes: **0**. Legacy session-unbound FCM rows: **0**. Duplicate token groups: **0**. Duplicate job-key groups: **0**. Business policy configuration: **missing**. All nine existing relationship-integrity checks reported zero missing references, including order/user, entitlement/book/user/order, enrollment/course/user, registration/user and book/media links. This is not an exhaustive semantic validation of every optional field or historical business assertion. Overall shared-deployment collection quota/capacity was not queried outside the approved namespace; the earlier collection-limit concern is not declared resolved.

## 3. Backup method and consistency

Installed official MongoDB Database Tools **100.14.1** were version-checked and used for both dump and restore. `mongodump` received a temporary YAML configuration file inside a restricted directory, explicit `--db=kitss_education_dev`, `--gzip` and an archive path. Neither URI nor password appeared in process arguments, reports or tool output. Private tool stdout/stderr were captured and not echoed. No cross-database/oplog/user-role dump was requested.

Free disk space before backup was **52,739,047,424 bytes**, exceeding the enforced minimum of 1 GiB and four times logical data size. Windows inherited ACLs were removed before credential/archive creation; only executing owner, SYSTEM and Administrators have explicit access. The completed archive directory was checked as inheritance-protected; the sandbox account could not read its ACL. Temporary credential-file removal was verified. ACL protection is not encryption or an approved retention/off-device backup policy.

Consistency basis: **owner-confirmed stopped writers plus identical collection/options/index/count/canonical BSON fingerprints immediately before and after dump**, then exact restored comparison. This is a quiesced logical backup, **not an atomic point-in-time/oplog backup**. Writer quiescence is an owner assertion, not independently enforced by a lock or deployment control. No remote writers were stopped and no remote settings changed. If writers resume or source data changes, repeat the consistency assessment rather than applying this evidence to a later state.

Official references: [mongodump and private config](https://www.mongodb.com/docs/database-tools/mongodump/), [mongorestore version compatibility](https://www.mongodb.com/docs/database-tools/mongorestore/). The documented restore requirement informed using a matching 8.0 server; no cross-version migration is claimed.

## 4. Retained archive integrity

Private directory relative to repository root:

`.runtime/backups/2026-10-26T19-21-14-704Z-7d15d69f-bb15-4ed5-be77-900a80666bc3`

Archive: `database.archive.gz`, **7,886 bytes**. SHA-256:

`23cdd990a97a6fe2c0d7d692caf40b62a6fafc25f9486dec39dda2b7e89d1148`

The manifest records source version, collection metadata, complete logical index definitions, counts, canonical document hashes, exclusions and consistency basis. Hash/size were validated before restore. All 34 collections and 111 index definitions were compared after restore, including compound-index key order. The archive and completed manifest remain ignored/private. Corrupt/version-mismatch copies and reserved failed destinations are separately retained as task evidence; none replaces the accepted archive. A checksum verifies integrity relative to the trusted manifest, not independent authenticity of an arbitrary uploaded archive.

## 5. Local restore and isolation

A new task-owned MongoDB **8.0.34** process bound only to **127.0.0.1:27249**, using a new `.runtime/stage18-mongo-<UUID>` directory with restricted Windows ACLs. It did not reuse Stage 17's data directory or an existing application namespace. The portable `mongod` entry was retrieved from MongoDB's official HTTPS Windows archive, with ZIP CRC verification and a recorded local SHA-256. Authenticode reported **NotSigned**; no publisher-signature verification is claimed. No system installation/service/dependency upgrade occurred.

Targets were new `kitss_stage18_restore_<16 hex>` namespaces. Restore verifies major version/hash/size, atomically creates `_kitss_restore_guard`, maps only the source namespace and uses `--stopOnError`, never `--drop`. Before application startup, every document fingerprint/count/collection option/index matched the source manifest. The retained guard is one intentional additional collection, excluded from the 34 source-collection comparison.

Startup used a separate empty task media root, blank SMTP/payment secrets, disabled Firebase and injected `FakePaymentProvider`. Normal backend startup was never invoked against default remote configuration. Provider processing in this stage is synthetic. Fresh synthetic regression databases use the same task-owned loopback instance with explicit guarded names; no destructive suite can select the remote original through the supplied test configuration.

## 6. Compatibility, authority and maintenance

Two full restored application startups/readiness checks/shutdowns passed. Full document fingerprints for all **29 business collections** remained unchanged after each startup. Five maintenance collections were separately evaluated: auditlogs, auththrottles, domainLocks, jobs and sessions. The only observed collection difference after startup was **jobs.updatedAt**; row counts and all other job fields remained unchanged. No business row or business index changed. Exact restoration before startup included all five maintenance collections too.

Roles/permissions/account state, product publication/pricing, policies, orders/capture/refunds, entitlements, registration/franchise/result approval and token ownership were not rewritten or granted. Policy absence remained absence, not approval. Actual orders, paid entitlements, enrollments, registrations, results, franchises and tokens are empty: preservation of these empty sets is verified, but existing paid history/legacy-token migration cannot be demonstrated from this dataset. Separate synthetic regressions exercise pending versus captured orders, paid/free access, approval gates, legacy tokens and conflicts.

No known legacy index needed retirement in the actual copy, and all expected startup index creation succeeded twice. Synthetic recovery tests separately seed known old constraints, verify safe retirement on copies, reject unexpected definitions and preserve conflicting token owners with safe compatibility errors. No migration was executed on the original. No actual data-repair migration is currently required by the inspected index/token data.

## 7. Media exclusions and policy findings

Four media metadata records have valid storage-key shapes: **three quarantined, one deleted**. No ready media record was observed. No original local/remote media file was read, copied, scanned, deleted or recovered by this stage. MongoDB archives do not contain filesystem PDF/video/image bytes. Restored media metadata/reference shapes are verified; content checksums, playback, licensing, complete-media consistency and actual file recovery are **unverified**. Media recovery status is **PARTIAL (metadata only)**. Previous Stage 15/17 synthetic real-tool evidence is historical, not newly executed media recovery.

`siteSettings` is empty and `businessPolicies` is missing. Existing fail-closed defaults remain intact. Proposed next action is owner-defined policies through existing permissioned, audited admin configuration, covering fees, documents/guardian/privacy/retention and other unresolved legal/tax/refund/affiliation/result rules. Do not seed approved policies, publish quarantined media or infer financial rules in a migration. A separately authorized consistent private-media backup and recovery drill is required for full-system recovery.

## 8. Failure and restart evidence

Actual-archive local tests passed corrupt-copy rejection, occupied-target preservation, failed-tool handling with retained reservation, and different-major-version rejection before collection creation. Retrying over a partial destination is blocked; preserve evidence and choose a new guarded namespace after investigation.

After verifying the main task MongoDB PID/executable/dbpath/port, it was forcibly interrupted and restarted with the same journaled task directory. All restored-copy collection/document/index fingerprints remained unchanged; **34 source collections / 44 documents** survived. Separate synthetic process recovery covers unavailable startup, readiness failure and reconnection. The original remote was never a recovery destination or application-startup target.

A final approved read-only source comparison after local testing again matched the backup: **34 collections / 44 documents, unchanged fingerprints/options/indexes**. No remote repair/delete/index mutation occurred.

## 9. Regression evidence

Completed runs (TAP counts include parent entries):

| Run | Result | Scope |
|---|---|---|
| Full backend `npm test` | **254 passed, 0 failed, 3 skipped**, 257 entries, 310.98 seconds | Fresh loopback fixtures, actual archive on local copies, synthetic payment/mail/push/scanner adapters; actual installed video processors in their existing focused case. |
| Initial guards/lifecycle/startup | 16 passed, 0 failed, 0 skipped | Before the additional compound-index-order unit; overlaps final regression. |
| Approval guards + actual-archive restored-copy suite | 13 passed, 0 failed, 0 skipped | Four units plus eight copy scenarios and TAP parent; no remote connection during tests. |
| Final approval/copy rerun | 13 passed, 0 failed, 0 skipped | After adding exact jobs.updatedAt-only maintenance assertions; same eight copy scenarios, not extra distinct workflows. |
| Actual main task MongoDB interruption/restart | PASSED | Exact actual-copy fingerprints before/after journal recovery; separate from synthetic process test. |
| Shared HTTP client | 8 passed, 0 failed, 0 skipped | `npm run test:client`. |
| Frontend production build | PASSED, 40.34 seconds | `npm run build`; existing large-chunk warning only. |
| Backend / frontend dependency audits | 0 / 0 vulnerabilities | `npm audit --json`; no dependencies or lockfiles changed. |

Focused suites overlap the full regression and TAP parents are included, not summed as distinct extra workflows. The broad run covers backup/restore/failure guards, startup/worker drain, actual synthetic process restart, legacy-index/token conflicts, commerce authorization and registration/result/role/policy gates. It preceded the final test-only jobs-field assertions; the final focused rerun covers those assertions. The three skips were optional local replica-set readiness (no replica-set opt-in), real-scanner/media acceptance (not enabled) and live SMTP (deliberately disabled). No skipped case is counted as passed. Browser suites and real media/provider/SMTP/FCM delivery were not run in this database-only stage; no acceptance claim is made for them. Inspecting remote replica-set topology does not exercise transactions or PITR.

Commands: backend `npm test`, `npm run test:client`; focused `node --test backend/tests/approved-remote-backup.test.js backend/tests/remote-copy.mongodb.integration.test.js`; frontend `npm run build`; both directories `npm audit --json`. All integration database settings explicitly used the task-owned loopback instance, fresh guarded Stage 3/4/5/6/7/8/10 fixture namespaces and new restore namespaces. The reused Stage 17 synthetic recovery accepts the exact Stage 18 loopback base and writes separate Stage 18 evidence. See the runbook for archive opt-ins; never run destructive suites using default application DB settings.

An initial local inventory disk-space probe crashed Node when passed a URL to Windows `statfs`; it was corrected to a filesystem path and inventory rerun successfully. Get-Volume was denied in the sandbox; disk capacity was subsequently measured with Node statfs. PowerShell script-file execution was disabled, so the regression was executed directly without changing execution policy. An automatic approval-review usage-limit failure delayed binary verification; the owner requested continuation, and the same action subsequently passed review. These are not passing tests or undisclosed provider checks.

## 10. Security, implementation and final disposition

Added a separate explicit-scope remote-backup helper and focused guard/restored-copy tests. Extended existing local restore prefixes conservatively, added source/target major-version validation, fixed compound-index-order comparison, and allowed existing synthetic recovery tests on the exact Stage 18 loopback base without overwriting Stage 17 evidence. No HTTP API, UI, business flow, model, dependency, .env, production setting or remote schema was changed.

Real .env files, archives, local DB directories, logs, tools and private media remain ignored. Backup URI configuration was temporary/private and removed. Source/build/Stage 18 log scanning reviewed **404 files with zero configured-private-secret/private-key matches**. Final staged review checks all ten source/test/documentation files, excluded paths, credential matches and `git diff --cached --check` before the authorized local commit. The commit hash and final working-tree status are supplied in the completion response rather than embedded in their own commit.

After tests, the recorded task MongoDB executable/PID/dbpath/port were rechecked and only that process was stopped. Private task data, verified archive/manifests and partial recovery evidence were retained. The accepted archive SHA-256 still matched. Only task-owned partial public binary downloads were removed; the verified portable executable remains ignored. Existing services/application media were not stopped or changed. No amend, push or deployment.

## 11. Remaining gates and recommended next stage

Resolve missing business policies through owner-approved admin configuration, obtain separately authorized complete media backup/restore evidence, and confirm deployment isolation plus least-privilege backup credentials. Approve retention/encryption/off-device copies/RPO/RTO/PITR and operational capacity/supervision separately. The earlier shared collection-limit concern remains a capacity question outside this namespace-only inventory. Existing Stage 12 real Razorpay, optional FCM, production/runtime/device and business/legal/source/privacy/licensing gates remain unchanged. This stage authorizes no original-data migration, remote writers/settings changes or operational release.

Stage 18 stops after documentation/security verification and the local commit. No GitHub push, deployment, public tunnel, real payment, SMTP message or FCM delivery.
