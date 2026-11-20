# Clinical review of the source-traceable draft activities

DiagnoCare contains **8 draft cases** (case library) and **8 draft guided workshops** (Ateliers pratiques).
They are fictional teaching simulations. They are **not clinically approved**, and they stay labelled
**"Brouillon — relecture par un enseignant clinicien requise"** until a qualified clinical educator approves them.

Screen-based workshops never certify competence. Hands-on skills (CPR, examination, asepsis) still require
supervised practice on a model or in a clinical setting.

## Who can see the drafts

| Who | Draft cases and workshops |
| --- | --- |
| Teachers, institution admins, platform admins | Always visible and playable, so they can review them |
| Students | Listed with a "Draft" badge but **locked**, until an admin turns on *Admin → Settings → Student access to drafts* |

Turn on student access only if the faculty accepts unreviewed material for supervised pilots.

## What every activity contains

- **Draft banner and simulation label.** Shown on the case page, in the consultation room and in the report (cases), and on every workshop screen.
- **"Review and version" panel.**
  - Status and version.
  - Reviewer and review date (placeholders until approval).
  - Local-protocol note.
  - A list of points flagged **"Requires clinical educator review"**. These points are kept out of the student-facing answer key.
- **Reference panel.** For each source:
  - Title, organisation and link.
  - Publication or update date, and the section used.
  - Date checked, and what was actually verified.
  - Licence note, with a "permission needed to adapt" flag where it applies.
- **Debrief** (cases: in the report; workshops: on the results screen):
  - Expected reasoning and must-not-miss points.
  - Uncertainty, feedback for correct, incomplete and unsafe choices.
  - How the rubric works, and reflection questions.

## How to review a case

1. Open **Teach → Cases**, tab *In review*. Each case also appears in the library under
   "Nouveaux cas sourcés — en relecture clinique".
2. Play the case from start to finish, then read the report: score breakdown, debrief, references.
3. Check every item in "Requires clinical educator review". Supply local content where it is requested:
   - Sepsis pathway.
   - Stroke pathway.
   - Mental-health safety pathway and support resources.
   - Paediatric triage system.
   - Endoscopy and transfusion route.
   - Algerian driving rules after syncope.
4. To change the content, edit the case in the case editor.
   - Saving an edit sends the case back to *Draft*. Submit it for review again afterwards.
   - The teaching block (`content.pedagogy`) is kept when you edit.
5. To approve: in the case's review workflow, choose **Publish**, then enter your name, role and notes.
   - The case leaves the draft section and joins the main library.
   - The draft banner disappears.
   - The "Review and version" panel shows the reviewer and date from the workflow.
6. Re-seeding never overwrites these cases. The seed only creates missing ones, so your edits and approvals survive every deploy.

The source files are `src/lib/cases/drafts/cases-a.ts` and `cases-b.ts`. They are written once in French and English.
To change the seed content for a fresh install, edit those files, or edit the stored case directly.

## How to review a workshop

Workshops are code-defined, with no database row. The data files are:

- `src/lib/workshops/guided/workshops-a.ts`: ABCDE, BLS + AED, focused neurological examination, blood gases.
- `src/lib/workshops/guided/workshops-b.ts`: chest X-ray, abdominal examination, hand hygiene, SBAR.

Steps:

1. Play the workshop and read the results screen.
2. Edit the steps, feedback, keywords (SBAR / CXR / neuro "compose" steps) or references in the data file.
3. To approve, set the workshop's `review` field to:
   `{ status: "approved", version: "1.0", reviewer: "Name, role", reviewDate: "YYYY-MM-DD", pending: [] }`.
   - Empty `pending` only after every point has been resolved.
4. Deploy. An approved workshop drops the draft badge and opens to every student.

Sources are listed once in `src/lib/pedagogy/sources.ts`. Update a source there (new edition, date checked, licence) and it updates everywhere.

## Sources checked (2026-11-20)

| Source | Version verified | Used by |
| --- | --- | --- |
| WHO-ICRC Basic Emergency Care | 2018 | Sepsis, stroke, GI bleed, febrile child, ABCDE, SBAR |
| WHO SBAR Handover Tool / Patient Safety Solution 3 | 2007; tool date unconfirmed | Sepsis, SBAR |
| WHO Paediatric ETAT (updated guideline) | 2016 | Febrile child |
| WSES Jerusalem appendicitis guideline | 2025 edition (JAMA Surgery 2026;161(3):283–295) | Appendicitis |
| ESGE peptic-ulcer bleeding guideline | Update 2026 | GI bleed |
| WHO haemoglobin cutoffs for anaemia | 2024-03-04 | Anaemia |
| WHO mhGAP Intervention Guide 2.0 and mhGAP guideline 3rd ed. | 2016; 2023-11-20 | Low mood |
| ERC Guidelines 2025 Adult BLS (via Resuscitation Council UK) | 2025-10-27 | BLS + AED |
| WHO hand hygiene in health care / Five moments | 2009; 2021 page | Hand hygiene |
| ESC syncope guideline | 2018, still current; 2027 update announced | Syncope |
| AHA/ASA early management of acute ischaemic stroke | 2026-01-26 | Stroke, neuro exam |
| Surviving Sepsis Campaign | 2026-03-23 | Sepsis (recognition only) |
| StatPearls — Arterial Blood Gas | updated 2024-01-08 | Blood gases |
| Radiopaedia — systematic chest radiograph assessment | living article | Chest X-ray |

**How these were verified.** Most were checked against the publisher's or an indexing page: title, organisation, date and scope.
The full texts were **not** re-read. Each activity therefore lists the details that depend on the full text under
"Requires clinical educator review", and those details are kept out of the answer key.

## Licensing — content still awaiting confirmation or permission

- **WHO documents.** Usually CC BY-NC-SA 3.0 IGO. The "NonCommercial" term does not cover a paid platform.
  - The app cites and paraphrases WHO material only.
  - Adapting it further needs WHO permission.
  - The "My 5 Moments" poster is © WHO, all rights reserved, and is **not** reproduced.
- **ESC, ESGE, WSES and AHA/ASA guidelines.** Publisher copyright.
  - No table, algorithm, score card or figure is reproduced or turned into an interaction.
  - ESC risk criteria in particular need ESC permission before being adapted.
- **StatPearls and Radiopaedia.** Licences not confirmed, likely NonCommercial.
  - No image is embedded.
  - The chest X-ray workshop uses a hand-drawn **schematic labelled "not a radiograph"**.
  - The educator must supply real radiographs under a licence that allows commercial use.
- **Neurological and abdominal examination checklists.** No suitably licensed source was adopted. Both are structured drafts, to be replaced by the faculty's approved checklist.

## Deliberately excluded

These are excluded from every activity, by design, pending educator-approved sources:

- Drug choices and doses: antibiotics, antipyretics, iron, PPIs, reperfusion therapy.
- Fluid volumes, transfusion thresholds, oxygen targets.
- Endoscopic treatment protocols.
- Crisis-management instructions.

## Known limitations

- **No Arabic version and no right-to-left layout.** Arabic was removed from the platform earlier at the owner's request, so every activity is in French and English only. Adding Arabic back would need the translation system and RTL layout restored across the app.
- **Workshop scores are not saved to the database.** Results are shown at the end and students can repeat freely, but there is no history or teacher dashboard. Saving them would need a new table.
- **Workshop approval is a code change** (`review.status`), not a button in the review workflow.
- **Automatic marking of free-text steps** (SBAR, chest X-ray description, neuro summary) looks for keywords. It always shows a model answer so students can judge their own wording. Educators should adjust the keywords.
