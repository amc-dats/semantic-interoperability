# Iterations

A chronological account of how the Interoperability Maturity Self-Assessment
went from brief to a live, working app with a real backend. Kept as a
narrative log distinct from `README.md` (which documents current state and
decisions) and the `functionapp` repo's own README (which documents the
backend specifically).

---

## Day 1 — local prototype

Built the whole app from `self_assessment_app_brief.md` in one pass: React +
TypeScript + Vite, following the `data-lineage` reference app's pattern
(static frontend, no client-side routing). Extracted all 36 assessment
questions, level descriptors, and roadmap activities directly from the six
client-supplied `.xlsx` workbooks into `src/data/*.json` — generated once at
build time, not parsed at runtime, per the brief.

Full flow built end to end: consent intro → video placeholder → business
context → 5-dimension assessment with per-dimension target-setting → results
(chart, immediate actions) → optional email opt-in → optional validation
survey → thank-you. Backend was a local Express mock of the two planned
Azure Function endpoints, so the whole flow was testable without any Azure
resources yet.

**Brief revision round.** The brief was updated with concrete fixes and a
richer results design mid-flight:

- Intro text, goal-setting note, and target-dropdown descriptors switched to
  the exact supplied copy (`dimension_maturity_descriptors.md`).
- Results screen rebuilt: one combined chart instead of five separate ones,
  overall-score card resized, immediate-actions panel restructured to put
  Technical first (flagged as priority) followed by the other four, with an
  overall-score cap at Level 3.
- Found and fixed a real extraction bug while re-processing the revised
  `_PlainEnglish.xlsx` workbooks: the "don't show internal-only roadmap
  rows" suppression rule was matching two literal phrases and missed a
  third ("Not yet defined in the roadmap beyond Level 4...") — three
  placeholder rows would have leaked to respondents. Fixed by suppressing
  on `activityId === null` instead, which is general rather than
  phrase-specific. Also stripped an internal "Prerequisite: ... Once
  satisfied:" dependency note that had leaked into two otherwise-real
  activities.

**Decided and confirmed:** no "back" navigation between assessment
dimensions — flagged twice for reconsideration, user confirmed final.

**First git save.** Local repo initialised in `webapp/`, first commit made.
Then corrected twice in quick succession:

1. Commit author identity was wrong (personal email instead of the Cranfield
   address matching the Azure/GitHub account) — fixed locally, history
   rewritten since nothing had been pushed yet.
2. Deployment target was wrong — briefly planned to reuse the existing
   `amc-dats/data-lineage` repo, corrected to a new, separate repo:
   `amc-dats/semantic-interoperability`.

---

## Day 2 — wording toggle, results screen redesign, GitHub Pages, and the real backend

**Technical/plain-English wording toggle.** Brought in the *technical*
wording variant as a parallel data source (extracted from the original,
pre-"PlainEnglish" workbooks) alongside the existing plain-English variant.
Added a toggle at the end of Business Context ("Non-technical
leaders/managers" vs "IT/data professionals") that switches question and
descriptor text throughout the assessment. `wordingVariant` recorded on the
response record for later analysis. Also fixed a scroll-position bug along
the way — navigating between screens in this single-page app wasn't
resetting scroll to top, since there's no router to do that automatically.

**Immediate actions panel, several rounds of refinement:**

- Restructured from "grouped by question, with question text repeated" to a
  flat list per dimension, sorted by workstream → level → item
  (`1.2b, 2.2a, 2.2b, 2.2c, 3.2a...`), dimension-abbreviation prefix
  stripped from activity IDs.
- Found and fixed a display bug in that same prefix-stripping: abbreviated
  combo IDs in the source (`SE1.2c/d/e` rather than repeating the full
  prefix on every part) were producing dangling slashes (`1.2c//`, `3.3b/`)
  because stripping each segment's leading letters independently wiped a
  bare continuation like `d` to nothing. Fixed by expanding combos to their
  full form once, at extraction time.
- Re-extracted after the user hand-reconciled several source-workbook
  annotations ("pending reconciliation" drafting notes, `-new`/`-revised`
  proposed-activity ID suffixes) — caught and stripped one instance the
  reconciliation pass missed, defensively, so it can't leak through even if
  it recurs.
- Surfaced (and, per the user, accepted as a known quirk of the ID scheme
  rather than something to fix) a handful of activity IDs reused across
  genuinely different activities in the Organisational workbook.
- **Level-3 progression gate.** Replaced the brief's original "overall
  score below 2 caps every dimension at Level 3" rule with a more precise,
  per-dimension check: no dimension's actions go beyond Level 3 until
  *every* dimension has individually reached it (matches the framework's
  own stated rule). The old rule was mathematically a subset of the new
  one, so it was replaced outright rather than kept alongside it.
- **Level-3-rounding edge case.** Found separately: a dimension averaging
  2.51 rounds up to Level 3 and was being treated as "target met, nothing
  to show" even when individual questions inside it were still genuinely
  below 3 with real workstream activities defined. Fixed so those specific
  questions' activities still surface, with a
  "Minimum Level 3 reached. Areas to prioritise in the short term are
  those with the lowest scores." note in place of the generic "no action
  needed" message.

**Combined chart, redesigned in response to feedback:**

- Dimension row labels moved to the page edge; x-axis level headers
  wrapped onto two lines (level number, then stage name) consistently for
  all five.
- Added a numeric data label above each "Now" point.
- Colours swapped: Now = amber/orange, Short-term target = blue,
  Long-term target = green.
- Marker overlap handling went through two iterations: first tried
  uniform size (all three the same), which turned out to fully hide
  overlapping series; ended on differentiated size *and* shape — Now
  (circle) smallest and drawn on top, Long-term target (diamond) largest
  and drawn underneath — so a full overlap reads as a clean bullseye
  instead of hiding anything.
- The old summary table beneath the chart was removed as redundant once
  the chart carried this much detail on its own.

**GitHub Pages deployment.** Copied the proven `deploy-pages.yml` workflow
from `data-lineage` verbatim, set `vite.config.ts`'s `base` to match the
Pages subpath, renamed the default branch from git's `master` to `main` to
match. First workflow run failed — Pages wasn't enabled on this brand-new
repo yet (`configure-pages` couldn't find a Pages site) — enabled it via the
API with the Actions build source, re-ran, succeeded. Live at
**https://amc-dats.github.io/semantic-interoperability/**.

**Video.** Wired in once the export was hosted on Blob Storage
(`VITE_VIDEO_URL`), then iterated on it:

- Added a visible frame/border around the video area (it was washing out
  against the white page background once light slide content filled the
  frame).
- The 1080p/30fps export was ~29MB and slow to load; the actual content is
  ~99% static slides, so re-encoded at 15fps + CRF 20 + `faststart`
  (moves metadata to the front so playback can start before the full file
  downloads) — 29MB → 4.5MB with no visible quality loss, checked directly
  against several frames. Uploaded as a separate blob rather than
  overwriting the original.
- Default playback speed set to 1.2x.
- Autoplay added — muted, since browsers block autoplay with sound
  unless it starts muted, with no app-side workaround.
- A one-click "Watch in fullscreen" button added as the practical
  equivalent of "play in fullscreen by default" — browsers only allow
  `requestFullscreen()` as a direct response to a user gesture, same
  restriction as unmuted autoplay, so there's no way to default to it.
- **Captions.** Since the video plays muted by default, added real
  captions rather than leaving it silent-and-uncaptioned: extracted audio,
  transcribed with Whisper (small model first, then medium for better
  accuracy), cross-checked the two passes against each other, and
  hand-corrected two mis-hearings both models agreed on ("Cranfield
  University" heard as "Grampfield" by the small model; "Semantic
  interoperability" heard as "Symbolic" by both). Wired in as a WebVTT
  track (`public/captions/intro.vtt`).

**The real backend.** Built out the Azure Function App from scratch:

- Two endpoints (`submit-assessment`, `send-results`) as Azure Functions v4
  (Node.js), in a new, separate repo:
  **https://github.com/amc-dats/interoperability-results**
  (kept separate since the frontend repo's root *is* the Vite app, not a
  monorepo layout).
- `submit-assessment` flattens the frontend's nested payload into a flat
  Table Storage entity (Excel/Power BI-friendly, per the brief), upserts by
  `responseId` so a later validation-questionnaire submission lands on the
  same row.
- `send-results` sends via SendGrid; the results-email content (score
  summary + immediate actions) is rendered by the *frontend*
  (`src/lib/emailSummary.ts`, reusing the exact scoring/roadmap logic
  already driving the Results screen) and passed through, since the backend
  has no access to the question/roadmap data needed to compute that itself.
  Deployed code-complete but returns `503` gracefully until a SendGrid
  account exists — no account existed yet at deploy time.
- Deployed via `az functionapp deploy` (AAD-authenticated zip deploy, since
  Basic Auth is disabled on this Function App per the brief) — the CLI
  timed out client-side (504) on the first attempt but the deployment had
  actually succeeded server-side, confirmed via the SCM deployments API.
- CORS opened for the GitHub Pages origin and local dev.
- `VITE_API_BASE` set as a GitHub Actions repo variable so the deployed
  frontend calls the real backend; local dev deliberately still uses the
  mock backend by default so day-to-day iteration can't touch real data.
- **Verified with a real browser against the live site** (not just curl):
  filled out the whole assessment on the live Pages URL, submitted, and
  confirmed the row landed correctly in the real `Responses` table — all 36
  ratings, scores, goals, business context, including a field with a
  genuine em-dash character surviving byte-perfect (an earlier curl-based
  test of the same endpoint had shown a corrupted character, traced to the
  Windows shell mangling it before the request even left the machine, not
  a real bug — confirmed once the same data went through a real browser's
  fetch API instead).

**SendGrid setup started.** Talked through what's needed (account, single
sender verification — not full domain authentication, since that needs DNS
access the user doesn't have for `cranfield.ac.uk`, and isn't warranted for
this volume anyway — and an API key), and how to hand the two resulting
values off for the final wiring (`SENDGRID_API_KEY` /
`SENDGRID_FROM_EMAIL` as Function App settings). Not completed yet — this
is the one functional gap remaining as of the end of this session.
