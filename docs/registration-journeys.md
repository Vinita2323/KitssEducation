# Registration journeys

All four application journeys start at `/register`. The original compact form
layouts and field groupings remain: franchise, tuition and study have five steps;
teacher has four. Account creation appears inside the last step, reusing the
applicant name/email, with password, email verification and existing-account sign-in. Applicants create a login,
verify their email and sign in within the selected journey. Existing users sign
in to the same account. A login account alone grants no staff or paid access.
Passwords and email codes are not stored in application records or browser storage.

Applicants can return through Profile or the side menu -> **My applications**.
Drafts support saving and resuming; submitted details are read-only until staff
request corrections. Files may be selected in the original Documents step; they
upload only after verified sign-in and saving. Save changed details before
submitting. Admin document policies determine which uploads are collected; raw
identity numbers remain disabled. Required documents are enforced by the server.

## Franchise

The five steps remain Institution, Affiliation, Contact, Location and Documents.
The optional institution logo is stored as a private, scanned PNG/JPEG owned by
the applicant (maximum 3 MB), available to reviewers but excluded from public
listings. Existing applications need no logo. Programs, contact designation, state
and maps URL retain their original fields.
Staff review documents and decide the request in **Franchise Requests**. Approving
a current application also publishes its institutional listing in **Colleges & Institutes** at `/colleges`. `/institutes` and `/franchises`
redirect to `/colleges?network=franchise`. Standalone franchise profiles list only name, type, city/state, website and
programs. They do not offer online admissions. Admin may explicitly associate an
approved franchise with the same existing published college listing; this yields
one profile with a KITSS Franchise badge, retaining that college’s public courses
and admission rules. University/college affiliation alone does not merge different
institutions. Hiding the franchise listing removes its profile/badge without
hiding an independently published college. Personal contacts, full addresses, documents, notes and payment data are
never included in the public directory.

Approval and paid affiliation activation remain separate. Existing joining,
renewal, verification and accepted-policy rules still apply. Staff can hide or
republish an approved listing with a review reason, without changing affiliation.
Earlier approvals are not silently backfilled; approved current-workflow records
can be published from their review screen.

## Tuition / Coaching

Staff review the application in **Registration Review**. Applicants follow the
link to the existing **Coaching** catalogue to choose courses and enroll. Existing
free enrollment, course plans, payment confirmation and learning access remain
authoritative; an approved application does not unlock paid lessons.

## Study

The form is a study enquiry. Staff review it and record follow-up notes in
**Registration Review**. KITSS handles guidance and further arrangements directly;
there is no automatic college admission, course enrollment or public listing.

## Teacher / Professor

After approving the application, an administrator with registration approval and
content writing/publishing permissions reviews the public profile, selects a
cleared **public faculty portrait**, and chooses **Mark as KITSS teacher and
publish**. Private registration documents cannot be used as public portraits.
Retries reuse the linked profile instead of creating duplicate faculty entries.

The profile appears under **About -> Teachers & Faculty Profiles** and in the
course editor's published instructor choices. Use **Content -> Faculty** for
subsequent edits/unpublishing. In **Coaching**, select the teacher on a course and
manage its lessons, videos and documents using the existing admin upload tools.
Teachers send material outside the platform and receive no staff/upload permissions
from application approval or publication. Public faculty cards link to the
existing course search by teacher name.

## Configuration and validation

Existing admin fee, document, guardian-consent, security-scan and privacy settings
still govern submissions. No business policies or live records are changed by
this implementation.

Regression coverage includes inline account creation and email verification,
draft reload and submission for tuition/study/teacher, owner-only application
history, admin teacher review/publication, safe franchise publication and hiding,
and existing verified-payment/renewal flows. Database/browser integration tests
use fresh guarded databases with fake email/payment/scanner services, then remove
only those test databases. Real email delivery and real payment collection are
not exercised.
