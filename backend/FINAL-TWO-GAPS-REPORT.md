# Final two software gaps: dashboard filters and admin accessibility

26 October 2026. Focused follow-up to local baseline `1a5c4f4` on `main`; the initial working tree was clean. No application database, live provider, SMTP delivery, production deployment or financial/access policy was changed.

## Status

B01: **IMPLEMENTED AND TESTED**. F25: **IMPLEMENTED AND TESTED** at the representative software/browser acceptance level. The verification scope and limitations below apply; this is not WCAG certification or operational release acceptance.

## B01: existing dashboard, actual stored data

The existing protected `GET /api/v1/admin/dashboard` accepts optional `from`, `to` and `paymentMode`. Existing permission checks and the all-time response groups remain. No analytics endpoint, collection, payment provider call or entitlement change was added.

- Dates are real UTC calendar dates in `YYYY-MM-DD`, from 1970 through 9998. Start is inclusive UTC midnight; end is exclusive midnight of the following day, so the complete end day is included. Either bound may be omitted. Invalid calendars, reversed ranges, duplicate/structured parameters, unknown fields and unsupported environments return 422.
- Captured order groups use `capturedAt`, other order groups use `createdAt`, and failed-attempt observations use `attempts.observedAt`. Platform collection counts and payment-event queues remain explicitly **lifetime** metrics. The response includes applied filters and timestamp semantics.
- The schema stores `paymentMode: 'test'`, provider `razorpay`/`fake`, and a separate `simulated` flag. The UI offers **All stored environments / Test Mode**. This is a payment-environment filter, not a verified payment-method breakdown. UPI, card, cash, wallet and bank-transfer information is unavailable and is not inferred from a provider name. Live Mode remains unavailable.
- Captured amounts remain gross captured order value, separated from simulation. Pending/failed/cancelled groups retain their own statuses and order values, and are never presented as captured receipts. No net-revenue, refund, settlement, tax, invoice or profit metric was invented.
- Each order is grouped once; attempts are unwound only for failed-attempt counts. Existing capture/replay/fulfillment safeguards are unchanged. Additive indexes cover `(status, capturedAt, paymentMode)`, `(createdAt, paymentMode)` and `(attempts.observedAt, paymentMode)`, with date bounds usable when environment is omitted. Each aggregation has a 10-second server execution limit; output is bounded grouped data, not an unbounded record export.
- Accessible Apply/Clear filters persist in URL query parameters and survive reload. Requests abort on change/unmount; aborted responses cannot replace newer results. Loading clears old totals, empty/error states are explicit, active requested filters remain visible, and reset restores the original all-time view. The summary was extracted into a shared component while retaining its existing export through the orders module for the dashboard import; the orders-review page keeps its existing independent order filters.

Actual HTTP/MongoDB fixtures verify inclusive midnight/end-of-day boundaries, different creation/capture dates, one-sided/combined ranges, stored Test Mode filtering, unsupported/structured inputs, empty ranges, all-time/reset totals, failed-attempt timestamps, pending-value separation and guest/student denial. Duplicate captured-attempt observations do not duplicate captured order totals. The existing commerce regression separately exercises actual duplicate callback/webhook delivery and exactly-once effects with its isolated fake provider.

## F25: shared implementation and section review

Admin-scoped CSS preserves the existing design while raising small control text to at least 14px, providing visible 3px focus outlines, improving muted/orange/emerald text contrast, enlarging important button/control targets toward 44px, wrapping long messages and keeping inputs within their containers. The sidebar switches to the named mobile drawer below 1024px, retaining usable content width at tablet sizes. Dialogs scroll within the dynamic viewport; controls have scroll margins below the sticky header. Reduced-motion preferences apply to CSS and Framer Motion.

The shell provides a skip link, named main target and current-navigation semantics. Table headers receive column scope; overflowing table containers become named, focusable scroll regions, including after resize. Native invalid events create associated inline error text and `aria-invalid`; correcting valid input removes only the helper's own error association. Existing API errors remain alerts, with entered data preserved. Status/filter buttons expose selection using `aria-pressed`. Toast messages are announced; their dismiss controls have visible focus and larger targets.

Existing modal editors/reviews now have names, modal semantics, initial focus, Tab/Shift+Tab containment, Escape and invoker restoration. Admin background branches are inert while modal dialogs are open. Inline result/notification/account/registration editors move focus without pretending to be modals. Restoration handles a temporarily disabled loading invoker, React StrictMode and immediate heading fallback when an archived row removes its invoker; it avoids stealing subsequent user focus. Searchable-selector portals stay inside a containing dialog. Native selects retain browser keyboard behavior.

All 20 active sections were source-reviewed and exercised with axe-core 4.14.0 against WCAG 2 A/AA, 2.1 AA and 2.2 AA tags, eight widths, and native Chrome 200% page zoom. Shared fixes apply even where no page-specific source change was necessary.

| Section | Specific review and representative interaction evidence |
|---|---|
| Dashboard | Labels, range error association, Apply/Clear by keyboard, persisted URL/reload, stale response rejection and mobile reflow. |
| Users / staff permissions | Named search/filter/reason controls, native permission checkboxes and inline details focus; keyboard account-detail open/close. Existing backend authorization and staff protections regressions retained. |
| Audit logs | Named filters, headers, bounded pagination, redacted records, focusable horizontal table regions. |
| Operations | Named job filters/actions, status/loading/empty announcements, pagination and table reflow. |
| Results | Inline issuer/exam form focus, native labels/selects and JSON input; keyboard save of a synthetic issuer draft. Official publication gate retained. |
| Notifications | Named composer fields, native audience/category selects, keyboard draft save and focus restoration after asynchronous refresh. |
| Coaching | Named course/lesson dialogs, native taxonomy/section selects, media controls; keyboard course and lesson draft saves on an editable draft course. |
| Enrollments | Search/status/review controls, table headings and scrolling; manual-grant and verified-source restrictions retained. |
| Orders | Existing references, filters, pagination/reconciliation controls and financial-summary filter semantics; no manual paid-status control added. |
| Registrations | Named nonmodal review, reason field, keyboard persisted note and close action; activation/documents/payment gates retained. |
| CMS | Named editor, selected content section, native dropdown within dialog, keyboard real API error/correction/save, preserved values and long alert wrapping. |
| Media | Named file/purpose/status controls, quarantine/status feedback, native select/refresh keyboard operation and horizontally scrollable record table. Scanner rules unchanged. |
| Settings | Programmatic labels, native form controls, typed settings and permission-disabled states; shared focus/contrast/reflow review. |
| Taxonomies | Named editor, wrapped labels, parent/status selects, keyboard change/Escape and focus return. |
| Universities | Explicit search/field labels and named close button, required native validation/correction, keyboard save persisted to MongoDB and focus return. |
| Colleges | Explicit search/university-filter label, darker status text, named editor/close and keyboard change/Escape; existing create/edit regression passes. |
| College programs | Explicit linked labels, named program dialog/close and keyboard edit/Escape; existing program create/edit/archive regression passes. |
| Franchise requests | Explicit search/note labels, named review/close, selected status semantics and keyboard note workflow; document-free review and approval gate preserved. |
| Admission applications | Explicit search/internal-note labels, named review/close, independent filter/review selection semantics and keyboard note workflow. |
| Books | Linked filter labels, named editor/archive confirmation, ready-media selectors, keyboard draft save/archive, announced result and focus return/fallback; existing upload/publish/edit/archive regression passes. |

Eight-width matrix: **320, 375, 390, 414, 768, 1024, 1280 and 1440 CSS pixels**, all 20 sections, with no document-level horizontal overflow. Native 200% Chrome page zoom uses a disposable profile, not CSS transform or device scale emulation: the test asserts `devicePixelRatio === 2` and a layout viewport below 730 CSS pixels for a 1440px window. It checks all 20 sections and an actual modal keyboard/axe workflow. The preference format follows [Chromium's zoom implementation](https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc). An additional 720px equivalent-zoom layout and 390×400 reduced-height viewport check exercise scrolling, mobile drawer trapping/Escape and reachable financial controls.

## Actual verification results

| Executed scope | Passed | Failed | Skipped/excluded | Result / explanation |
|---|---:|---:|---:|---|
| Final complete F25/B01 browser acceptance | **34** | **0** | **0** | All 33 children plus parent; all 20 sections, eight widths, native 200% zoom, axe and saved keyboard workflows. |
| Final removed-row fallback / book-course-lesson keyboard rerun | **2** | **0** | **32** | One affected workflow plus parent after the immediate fallback refinement; unrelated children explicitly excluded. |
| Existing institution browser mutations | **6** | **0** | **0** | Existing unchanged width loop omitted using its workflows-only switch. |
| Existing publishing browser mutations | **5** | **0** | **0** | Existing unchanged width loop omitted; uploads, publication, editing and permissions retained. |
| Existing shared selector/dialog/PDF/CMS regression | **5** | **0** | **0** | Actual keyboard selector/drawer behavior and existing protected-content workflows. |
| Final dashboard unit + actual HTTP/MongoDB integration | **2** | **0** | **0** | Rerun after date-first index ordering; initial focused run also 2/0/0. |
| Complete backend invocation | **119** | **2** | **2** | Two database-name guards rejected incorrectly supplied test prefixes before executing those suites; media-tool and legacy replica-set checks were not opted in in this invocation. |
| Corrected backend scopes + media tools + shared client | **36** | **0** | **0** | Auth 14, institutions 12, installed-media checks 2 and shared client 8. Correct prefixes supplied; media binaries explicitly opted in. |

Across the complete backend run and corrected scopes, the final backend coverage is **146 passed, 0 remaining failed, 1 optional legacy replica-set check not executed**, plus **8 shared-client tests passed**. This is a coverage rollup across runs, not a claim that the original full invocation exited successfully. The final dashboard index refinement was verified separately with 2/0/0. The legacy replica-set connection check remains unexecuted because this disposable MongoDB is standalone; this stage changes no transactional payment workflow.

Final browser acceptance plus the three existing regressions totals **50 passing executions with no failures/skips in those final runs**; the subsequent removed-row fallback rerun adds 2 passing executions and explicitly excludes 32 other children. Repeated scopes are not counted as new independent requirements. Final complete browser runtime was 435.60 seconds. Final frontend build exited **0** in **51.37 seconds**, retaining Vite's existing large-chunk warning. Backend and frontend `npm audit --json` each reported **0 vulnerabilities**; the lockfiles were unchanged after those audits.

Earlier failures are preserved in [FINAL-TWO-GAPS-TEST-RESULTS.json](FINAL-TWO-GAPS-TEST-RESULTS.json), with exact totals:

| Earlier browser run | Passed | Failed | Explicitly excluded |
|---|---:|---:|---:|
| First | 24 | 7 | 0 |
| Second | 29 | 3 | 0 |
| Focused correction | 1 | 4 | 27 |
| Expanded pre-acceptance run | 30 | 3 | 0 |
| Additional draft/review scope | 1 | 2 | 31 |
| Native-zoom/review scope | 1 | 2 | 31 |
| First review-only scope | 0 | 2 | 32 |
| Corrected review-only scope | 2 | 0 | 32 |

These exposed unnamed controls/college contrast, disabled-invoker focus return and the franchise button's misplaced accessible name, which were fixed. Test-side corrections included exact button names, waiting for enabled controls and persisted notes, generating an actual oversized-body validation error, editing lessons on a draft course, supplying a positive synthetic fee and required franchise taxonomies, and allowing 60 seconds for browser navigation after a 20-second timeout during concurrent runs. Native page zoom and all final affected scopes subsequently passed. Screenshots/private fixture dumps stay ignored; the committed [browser evidence](FINAL-TWO-GAPS-BROWSER-EVIDENCE.json) records axe findings rather than representing a WCAG certificate.

Counts include Node's parent tests where printed. Explicitly excluded tests and the optional legacy replica-set check are not passing tests. Local logs remain ignored under `.runtime/`; committed evidence contains only synthetic section identifiers and test summaries, not application documents or credentials.

## Reproduction

Use a disposable local MongoDB and explicit process-only environment overrides. The test fixtures refuse existing/non-test databases. Do not substitute the application's configured host.

```powershell
$env:MONGODB_URI='mongodb://127.0.0.1:27240/kitss_two_gaps'
$env:MONGODB_DB_NAME='kitss_two_gaps'
$env:MONGODB_REQUIRE_REPLICA_SET='false'
$env:KITSS_DASHBOARD_TEST_DB='kitss_stage10_test_'+[guid]::NewGuid().ToString('N').Substring(0,16)
node --test backend/tests/dashboard.test.js backend/tests/dashboard.mongodb.integration.test.js
$env:KITSS_TWO_GAPS_BROWSER_DB='kitss_stage10_browser_'+[guid]::NewGuid().ToString('N').Substring(0,16)
node --test frontend/tests/two-gaps.browser.test.js
npm.cmd --prefix frontend run build
npm.cmd --prefix backend audit --json
npm.cmd --prefix frontend audit --json
```

The browser test uses installed Chrome (override `CHROME_PATH` if necessary). `KITSS_TWO_GAPS_FOCUS` optionally selects child titles by a regular expression and explicitly skips other children; unset it for the complete focused-stage suite. Complete backend regression uses `npm.cmd --prefix backend test` with each existing opt-in suite assigned its required fresh database prefix, plus `MEDIA_FFPROBE_PATH` / `MEDIA_FFMPEG_PATH` for installed media tools. Authentication requires `kitss_stage3_test_<16hex>`; institutions requires `kitss_stage4_test_<16hex>`. These process overrides do not overwrite developer `.env` files.

## Limits, retained gates and safety

- No physical phone/tablet, actual mobile virtual keyboard/IME, screen reader (NVDA/JAWS/VoiceOver/TalkBack), switch device or cross-browser assistive-technology combination was independently tested. Reduced-height emulation is not physical keyboard acceptance. Automated axe and browser keyboard/reflow checks do not establish full WCAG certification.
- Native file-picker OS dialogs and browser-owned confirmation-dialog assistive-technology behavior were not independently audited. Existing upload/publication regressions cover the application's file lifecycle with synthetic clean-scanner doubles, not a real scanner certification.
- No production-sized aggregation/load benchmark or exhaustive record/device/control permutation was claimed. Query timeouts/index definitions were verified on isolated local MongoDB. Existing policy/provider/scanner/SMTP/runtime/operational acceptance gates remain.
- Incidental existing behavior: creating a college program with `feeMinor: 0` is rejected by its existing required-field validator. A positive synthetic fee is used here. This focused stage does not redefine zero-fee/admission pricing policy or alter that validator.
- Only `axe-core@4.14.0` was added, as an exact frontend **development** dependency for automated accessibility checks. No application dependency upgrade, schema collection, provider SDK, migration or secret was added.
- All database writes were confined to fresh guarded test databases on a loopback-only disposable MongoDB process, port 27240. The configured application database was not contacted; no host cleanup, record reset or business-data seed was performed. The task-created local MongoDB was shut down gracefully after all writers finished; ignored local test data is retained.
- Local commit is authorized after verification/secret/diff review. No amend, push, branch/remote change, deployment, live payment or next development stage is authorized by this report.

## Final review

Source/documentation and compiled-frontend review examined 337 shareable text files with zero configured credential-value matches; Git whitespace checks passed. No environment files, private fixture dumps, browser profiles, dependencies or compiled bundles are included in the local commit. The staged inventory contains 39 legitimate source/test/documentation files; staged private-key/configured-credential checks found zero unsafe entries, and `git diff --cached --check` passed. Commit identity is recorded by `git log -1`; no amend or remote operation is part of this stage.
