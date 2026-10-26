# Stage 11 — Gmail SMTP and Razorpay Test Mode acceptance

26 October 2026. Baseline: `5c19361`, branch `main`, initially clean tree. This stage reuses the existing JavaScript modular monolith, authentication/account services, SMTP adapter, PaymentService/RazorpayPaymentProvider and frontend checkout. No duplicate authentication, payment endpoint, collection, subscription engine or dependency was added.

## Operational result

| Acceptance item | Result |
|---|---|
| Gmail SMTP configured | **YES**, ignored `backend/.env`, Gmail STARTTLS on 587, certificate validation enabled. |
| Real SMTP authentication | **YES**, Nodemailer verify succeeded. No message was sent by that connection-only probe. |
| Actual SMTP acceptance | **YES**, six messages accepted by Gmail through actual auth/account workflows. |
| Actual inbox receipt | **YES (owner-confirmed)**: the owner explicitly confirmed all six messages received. No independent inbox API/read access was used. |
| Razorpay Test Mode credentials configured | **PARTIAL**: API credentials present; webhook secret absent, rotation flag false, operator checkout approval absent. |
| Real provider interaction | **YES, read-only authentication only**: Razorpay Test Mode authenticated GET `/v1/orders?count=1`. No records from that response were printed or persisted. |
| Real provider-connected payment verified | **NOT EXECUTED**. No order, Checkout payment, provider webhook or payment capture was created by this stage. |
| Book / coaching entitlement verified | **YES under isolated fake-provider regression; NO new real-provider entitlement**. These are separate forms of evidence. |

The original Stage 11 prompt required rotation and prohibited disclosed credentials. After the agent requested private replacements, the owner explicitly instructed **“use the credentials i give to you for now”** and authorized messages only to the specified owner inbox, at most six. That later instruction permitted temporary local SMTP and read-only Test Mode checks using those supplied credentials. **It does not establish rotation.** No secret value is reproduced here. The existing payment activation gate remains closed; `RAZORPAY_CREDENTIALS_ROTATED` was not falsely set to true and no approval file was manufactured.

## Architecture reviewed and preserved

- `loadConfig()` reads `.env` relative to `backendRoot`, not the shell working directory; process environment overrides file values. Only selected local environment keys/comments were edited, preserving MongoDB, storage, authentication and other settings. Actual `.env` files are ignored and excluded from Git.
- SMTP uses the existing Nodemailer adapter, backend-only credentials, `requireTLS`, TLS 1.2 minimum, certificate validation, bounded connection/greeting/socket timeouts, disabled protocol/debug logging and disabled attachment URL/file access. New `SMTP_FROM_NAME` supplies the requested display name through Nodemailer's structured `{name,address}` sender; `SMTP_FROM` remains the mailbox. Gmail configuration now rejects implicit-TLS/other-port settings and display-name header injection.
- The requested `SMTP_PASS`, `FROM_NAME` and `FROM_EMAIL` names are not existing project settings. Their meanings are mapped to `SMTP_APP_PASSWORD`, `SMTP_FROM_NAME` and `SMTP_FROM`; no duplicate password/sender aliases were introduced. SMTP identity matches the authorized Gmail account; no private credential belongs in frontend settings.
- Account registration/verification, resend, reset and staff invitation use existing embedded hashed User challenges. OTP purpose/account/expiry/attempt limits, delivered-proof authorization, one-use consumption and session revocation remain unchanged. Email-change verification is bound to current password, account security version, new address and requesting session.
- PaymentService still resolves authoritative prices, persists internal orders before remote creation, verifies Checkout HMAC against stored order/attempt ownership and provider payment/order amount/currency/captured evidence, and fulfills through existing durable idempotent effects. Raw signed webhooks, duplicate event handling, leased reconciliation and source-order-backed entitlements remain unchanged.
- Frontend receives only the existing server-issued publishable Key ID/Checkout payload when the provider is operational. Cancellation never marks paid; entitlement refresh follows authoritative verification/fulfillment. The only frontend change makes the deliberately non-enumerating recovery response informational rather than a delivery-success toast. Layouts, routes, checkout flows and payment/access gates are preserved.

## Real SMTP workflow evidence

The opt-in `backend/tests/smtp.live.integration.test.js` called the real SMTP adapter and existing auth/account services on three fresh guarded MongoDB databases bound to `127.0.0.1:27241`. It sent **exactly six messages**, all to the explicitly approved inbox, in this order:

1. Registration verification OTP. Invalid and artificially expired proofs were rejected in the isolated fixture; no OTP was returned in the service response.
2. Resent verification OTP. An immediate resend produced no email. The test waited the actual configured cooldown (60 seconds) before sending again; old proof rejected, new proof activated the synthetic identity.
3. Password-reset OTP. Invalid proof rejected; successful reset revoked the previous session, rejected the old password and allowed the new password.
4. Email-change OTP. A different synthetic starting identity in a separate empty database changed to the same approved inbox; wrong code rejected and confirmation revoked the previous session. No second recipient was used.
5. Staff invitation. Existing invitation-only authority granted only the requested synthetic staff permission.
6. Staff email-verification OTP after invitation acceptance. Staff could authenticate only after verification.

Proofs were observed only in memory inside the isolated test harness to complete the workflows; they were never returned to a browser, logged, saved to evidence or included in screenshots. The starting synthetic verified identities were fixture setup, not application-user activation or manual business entitlement grants. Real SMTP failure injection is not performed by deliberately abusing Gmail credentials; offline adapter/auth/account regressions verify safe failure messages, undelivered-proof invalidation, unchanged identity and anti-enumeration behavior.

The live suite is disabled during ordinary tests. It requires explicit opt-in, a loopback-only test URI, matching authorized sender/recipient and an atomic ignored six-message reservation created before network use. A failed/uncertain run cannot automatically resend. The reservation remains in place after acceptance. The separate diagnostic command can send one explicitly requested plain diagnostic message to the sender inbox, but **was not used to send any message in this stage**. Its guard now refuses additional diagnostic delivery when the six-message workflow reservation exists; that zero-send behavior was explicitly checked. The six-message budget is exhausted.

Safe evidence: [STAGE11-SMTP-EVIDENCE.json](STAGE11-SMTP-EVIDENCE.json). It contains purpose/acceptance booleans only, no recipient address, OTP, token, password, message ID or database dump. The owner subsequently confirmed all six messages received. This is owner testimony, not an independent inbox/API inspection.

## Razorpay evidence and retained prerequisites

`RazorpayPaymentProvider.verifyTestAuthentication()` is an explicit operator-only diagnostic on the existing abstraction. It accepts only a Test Mode key/mode and performs a fixed read-only GET. It cannot create an order, approve the provider, verify a Checkout/webhook signature while gated, mark paid, reconcile a payment or grant entitlement. Unit tests confirm zero diagnostic network calls for Live/missing credentials and that successful authentication leaves payment creation/signature processing unavailable.

`node backend/scripts/verify-razorpay-auth.js --confirm-test-key-use` succeeded, returning only authenticated/Test Mode/payments-disabled booleans. Its response record was not logged. The ordinary `approve:razorpay-test` command was **not run** because rotation and webhook prerequisites are unmet.

Real book/coaching Checkout, payment cancellation/failure/pending/capture, callback/replay/duplicate webhook, interrupted-callback provider reconciliation and actual paid entitlement creation remain **NOT EXECUTED against Razorpay**. Existing isolated fake-provider API/browser regressions cover those server/state boundaries without misrepresenting them as provider acceptance. No provider order or real-money transaction was initiated. No Live configuration, production webhook, public tunnel, deployment or arbitrary mark-paid/manual grant was enabled.

Before real provider-payment acceptance:

- Revoke/rotate the disclosed Gmail app password and Razorpay API secret; supply replacements privately in the ignored backend environment. Rotate/configure the webhook signing secret independently. Do not paste replacements into chat.
- Owner-confirmed receipt is recorded; perform future operational calibration/abuse/deliverability checks as separately authorized; this six-message run must not be repeated blindly.
- Set the existing rotation flag only after actual rotation and run the existing operator approval (read-only authentication, credential-bound seven-day approval). SMTP/read-only authentication success is not this approval.
- Choose a secure provider-webhook testing method. No public exposure was authorized here. Any tunnel or externally reachable testing endpoint requires separate explicit approval before it is established.
- Use separately approved positive-priced/licensed/scanned book and coaching fixtures and verify actual Test Mode Checkout/capture/fulfillment/admin totals. Existing content/scanner/publication gates were not bypassed to obtain payment acceptance.

## Commands and configuration

Non-secret mapping: Gmail host `smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`; private sender/user are stored in `SMTP_USER` and `SMTP_FROM`, display name in `SMTP_FROM_NAME`, password in `SMTP_APP_PASSWORD`. Razorpay uses existing `PAYMENT_PROVIDER=razorpay`, `PAYMENT_MODE=test`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_CREDENTIALS_ROTATED`. No secret is copied into examples/source/tests/docs. No frontend private payment variables were added.

```powershell
# Explicit connection-only diagnostics; neither sends email nor creates payment.
node backend/scripts/verify-smtp.js --verify --confirm-local-smtp-use
node backend/scripts/verify-razorpay-auth.js --confirm-test-key-use

# Offline adapter/config/HTTP/redaction tests; no external messages or payments.
node --test backend/tests/email.test.js backend/tests/auth.test.js backend/tests/env.test.js backend/tests/commerce.test.js backend/tests/http.test.js backend/tests/logger.test.js
npm.cmd --prefix frontend run build
npm.cmd --prefix backend audit --json
npm.cmd --prefix frontend audit --json
```

`--confirm-local-smtp-use` is an explicit operational acknowledgement, not a claim that the supplied credentials were rotated. The initial connection-only probe used the earlier flag name before that ambiguity was corrected; no email was sent by that probe. The live workflow test requires `KITSS_STAGE11_REAL_SMTP=true`, `KITSS_SMTP_ACCEPTANCE_RECIPIENT` privately set to the approved sender inbox and `MONGODB_STAGE11_SMTP_TEST_URI=mongodb://127.0.0.1:27241/kitss_stage11_local`. Do not opt in again without a new approved message budget and review of the existing reservation.

Transport references: [Google Gmail SMTP settings](https://support.google.com/mail/answer/7104828?hl=en), [Nodemailer SMTP/TLS and verify semantics](https://nodemailer.com/smtp). These references support configuration/connection-versus-delivery distinctions; actual results above come from this repository's executed checks.

## Tests, build and security review

| Executed scope | Passed | Failed | Skipped | Adapter / boundary |
|---|---:|---:|---:|---|
| Final unit/config/HTTP/logger | **25** | **0** | **0** | Mock transport, TLS/header/timeouts/config, safe error logging and read-only provider gate; no external traffic. |
| Auth, commerce, coaching, account/results and dashboard MongoDB integration | **63** | **0** | **0** | Actual isolated local MongoDB/API, fake SMTP/payment/scanner adapters. Includes invalid/expired/replayed proofs, delivery failures, owner/amount/currency/signature checks, pending/failure/duplicate webhook, crash recovery, both entitlements and financial groups. |
| Actual Gmail workflow suite | **4** | **0** | **0** | Three workflow children plus parent; exactly six real messages accepted, all owner-confirmed received. No additional diagnostic message sent. |
| Ordinary invocation of live-mail suite | **0** | **0** | **1** | Deliberately skipped without explicit opt-in; confirms normal tests do not send mail. |
| Final book/commerce browser | **7** | **0** | **0** | Real local API/MongoDB, explicitly isolated fake Checkout/provider. |
| Coaching/reader browser | **7** | **0** | **0** | Real local API/MongoDB, fake provider; unchanged width loop omitted. |
| Auth browser desktop/mobile | **16** | **0** | **0** | Mocked HTTP only, including recovery, OTP, invitation and session boundaries. |

Real Gmail authentication and the single real Razorpay read-only authentication request are operational checks, not fake-provider payments and not folded into the offline test count. Exact machine-readable counts: [STAGE11-TEST-RESULTS.json](STAGE11-TEST-RESULTS.json). Node counts include parent tests. The complete backend suite and unrelated expensive browser matrices were not rerun; the relevant scopes above were executed.

The initial existing commerce browser run had **5 passed, 2 failed (one child plus parent), 0 skipped**: its cookie-clearing login redirect timed out waiting for the full document `load` event. The corrected test waits for DOM content, explicitly verifies the Login control and actual `/auth/me` **401**, and still asserts no stale order data. Its final complete mutation scope passed 7/0/0. No authentication guard was relaxed. The initial smaller unit scope also passed 17/0/0 before expanded final unit checks. A final SMTP safety-only rerun passed 5/0/0, and a separate read-only reservation check confirmed zero network calls/zero messages when an additional diagnostic was requested after the six-message budget was consumed.

Frontend production build: **exit 0**, Vite reported **1m 31s**, with the existing large-chunk warning. Backend and frontend dependency audits each reported **0 vulnerabilities**. No dependency/lockfile upgrade or Razorpay SDK installation occurred.

Security checks confirm both local `.env` files and runtime acceptance reservations are Git-ignored; configured secrets match no reviewed source/example/test/report/frontend-bundle content. TLS verification is explicitly true, protocol logging is disabled, OTP/challenge values are absent from service responses/evidence, and Razorpay order/signature/payment paths retain their original gate. Only Test Mode was contacted. No app database or unknown production URI was contacted; synthetic writes were confined to fresh local test databases. No screenshot of real credentials/mail/Checkout was taken. The task-created loopback-only MongoDB was shut down gracefully after all test writers finished; ignored synthetic data is retained.

## Remaining operational gates

The current matrix denominator/status counts remain unchanged: 162 representative implemented/tested entries, 21 operational gates, 28 policy-dependent entries and one outside scope. Gmail configuration/authentication/SMTP-accepted workflow delivery and owner-confirmed inbox receipt now have real evidence; independent inbox inspection, credential rotation and broader deliverability acceptance remain open. Real Razorpay payment/webhook/paid-entitlement acceptance remains open. Real maintained scanning/licensed publication, original identity/minors/documents/intake/fees/eligibility policies, franchise approval, free/manual rights/renewals/book revocation, tax/refunds/invoices, trusted official results, pinned-runtime/production recovery and physical/assistive-technology acceptance remain as previously documented. No next stage or production release is implied.

Source/test/documentation changes may be committed only after successful verification and a staged secret review. Actual `.env`, OTPs, invitation links, browser profiles, raw provider responses and private test logs are excluded. No push, deployment, history amendment, branch change or remote change is part of this stage.

Final source/build credential scan: 345 reviewed shareable text files, zero configured credential matches, Git whitespace checks passed. Separate review of 14 Stage 11 logs/evidence files also found zero configured credential matches. Raw mail/provider responses, env files and runtime reservations are excluded from staging. The final staged inventory contains 18 legitimate source/test/documentation files, with zero credential/private-key findings and a passing `git diff --cached --check`.
