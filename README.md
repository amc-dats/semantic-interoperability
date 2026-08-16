# Interoperability Maturity Self-Assessment — local prototype

A single-page React app implementing the 5-dimension Interoperability Maturity
Self-Assessment, per `../self_assessment_app_brief.md`. **This is the local
prototype stage** — the frontend is complete and runnable end-to-end against a
mock local backend; nothing has been deployed to Azure or GitHub Pages yet.

Built the same way as the `data-lineage` reference app: React 19 + TypeScript +
Vite, static frontend, no client-side routing.

## Running it

Two processes: the Vite dev server (frontend) and a small Express server that
stands in for the two Azure Functions described in the brief.

```
npm install
npm run dev:all     # starts both, proxied together at http://localhost:5173
```

Or run them separately (`npm run dev`, `npm run server`) if you want to watch
their logs apart. `npm run build` type-checks and produces a production build
in `dist/`.

The mock backend writes submitted responses to `server/data/responses.json`
(git-ignored) so you can inspect what a submission looks like — open it after
completing the flow once.

## What's stubbed vs. real

- **All 36 assessment questions, level descriptors, and roadmap
  activities/outcomes are real** — extracted directly from the five
  `*_Maturity_Self_Assessment_PlainEnglish.xlsx` workbooks into
  `src/data/assessment-data.json` and `src/data/roadmap-data.json` (see
  "How the data was extracted" below). Nothing here is placeholder text.
- **The video is live.** Exported and hosted on Azure Blob Storage in the
  `semanticinteroperability` account, public blob read access. `VITE_VIDEO_URL`
  is set in `.env.local` (git-ignored — not committed, since it's
  environment config, not app code) to the blob URL; if it's ever unset,
  the screen falls back to a "video coming soon" placeholder rather than
  breaking. See `src/components/VideoScreen.tsx`. When the real Function
  App URL gets set for deployment, `VITE_VIDEO_URL` will need setting again
  wherever that build happens (CI secret/variable, not just this local
  `.env.local`).
- **The backend is a local mock**, not the real Azure Function app. It
  implements the same two endpoints (`POST /api/submit-assessment`,
  `POST /api/send-results`) with the same contract (email is received, used,
  and never persisted), but stores to a local JSON file instead of Azure
  Table Storage, and only logs what it would send via SendGrid instead of
  actually sending. See `server/index.js`. Swapping in the real Function
  app later is a matter of setting `VITE_API_BASE` at build time (see
  `src/lib/api.ts`) — no frontend logic changes.
- **Code is pushed to `https://github.com/amc-dats/semantic-interoperability`**
  (a new, separate repo, not `data-lineage`), but GitHub Pages itself isn't
  set up yet — no deploy workflow exists there. That's still the next step
  (see "Next steps toward the real thing" below).

## Second pass — what changed

The brief was revised with several concrete fixes and a richer results
design; the source workbooks were also replaced with "PlainEnglish" versions
(plainer question wording) and a new `dimension_maturity_descriptors.md`.
This round:

- **Intro text, goal-setting note, and target-dropdown descriptors** now use
  the exact copy/data supplied (`dimension_maturity_descriptors.md` — a real
  per-dimension, per-level descriptor, not the generic stage-name fallback
  from the first pass, e.g. "1 — Initial / Ad hoc: Ad hoc, point-to-point
  links; no baseline").
- **Results screen rebuilt**: one combined chart (dimensions as rows, level
  1–5 as the x-axis, Now/short-term/long-term as three points per row, a
  Level-3 reference line) replaces the five separate per-dimension charts
  from the first pass; the overall-score card is resized and now shows the
  stage name inline; the immediate-actions panel puts Technical first
  (flagged as priority, or omitted entirely if its own target is already
  met) followed by the other four in fixed order, with the overall-score
  Level-3 cap applied when relevant.
- **Data re-extracted from the `*_PlainEnglish.xlsx` workbooks** (question
  text, level descriptors, and roadmap activities all changed there — see
  "How the data was extracted").
- **Found and fixed a real bug while re-extracting**: the brief's suppression
  rule ("don't show internal-only roadmap rows") was implemented in the first
  pass by matching two literal phrases ("No roadmap activity defined...",
  "Blocked:..."). The revised workbooks also contain a third phrasing —
  "Not yet defined in the roadmap beyond Level 4..." — which that literal
  match missed, so three placeholder rows would have leaked to respondents
  (Technical Q3/Q4/Q9's level-4 rows). Re-checked and confirmed every
  suppressible row across all five workbooks has a null Activity ID, and
  every row with a real Activity ID is real, actionable content — so the
  extraction now suppresses on `activityId === null`, which is general
  rather than phrase-specific. Separately, two *real* activities (Technical
  Q8/Q9's level-2 rows, `TE5.3a`/`TE5.3b`) had an internal dependency note
  prefixed onto otherwise-legitimate activity text ("Prerequisite: Q1-Q7
  must reach Level 3 first. Once satisfied: deploy standardised
  connectors...") — per the brief, that rationale must never reach the
  respondent even though the activity itself should. The extraction now
  strips everything up to and including "Once satisfied:", leaving exactly
  the wording the brief's own example uses ("TE5.3a: Deploy standardised
  connectors for priority systems...").

## Decisions made where the brief was ambiguous

- **No "back" navigation between dimensions.** Once a dimension's targets
  are confirmed, its answers can't be revisited in this session (there's no
  persistence to resume into anyway if the tab closes). Flagged in the first
  two passes for reconsideration; confirmed as final — not building it.
- **Immediate actions are computed per-question, then flattened for
  display.** The roadmap data in each workbook's `Activities` sheet is keyed
  by individual question + "from level," not by dimension as a whole, so
  for each question that hasn't yet reached the effective target, the
  specific activities that take *that question's own current level* up to
  the target are pulled individually. This is more precise than a
  dimension-wide average would allow (it won't tell someone who already
  scored 5 on one question to do a level-1 activity) and uses exactly the
  data that exists. The results screen no longer groups these by question,
  though (see "flat, sorted list" below) — it's purely how the underlying
  activities are selected. The dimension-level "no action needed" check
  (effective target ≤ current stage) still follows the brief exactly, as
  does the Technical-first sequencing and the Level-3 progression gate (see
  below — this replaced the brief's original overall-score cap).
- **Regulatory environment as checkboxes, not a native multi-select.** The
  brief calls it a "multi-select dropdown." A native `<select multiple>`
  is poor mobile UX (no visible affordance, awkward ctrl/cmd-click). A
  checkbox group under one heading achieves the same "select all that
  apply" behaviour and works cleanly on touch. Easy to swap back if you'd
  rather match the literal dropdown spec.
- **Assessment questions are required**, even though the brief only says
  business-context fields are optional. A dropdown must be answered before
  "Next" is enabled within a dimension. Scores wouldn't be meaningful with
  partial answers, and the brief's data model implies all 36 ratings are
  captured.
- **Submission timing.** The full record (business context + assessment +
  scores + goals) is POSTed once, right when the Results screen loads —
  not blocked on the optional email/validation steps, per the brief's "must
  not block submission of the assessment already captured." If the
  validation questionnaire is completed afterwards, a second POST to the
  same endpoint with the same `responseId` upserts the validation fields
  onto the same row (mirrors Table Storage's insert-or-replace semantics).
- **Combined-chart overlapping markers.** When a dimension's targets are left
  at their pre-filled default (equal to its current level — a common case),
  the three points land on exactly the same spot. Each series uses both a
  different shape and a different size — Now (circle) smallest and drawn
  last/on top, Short-term target (square) medium, Long-term target
  (diamond) largest and drawn first/underneath — so a full overlap reads as
  a clean bullseye (diamond corners visible at the outer edge, square ring
  in the middle, circle at the centre) rather than one shape hiding the
  rest. Per user feedback: Now is labelled directly above its point with
  its numeric score (short/long-term targets aren't, since they're whole
  numbers that already land exactly on a gridline); the old summary table
  beneath the chart was removed as redundant once the chart carried this
  much detail on its own. Colours: Now = amber/orange, Short-term target =
  blue, Long-term target = green.
- **Level-3 progression gate** (`allDimensionsReachedLevel3` in
  `src/lib/scoring.ts`) **replaced the brief's original overall-score
  cap.** The brief specified: if the respondent's *overall* average is
  below 2, cap every dimension's pulled actions at Level 3. Per user
  feedback, this is now a more precise, per-dimension check instead:
  actions are capped at Level 3 for every dimension until *all five*
  dimensions have individually reached Level 3 — matching the framework's
  own stated rule (shown to the respondent as the goal-setting note: "no
  dimension can progress beyond Level 3 until all five reach it"). The two
  conditions aren't independent alternatives — the overall-average-below-2
  case is always a subset of "not all dimensions have reached Level 3" (if
  the average is under 2, at least one dimension must be below 3), so the
  new check strictly subsumes the old one rather than adding a second,
  separate rule alongside it.
- **Immediate actions panel: flat, sorted list, no question repeats.** Per
  user feedback, the panel no longer groups activities under each question
  (with the question text repeated) — it shows one flat list per dimension,
  sorted by workstream → level → item (`1.2b, 2.2a, 2.2b, 2.2c, 3.2a...`),
  with the activity ID's dimension-abbreviation prefix stripped (redundant
  under a dimension heading that already says "Technical"). See
  `getImmediateActions` in `src/lib/scoring.ts`.
- **Found and fixed a display bug in that same prefix-stripping**: source
  combo IDs are sometimes abbreviated (`SE1.2c/d/e` rather than repeating
  the full prefix on every part). Stripping each `/`-separated segment's
  own leading letters independently wiped a bare continuation like `d` or
  `e` to nothing, since the strip regex matched the *entire* segment —
  producing a dangling slash on display (`1.2c//`, `3.3b/`). Fixed by
  expanding every combo to its full form once, at extraction time
  (`SE1.2c/d/e` → `SE1.2c/SE1.2d/SE1.2e`), so per-segment stripping
  downstream is always safe.
- **A few source activity IDs are reused across genuinely different
  activities** (e.g. `OR1.3a` appears for both Q1 and Q3 in the
  Organisational workbook, with different text) — confirmed with the user
  this is an accepted quirk of the ID abbreviation scheme, not a bug to fix
  in the source data or work around in the app. The flat activity list
  handles it fine either way (React keys are index-based, not ID-based, so
  a repeated label doesn't break rendering) — it just occasionally shows
  the same short ID twice with different content.

## Structure

```
src/
  data/
    assessment-data.json              # 36 questions + 5 level descriptors each, by dimension
    roadmap-data.json                 # roadmap activities/outcomes, by dimension + question + from-level
    dimensionMaturityDescriptors.ts   # per-dimension, per-level label + descriptor (dimension_maturity_descriptors.md)
    businessContextOptions.ts         # dropdown option lists (business_context_section.md)
  lib/
    scoring.ts                        # dimension averages, stage bands, cap logic, immediate-actions logic
    api.ts                            # fetch wrappers for the two backend endpoints
  components/                         # one component per screen in the flow
  types.ts                            # shared domain types + the flat submission payload shape
server/
  index.js                            # local mock of the two Azure Function endpoints
```

## How the data was extracted

`src/data/assessment-data.json` and `roadmap-data.json` were generated once
from the five `*_Maturity_Self_Assessment_PlainEnglish.xlsx` workbooks (their
`Assessment`, `Lookups`, and `Activities` sheets) — not parsed at runtime, per
the brief. `dimensionMaturityDescriptors.ts` was transcribed from
`dimension_maturity_descriptors.md`. If the source files change, they'll need
re-extracting; ask for this to be regenerated rather than hand-editing the
generated files.

## Git / repo state

- Local git repo (`webapp/.git`), commit author `Ananda Mello Costa
  <a.mellocosta.729@cranfield.ac.uk>` — matches the GitHub account
  (`amc-dats`, authenticated via `gh`) used for the Azure resources.
- `origin` remote is `https://github.com/amc-dats/semantic-interoperability`
  (public, for GitHub Pages Free-plan hosting, same as `data-lineage`),
  created for this app specifically, and the code is pushed there.
  GitHub Pages itself isn't configured yet — see next steps.

## Next steps toward the real thing

1. Stand up the real Azure Function endpoints against the provisioned
   `Interoperability-results` app and `semanticinteroperability` storage
   account, matching the contract `server/index.js` already models.
2. Add a `.github/workflows/deploy-pages.yml`, following the pattern in the
   `data-lineage` repo, and set `vite.config.ts`'s `base` to
   `/semantic-interoperability/` (or a custom domain, if one gets set up)
   to match the Pages subpath. Set `VITE_API_BASE` to the deployed Function
   App URL at build time, and `VITE_VIDEO_URL` to the blob URL already in
   `.env.local` (that file itself isn't committed, so the deploy build
   needs the variable set some other way — a repo/CI variable, not a
   secret, since the video is public).
3. Add the Function App's CORS entry for the GitHub Pages origin once it
   exists.
