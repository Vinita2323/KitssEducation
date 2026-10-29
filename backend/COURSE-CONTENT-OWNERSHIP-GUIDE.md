# Course content ownership

The coaching editor now has a collapsed **Content ownership** section instead of the licensing checkbox and source-note input shown on every form.

- Choose **KITSS team**, then explicitly confirm KITSS owns the content. A descriptive ownership declaration is saved; a separate permission-details input is not shown.
- Choose **Teacher / external source**, supply the creator/permission reference and explicitly confirm permission.
- Changing source or external permission details resets the confirmation.
- Existing custom notes and confirmations remain unchanged when editing without changing them. They are displayed as external/source evidence rather than automatically classified as KITSS-owned. The full existing 2,000-character note limit is retained.
- Unfinished drafts can still be saved. Publishing continues to require both confirmed rights and a nonempty note through the existing backend validation. This UI does not independently verify ownership or provide legal permission.

The existing `rightsConfirmed` and `rightsNote` API fields are reused. No new schema, role, permission, payment change, database migration or live data update is introduced. Other course editor, lesson and plan behavior remains unchanged.

Verification uses `node --test tests/coaching-options.browser.test.js` from frontend, including ownership-specific scenarios and existing option-loading/retry/save/mobile checks. All responses are mocked and no courses or external messages are created in the real application. The frontend production build is also checked. No production deployment or push is performed.
