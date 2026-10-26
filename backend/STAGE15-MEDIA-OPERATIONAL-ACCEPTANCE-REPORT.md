# Stage 15 media operational acceptance

Baseline: `main`, `42958ee`. Initial working tree was clean. The Stage 14/13 reports, final completeness audit/matrix, master checklist and existing media/storage/publishing/commerce/coaching source and tests were reviewed. Stage 15 extends the existing modular monolith; it does not replace the upload, scanner, payment, reader or video architecture.

## Gap audit and implementation

| Area | Initial finding | Final evidence |
|---|---|---|
| Private storage, publication, licensing and entitlements | Implemented; regression-tested with explicit scanner doubles | Reused unchanged. Real-scanned PDF/video content exercised through HTTP and the actual browser/admin UI. |
| ClamAV | Existing loopback INSTREAM adapter; no usable installation in standard locations | Official portable 1.4.6 LTS x64 package downloaded into ignored task storage, detached release signature verified, official definitions downloaded/tested by FreshClam, local daemon configured and exercised. No Windows service or system-wide installation. |
| FFmpeg/FFprobe | Existing MP4 probe/full-decode design; binaries installed by WinGet but absent from the invoking shell PATH | Installed 9.0 full build verified and configured by absolute path. Real metadata inspection/full decode and self-generated MP4 encoding passed. No unnecessary streaming/transcoding platform. |
| Scanner deadline | Socket idle timeout could be kept alive by traffic; stalled input could outlive the intended scan bound | Added validated `MEDIA_SCAN_TIMEOUT_MS`, absolute wall-clock deadline, bounded input and input/socket destruction. Failure remains unavailable/quarantined. Protocol/stalled-input regression added. |
| Operational acceptance fixtures | Commerce fixture always selected fake scanner outside actual-application mode | Added explicit scanner injection and guarded real-media fixture. Real mode requires task loopback MongoDB, explicit real-tool configuration and actual ClamAV VERSION response with loaded signatures; it cannot select the application database. Ordinary regression retains its clearly separate fake scanner. |
| Content ownership | No owner educational inventory supplied | Used only self-generated PDFs/images/test video and synthetic licensed-rights declarations. This establishes pipeline acceptance, not licensing of future owner content. |

New files: `MEDIA-LOCAL-SETUP.md`, this report, real-media fixture/integration tests and scanner deadline test. Existing scanner/environment loading/example, commerce/video test fixtures, real-tool unit tests and video browser tests were refined. Requirements matrix/master checklist are updated. No Stage 15 application dependency was added. No new business collection, public upload endpoint, media authorization bypass or production record change was introduced.

Unrelated notification/Firebase source, dependency, environment-example and Git-ignore changes appeared during the interrupted task. They are preserved and excluded from this stage's commit, including separate hunks in shared environment files. They are not Stage 15 implementation or acceptance evidence.

## Real local tools and security

The official [ClamAV download page](https://www.clamav.net/downloads) provides Windows portable packages and the Talos public key. The 1.4.6 LTS ZIP's detached release signature verified successfully against that key, fingerprint `5BAD CA26 65EF 59DC F8A2 3D8B 707F 0DB4 8083 6771`. The Windows executable itself reported no Authenticode signature; detached PGP verification was therefore recorded separately. GPG's trust warning concerns local certification of the downloaded key; no independent out-of-band identity attestation is claimed. Package, keyring and logs remain ignored.

FreshClam downloaded official databases and verified each before installation: daily version **28165**, **355788** signatures; main version **63**, **3287027** signatures; bytecode version **339**, **80** signatures. Final daemon response: `ClamAV 1.4.6/28165/Mon Oct 26 11:57:07 2026`. A final real PDF clean scan passed after restarting only the verified task-owned daemon with `FailIfCvdOlderThan 7` enabled. Runtime evidence timestamp: **26 October 2026, 18:07 IST**. Continued update scheduling/monitoring remains an owner operational responsibility; a successful scan today does not guarantee future definition freshness.

ClamAV binds **127.0.0.1:3315** with bounded workers/queue, 256 MiB stream/file maximum, 512 MiB aggregate scan bound, 120-second scan bound and alert-on-exceeded-limits behavior. The app keeps its narrower per-purpose/file limits. The existing INSTREAM protocol streams bytes and does not create scanner-specific temporary files. Existing generated quarantine/private/staging keys, journaled intent, checksums, cleanup/reconciliation and no-static-private-file rules remain. Malformed media is inspected/rejected, not trusted by extension alone.

Actual scan results:

- Self-generated clean PDF: **clean**, including after final daemon restart.
- Standard harmless antivirus test pattern: **infected**, built and scanned in memory only; no actual malware or public fixture introduced.
- Actual connection refusal: upload remains quarantined with scan error; real-daemon rescan recovers to clean/ready.
- Absolute deadline with stalled input and trickle socket traffic: failed closed; unit server is deliberately a failure double, not real positive antivirus evidence.

Installed FFmpeg/FFprobe both reported **9.0-full_build-www.gyan.dev**. A 20-second 320x180 H.264/AAC fast-start test-pattern MP4 was encoded by actual FFmpeg into ignored task storage. The browser uploaded that generated output, the backend extracted its real metadata and performed a full error-sensitive FFmpeg decode, and Chrome decoded frames, sought, saved and resumed playback. Existing unit fixtures additionally exercised real unsupported-codec conversion/rejection, corrupt packets, absent FFmpeg/FFprobe and a deliberately tiny processing timeout.

The application intentionally accepts validated private MP4 rather than producing transcode variants: probing and full decode are actual processing operations; no HLS, multi-resolution outputs or application transcoding is claimed. See [local setup/runbook](MEDIA-LOCAL-SETUP.md) and the [official FFmpeg download guidance](https://ffmpeg.org/download.html).

Only five ignored backend media settings were updated: `MEDIA_CLAMAV_ENABLED`, `MEDIA_CLAMAV_PORT`, `MEDIA_SCAN_TIMEOUT_MS`, `MEDIA_FFMPEG_PATH`, `MEDIA_FFPROBE_PATH`. Existing unrelated environment values were preserved. No secret was copied into a source/example/report. No frontend scanner/tool paths are required. The portable daemon is left available for local development; it is not a permanent service and will need owner restart/update management after reboot. System-wide service installation remains separately approved work.

## PDF, video and admin workflows

Real HTTP acceptance authenticates synthetic staff/student sessions with existing cookies/CSRF and uploads through the actual multipart route. PDF scan/inspection, page count, checksum, private visibility, stable duplicate upload and exact delivered bytes are verified. A published approved-zero book grants real free access without a fake order. A separate paid book denies unpaid access, accepts only a captured synthetic-provider payment, grants lifetime rights once and denies revoked/unpublished access. This is not real Razorpay acceptance.

Video acceptance uploads through the admin lesson editor, previews authenticated bytes, attaches/publishes the lesson and course with authored rights metadata, and selects an approved free course plan. The eligible synthetic student explicitly enrolls through the real UI, then plays the real uploaded video. Progress/resume, seeking, speed changes, completion ordering, pending-write identity/navigation safety and actual HTTP 206 range use are verified. Mobile/touch emulation decodes actual frames. The scanner is real for all real-mode fixture uploads, including covers and lesson PDFs.

The browser also edits a test book, uploads a real-scanned generated PDF, configures zero price, saves/publishes it, opens the free reader and checks actual nonblank rendered canvas pixels. Admin Media Management shows persisted ready/clean state; a books-read-only subadmin is denied that route. Existing upload progress and inspecting/scanning/ready/quarantine messages were reused. No UI redesign was necessary.

Access/security evidence covers anonymous/foreign/non-entitled direct requests, paid-course expiry/revocation, unpublished content, stale/replaced video references, protected deletion, valid/suffix/invalid ranges, path guesses, malformed PDF, incorrect MIME, corrupt/truncated/oversized/interrupted video, unavailable scanner/rescan, tool absence/timeout, checksum/private storage and audit persistence. Private registration PDFs are scanned by the real daemon and readable only by their owner or authorized document reviewer; generic media-read staff remain denied. No guessed public storage URL grants private bytes. Sensitive internal storage paths are absent from serialized errors; protected responses retain `no-store` and `nosniff`.

These are isolated acceptance identities using real session validation; no real staff password, owner document or application record was used. Existing auth-specific login workflows were not rebuilt.

## MongoDB and test evidence

Task-created **real MongoDB 7.0.24**, dedicated loopback **127.0.0.1:27245**, fresh guarded `kitss_stage10_test_<16 hex>`/`kitss_stage10_browser_<16 hex>` databases, ignored task data root. The application MongoDB was never selected. Fixture cleanup deletes only its synthetic records and verified temporary media root. Task database collections/files are not committed. The test MongoDB is no longer running; no existing developer service was stopped.

| Run | Actual result | Scope and limits |
|---|---|---|
| Real-media acceptance + scanner deadline + publishing/video units | **15 passed, 0 failed, 0 skipped/cancelled** | Real ClamAV clean/detection/recovery/private-document evidence, real FFmpeg/FFprobe, eight DB/HTTP child workflows; includes Node parent entries. |
| Existing video HTTP integration with real-media opt-in | **6 passed, 0 failed, 0 skipped** | Real scanner/tool uploads, synthetic payment adapter, 206/416, expired/revoked rights, replacement, interruption/oversize and cleanup. |
| Real-media Chrome admin/reader/video suite | **16 passed, 0 failed, 0 skipped** | Actual generated MP4 upload/playback and PDF canvas, admin media restrictions, mobile/touch and all eight requested widths: 320/375/390/414/768/1024/1280/1440. |
| Complete backend/shared-client regression | **198 passed, 0 failed, 4 skipped** | 202 entries including parents; ordinary regression fake scanner remains distinct from real operational evidence. |

The four full-run skips were optional replica-set connection without opt-in, deliberately disabled real-media opt-in in that broad run, deliberately disabled live SMTP, and actual-tool unit paths not explicitly exported by that broad command. The latter real-media/tool suites were run separately with explicit environment paths as shown above; no skipped check is called a pass. Real-media run counts overlap unit cases in the broad run and are **not added** into one misleading total. The final broad regression includes the source deadline fix; later focused real-media and browser additions are separately evidenced. No real provider transactions, SMTP messages or third-party result calls were made.

Commands:

```powershell
node --test --test-concurrency=1 backend/tests/real-media.mongodb.integration.test.js backend/tests/scanner-deadline.test.js backend/tests/video.test.js backend/tests/publishing.test.js
node --test backend/tests/video.mongodb.integration.test.js
node --test frontend/tests/video.browser.test.js
node --test --test-concurrency=1 backend/tests/*.test.js frontend/src/shared/api/httpClient.test.js
npm.cmd --prefix frontend run build
npm.cmd --prefix backend audit --json
npm.cmd --prefix frontend audit --json
```

Explicit real-media opt-in/tool paths/fresh database names are mandatory; see the runbook. Broad regression does not enable live SMTP or provider tests. Initial frontend production build passed (61 seconds, existing large-chunk warning). Both dependency audits initially reported zero vulnerabilities. Final current-tree production build also passed (96 seconds, existing chunk warning). Final backend audit remains zero; final frontend audit reports **four high-severity dependency entries** in the independently added Firebase chain (`firebase`, `@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js`), covering upstream [certificate-context](https://github.com/advisories/GHSA-m9gg-hp2v-232j) and [error-detail disclosure](https://github.com/advisories/GHSA-f596-whhp-79r4) advisories. These entries are related dependency paths, not four independent defects in this application. Firebase/package-lock changes are preserved outside this media commit; no automatic major dependency change was made. Review/remediate the notification dependency tree before release. Final scanner/config unit check: **5 passed, zero failed/skipped**, overlapping earlier unit evidence and not added to regression totals.

The broad regression result predates the independently added notification work; it is not a claim of full regression acceptance for those subsequent changes. Current build/audit findings above reflect the combined current working tree. Stage 15 media acceptance is recorded separately.

Failed attempts are retained honestly in ignored logs: initial FreshClam setup used an invalid path/directive layout; corrected native Windows path and one-directive-per-line configuration succeeded. Direct public-key downloads returned HTTP 403; retrieving the embedded key through the official page tool enabled successful detached-signature verification. First real-media run: 11 passed/3 failed (two fixture assertions plus parent); second: 12 passed/2 failed (intentional linked-book unpublication not restored before course publication). Correcting only fixture setup produced passing runs. A later overlapped focused run had 14 passes and one cancelled deadline-test entry due to test socket-cleanup ordering; cleanup was fixed and final rerun passed 15/15. The first expanded browser attempt had an ambiguous upload-button locator and dependent failures; its task-owned browser process was stopped, the locator corrected, and a fresh complete rerun passed 16/16. No failed or interrupted run contributes passing counts.

The final scanner restart was initially not executed because automatic approval review hit a usage limit, explicitly a review-service failure rather than an unsafe-action finding. After the owner resumed, review succeeded; the task-owned process identity was checked, restarted with age enforcement and passed a fresh real scan. No approval control was bypassed.

Final review scanned 380 source/build text files with zero configured/legacy credential matches. The 15 Stage 15 staged files passed the staged-secret/excluded-path review with zero findings and `git diff --cached --check`. Shared configuration staged only media hunks; all unrelated notification/Firebase changes, dependencies and real environment files remain unstaged. The working tree therefore remains dirty after this stage's commit solely for preserved unrelated work. No Stage 15 source change is intentionally left uncommitted.

## Remaining operational work and next stage

- Resolve the separately introduced frontend Firebase audit findings before a release; notification implementation is outside this media stage.
- Owner supplies legitimate educational inventory and verifies its actual copyright/license rights. Generated fixture success does not license real books/videos or approve publication of owner data.
- Maintain official ClamAV definitions and engine updates, monitor daemon health/scan failures, review size/timeout/capacity settings against actual inventory, and decide whether to approve a permanent local/system service. No signature freshness promise beyond recorded checks.
- Validate production storage capacity, backups/restore, durable worker/daemon operations and runtime/physical-device accessibility before release. This stage performs no deployment or production readiness certification.
- Reuse the tested pipeline for a separately approved import of owner content into a designated development environment. Obtain separate approval before touching existing application records.
- Razorpay real Test Mode operational acceptance, provider refunds, franchise official activation, tax compliance, result-source/privacy decisions and other Stage 14 business gates remain unchanged. No payment or policy bypass is introduced.

Stage 15 stops after its local reviewed commit. No push, deployment, production release, public tunnel, actual Razorpay transaction, additional live SMTP delivery or application-data modification occurred.
