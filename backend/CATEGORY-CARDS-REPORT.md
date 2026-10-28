# Editable category cards

Implemented on 2026-10-27. Open **Admin > Content > Categories** (`/admin/content`).

## Behavior

- Add up to 30 cards; edit titles, descriptions, tab labels, badges, tags, approved colours, icons and approved existing public destinations.
- Select or upload a category image through the existing CMS MediaPicker. Existing image validation, scanning, ownership/permission and readiness gates apply. An image replaces the icon.
- Reorder, hide or remove cards. Removal requires confirmation and takes effect only after draft saving and publication. Images and linked business records are retained.
- Cards and filter tabs derive from the same visible ordered configuration. Search includes titles, descriptions and tags.
- The initial five defaults and legacy published section title/description overrides remain supported. An explicitly published empty list is respected. Existing page sections are preserved. Unpublishing falls back to the defaults.
- Saved changes have a separate Publish action, including edits to a currently published page. Unsaved changes cannot be published.

## Architecture and safety

The optional `categoryCards` array extends the existing PageContent record with key `categories`. No new collection, duplicate endpoint, dependency, environment setting or migration was added. The public page reads the existing published content endpoint; admin operations reuse page content create/edit/publish APIs. Existing content read/write/publish permissions, CSRF, revision checks, immutable page key, audit events and snapshot publication remain in force. Category fields are rejected on other page keys. Destinations, icons and colours are allowlisted; arbitrary URLs, scripts and CSS are not accepted.

Media reference checks now include both draft and published category image references, preventing referenced-file deletion and allowing public delivery of published images. Adding a category does not create a business module or alter academic taxonomies. Archived category pages remain read-only under the existing archive policy.

Changed source: backend publishing models/validation/service and media service; frontend CategoriesPage, shared category defaults/themes, new CategoryCardsManager, AdminContentPage and its page guide. README documents usage and verification. Added backend category validator/schema tests and an isolated real-HTTP/browser category test.

## Verification

Final results:

- `node --test backend/tests/category-cards.test.js backend/tests/publishing.test.js`: **6 passed, 0 failed, 0 skipped**.
- Existing `backend/tests/publishing.mongodb.integration.test.js` with a fresh local test database: **10 TAP entries passed, 0 failed, 0 skipped** (includes parent test). Covers book publication, previews, settings, banner windows, faculty, quarantine, corruption, revision conflicts and cleanup.
- New `frontend/tests/category-cards.browser.test.js` with a separate fresh local test database: **3 TAP entries passed, 0 failed, 0 skipped** (parent and two subtests). Covers unauthorized/read-only/CSRF/stale writes, publish permissions, wrong media purpose, non-category isolation, preservation of legacy content, sixth card creation, draft snapshot protection, publishing, decoded image delivery, destination, filter/search/reset, 390/320px public layout, hidden tabs, reordering, removal, retained image, referenced-media deletion protection and an intentionally empty configuration. No browser page errors occurred.
- Frontend production build passed; existing large-bundle warning remains.
- Git diff whitespace check passed. Changes contain no credentials; local environment/credential files were not modified.
- Synthetic desktop admin and mobile public screenshots were inspected locally.

Earlier development runs failed on an ambiguous legacy heading selector, dropdown accessible names and an assertion during card exit animation. Selectors/waits were corrected; explicit dropdown accessible names were added to the editor. The final browser run passed. These results do not claim a full application-wide test run.

Tests used a new local standalone MongoDB server on port 27321 and synthetic users/images, with the existing fake clean scanner. No configured application/remote database, real payments or email delivery was used. Test records were cleaned by the existing fixture, and the task-owned local MongoDB process was stopped afterward. No seed content was published into the owner's database, no push and no deployment occurred.
