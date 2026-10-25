# Local server storage and environment plan

## Stage 3 environment and database update

Keep the existing owner-configured MONGODB_URI private and unchanged. MONGODB_REQUIRE_REPLICA_SET=false is now the default and local value; no MongoDB/Docker installation or replica initialization is needed. MONGODB_DB_NAME optionally selects an explicit database. A development URI without a database selects kitss_education_dev; production requires explicit selection. Stage 6 must separately approve a payment consistency strategy rather than assuming this standalone deployment supports transactions.

backend/.env.example now documents backend-only AUTH_SECRET (random >=32 characters), SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_APP_PASSWORD and SMTP_FROM plus bounded session/OTP/cooldown settings. Use a provider-issued app password, never a normal mailbox password; mandatory STARTTLS on 587 or implicit TLS on 465, validated certificates, no SMTP debug logging. Local env received a random auth secret if absent and blank missing SMTP fields without overwriting credentials. Blank SMTP permits startup, but delivery-dependent flows fail safely; real delivery remains unverified. No secret belongs in VITE_ values.

Storage provider behavior is retained from Stage 2: no private static serving, upload endpoint, authorization bypass or claimed scanning/complete media lifecycle. The existing Vite proxy and configurable shared client base URL are retained. See [current setup](../../backend/README.md); any replica-set instructions below are historical/future payment options, not Stage 3 requirements.



Stage 2 implementation update (23 October 2026): `backend/src/storage/` implements the IO contract, including streaming, generated keys, SHA-256, range reads, no-overwrite publication, path/junction protection, idempotent file deletion and readiness probes. There is no media/upload HTTP endpoint or static file mount; getPublicUrl is a logical future address. Scanning, MIME validation, ownership/entitlement, MediaAsset persistence, orphan/reference jobs and cloud migration remain later-stage work. See [actual setup/reference](../../backend/README.md).

The user explicitly authorized creating local env files for Stage 2: credential-free `backend/.env` and `frontend/.env` were created only because neither existed, and both are Git-ignored. Backend env has the local replica-set URI and absolute workspace upload root; all three Razorpay credentials are blank and not required. `backend/.env.example` and `frontend/.env.example` document implemented Stage 2 settings. The longer Phase 1 example below is a future full-platform proposal, not a claim that session, email, scanning or payment systems now exist. Node's env parser loads config centrally; process variables take precedence; Test Mode is enforced without SDK calls. No exposed secret was copied or rotated.

No storage implementation or environment files are created in Phase 1. Examples are documentation placeholders, not credentials. Initial provider must be server-side local disk. Browser localStorage is currently a mock data store and must not be used as trusted file storage, authentication, financial or entitlement persistence.

## Storage contract and access boundaries

```text
StorageProvider.upload({stream,key,contentType,visibility,expectedBytes})
  -> {key,bytes,checksum,metadata}
StorageProvider.delete({key}) -> idempotent result
StorageProvider.getFile({key,range?}) -> {stream,metadata,range?}
StorageProvider.getPublicUrl({key}) -> URL only for explicitly public assets
StorageProvider.getMetadata({key}) -> {exists,bytes,contentType,checksum?}
```

MediaService performs validation/ownership/entitlement and knows MediaAsset IDs. Providers only perform storage IO. A provider does not decide whether a student purchased a course. `getPublicUrl` must reject private assets; private delivery uses authenticated `/media/:id/content`. Business modules never concatenate disk paths, call filesystem operations or store provider URLs as primary relationships. Provider config is injected through a registry; LocalStorageProvider initially, future S3/Cloudinary implement the same logical contract with range/visibility behavior. Prefer streaming buffers bounded in memory, especially videos.

Proposed durable layout under an absolute configured volume root:

```text
<STORAGE_LOCAL_ROOT>/
  staging/<random-upload-id>
  quarantine/<random-key>
  public/<purpose>/<yyyy>/<mm>/<uuid>.<approved-extension>
  private/<purpose>/<yyyy>/<mm>/<uuid>.<approved-extension>
```

Keys are server-generated normalized relative identifiers. Resolve against the configured root and verify path remains inside it; reject traversal, absolute/UNC/drive paths, NUL and symbolic-link escapes. No user filename becomes a directory or executable name. Keep private directory outside the SPA/public webroot. No broad express.static. Save user filename only as sanitized metadata for display/download disposition.

## Discovered file purposes and proposed limits

Limits are engineering defaults, enforced server-side and at proxy; adjust after real asset sizing. Admin business configuration may lower limits, not disable validation. Browser accept attributes are hints only. New actual PDF viewing is required, but a library choice should be evaluated during implementation rather than assumed installed.

| Purpose and source | Visibility | Allowed initial types | Proposed limit / controls |
|---|---|---|---|
| Brand logo, college/university/faculty/banner/cover; existing external URLs and public logo/banners | public only after publication | JPEG/PNG/WebP | logo 3MiB (matches franchise UI), other image 5MiB; decode/re-encode, dimensions/pixel bounds, strip metadata |
| Profile/passport photo; Study/Tuition/Teacher forms | private source; safe profile variant only where approved | JPEG/PNG/WebP | 3MiB; no automatic public passport image |
| Franchise registration/affiliation/auth-letter/PAN-GST documents | private reviewer/capability | PDF/JPEG/PNG | 5MiB each (matches current client doc limit); cap total request/draft and document count |
| Student Aadhaar/certificate/result/class ID; teacher Aadhaar/experience | private scoped reviewer | PDF/JPEG/PNG | 5MiB each, quarantine, minimize retention; identity purpose approval Q05 |
| Book originals and course study books | private for paid material; free policy Q04 | PDF | 50MiB initial, real page count/TOC extraction, parser sandbox/timeouts, malicious active-content check |
| Public book preview | public approved derivative | PDF page subset or raster pages | 10MiB total; never a URL to entire original paid document |
| Lecture videos | private authenticated streaming | MP4/H.264/AAC initial tested format | 1GiB initial, route-specific streaming upload limit, duration/codec probe, proxy timeouts; no entire-memory multipart buffers |
| Lecture notes/resources (legacy player) | private, download only if editor explicitly permits | PDF initially | 25MiB; additional Office/document formats require explicit need and scanner support |
| Trusted result imports (new operational dependency) | private results operators only | bounded UTF-8 CSV or JSON schema | 10MiB, streaming parse/row cap/dry-run, reject formula-bearing exports, per-row validation/provenance |
| Order invoices | private owner/commerce | generated PDF | 5MiB expected; immutable version/safe numbering |

Untrusted SVG/HTML/executables/archives are rejected initially. Existing first-party SVG artwork can remain code assets; this does not justify allowing applicant SVG uploads. Check file signatures, extension/type allowlist and actual decoder parse; neither MIME nor signature alone is sufficient. Use [OWASP file-upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) for layered validation, generated names and isolated storage.

## Upload / attach / deletion lifecycle

1. Public applicant creates intake draft and receives short-lived capability; authenticated editor/student uses its existing identity. POST media validates scope+purpose, per-user/draft quotas, content-length and streamed bytes before accepting the upload. Empty payload and aborted uploads fail safely.
2. Stream to staging, scan/probe with bounded resources, reject mismatches; write a quarantined/staged MediaAsset with checksum and real bytes/page/dimension metadata. Only ready media may be attached/published. A forged asset ID belonging to another draft is denied.
3. Attach IDs on a validated domain write. Asset relationships and application state update in a database transaction where appropriate. If disk write succeeds but DB write fails, retain a recoverable staged state and cleanup job; if storage fails, never mark ready. File deletion cannot be rolled back by MongoDB, so use logical status then retryable physical cleanup.
4. Successful publication exposes public derivatives through safe asset resolution. Private files require session/capability or staff reviewer authorization. Applicant capability may access own staged documents only, never paid books or another application.
5. DELETE staged/unreferenced media checks references; attached media must first be detached/replaced. Archive must not delete historical invoices or learner content still licensed. Cleanup abandoned drafts after proposed 24h/7d windows depending intake needs; final retention is Q05. Persist retries and disk-full alerts. Scanner outages quarantine, not silently approve.

## Private PDF/video delivery

Authorize every byte/range request using the canonical book/course relationship, account status, enrollment/entitlement and current server time. Return 200/206 with correct Content-Type, Accept-Ranges, Content-Range and Content-Length; invalid range ->416. Support stream backpressure/abort, not read-entire-file. Prohibit shared caching for private material, and avoid exposing physical path/key. A same-origin session cookie works with `<video>` requests; cross-origin cookie/media/CORS behavior must be tested on Safari/mobile. Future short-lived signed delivery tokens bind resource/user/scope/expiry and remain server-minted, not permanent public URLs.

Initial practical strategy: MP4 with seekable metadata and HTTP Range behind a reverse proxy using an internal protected delivery location after Node authorization. The public URL stays `/api/v1/media/:id/content`; proxy internal paths are never client-chosen. Limit concurrent streams/bandwidth based on measured capacity, monitor disk/egress, test revoked access on new requests. Already buffered content cannot be recalled. Local single-rendition MP4 has no adaptive streaming/CDN elasticity. If actual library size/concurrency exceeds capacity, approve transcoding/HLS and provider/CDN migration separately; every HLS segment/key then needs protection. Existing sample video is not production educational inventory.

## Backups and cloud readiness

Local production requires a mounted persistent volume, disk quotas/free-space monitoring, least-privilege non-executable permissions, and backups of files plus matching DB metadata. Do not deploy local paid files to ephemeral function storage. One Node VM/container with durable volume is the initial default; multiple replicas need shared durable file access or object storage. Frontend Vercel SPA hosting does not solve backend persistence.

Migration: inventory asset IDs/provider/keys/checksums and active references -> copy originals/variants to destination preserving logical IDs -> verify count/checksum/visibility -> test range/private delivery -> atomically update asset provider/key in batches with journal -> resolve URLs through provider -> retain read fallback/rollback window -> remove local copies only after restore/rollback validation. No business code rewrite; no database-wide hardcoded URL replacement. Backups need encrypted copies and restore drills with unpublished/private access verified. Target proposed RPO 24h/RTO 4h requires owner/infrastructure confirmation Q10.

## Frontend environment example (documentation only)

Detected build tool is Vite. Values prefixed `VITE_` are public build-time values; do not put any secret there. This follows [Vite environment documentation](https://vite.dev/guide/env-and-mode).

```dotenv
# frontend/.env.example (future file)
VITE_API_BASE_URL=/api/v1
VITE_PUBLIC_APP_URL=http://localhost:5173
VITE_APP_ENV=development
```

Use `import.meta.env.MODE/DEV/PROD` for build mode rather than duplicating every setting. Validate required public URLs at startup/build; normalize slash handling. A feature flag, if necessary, is public UX control and never authorization. Razorpay is the confirmed provider: A55 returns only the publishable Key ID and necessary Standard Checkout data for the backend-created order. Neither `RAZORPAY_KEY_SECRET` nor `RAZORPAY_WEBHOOK_SECRET` is frontend configuration; no VITE_ payment secret is allowed. Backend owns all three named credentials and never exposes either secret. Production environment changes generally require a frontend rebuild; document deployment values. Prefer same-origin `/api/v1` reverse proxy; current Vite dev `/api` proxy can remain compatible.

## Backend environment example (documentation only)

```dotenv
# backend/.env.example (future file; blank sensitive values intentional)
NODE_ENV=development
PORT=5000
APP_PUBLIC_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:5000
MONGODB_URI=
SESSION_COOKIE_NAME=kitss_session
ADMIN_SESSION_COOKIE_NAME=kitss_admin_session
SESSION_SIGNING_SECRET=
SESSION_IDLE_SECONDS=86400
SESSION_ABSOLUTE_SECONDS=86400
SESSION_REMEMBER_SECONDS=2592000
ADMIN_SESSION_IDLE_SECONDS=1800
ADMIN_SESSION_ABSOLUTE_SECONDS=28800
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
CSRF_SECRET=
TRUST_PROXY_HOPS=0
CORS_ORIGINS=http://localhost:5173
AUTH_CHALLENGE_TTL_SECONDS=600
AUTH_CHALLENGE_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_SECONDS=900
LOGIN_RATE_LIMIT_MAX=10
RESULT_LOOKUP_RATE_LIMIT_MAX=20
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=
STORAGE_PUBLIC_BASE_URL=/api/v1/media
UPLOAD_IMAGE_MAX_BYTES=5242880
UPLOAD_IDENTITY_MAX_BYTES=5242880
UPLOAD_BOOK_MAX_BYTES=52428800
UPLOAD_VIDEO_MAX_BYTES=1073741824
UPLOAD_IMPORT_MAX_BYTES=10485760
UPLOAD_MAX_FILES=6
UPLOAD_DRAFT_QUOTA_BYTES=31457280
UPLOAD_STAGING_TTL_HOURS=24
MALWARE_SCAN_MODE=required
MALWARE_SCAN_ENDPOINT=
IDENTITY_ENCRYPTION_KEY=
EMAIL_PROVIDER=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PAYMENT_PROVIDER=razorpay
PAYMENT_MODE=test
PAYMENT_RECONCILE_INTERVAL_SECONDS=300
JOB_POLL_INTERVAL_SECONDS=10
LOG_LEVEL=info
LOG_REDACT_SENSITIVE=true
```

Conditional requirements: email provider config required for production recovery/activation; all three Razorpay credentials required for provider-connected payments/webhooks; approved encryption key required only if sensitive ID retention is approved; scanning endpoint required for selected external scanner. `PAYMENT_PROVIDER=razorpay` records the confirmed choice behind the provider abstraction, not an open gateway selection. Offline unit tests use injected provider fakes, not real secrets. `STORAGE_LOCAL_ROOT` is mandatory and absolute in production; no implicit repo/public directory. DB connection must support transactions. Admin/student cookie names and TTLs cannot collide accidentally. Validate integers/booleans as typed data, origins as exact URLs, supported provider enum and required production TLS/cookies at startup; fail fast with redacted messages.

The exposed test credential is compromised; the authorized owner must revoke/rotate it before payment integration and supply fresh Test Mode configuration through the secret store. Do not copy current source credentials to any example or fixture. Examples remain blank placeholders; no credential values or real env files are created in this documentation task. Enforce Test Mode in development/CI/provider-connected integration tests, reject Test/Live key and record mismatches, isolate webhook signing configuration per environment, and require explicit approval before any live payment is initiated during implementation/testing. Never log secrets or include them in admin configuration responses. Fees, plan amounts, tax treatment, refund rules and invoice compliance are versioned approved business configuration, not inferred from gateway choice or arbitrary env defaults.

Future cloud credentials (`S3_BUCKET`, `S3_REGION`, endpoint/role configuration, or Cloudinary account credentials) are deliberately absent from active configuration until a provider is approved and implemented. Document future adapter variables at that time; do not provision cloud now. Prefer deployment-managed identity rather than static keys where available.

Implement root/backend/frontend ignore rules later: ignore `.env`, `.env.*`, uploads, private fixtures, logs and backups, explicitly unignore `.env.example`. Current `*.local` rule is insufficient. Keep examples placeholder-only and commit no real secrets. Supply production secrets through deployment secret management, separate dev/stage/prod databases/volumes/payment credentials, and rotate independently. Staff-editable fees/business settings belong in versioned DB settings; auth/payment/storage security settings remain deployment/code-controlled.
## Stage 4 storage/environment boundary — 24 October 2026

Existing ignored .env files and developer MongoDB URI are preserved; no new Stage 4 credentials or required environment variables. Existing local storage provider stays unchanged. A72 upload authorization/scanning/MediaAsset lifecycle remains deferred: franchise selected files are represented only as pendingDocuments metadata, clearly labelled locally selected, and block final submission until removed. Document-free review is explicitly allowed; no document is claimed to have been uploaded or silently discarded.

SMTP/app-password placeholders may remain blank for this stage. No real mail or Razorpay provider call is required by domain startup/tests. Guest draft recovery capabilities are secret bearer credentials in a private link fragment, removed from browser history after use; expire after 24 hours. Production retention, cleanup, privacy consent and real media assets still need owner decisions.


## Stage 5 implementation status - 24 October 2026

The existing local StorageProvider is used for generated staging/quarantine/public/private keys, streams, metadata, checksums and deletion; its interface now explicitly declares createKey. Backend .env.example and the ignored existing developer .env gain only MEDIA_CLAMAV_ENABLED=false and MEDIA_CLAMAV_PORT=3310. Existing credentials are preserved. No frontend secret or trust-bypass variable was added. Scanner connects only to 127.0.0.1; never expose unauthenticated clamd TCP publicly.

Stage 5 limits: images 5 MiB input, public sample PDFs 10 MiB, private full PDFs 50 MiB, also bounded by UPLOAD_MAX_BYTES. Decoded image pixels/dimensions/output, parser memory/runtime, upload duration, request/body limits and actor quota/rate limits are bounded. Configure HTTP/proxy request timeouts consistently for expected upload speeds; large-file capacity testing remains necessary.

Durable MediaAsset IO intents and cleanupKeys track pending writes/promotions/deletions. Staged intents older than 15 minutes can be reclaimed by startup/hourly maintenance; promotion cleanup has a 15-minute protection window, then retries safely. Failed disk removal stays tracked. Quarantined files are retained pending scan/retention policy, not silently purged. Archived content retains references, so detach/replacement and an approved retention policy are required before physical removal. Public visibility is logical authorization, never a public directory mount. Per-read checksum verification favors initial integrity over high-volume performance. Real persistent volume permissions, capacity/scan monitoring and coordinated DB/file backup restore remain operator work.

## Stage 6 adopted implementation - 24 October 2026

Stage 6 adds only optional RAZORPAY_CREDENTIALS_ROTATED=false to backend/.env.example and the ignored existing .env; existing credentials are preserved. No frontend Razorpay credential variable was added. Private .runtime/razorpay-test-approval.json is generated only by deliberate future operator validation; no approval file was created now. No SDK or new npm dependency was installed. Existing HTTP client and local StorageProvider remain in use; entitlement integration cannot bypass scan/license/integrity controls.

The configured development host is at its 500-collection limit. No collection/index/database was dropped or reset. A separate cached MongoDB 7.0.24 binary was used for a fresh loopback-only standalone test process on port 27186 with an ignored .runtime data root. This did not change backend/.env MongoDB URI or existing topology. Per-command MONGODB_URI and fresh DB names select only that separate server for tests. Local test server and retained synthetic smoke evidence are not proof of configured-host persistence. Application startup can fail safely until capacity exists for four additional collections; do not silently disable schema safety checks.

Tests use journaled writes and durable lease recovery, not replica-set transactions. Volume durability/backups and coordinated DB/file restore remain operational gates. Quarantine/scanner/retention restrictions from Stage 5 remain. No new production endpoint exposes private storage statically.


## Stage 7 implementation and superseding evidence - 24 October 2026

No Stage 7 environment secret was added; frontend pdfjs-dist 6.4.299 is pinned for actual local PDF rendering; existing backend .env values and frontend proxy were retained. course_thumbnail uses the existing image inspection/scanning pipeline; lesson_document uses private scanned PDFs with real page counts. Course/Lesson reference hooks prevent deletion of attached assets; secure media delivery retains integrity, range, no-store, MIME and entitlement checks. Video upload/inspection/transcoding is not available and fails closed; no public sample fallback is used by active players. The PDF.js canvas reader uses the existing same-origin /api reverse proxy for cookie-protected range transport and saves explicit page controls. Worker/CMap/font/WASM resources are emitted locally; eval is disabled and canvas dimensions bounded. Host all emitted assets and test same-origin worker/resource CSP. Text-selection/accessibility overlays are deferred; the original-PDF link remains available. Developer backups and local standalone test/restore roots are under ignored .runtime, outside MongoDB and frontend/public; do not publish them. Actual-host database cleanup and verified logical restore are documented in Stage 7 evidence. Actual host advertises replica-set metadata; no topology or application URI was changed.

See [Stage 7 report](../../backend/STAGE7-REPORT.md) and [current backend runbook](../../backend/README.md). Historical earlier-stage status paragraphs remain snapshots, not current operational acceptance.
