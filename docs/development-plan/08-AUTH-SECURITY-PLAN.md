# Authentication, authorization and security plan

## Q03 approved and implemented in Stage 3

Q03-A: normalized unique email OR backend-issued student ID, same Argon2id password; phone login excluded.
Q03-B: one active student session, persistent hashed opaque credentials, distinct HttpOnly student/staff cookies, synchronous expiry/status/version/pointer checks. Credential-validated transfer proof expires in two minutes, is single-use, requires explicit confirmed:true and replaces the exact prior pointer through CAS. A password submission alone cannot silently transfer.
Q03-C: minimal student identity creation chooses password, then email OTP verification. Pending accounts cannot authenticate. No registration fee status, book entitlement or coaching enrollment is granted.
Q03-D: authorized invitation-only staff, server-controlled ordinary-admin roles/grants, single-use 24-hour invitation token, staff chooses password, then email OTP verification before login.
Q03-E: recovery uses email OTP bound to challenge/account/purpose/expiry, atomic single-use password change and securityVersion session revocation; login is required afterward.
Email delivery uses SMTP + provider-issued app password as explicitly requested. Credentials remain backend-only; transport failures never authorize undelivered proofs. Live mail is unverified because SMTP fields are blank.

Security defaults: passwords 12-128 characters, Argon2id 64 MiB/timeCost 3/parallelism 1; OTP 10 minutes/five attempts/resend 60 seconds; student absolute 24h or remembered 30d, idle 24h; staff absolute 8h/idle 30m. Configuration is bounded. These engineering defaults remain subject to production calibration. Fixed-window IP/account throttles persist in MongoDB. All browser mutations use exact Origin plus signed HttpOnly host-only CSRF cookie and matching header; the one-hour CSRF token is obtained from A01. Secure cookies are mandatory in production.

Embedded User challenges make consume+effect atomic on standalone MongoDB; no transaction assumption. Atomic securityVersion invalidates all prior sessions even if bulk cleanup fails. Durable security audit outbox records the change atomically and retries after database outages. No default admin, startup bootstrap, role mass assignment or browser auth token exists. requireSession/requirePermission/requireOwner are operational integration helpers; future business/entitlement authorization is not claimed. General role/status administration, MFA, compromised-password corpus screening and production abuse/load calibration remain deferred.

The following Phase 1 findings/proposals are historical except where superseded here. SMTP app-password configuration and configured-MongoDB smoke succeeded only as documented in 10: DB connectivity was verified, live SMTP was not. The compromised Razorpay source secret field has been cleared without copying its value; owner revocation/rotation is still mandatory before Stage 6. No history rewrite or provider call occurred.



## Phase 1 defects and chosen approach (superseded by Stage 3 above)

The Phase 1 audit found mock authentication, browser plaintext credentials, fake resets/device binding and unguarded admin routes. Stage 3 has replaced those authentication boundaries; business CRUD/media/payment integration remains deferred. Do not copy demo credentials or browser entitlements to production.

Options: access/refresh JWTs can suit external/mobile clients but introduce refresh rotation/revocation complexity; a single browser SPA and Express service can use opaque server sessions with immediate revocation. Recommend a cryptographically random opaque session ID in a Secure, HttpOnly, SameSite=Lax host-only cookie, hashed in MongoDB Session, with independent student/admin session kinds and server-controlled expiration. Same-origin reverse proxy is preferred. Do not put auth tokens, passwords or OTPs in browser storage or URLs. A production in-memory session store is unsuitable; [Express security guidance](https://expressjs.com/en/advanced/best-practice-security/) describes server-side sessions and secure cookie handling.

Proposal: student idle expiry 24h, remembered absolute expiry 30d, nonremembered absolute expiry 24h; admin idle expiry 30m and absolute 8h. These are engineering defaults for approval, not observed business rules. Rotate on login, privilege change, password change and transfer. Server checks expiry/status and User.activeSessionId on protected requests. HttpOnly cookie path must support authorized media delivery. Separate staff session cookie prevents a student from becoming admin by modifying client state.

## Authentication lifecycle

1. Bootstrap AuthContext with null user/loading; fetch `/auth/me`, render public pages as guest on 401 and redirect protected routes preserving a safe internal return destination. Clear user-owned caches on logout/account switch. Guards improve UX; every endpoint independently authenticates.
2. Stage 3 creates identity only: student chooses a password, verifies email OTP and then signs in. Staff uses invitation/password choice/email OTP. Full business intake, document and fee workflows are deferred and must never confuse email verification with payment or paid eligibility. Faculty applications grant no staff role.
3. Hash passwords with Argon2id and calibrated cost on target infrastructure; never trim submitted passwords or log/return hashes. Use a vetted library, minimum/maximum length and compromised-password screening where feasible; backend rule is authoritative. Rate limit by account identifier plus IP and use generic credential errors. Keep recovery messages non-enumerating.
4. Recovery issues a hashed short-lived challenge (proposed 10m, maximum five attempts), binds OTP/token to identifier+purpose+challenge, atomically consumes on success and revokes sessions. Remove prefilled OTP. Email provider failure is retryable through the persisted job; never claim successful actual delivery without a delivery attempt.
5. Device conflict response supplies a credential-authenticated short-lived transfer proof. On confirmation, atomically replace activeSessionId and issue a new cookie. An unauthenticated attacker cannot transfer with only a user ID/device string. User-agent label is informational, not a security fingerprint. Simultaneous transfers must leave exactly one winning active session. Existing session is denied on its next request, including media requests; do not promise termination of already buffered bytes.
6. Logout revokes current server session and expires cookie; password reset/suspension revokes all sessions. Staff invitations are super-admin controlled, single-use, no hardcoded bootstrap password. Initial bootstrap occurs via an audited one-time deployment command, not a public endpoint. Admin MFA is recommended before production staff access; choose delivery/provider in Q03 rather than inventing an external integration.

## Role / permission matrix

Roles are proposed, with fixed code-managed permissions. A teacher application does not prove a teacher portal exists. Begin with `student`, `admin`, `super_admin`; narrower staff roles are optional assignments only when actual staffing requires them. Account status and object ownership apply in addition to roles.

| Capability | Guest | Student | Admin (assigned grants) | Super admin |
|---|---|---|---|---|
| published catalogue/CMS/config | read | read | read | read |
| own draft/intake upload | capability only | own only | review grant required | review |
| private profile/preferences/password | no | own | own | own |
| books/lessons/progress | published free/preview per policy | valid entitlement only; own progress | no blanket learner access from admin role | explicit audited support exception |
| orders/invoices/results/history/notices | none except own capability order | own and authorized | domain read permission only | domain permissions |
| institutions/programs | no write | no write | institutions.read/write | all |
| admission/franchise/registration review | no | no | admissions.*, franchises.*, registrations.* separately | all |
| book/course edits and publish | no | no | learning.read/write/publish | all |
| plans / reconciliation / grants | no | no | commerce.plans.write / commerce.reconcile / learning.grants.manage explicitly | all |
| CMS/settings/notifications | no | no | content.*, settings.*, notifications.* separately | all |
| trusted result ingest/publication | no | no | results.read/manage/publish separately | all; provenance still required |
| staff invite/role changes | no | no | no by default | accounts.roles.manage |
| audit/operational jobs | no | no | audit.read / operations.read explicitly | all |

No permission grants may be supplied by a student registration/profile payload. Prevent last active super-admin removal, self-escalation and blind role changes without recent reauthentication. Admin actor/name on notes comes from session; supplied `author` strings are rejected. Publish permission never bypasses content/source validation.

## Security controls tied to findings

| Surface | Planned controls | Required negative verification |
|---|---|---|
| Login/reset/intake/results | configurable shared rate limits, identifier/IP throttles, anti-abuse capabilities, bounded input | brute-force, enumerating differences, expired/used proof, cross-draft access |
| Cookie-authenticated mutations | CSRF token + Origin/Referer validation, exact trusted origins, no wildcard credentialed CORS | cross-site POST denied; no state-changing GET |
| HTTPS/proxy/headers | TLS, Helmet, hide X-Powered-By, explicit trusted hops; tuned CSP for Razorpay, fonts/images/media | untrusted forwarded IP cannot bypass limits; CSP allows intended Checkout/export flow only |
| MongoDB/query inputs | schema validation, field allowlist, ObjectId verification, no client operator/filter/pipeline | `$ne`, prototype/property injection, mass assignment and arbitrary sort rejected |
| Object access | resource ownership and parent membership, published status and server expiry | student A cannot read B order/identity/results/asset; mismatched course lesson/book denied |
| Media | signature/type/size limits, safe UUID keys, private path isolation, malware/quarantine, no browser source URLs for paid originals | path traversal, SVG/HTML script upload, double extension, spoofed MIME, oversized/decompression payload |
| Payment | server-created order, HMAC verify, captured status/amount/currency, unique IDs, event idempotency, transaction+reconciliation | callback spoof, replay, duplicate/out-of-order webhook, alternate owner's order, unpaid access |
| CMS/external links | schema sanitization and http(s)/internal allowlist, no javascript URLs or arbitrary stored JSX | stored XSS, open redirects, unsafe image URL/SSRF import |
| Sensitive intakes | minimize identity data, encrypted approved IDs, private assets, purpose/retention/access logs, masked UI | identity not in logs/list DTOs/public media; deleted draft cleanup honored |
| Error/log/audit | redacted structured logs with request ID, append-only safe audit | no secret, cookie, plaintext password, OTP, card data, full identity or source stack leak |

The frontend currently exposes a Razorpay test secret. **Treat it as compromised. Revocation/rotation by the authorized account owner and confirmation of replacement credentials are mandatory before any payment integration work or provider-connected integration testing.** This is not deferred until production launch. Review usage and affected credentials/webhook signing configuration, and rotate any other exposed values as appropriate; record evidence without recording secret values. No rotation has been performed by this documentation update. Remove compromised values from source and client artifacts during approved implementation; history cleanup, if desired, is a separate explicit Git operation, not Phase 1 work. Never copy the existing secret into docs, examples, fixtures, new files or messages.

## Confirmed Razorpay security requirements

Razorpay is the selected gateway for every applicable paid registration fee, book purchase, prepaid coaching pass and renewal. Use Standard Checkout with backend-created orders through PaymentService/RazorpayPaymentProvider. Business modules must not directly depend on SDK calls. Development and integration testing use **Razorpay Test Mode only**; no live payment may be initiated during implementation or testing without explicit approval. Test and Live records, credentials and webhook configurations must be isolated; default startup/test configuration fails closed against accidental Live use.

`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are managed in the backend deployment environment/secret store. Only the publishable Key ID may be included in A55's frontend Checkout payload, alongside the backend-created order and necessary checkout information. Neither secret goes into VITE_ variables, browser storage, public settings, logs, error responses, fixtures, source code or an admin settings screen. Webhook verification uses its own signing secret, not the Checkout key secret; never trust client-provided credentials.

The backend resolves current prices and stores its pending order before creating the bound Razorpay order. Verify Checkout HMAC against the stored provider order ID, then verify capture, buyer/application ownership, payment-to-order binding, amount, currency and mode from provider evidence. Signed webhooks are independently verified over raw bytes. Signature validation alone is not capture confirmation. Callback, webhook and reconciliation feed the same atomic, idempotent settlement/activation service; no frontend status/amount/entitlement assertion can bypass it. Administrators, including super admins, cannot mark unpaid orders paid without verified evidence; exceptional manual access grants remain distinct audited nonpayment records and cannot inflate financial summaries.

Mandatory negative tests include forged callback/signature, payment-ID substitution, wrong owner's order, wrong amount/currency/mode, authorized-but-uncaptured payment, raw-body tampering, duplicate/out-of-order webhook, replayed creation key with changed payload, duplicated renewal, and temporary database failure after capture. No automatic recurring Razorpay mandates/subscriptions are assumed; approval of gateway does not settle fee values, tax, refunds or invoice compliance.

Keep public caching separate from private `Cache-Control: private, no-store` documents/orders/results. Anonymous capability responses must not be cached. Payment webhooks require raw body signature handling before generic JSON parsing and do not use browser CSRF. File downloads set safe content types/disposition/nosniff. Do not pass external URL uploads directly to the server without egress restrictions and validation; prefer local file upload initially.

Existing 'anti-screenshot' scripts, blur overlays, clipboard overwrites, getDisplayMedia interception and shortcut blocking are not DRM and cannot prevent OS capture. Preserve useful watermark/player appearance, correct misleading guarantees, and review intrusive clipboard/keyboard behavior for accessibility with approval. Access control protects delivery; it cannot revoke a document already downloaded or prevent a camera recording. Dedicated DRM is outside confirmed scope.

This is an engineering privacy/security plan, not a legal determination. The forms collect minors' DOB, guardian details and Aadhaar-like identity documents; the owner must decide necessity, consent, authorized staff access and retention before production collection (Q05). No claim about current legal compliance is made here.
## Stage 4 enforcement — 24 October 2026

Admissions require a verified signed-in account (owner-confirmed Q04). Reuse persistent sessions, exact Origin checks, signed CSRF and default-deny permission middleware; no frontend gate substitutes for server enforcement. Domain validators reject unknown fields, malformed IDs, invalid references, unsafe URLs, oversized arrays and stale revisions. Guest franchise access is limited to its expiring hashed capability; another authenticated owner cannot reuse that capability.

Staff review permissions are explicit admissions.review/franchises.review; actors and note authors come from the session. Public DTOs omit review evidence, internal notes/outboxes and draft information. Audit events persist atomically with each domain record change. No public upload endpoint/private static files were introduced; selected-file metadata is never accepted as proof of upload. Q05 privacy/retention approval is still required before live sensitive intake. SMTP remains app-password based and unconfigured; tests use fakes. Razorpay rotation and all Stage 6 controls remain mandatory.


## Stage 5 implementation status - 24 October 2026

Stage 5 reuses opaque server sessions, fixed RBAC grants, exact Origin checks and double-submit CSRF for multipart and JSON writes. New code grants are content.publish, media.read and media.write. Upload ownership, compatible purpose and ready/clean checks are enforced before linking; public byte visibility also requires a live content reference. Unknown/private assets return safe 404 responses. No student upload or frontend entitlement bypass exists.

Uploads reject unsafe paths/names/extensions, unsupported MIME/signature pairs, oversized/malformed/empty files, animated/excessive images, encrypted/active/malformed PDFs and parser resource abuse. Images are decoded and re-encoded to metadata-free PNG. PDF structures reject active actions, scripts, embedded files and forms; this is defense in depth and does not replace malware scanning. SHA-256 verifies storage integrity before delivery. Private media is never express.static content.

ClamAV INSTREAM is bounded and loopback-only. No daemon was available on the development host. Unconfigured, failed and infected scans never become ready/public; no admin API or env flag marks files trusted. Clean scanner test doubles exist only in isolated test fixtures, not application startup. Production scanner/signature updates, upload volume monitoring, approved retention and backups remain operational gates. No real SMTP was used; app-password SMTP configuration remains pending. The previously exposed Razorpay test credential remains compromised and must be rotated before Stage 6; no old secret was copied.

## Stage 6 adopted implementation - 24 October 2026

Stage 6 preserves sessions/RBAC, exact Origin and CSRF for browser writes, owner-only order/application reads, rate limits, bounded validation and safe DTOs. New grant commerce.read controls staff payment inspection; commerce.reconcile never permits manual paid status. Backend product lookup and immutable snapshots reject client prices/owners/paid flags. Provider payment references are unique across orders. Raw webhook HMAC and durable event receipt precede acknowledgment; payload status alone is never capture proof.

RAZORPAY_CREDENTIALS_ROTATED=false is the safe default. The flag alone cannot enable calls: the operator must deliberately run scripts/approve-razorpay.js --confirm-rotated-test-credentials after fresh rotation. It performs a read-only Test Mode authentication check and stores a private ignored credential fingerprint approval (seven-day startup validity). Startup never runs it. Credential changes invalidate approval. No live keys/mode accepted, no automatic conversion, no actual validation/order/capture/webhook call occurred. Old exposed credentials remain compromised and must not be reused.

Book access requires real non-revoked entitlement, captured source order and secure current licensed publication; zero pricing, callbacks, failed/authorized payment and missing entitlement grant nothing. Quarantine, MIME/integrity/range checks remain intact. Identity uploads/numbers are not enabled. SMTP is still pending; teacher drafts never grant roles. Critical commerce writes explicitly request journaling. Exactly-once external delivery/cross-document atomicity are not claimed; durable dedup/retry assumptions are documented.


## Stage 7 implementation and superseding evidence - 24 October 2026

Stage 7 retains existing session/status/Origin/signed-CSRF/fixed-permission guards. Learning mutations are additionally account-throttled and allowlisted; user IDs, captured status and expiry cannot be supplied by learners. Private access requires exact published course/lesson membership, active verified user, an actual unexpired non-revoked enrollment and matching captured source order, plus clean ready licensed media. An Order or client flag alone never grants access. Explicit public previews are separate; preview viewing cannot write enrolled progress without enrollment. Contextual book reading validates the actual course/book relation even when a direct book purchase exists. New media references protect deletion; lesson PDFs stay in private storage and have no static route. Wishlist grants no rights. Identity-scoped state and late-response guards prevent cross-account data retention. No real payment, SMTP, arbitrary grant, free-access rule or scanner bypass was enabled. The local PDF.js worker uses same-origin protected media, local font/CMap/WASM assets, disabled eval and bounded canvas dimensions. Canvas viewing is not DRM or screenshot prevention; the authorized original-PDF link remains available for accessibility.

See [Stage 7 report](../../backend/STAGE7-REPORT.md) and [current backend runbook](../../backend/README.md). Historical earlier-stage status paragraphs remain snapshots, not current operational acceptance.

## Stage 10 account and operational administration

Fixed accounts.read/accounts.manage grants are added without implicitly granting ordinary staff new rights. Only super admins retain accounts.roles.manage. Account-management APIs reject self changes, every super-admin target, pending/archived activation, student-to-staff promotion and privilege escalation; all super-admin lifecycle remains operator-controlled, preventing concurrent last-super-admin removal. Reason, optimistic admin revision, bounded audit outbox and security-version CAS are required. Restoration never resurrects an old session. Read-only B38/B39 projections omit proofs, session/lease tokens, password hashes, job/result payloads and candidate data. Existing HTTP Origin/CSRF/RBAC/ownership middleware remains authoritative. No provider, activation, identity-document or payment gate is relaxed.
