# User and admin wording cleanup — 2026-10-29

Replaced development-stage notes, database references, integration placeholders and technical restriction messages with plain-language copy across registration, franchise applications, course and book checkout, refunds, settings, file management, payment review and admin help. Saved-success notices no longer name MongoDB. Media screens describe security checks instead of quarantine internals. Payment checks and book access replace reconciliation/entitlement labels where presented to users.

Unavailable actions remain unavailable. Copy does not imply that an application was submitted, approved or activated. Test Mode, simulated-payment identification, licensing/pricing approval, private file restrictions, refund execution boundaries and required business decisions remain visible and accurate. Demo inventory and client-authored/published content were not edited or disguised as real inventory.

Shared display helpers format selected status values and admin field names. Select option values remain the original API values (for example, `captured`, `dead`, `quarantined`), even when their labels read Payment confirmed, Needs attention or Awaiting security check. Payment units are preserved. The HTTP client's displayed error messages are simplified while codes, status, request references, fields and attached data remain unchanged.

No backend source, authorization checks, route guards, financial calculations, approval gates, data records, environment files or credentials were changed. Necessary operational file-format instructions remain available; removing these would make the existing import/settings tools harder to use.

Verification:

- 15 unit/HTTP/help tests passed, no failures or skips.
- 12 mocked browser scenarios passed across plain-language notices, concise admin help and book publication (15 TAP entries including parent tests), no failures or skips.
- Browser checks verify raw filter values, Test Mode visibility, closed application behavior, disabled unauthorized uploads, draft publication requirements, server rejection handling, mobile layout and existing admin form behavior.
- Frontend production build passed with the existing large-chunk warning.
- Source text was audited using a local JSX parser; `git diff --check` passed.
- Existing commerce/access browser expectations were updated for renamed controls. Full database-backed regressions and live payment, email, upload or deployment acceptance were not executed for this presentation change.

Commands:

```powershell
cd frontend
node --test src/shared/ui/displayText.test.js src/shared/api/httpClient.test.js tests/admin-field-help.test.js
node --test --test-concurrency=1 tests/plain-language.browser.test.js tests/admin-concise-help.browser.test.js tests/book-publication.browser.test.js
npm.cmd run build
```

These changes are local. No push, deployment or real external-service operation was performed.
