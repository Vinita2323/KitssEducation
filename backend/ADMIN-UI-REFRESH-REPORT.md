# Admin UI refresh

## Current guidance policy: concise help

The owner's later visual review supersedes the original every-field-help approach described below. Ordinary names, titles, email/password, search, status, category, date and other straightforward controls now have no automatic help paragraph. The generic fallback and automatic required/range/character-limit explanations were removed. Native constraints, validation feedback and existing error descriptions remain intact.

Short guidance remains for technical formats, rupees/paise, licensing/source evidence, upload scanning, retention and other consequential choices. No empty hint paragraphs or dangling help IDs are rendered. Detailed financial calculation and Test Mode explanations are in a native keyboard/touch-accessible “How totals are calculated” disclosure, closed by default; the filters retain one compact UTC note.

Verification for this follow-up: production build passed; five guidance unit checks plus four mocked browser TAP entries passed (nine total, zero failures/skips). Browser coverage includes compact mobile admin login, desktop/mobile dashboard reflow, keyboard disclosure open/close, date-range validation/error association, filter apply/reset, book price guidance and unchanged draft payload (123.45 rupees to 12,345 paise, approvals false). Dashboard WCAG axe checks passed and screenshots were inspected. No database/provider/SMTP tests or external calls were needed for this presentation-only follow-up. Earlier broad test counts below are historical, not rerun counts for this change.

## Delivered

The entire existing admin workspace uses a shared visual treatment for headings, cards, tables, buttons, inputs, validation feedback and spacing. The grouped collapsible sidebar and mobile drawer remain available. Each section has contextual “How to use this page” guidance. All existing native input/select/textarea declarations in 24 admin pages and editors now use shared field components with help text connected through `aria-describedby`.

Guidance covers prices in rupees versus paise, upload/scanning requirements, policy approvals, consent, evidence, review reasons, permission selection and filters. Existing labels, input values, validation attributes, event handlers, refs, API calls and request payloads are preserved. The help does not authorize a business decision, payment, tax policy or entitlement. Admin login also includes field guidance; student styling remains outside the admin CSS scope.

No backend application source, models, API contracts, dependencies, real environment values or business data were changed for this refresh. Earlier uncommitted dedicated-login/sidebar work was preserved. Source normalization checks verify the 24 form conversions retain their original control behavior; native tags/imports, display help labels and one obsolete book-editor explanation are the intended differences.

## Verification record

- Production build passed. The existing large-chunk advisory remains.
- Six guidance unit checks passed.
- Sequential desktop/mobile authentication: 16 TAP entries passed, zero failed/skipped (mocked HTTP).
- Policy/workflow regression: 11 TAP entries passed, zero failed/skipped. This covers real local HTTP/MongoDB policy saves, registration activation, result review, invitations, granular permissions, free access, simulated repurchase/refund review and exceptional access gates.
- Full admin accessibility/workflow run: 31 of 34 TAP entries passed; two scenario failures plus the parent failure are recorded in the combined command below. All 20 base-page accessibility checks, connected field-help checks, editor accessibility, validation, multiple save/review workflows, dashboard filters and native Chrome 200% zoom passed. The archive scenario assumed archived records disappeared from “All Statuses”; the last responsive scenario timed out waiting for an admin heading after a long run (session expiry was suspected). Targeted rerun results are listed below.
- Combined sequential command: 76 TAP entries, 68 passed, 8 failed, no skips/cancellations. This command is **not** presented as a passing run. Failures include test-parent entries: navigation immediate-scroll assertion/cascaded mobile viewport, an ambiguous upload button locator, the archive expectation and later expired-session responsive check. Those test assumptions were corrected without weakening application checks.
- Corrected navigation rerun: 5 TAP entries passed, zero failed/skipped, including desktop collapse/expand, mobile focus/resize and permission filtering.
- Dedicated upload/draft check: three TAP entries passed, zero failed/skipped. A generated image was uploaded through the actual local HTTP pipeline (synthetic clean scanner); ₹123.45 persisted as 12,345 paise, with draft state and pricing/rights approvals still false. Review/policy fields have connected help. Desktop/mobile screenshots were inspected.
- Final guidance plus upload/draft rerun after help-label refinements: nine TAP entries passed, zero failed/skipped.
- Corrected archive and eight-width reflow rerun, together with the dedicated upload/draft checks: 37 TAP entries, six passed, zero failed, 31 explicitly excluded checks skipped. The archive assertion now selects the draft filter before expecting the archived row to disappear; the application still retains archived history. All 20 sections reflowed at 320, 375, 390, 414, 768, 1024, 1280 and 1440 pixels. The skipped cases were already exercised in the broader run and are not counted as passes in this focused run.
- Final production build passed after the last help-label refinement. `git diff --check` passed. No frontend service, backend application source, model or API contract changed.

Earlier parallel runs hit local resource/time limits and are not acceptance evidence. Their logs were retained separately. Only identified test runners and child browsers were stopped. No owner browser or application server was intentionally stopped.

## Reproduction and evidence

Use fresh guarded fixture namespaces on a separate local MongoDB instance. This run used task-owned MongoDB 8.0.34 bound to `127.0.0.1:27317`; it never selected the configured application database. SMTP, scanner and payment adapters are synthetic; no real email, provider charge or operational acceptance is claimed.

```text
frontend: npm run build
node --test frontend/tests/admin-field-help.test.js
node --test frontend/tests/admin-navigation.browser.test.js
node --test frontend/tests/admin-workspace.browser.test.js
node --test frontend/tests/auth.browser.test.js
node --test frontend/tests/business-policies.browser.test.js
node --test frontend/tests/two-gaps.browser.test.js
```

Database tests require the explicit fresh `KITSS_ADMIN_UI_BROWSER_DB`, `KITSS_STAGE13_BROWSER_DB` or `KITSS_TWO_GAPS_BROWSER_DB` namespace accepted by the existing test fixture guards, and `MONGODB_URI` set to the isolated loopback instance. `KITSS_ADMIN_UI_REVIEW=true` adds connected-help assertions and writes evidence under ignored `frontend/test-artifacts/`. Focused checks use `KITSS_TWO_GAPS_FOCUS`; excluded scenarios remain reported as skipped.

Logs and source-review evidence are in ignored `.runtime/admin-ui-*.log` and `.runtime/admin-ui-source-review*.json`. Screenshots are ignored `frontend/test-artifacts/admin-workspace-*.png`. Historical completeness/audit evidence was not overwritten by the refresh run.

## Limits

Automated browser checks cannot guarantee absence of every regression. Physical devices, real provider acceptance, business/legal approvals, licensing, email rotation and production operations retain their existing requirements. No push, deployment, public tunnel or database migration was performed.

Final security review found no changed source/test/documentation file containing the configured private credentials or generated admin password. The task-owned MongoDB process was stopped after executable, data-directory and port identity checks; its test files were retained. No commit or push was made.
