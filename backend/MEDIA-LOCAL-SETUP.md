# Local media operations

Stage 15 uses the existing private LocalStorageProvider, ClamAV INSTREAM adapter, PDF inspection, FFprobe metadata inspection and full FFmpeg decode. Accepted video is fast-start MP4 with H.264 8-bit 4:2:0 (up to 1080p, 60 fps, level 4.2) and optional stereo AAC-LC, up to two hours. This is private authenticated progressive/range delivery, not an HLS/transcoding platform. Unsupported media must be converted by an authorized operator before uploading; the application never labels an unprocessed or unscanned upload clean.

## Tools and signatures

Use an official supported [ClamAV Windows portable package](https://www.clamav.net/downloads) and follow its [Windows documentation](https://docs.clamav.net/faq/faq-win32.html). Stage 15 downloaded the official 1.4.6 LTS x64 ZIP into ignored `.runtime/stage15-tools`, verified its detached signature using the Talos public key on the official download page, and initialized official definitions with FreshClam. No Windows service, PATH change or system-wide installation was performed. Keep this directory private and Git-ignored.

The existing installed FFmpeg/FFprobe 9.0 WinGet build was verified and reused. The [FFmpeg download page](https://ffmpeg.org/download.html) identifies supported sources for Windows builds. No new FFmpeg installation was necessary. Use absolute executable paths in the existing backend settings; paths belong in ignored local configuration, not frontend variables.

The configured local ClamAV listener is **127.0.0.1:3315**. Do not expose it publicly. `backend/.env` contains only the local media settings added/updated for this stage; unrelated existing values were preserved:

```dotenv
MEDIA_CLAMAV_ENABLED=true
MEDIA_CLAMAV_PORT=3315
MEDIA_SCAN_TIMEOUT_MS=120000
# Set these to the installed absolute executable paths:
MEDIA_FFMPEG_PATH=<installed-ffmpeg.exe>
MEDIA_FFPROBE_PATH=<installed-ffprobe.exe>
```

`MEDIA_SCAN_TIMEOUT_MS` is an absolute wall-clock deadline, including streaming and waiting for the result. Its validated default is 20000 ms; the local real-tool setup uses 120000 ms. Traffic cannot repeatedly reset the deadline. Failure destroys the input stream and socket and leaves the upload unavailable. The scanner's byte bound uses the existing video limit with a floor large enough for supported PDFs. Existing per-purpose upload bounds still apply first.

The task-local `freshclam.conf` uses an **absolute native Windows path** for `DatabaseDirectory`, `DatabaseMirror database.clamav.net`, connection/receive timeouts and foreground execution. The directory must exist. Each directive must occupy its own line. Run the official updater before starting the daemon:

```powershell
# Run from the repository root; these paths are all ignored local artifacts.
$mediaTools = Join-Path (Get-Location) '.runtime/stage15-tools'
$clamTools = Join-Path $mediaTools 'clamav/clamav-1.4.6.win.x64'
& (Join-Path $clamTools 'freshclam.exe') ('--config-file=' + (Join-Path $mediaTools 'freshclam.conf'))
& (Join-Path $clamTools 'clamd.exe') ('--config-file=' + (Join-Path $mediaTools 'clamd.conf'))
```

The foreground daemon command occupies that terminal; a separate owner-managed hidden process can also be used. Do not start a second daemon on the same port. The Stage 15 daemon is left running for local development; it is not installed as a Windows service and will not restart automatically after reboot.

Local clamd configuration uses `TCPAddr 127.0.0.1`, `TCPSocket 3315`, `StreamMaxLength 256M`, `MaxFileSize 256M`, `MaxScanSize 512M`, `MaxScanTime 120000`, `AlertExceedsMax yes`, bounded workers/queue and `FailIfCvdOlderThan 7`. Match the stream/file limits to any deliberately increased application upload limits. Exceeded limits are a failed scan, not clean content. Keep FreshClam definitions updated; the daemon self-checks and reloads updated databases. The startup age check is not a substitute for an ongoing update schedule and monitoring. Do not rely on this development process as production antivirus operations.

## Application behavior

Admin Media Management shows quarantine/ready/failed status and scan results. A quarantined file cannot be attached or read; fix the tool/configuration problem, then use **Rescan** on the current revision. Clean files can be attached through existing book and lesson editors. Publishing still requires approved pricing, rights, required metadata and clean referenced media. Private registration documents require their configured policy and owner/document-review permission; generic media-read permission is insufficient.

Paid books retain lifetime verified-source entitlements. Free books require approved zero price and an explicit logged-in free-access action. Free courses require an approved zero plan and explicit enrollment. Expired/revoked/unpaid access, unpublished content, stale video references and guessed private storage URLs remain denied. These checks never depend on browser playback success or a filename extension.

## Repeat acceptance safely

Real-media tests require a **dedicated real MongoDB on 127.0.0.1:27245**, never the application database. Start it with a new ignored task root and record its process identity. Use `MONGODB_URI=mongodb://127.0.0.1:27245/kitss_stage15_local`, `MONGODB_DB_NAME=kitss_stage15_local`, `MONGODB_REQUIRE_REPLICA_SET=false` for this standalone fixture only, the real tool paths above, and `KITSS_REAL_MEDIA_ACCEPTANCE=true`. Set each database variable to a different fresh `kitss_stage10_test_<16 lowercase hex>` name; browser names use `kitss_stage10_browser_<16 lowercase hex>`. Occupied databases and non-task URIs are rejected before fixture writes.

```powershell
# KITSS_STAGE15_TEST_DB selects the first suite's fresh guarded database.
node --test --test-concurrency=1 backend/tests/real-media.mongodb.integration.test.js backend/tests/scanner-deadline.test.js backend/tests/video.test.js backend/tests/publishing.test.js
# KITSS_VIDEO_TEST_DB selects another fresh guarded database.
node --test backend/tests/video.mongodb.integration.test.js
# KITSS_VIDEO_BROWSER_DB selects another fresh guarded database; local Chrome required.
node --test frontend/tests/video.browser.test.js
```

`MEDIA_FFMPEG_PATH`/`MEDIA_FFPROBE_PATH` must be explicitly exported for the actual-tool unit tests. Merely reading backend `.env` into application config does not export variables into the test process. Optional `KITSS_REAL_MEDIA_VIDEO` selects a task-generated MP4 for the browser; otherwise the existing self-generated fixture is used. Test output/evidence must remain ignored. No new generated PDF/video fixture is committed.

The explicit real-media mode scans every fixture upload through the actual daemon. The ordinary regression fixture still defaults to a fake scanner, clearly separate from operational evidence. Payments remain explicitly synthetic; no Razorpay or SMTP acceptance is invoked. The harmless antivirus pattern is constructed only in memory for detection testing and is never saved to a public file or report. Failed-scan/protocol unit doubles are failure-mechanism tests, not real positive-scan evidence.

After acceptance, stop only the task-created MongoDB after checking its recorded PID/loopback address/port/root; retain or remove only positively identified task-owned synthetic artifacts. Existing application databases, user files and developer servers must remain untouched. The owner must separately approve any permanent service/system setup or production deployment.
