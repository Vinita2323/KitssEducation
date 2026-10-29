# Home presentation restoration

The home page again uses coloured service cards, icons and the existing cap-and-books illustration, followed by a green “Why choose us” panel. The original unsupported marketing claims (such as guaranteed results or round-the-clock support) are not automatically restored.

Existing published text, links, images and card order remain authoritative. Old home card sections need no migration: the first card section uses the services layout and the second uses the feature panel. Further sections retain the standard renderer. Explicit layout selection overrides this compatibility behavior. The About teaser and banner components remain unchanged.

To edit: open **Content → Page sections → home → Edit**. For each section choose **Home layout**: Automatic, Coloured service cards, Why choose us or Standard section. Edit the section heading/body and individual card titles, descriptions, destinations, icons, colours and order. Save Content Draft, then Publish through the existing controls to replace the published snapshot. Use the existing section image picker for supporting images.

Appearance fields are optional additions to the existing PageContent sections and items: `layout`, `iconKey`, and `color`. Existing route allowlists, publication permissions, optimistic revisions, media checks and the save/publish distinction remain unchanged. No new collection or application system is introduced. About and other pages retain their existing renderer and editor.

No application database content or live deployment was modified. Existing demo copy remains labelled; replacing it with public marketing copy requires approved wording. Existing unrelated changes present at task start were preserved, including payment, dashboard and book work.

Checks:

```powershell
cd backend
node --test tests/home-layout.test.js tests/publishing.test.js
cd ../frontend
node --test tests/home-layout.browser.test.js
npm.cmd run build
```

Backend checks cover legacy compatibility, schema retention and rejection of unsupported layouts, icons, colours and destinations. Browser checks use mocked HTTP and cover published copy/links, desktop and 390/320px layouts, and appearance edits saved through the existing revision-protected draft API. They do not establish real database or live-site acceptance. Production build retains the existing large-chunk warning.
