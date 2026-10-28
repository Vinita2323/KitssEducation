# Coaching editor options fix — 2026-10-28

The coaching editor requested `/api/v1/public/faculty`, which had no registered route. Its shared `Promise.all` also discarded successful taxonomy and book results whenever one list failed.

The public faculty route now delegates to the existing publishing service. It returns paginated published snapshots using the same public projection already used on About. Draft/archived profiles, source evidence and staff audit fields are not returned. No new collection or publishing system was introduced.

The editor loads languages, subjects, boards, classes, programs, states, published instructors and published books independently. Failed lists are named in a warning and their controls are disabled; other controls remain available. Retry preserves entered form values. Opening an editor refreshes its choices. Requests are aborted on refresh/unmount, and all result pages are loaded through the existing `readOptions` helper. Successful empty lists are distinguished from load failures.

Course/lesson/plan save contracts, permission checks, publication rules and payment behavior are unchanged. No application records, credentials or environment settings were modified by this fix.

Verification:

- Backend: 5 tests passed, 0 failed. Includes actual local Express HTTP routing with a model double, snapshot filtering/projection, pagination and invalid queries, plus publishing/coaching validation regressions.
- Backend database integration: 2 suites skipped because isolated database settings were not supplied. The existing publishing suite now checks the public faculty route when run with an isolated database.
- Browser: all 4 coaching scenarios passed using mocked HTTP, covering partial failures, retry, pagination, refreshed choices, save payloads, empty lists, mobile layout, keyboard focus and accessibility. The initial run used an incorrect Save button locator; the locator was corrected and the full suite passed on rerun.
- Running development app: a read-only request through the Vite proxy successfully returned the faculty list, with 2 published profiles reported. This is separate from mocked browser evidence.
- Direct read-only checks against the existing backend on port 5000 also succeeded: 2 published instructors, 1 language, 3 subjects, 1 board, 1 class, 1 program and 1 state. A later check through port 5173 failed because no Vite server was listening after the temporary browser-test server closed; direct backend checks confirmed the API remained available.
- Frontend build passed with the existing large-chunk warning. `git diff --check` passed.

Commands:

```powershell
cd backend
node --test tests/public-faculty.test.js tests/publishing.test.js tests/publishing.mongodb.integration.test.js tests/coaching.mongodb.integration.test.js
cd ../frontend
node --test tests/coaching-options.browser.test.js
npm.cmd run build
```

Refresh `/admin/coaching` and reopen the editor. Create active taxonomy choices in Dropdown settings, publish instructors in Content → Faculty, and publish books in Digital Books. No live payments, SMTP delivery, deployment or Git push was performed.
