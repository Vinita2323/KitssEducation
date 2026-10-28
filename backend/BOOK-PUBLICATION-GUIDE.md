# Book publication and admin preview

At `/admin/books`, status badges are read-only. Each eligible row has explicit **Publish** or **Unpublish** buttons. **Admin preview** reads the saved record through the existing permission-protected admin detail endpoint and stays in the admin workspace. **View public page** is shown only for published rows.

To publish:

1. Open Publish and review the current saved record and requirements.
2. Use Edit book to fill missing author, category, language, description, cover, full PDF, price, approved pricing, rights confirmation and licensing reference.
3. Save the draft, reopen Publish, then Confirm publish.

Do not approve pricing or licensing unless authorized. The seeded paid English demonstration was originally left without pricing approval intentionally; creating or saving a price alone does not approve it.

The checklist checks supplied metadata. Actual publication remains server-authoritative, including file scanning, PDF validation, active educational choices, permissions and optimistic revisions. A 422 response means publication validation rejected the request; the dialog keeps the server's explanation visible and does not report success. File links use the existing guarded media endpoint and are offered only to staff with media-read permission. The preview does not turn draft files into public assets or grant student entitlements.

Unpublish requires confirmation and uses the existing publish API with `publish: false`. Editing a published record does not automatically replace its published snapshot. Current behavior still requires the existing unpublish/publish workflow to replace that snapshot.

No backend validation, financial policy, existing book records, credentials or environment configuration was changed. These source changes are local; no deployment or production publication was performed.

Verification commands:

```powershell
cd frontend
node --test --test-concurrency=1 tests/book-publication.browser.test.js tests/admin-concise-help.browser.test.js
npm.cmd run build
```

The book browser suite uses mocked HTTP and checks admin preview, missing approval, server 422 rejection, successful publication/unpublication payloads, public-link visibility, read-only access, mobile layout, keyboard focus and accessibility. The existing database-backed publishing browser test was updated to use the explicit confirmation controls; it requires isolated database configuration and is not part of the mocked run.

Verified on 2026-10-28: all 9 browser scenarios passed across both mocked suites (11 TAP entries including the parent tests), with 0 failures and 0 skips. The production frontend build and `git diff --check` passed; the build retains the existing large-chunk warning. The database-backed publishing suite and live-site publication were not executed.
