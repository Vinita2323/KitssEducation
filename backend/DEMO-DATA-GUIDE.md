# Demo data walkthrough

Seeded on 2026-10-28 into the configured development database, `kitss_education_dev`, using existing authenticated admin/application APIs. No application code, dependencies or environment files were changed. Records marked DEMO are fictional examples, not real colleges, staff credentials, academic qualifications or commercial offers.

## Where to start

Sign in at `/admin/login` with your existing private admin credentials. Start the frontend and backend normally if they are stopped (`npm.cmd run dev` in `frontend/` and `backend/`, in separate terminals). The usual frontend address is `http://localhost:5173`.

| Admin section | Demo examples | What to explore |
| --- | --- | --- |
| Universities | DEMO Horizon Learning University; DEMO Meadow Skills University | Edit a university and see its institution relationships |
| Colleges / Institutes | DEMO Horizon College of Learning; DEMO Meadow Institute of Skills | Location, parent university, public profile and programs |
| Institution programs | Five demo programs, including Admissions Walkthrough | Program details, fees, seats, admission status and hierarchy |
| Digital Books | DEMO Mathematics Essentials; DEMO Everyday Science; DEMO English Communication | Published/free vs draft/paid example, covers, four-page private PDFs, one-page previews and table of contents |
| Coaching | DEMO Mathematics Foundations; DEMO Science Explorer - Draft Workshop | Course metadata, syllabus sections, six original text lessons and two prepaid plans |
| Admission Applications | DEMO Learner A - New enquiry; DEMO Learner B - Under review; DEMO Learner C - Closed example | New, in-process and rejected records; open details and inspect recorded review notes |
| Content > Banners | DEMO Start your learning journey; DEMO Explore original learning samples | Image attachment, call-to-action, ordering and publication |
| Content > Faculty | Demo Mathematics Mentor; Demo Science Mentor | Fictional mentor profiles with original illustrated portraits |
| Content > Page sections | Published Home and About demo sections | Editable service cards, learning steps and platform introduction |
| Taxonomy | 12 entries with Demo labels/keys | Board > class > subject hierarchy, language, state > district, institution type, designation, qualification and program |
| Media | Files named `demo-v1-*` | 15 original clean/ready files: nine PNGs and six PDFs, inspected and scanned through the real local ClamAV pipeline |

Recommended first exercise: search **DEMO Mathematics Essentials**, open it, inspect the cover/full PDF/preview and publication state, then compare it with the **draft** DEMO English Communication book. Next open **DEMO Mathematics Foundations** and compare its published lessons and free plan with the draft Science Explorer course. Finally inspect the three admission-review states.

## Public pages

- `/home`: the two new banners appear in the carousel alongside your existing banner; Home service cards and learning-step sections are published. Your existing banner remains first according to its existing sort order; use the carousel controls to see the new slides.
- `/about`: published demo introduction and two fictional mentor profiles.
- `/books`: two free published demo books with original covers/previews.
- `/coaching`: one published free demo course with authored text lessons. No video lesson was fabricated.
- `/colleges` and `/institutes`: clearly labelled fictional institutions and sample programs.
- `/categories`: your existing configuration was preserved.

## Prices, applications and operational boundaries

The English book has an illustrative INR 149 price but remains an unapproved draft. The Science Explorer course and its illustrative INR 299 six-month pass remain drafts; plan rules are not approved. They cannot be purchased through the public catalogue. The published Mathematics course has a zero-price six-month demo access plan. No account was enrolled and no entitlement was manually granted during seeding.

The current institution-program validator rejects `feeMinor: 0` as a required-field error. To avoid changing application code in this data-only task, program examples use clearly labelled illustrative display prices: INR 4,990 / INR 1,490 for the two sample programs per institution and INR 990 for Admissions Walkthrough. These are not approved financial policies or real admission offers. All five programs are closed to new admission submissions at completion. No payment order, captured transaction, refund, invoice or financial total was fabricated.

The three fictional admission examples were submitted through the normal verified-account intake API using the authorized owner's admin session, then reviewed through admin APIs. They contain `.invalid` email addresses and dummy telephone data; no learner accounts were created and no invitation, OTP, email, push or other external message was sent. Admissions Walkthrough was opened only for creation of these examples and closed again afterward.

The franchise policy is not published. No policy, agreement, franchise evidence, approval or affiliation was invented to bypass that gate. Results, real staff accounts, permissions, financial settings and existing learning entitlements were not modified.

## Preservation and verification

Only the old STAGE5 test sections on Home and About were replaced/published, with the owner's explicit approval. Original records were backed up privately before changes. Existing books, courses, faculty, Categories configuration and original banner were compared against their pre-seed values and preserved unchanged.

Inventory changes:

| Collection area | Before | After |
| --- | ---: | ---: |
| Universities | 0 | 2 |
| Colleges / institutes | 0 | 2 |
| Taxonomy entries | 0 | 12 |
| Books | 2 | 5 |
| Faculty | 2 | 4 |
| Coaching courses | 2 | 4 |
| Banners | 1 | 3 |
| Page-content records | 3 | 3 |

Additionally created five programs, six lessons, two plans, three admission applications and 15 media assets. The private manifest tracks 58 objects, including two explicitly updated page records (41 new business/taxonomy/content records + 15 media assets + two page updates).

**45 data/API/browser verification checks passed; zero failed; zero browser JavaScript errors.** Checks cover preservation of original records, 15 clean/ready media assets, free published examples, gated paid drafts, closed admission programs, sample review states, absence of demo payment orders, Home/About publication, seven public/admin routes and Home fit at 390px and 320px. Screenshots of the populated public/admin pages were inspected locally. This is data/API/browser verification, not a new claim that the application-wide automated test suite or frontend build was rerun; application source was unchanged.

All writes went through existing validation, authorization, audit and publication workflows. No direct MongoDB inserts, fake scanner, fake provider transactions, authentication bypasses or live payments were used. The real local scanner approved the original generated media. The temporary backend disabled SMTP, push and payment provider credentials in memory and stopped its background workers; no .env setting was changed. Temporary backend/browser/scanner processes were stopped after verification. No push or deployment occurred.

## Private evidence and later cleanup

Ignored local files under `.runtime/demo-data/` contain:

- `before.json`: pre-seed content inventory, including the old Home/About drafts.
- `manifest.json`: exact IDs/resources for added records and approved page updates.
- `verification.json`: check results and before/after counts.
- Original generated assets, local screenshots and resumable setup scripts.

Do not publish these private operational files. No password or session cookie is included in this guide or the manifest. Credentials were read privately for normal admin login and never printed.

For later cleanup, use the manifest to identify only demo records. Review dependencies before archiving/removing parents or media; referenced-file protection still applies. Do not bulk-delete records by a broad name search. Restore old page content from the backup only after checking for subsequent owner edits. No cleanup or deletion was performed as part of this task.
