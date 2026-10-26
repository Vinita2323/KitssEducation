# Stage 12 — Razorpay Test Mode acceptance

Date: 26 October 2026. Baseline: `main`, `6b722f0`. **Real payment acceptance remains blocked.** This stage verifies independent integration paths without changing the existing approval gate or claiming a provider payment succeeded.

## Configuration and exact blocker

The existing backend environment loader reads ignored `backend/.env`. `PAYMENT_PROVIDER=razorpay` and `PAYMENT_MODE=test` are configured; the existing Test Mode API key ID and secret are present. An authorized real, read-only `GET /v1/orders?count=1` authenticated successfully through the existing adapter. It returned diagnostic status `authenticated: true`, `paymentMode: test`, `paymentsEnabled: false`; raw provider records were not recorded.

A new cryptographically random local `RAZORPAY_WEBHOOK_SECRET` was written privately to that ignored file. Its value is absent from source, evidence and this report. SMTP settings were preserved and **zero additional live emails were sent**. No dependency was added or upgraded.

The exact remaining gate is `RAZORPAY_CREDENTIALS_ROTATED=false` plus absent `backend/.runtime/razorpay-test-approval.json`. The existing adapter requires both the rotation assertion and a current, matching operator approval, together with Test Mode credentials and webhook secret. Approval uses a seven-day credential-bound fingerprint; changing a credential invalidates it. No flag, approval record or production guard was altered to manufacture readiness. The configured provider still returns `503 PAYMENTS_UNAVAILABLE` before order creation or webhook processing. Successful read-only API authentication does not satisfy this gate. Existing credentials were used only for the expressly authorized read-only check; replacement credentials were not requested.

## Architecture and changes

Reviewed the Stage 11 report, final audit/matrix, security/testing plans and master checklist, along with environment validation, PaymentService, Razorpay adapter, order/verification routes, raw-body webhook route, leased event/reconciliation workers, book/course fulfillment, admin inspection/summary and frontend Checkout service.

The modular monolith and PaymentService/provider boundary are retained. The existing backend-created order and Checkout response deliver only the public key ID, provider order, amount, currency and checkout metadata. The frontend verification callback does not grant access. Capture requires authenticated provider reads and stored order/owner/receipt/amount/currency association; fulfillment rechecks current account, licensing, publication, clean media and source-order rights. No parallel APIs, SDK, payment system or authentication system was introduced. No application/frontend production source needed modification.

Changes comprise:

- `tests/coaching-fixture.js`: forwards optional fixture provider options to the existing commerce fixture.
- `tests/razorpay-acceptance.mongodb.integration.test.js`: production Razorpay adapter exercised through an injected HTTP transport double, real Express HTTP, real standalone MongoDB, synthetic licensed products, fake-clean scanner and non-delivering mail adapter.
- This report and evidence-only additions to the requirements matrix and master checklist.
- Ignored local environment: local webhook signing secret only; not a tracked change.

The new test uses ephemeral synthetic secrets and explicit fixture approval, never configured credentials or an operator approval file. It marks records **simulated**, despite using the real adapter, so dashboard evidence cannot be confused with real provider acceptance. Transport assertions check the fixed HTTPS provider origin, backend Basic authorization, backend pricing and disabled partial payments. Synthetic response entities omit the fake provider's `mode` field to exercise the credential-scoped production adapter contract.

## Acceptance evidence

| Area | Actual result and boundary |
|---|---|
| Real provider authentication | Passed, read-only Test Mode API interaction. No provider order/payment was created. |
| Real book/coaching Checkout | Not executed: approval prerequisite fails before order creation. No real browser widget or human payment step reached. |
| Book entitlement | Adapter/HTTP-double capture callback, repeated callback, owner status, current full-document access and exactly one persisted entitlement passed in isolated MongoDB. No real-provider book entitlement accepted. |
| Coaching enrollment | Adapter/HTTP-double signed webhook followed by authenticated-response-double capture reads, enrollment, lesson access, foreign-user denial and repeated fulfillment passed. No real-provider coaching enrollment accepted. |
| Local webhook signatures | Exact raw bytes signed with the synthetic fixture webhook key passed through the real raw-body endpoint. Modified bytes rejected. Duplicate event persisted once; no entitlement before worker processing. This is local signed-request evidence, not Razorpay delivery or validation of a remote dashboard secret. |
| Configured local webhook | Secret present, but operational endpoint remains closed by the same approval gate. Unapproved adapter HTTP test returns 503 with zero transport calls. |
| Reconciliation | Interrupted callback recovered through the actual adapter payment-history interface using transport-double evidence; exactly one entitlement persisted. Existing fake-provider tests also cover crashes, DB failures, bounded retries, leases and audit recovery. No real provider reconciliation accepted. |
| Admin orders/dashboard | Protected order references and captured gross totals checked; three synthetic captures total 37,035 minor INR units and remain explicitly simulated. Student admin access denied. No actual revenue/settlement/tax claim. |
| Failure paths | Existing API/browser suites cover cancellation, failed/authorized/pending payment, invalid signature, wrong user/order/amount/currency, replayed references, duplicate callbacks/webhooks, interrupted creation/capture/fulfillment and reconciliation. No unverified access or arbitrary mark-paid operation added. |

Actual Razorpay webhook delivery requires an approved externally reachable HTTPS test endpoint and matching Test Mode dashboard secret/events. No tunnel, public listener, production webhook or dashboard configuration was created. Separate exposure authorization is required before choosing and creating a tunnel; none is necessary for the completed loopback tests. A locally generated secret alone is not provider configuration.

## Test commands and results

All database/browser runs override MongoDB to a dedicated loopback-only standalone MongoDB 7.0.24 on port 27242 with fresh guarded synthetic database names. No configured application-host database was connected to or modified. Browser tests block external requests and use their existing explicitly mocked Checkout bridge. They do not constitute provider acceptance or real-device testing.

Set these process-local values in PowerShell before database runs:

```powershell
$env:MONGODB_URI='mongodb://127.0.0.1:27242/kitss_stage12_local'
$env:MONGODB_DB_NAME='kitss_stage12_local'
$env:MONGODB_REQUIRE_REPLICA_SET='false'
# Each variable below must receive its own NEW name; existing databases are refused.
$env:KITSS_RAZORPAY_ACCEPTANCE_DB='kitss_stage10_test_'+[guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE6_TEST_DB='kitss_stage10_test_'+[guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE7_TEST_DB='kitss_stage10_test_'+[guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_DASHBOARD_TEST_DB='kitss_stage10_test_'+[guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE6_BROWSER_DB='kitss_stage6_browser_'+[guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_STAGE7_BROWSER_DB='kitss_stage7_browser_'+[guid]::NewGuid().ToString('N').Substring(0,16)
$env:KITSS_BROWSER_WORKFLOWS_ONLY='true'
```

From the repository root:

```powershell
node backend/scripts/verify-razorpay-auth.js --confirm-test-key-use
node --test backend/tests/razorpay-acceptance.mongodb.integration.test.js
node --test --test-concurrency=1 backend/tests/commerce.test.js backend/tests/commerce.mongodb.integration.test.js backend/tests/coaching.mongodb.integration.test.js backend/tests/dashboard.mongodb.integration.test.js
node --test --test-concurrency=1 frontend/tests/commerce.browser.test.js frontend/tests/coaching.browser.test.js
npm.cmd --prefix frontend run build
npm.cmd --prefix backend audit --json
npm.cmd --prefix frontend audit --json
```

| Final run | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Real Razorpay read-only authentication diagnostic | Successful command; not a Node test count | — | — |
| Adapter/HTTP-transport-double + real HTTP/MongoDB | 6 | 0 | 0 |
| Existing provider, commerce, coaching, dashboard tests | 39 | 0 | 0 |
| Existing book/coaching browser workflows | 14 | 0 | 0 |

Final automated total: **59 passed, 0 failed, 0 skipped**. The real read-only provider command is recorded separately and is not included in that total.

The initial new adapter run passed 6 tests. Adding explicit lesson/admin assertions exposed a test expectation error: unauthorized lesson access correctly returns 403, not the asserted 404. That intermediate run had 4 passed/2 failed (child and parent); the assertion was corrected without changing application behavior and the final complete rerun passed 6/0/0. Earlier failed runs are not counted as passing final evidence.

Unchanged responsive-width loops were deliberately omitted with the existing workflow-only switch; this does not add a Node skip count. Real positive-priced provider orders, real Checkout capture, provider webhook delivery and real-provider entitlements/reconciliation were **not executed**, rather than counted as automated skips or passes.

Frontend production build passed in 44.62 seconds with the existing large-chunk warning. Backend and frontend dependency audits each reported zero vulnerabilities. No additional SMTP suite or live delivery was invoked.

## Security, data and operational status

Real environment and private approval paths are Git-ignored. Source/build review found zero configured credential matches; staged content and whitespace are reviewed before the local commit. No private environment, logs, screenshots, local databases or generated test files are included. Public-key delivery remains via the existing backend Checkout DTO; backend secrets are absent from public configuration. Test Mode and signature checks, CSRF/Origin/session/RBAC, publication/licensing/scanner restrictions and no-manual-grant rules are unchanged.

The dedicated synthetic MongoDB is shut down after writers finish, using verified task PID/port checks. Ignored synthetic files are retained; existing application data is untouched. Gmail SMTP Stage 11 acceptance is preserved. Financial/access/refund/invoice/renewal and other existing business/operational gates are unchanged.

Remaining work is to satisfy the existing operator approval honestly, then perform actual book and coaching provider orders/Checkout/capture/access/admin acceptance. Human assistance may be needed at Checkout. Actual remote webhook delivery requires a separately approved HTTPS testing method. Until that evidence exists, **Stage 12 real-payment operational acceptance is incomplete**; matrix primary classifications remain unchanged. No push, deployment, live payment, subscription engine or next stage is authorized or performed.
