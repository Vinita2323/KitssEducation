# Staff management

Open **Administration → Staff management** at `/admin/staff`.

Staff invitations now appear only on this dedicated page. They have been removed from the shared admin layout. User accounts retains its existing route and controls, with a link to the staff page for authorized managers.

The page reuses the existing invitation form and account management component:

- Invite or resend with a name, email and selected permissions. The existing SMTP, cooldown, permission restrictions and acceptance/verification process are unchanged.
- View staff accounts using the existing `/admin/users` API, fixed to `role=admin`. Search, status filtering and pagination remain available. Super-admin accounts remain in User accounts and are not editable through this ordinary-staff list.
- Select a pending account and choose Review invitation to prefill its details and reference. Resend remains valid only before password setup; pending can also mean that email verification is unfinished. The backend decides whether resend/revocation is permitted.
- Revoke a pending invitation using the existing API. Refresh the list if a previous delivery attempt failed or the recipient activated their account elsewhere.
- Review active staff and use the existing reason-required permission and suspension controls. Self-protection, protected accounts, verified-email requirements, recent authentication and session invalidation remain enforced by the existing backend.

The route and sidebar entry require `accounts.roles.manage`. The staff list additionally requires `accounts.read`; suspension additionally requires `accounts.manage`. No permissions are automatically granted. The new route is included in the admin shell's existing enabled-route list so its controls are not treated as old preview-only UI.

No new authentication or invitation system, backend API, database model or credential was added. No real invitation emails were sent during verification. Source changes are local; no deployment or push was performed.

Verification commands (mocked HTTP):

```powershell
cd frontend
node --test --test-concurrency=1 tests/staff-management.browser.test.js tests/admin-navigation.browser.test.js
$env:KITSS_AUTH_BROWSER_VIEWPORT = 'desktop'
node --test tests/auth.browser.test.js
npm.cmd run build
```

Database-backed business-policy invitation coverage was updated to use `/admin/staff`; it requires a separately configured isolated database and was not executed for this UI move. Mocked invitation tests verify API/CSRF contracts and do not establish SMTP delivery acceptance.

Verified on 2026-10-28: all 15 browser scenarios passed (4 sidebar, 7 desktop authentication, 4 staff-management scenarios). The staff review flow closes the account details before opening the prefilled invitation; the test waits for that prefill before asserting its values. Final build and `git diff --check` passed. The build retains the existing large-chunk warning. Staff-page and navigation checks include mobile behavior; the full mobile authentication suite was not executed.
