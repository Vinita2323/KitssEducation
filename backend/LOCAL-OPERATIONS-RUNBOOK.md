# Local operations and recovery

This runbook is for positively identified, owner-authorized local development data. Stage 17 found the configured application database was non-loopback and did not connect to it. A development-looking name is not proof of ownership or safety. Remote/shared/production operations require a separately approved scope. Never copy a credential-bearing URI into commands, reports or logs.

## Stage 18 approved remote development recovery

The owner separately approved read-only inventory and logical backup of **only** the configured `kitss_education_dev` namespace, then confirmed all writers were stopped. [Stage 18 acceptance](STAGE18-REMOTE-DEV-DATABASE-ACCEPTANCE-REPORT.md) records actual results and exclusions. This is not permission for future remote writes, index changes, writer shutdown, media copying, application startup against the original, or other namespaces. Deployment isolation remains unconfirmed; the existing account has broader permissions than this approved operation needs. Prefer a dedicated least-privilege read/backup account for future runs.

The existing local CLI still rejects all remote/authenticated URIs. The separate `src/modules/operations/approved-remote-backup.js` operator helper has no .env/network side effects on import. Its caller must supply reviewed development configuration and an approval object with `readOnly: true`, `writesQuiesced: true`, exact `database`, `expectedTopology: 'replica set'`, and `connectionSha256` bound to the approved URI. Capture that fingerprint privately when approving the scope; do not automatically approve a subsequently changed .env. These assertions are operator controls, not a database-enforced read-only role or proof that writers stopped. Reapprove any changed connection identity/topology/permissions/scope before access.

The helper validates TLS restrictions, reads only the named namespace, checks disk capacity, and uses official `mongodump --config` with a temporary private YAML URI file and explicit `--db`. Credentials never enter process arguments. Windows backup directories remove inherited ACLs and grant only the executing owner, SYSTEM and Administrators before credentials/archive creation; POSIX uses mode 0700. The YAML is removed in cleanup. Tool output/driver errors are not echoed. Investigate a failed dump privately; an incomplete directory without a completed manifest is not a valid backup. No encryption, retention policy, recurring schedule or remote writer control is implied.

Stage 18 used Database Tools **100.14.1**, remote MongoDB **8.0.34**, and a new task-owned **8.0.34** loopback instance on port **27249**. A restored namespace must be fresh `kitss_stage18_restore_<16 hex>` (the Stage 17 prefix also remains supported). Restore now rejects a different major server version before creating collections; this intentionally conservative check does not implement cross-version/FCV migrations. The MongoDB [restore documentation](https://www.mongodb.com/docs/database-tools/mongorestore/) requires compatible source/target versions. Compound-index field order is included in inventory comparison.

After a separately approved backup, restore only to that verified local task instance:

```powershell
$targetName = 'kitss_stage18_restore_'+[guid]::NewGuid().ToString('N').Substring(0,16)
node backend/scripts/local-recovery.js restore --uri ('mongodb://127.0.0.1:27249/'+$targetName) --confirmed-local-development --backup '<private completed archive directory>'
```

For the archive-specific acceptance test, set `MONGODB_URI=mongodb://127.0.0.1:27249/kitss_stage18_local`, `KITSS_STAGE18_BACKUP_DIRECTORY` to the selected private directory and `KITSS_MONGORESTORE_BINARY` to the installed official executable. Run `node --test backend/tests/approved-remote-backup.test.js backend/tests/remote-copy.mongodb.integration.test.js`. It uses new local namespaces, blank SMTP/payment secrets, disabled Firebase and the synthetic payment provider. It never connects to the source; missing archive opt-in is reported as skipped. It retains reserved/partial targets and access-restricted corrupt/version-mismatch archive copies for investigation. Database-only archives exclude every media file and private configuration; an empty separate task media root is not a recovered media library.

## Establish the boundary

- Check Git status and record the code revision. Preserve unrelated work and ignored developer configuration.
- Identify the actual MongoDB process, loopback listener and dedicated data directory. Use a fresh task-created instance for acceptance; never stop another developer process.
- Stop application writers and background workers before a standalone logical backup. The `--writes-quiesced` flag is an operator assertion, not an automatic lock or a snapshot guarantee.
- Confirm the installed official `mongodump` and `mongorestore` versions with `--version`. Stage 17 exercised installed Database Tools 100.14.1 against MongoDB 7.0.24. Revalidate tool/server compatibility and security updates before a future operational rollout; never accept untrusted archives.

## Inventory, backup and restore

The script has **no implicit .env database fallback**. It accepts only explicitly confirmed, credential-free loopback `mongodb://host:port/kitss_database` URIs without query parameters, rejects production-looking names, and cannot restore over an application database. This deliberately narrow local interface is not a remote/production backup system.

Run from the repository root, replacing the example with the exact positively identified local namespace:

```powershell
$sourceUri = 'mongodb://127.0.0.1:27247/kitss_confirmed_local_dev'
node backend/scripts/local-recovery.js inventory --uri $sourceUri --confirmed-local-development
node backend/scripts/local-recovery.js backup --uri $sourceUri --confirmed-local-development --writes-quiesced
# Optional --dump-binary and --restore-binary accept installed absolute tool paths.
```

Backups are retained under ignored `.runtime/backups/<UTC timestamp>-<UUID>/`. Each completed backup has a gzip BSON archive and manifest with archive SHA-256/size, source server version, collection counts, options, index definitions and deterministic BSON document fingerprints. Fingerprints before/after dumping must agree. No completed manifest is written if dumping fails or data changes. Do not interpret a partial directory as a completed backup. Verify private directory permissions and storage capacity; no encryption or retention policy is invented by this tool.

```powershell
$targetName = 'kitss_stage17_restore_'+[guid]::NewGuid().ToString('N').Substring(0,16)
$targetUri = 'mongodb://127.0.0.1:27247/'+$targetName
node backend/scripts/local-recovery.js restore --uri $targetUri --confirmed-local-development --backup '<retained backup directory>'
```

Restore validates the archive hash/size first, requires a fresh guarded target and creates an atomic `_kitss_restore_guard` reservation. It uses namespace mapping, `--stopOnError`, and never `--drop`. The guard remains as recovery evidence and is the one intentional additional collection. Collection coverage, options, indexes and exact BSON document fingerprints must agree; the guard is excluded from source comparison. Existing target collections, wrong destinations, malformed manifests and corrupted archives are rejected.

If restore fails, preserve the archive and partial destination, investigate privately, and use a **new guarded target** after correcting the cause. Do not automatically empty a destination or retry over its data. A verified restore is separate evidence from a successful dump. Never delete a backup merely because the test ended.

This is a **database-only logical backup**. It excludes filesystem media, secret configuration, external services, the replica-set oplog and point-in-time recovery. A complete recovery plan also needs a consistent, access-restricted media copy, separately secured configuration/credentials, compatible binaries, and owner-approved retention/RPO/RTO/restore drills. Stage 17 used synthetic media copies and retained the database archives; it did not back up existing application media or claim complete-system disaster recovery.

## Restored-copy compatibility

Test startup and migration only against the new copy, with a separate copied media root and external delivery disabled. Inject synthetic payment/mail/notification adapters in tests; do not start configured real-provider workers as a shortcut. Compare roles/permissions, captured versus unpaid orders, entitlement sources, registration states, result publication, device owners and job states before/after startup. Restart twice and check idempotency.

Replacement indexes are installed before retirement of known old constraints. Retirement verifies the old name **and** exact key/allowed partial-filter/sparse options. Unexpected definitions fail with `INDEX_COMPATIBILITY`; there is no `syncIndexes` or broad index removal. Inspect the read-only compatibility inventory and verified backup before deciding any manual fix.

Legacy device rows without session/security-version binding remain ineligible. Duplicate tokens block the new global index with `PUSH_INDEX_COMPATIBILITY`. Startup never deletes or reassigns them. Determine ownership and safe re-enrollment on the copy first; any original-data repair requires separately approved, backed-up steps. Missing optional fields are not an authorization grant. Result source/privacy and franchise/refund/provider gates remain independent.

## Storage integrity: dry run only

```powershell
node backend/scripts/local-recovery.js inventory --uri $sourceUri --confirmed-local-development --storage-root '<absolute private media copy root>'
```

This reports relationship counts and media checksum/missing-file/unsafe-reference/orphan/staging/symlink counts. It neither exports private keys/paths nor deletes files. Deleted assets are not treated as expected live files; cleanup keys are retained as references. An orphan candidate is not proof that deletion is safe: review all book/course/document/cleanup associations and the recovery plan first. Do not turn this report into application-storage cleanup without approval. Destructive tests must use a task-owned copied root, never the application's existing files.

## Health, workers and recovery

- `/api/v1/health/live` is process liveness. `/api/v1/health/ready` is core MongoDB/storage readiness and refuses readiness while draining. Core readiness does not certify media scanning or external providers.
- Existing **Admin > Operations** now includes dependency readiness and job filters. `/api/v1/admin/operations/health` requires `operations.read`; it exposes safe MongoDB/storage status, free bytes, scanner engine/signature age, processor availability, worker lifecycle/failure metadata, queue counts, expired leases, payment-reconciliation counts and pending audit records. It exposes no credentials, payloads or filesystem paths. Probe results are briefly cached; use Reset / refresh and inspect the timestamp rather than assuming a live display.
- Missing scanning/processing is reported as degraded. Existing upload/quarantine/publishing checks remain fail-closed; successful core startup is not permission to bypass them. Invalid configuration flags fail central validation. Missing/disabled optional Firebase credentials do not enable delivery or block core startup.
- Shutdown stops new worker ticks, drains current worker work and in-flight HTTP, then disconnects MongoDB. Durable unprocessed work remains for restart. A bounded shutdown deadline remains the final escape from stuck dependencies. Signal handler logic is tested; native Windows service/console/supervisor control delivery still needs deployment-specific acceptance.
- Payment events, result imports and notification jobs remain isolated by kind. Notification leases/backoff/eight-attempt dead state and payment reconciliation retain existing authority. There is no arbitrary mark-paid, grant, send, retry or force-complete operation.
- Investigate dead jobs with the safe Operations view and private logs. Database and audit outages leave committed outboxes retryable. In-app notices are idempotent; external notification acceptance and database acknowledgement remain at least once. Never infer provider completion from a queue status.
- The standalone publication mutex intentionally fails closed after an unknown writer interruption; do not automatically clear another owner's lock. Quiesce writers and review backup/audit/state on a copy before an approved manual recovery.

## Local media maintenance

See [MEDIA-LOCAL-SETUP.md](MEDIA-LOCAL-SETUP.md). Keep the existing loopback ClamAV daemon and absolute FFmpeg/FFprobe paths. Do not install a service or scheduled task without approval. Verify engine/signature age, official FreshClam mirror, seven-day startup age enforcement, scanner limits and clean scan readiness before use. Update signatures through the existing official FreshClam procedure; do not disable certificate/signature verification. Monitor ongoing signature age and scanner errors; startup age enforcement alone is not an update schedule.

If the daemon is absent, first verify no unrelated listener owns its configured port, then start the existing approved configuration and wait for signature loading before testing `PING`/`VERSION`. Do not restart unrelated services. A refusal, timeout, infected file or missing processor must remain unavailable/quarantined. Use authorized Rescan after repairing the cause. No HLS/transcoding infrastructure is added.

## Acceptance and open gates

See [Stage 17 report](STAGE17-OPERATIONAL-READINESS-REPORT.md) for exact completed runs, retained synthetic backup evidence and exclusions. Tests require explicit fresh guarded database names and the task-owned loopback instance; ordinary regression uses synthetic provider/scanner adapters, separately from real ClamAV/FFmpeg and official-tool acceptance. Do not sum overlapping suites or call a skipped check passed.

Existing remote application inventory/backup/compatibility, production capacity/backup protection/retention/restore objectives, physical-device/supervisor acceptance, real payment/FCM and business/legal/source/licensing gates remain open. No push, deployment, tunnel or external notification/payment delivery is authorized by this runbook.
