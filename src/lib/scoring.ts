import type {
  AssessmentAnswers,
  Dimension,
  DimensionId,
  Level,
  RoadmapData,
  RoadmapEntry,
  Scores,
} from "../types";

// Standard maturity bands (brief section 5)
const STAGE_BANDS: { min: number; max: number; name: string }[] = [
  { min: 1.0, max: 1.49, name: "Initial / Ad hoc" },
  { min: 1.5, max: 2.49, name: "Emerging" },
  { min: 2.5, max: 3.49, name: "Defined" },
  { min: 3.5, max: 4.49, name: "Managed" },
  { min: 4.5, max: 5.0, name: "Optimised" },
];

// Stage names keyed by integer level 1-5, used for target-dropdown descriptors
// and roadmap lookups (sourced from the roadmap workbook's Instructions sheet).
export const STAGE_NAME_BY_LEVEL: Record<Level, string> = {
  1: "Initial / Ad hoc",
  2: "Emerging",
  3: "Defined",
  4: "Managed",
  5: "Optimised",
};

export function stageNameForAverage(average: number): string {
  const band = STAGE_BANDS.find((b) => average >= b.min && average <= b.max);
  return band ? band.name : STAGE_BANDS[0].name;
}

export function roundedLevel(average: number): Level {
  const rounded = Math.round(average);
  return Math.min(5, Math.max(1, rounded)) as Level;
}

export function dimensionAverage(
  dimension: Dimension,
  answers: AssessmentAnswers,
): number | null {
  const levels = dimension.questions
    .map((q) => answers[q.id])
    .filter((v): v is Level => typeof v === "number");
  if (levels.length === 0) return null;
  const sum = levels.reduce((a, b) => a + b, 0);
  return sum / levels.length;
}

export function isDimensionComplete(
  dimension: Dimension,
  answers: AssessmentAnswers,
): boolean {
  return dimension.questions.every((q) => typeof answers[q.id] === "number");
}

export function computeScores(
  dimensions: Dimension[],
  answers: AssessmentAnswers,
): Scores {
  const byDimension = {} as Scores["byDimension"];
  let total = 0;
  for (const dim of dimensions) {
    const avg = dimensionAverage(dim, answers) ?? 1;
    byDimension[dim.id] = {
      dimensionId: dim.id,
      average: avg,
      currentLevel: roundedLevel(avg),
      stageName: stageNameForAverage(avg),
    };
    total += avg;
  }
  return { byDimension, overall: total / dimensions.length };
}

export interface SortedActivity extends RoadmapEntry {
  // activityId with the 2-letter dimension prefix stripped for display,
  // e.g. "TE1.2b" -> "1.2b" (already shown under the "Technical" heading,
  // so repeating the abbreviation there is redundant).
  displayId: string;
}

export interface ImmediateActions {
  dimensionId: DimensionId;
  noActionNeeded: boolean;
  // True when the dimension's rounded average has reached Level 3 (so no
  // further action is owed against its own target), but individual
  // questions within it are still genuinely below 3 with real activities
  // defined -- e.g. an average of 2.51 rounds up to 3 and masks a question
  // still sitting at 2. When true, `activities` holds only the level-3-gap
  // -closing work for those specific questions, not the dimension's normal
  // target-driven action list.
  minimumReachedWithGaps: boolean;
  currentStage: Level;
  targetLevel: Level;
  activities: SortedActivity[];
}

function stripDimensionPrefix(activityId: string): string {
  return activityId
    .split("/")
    .map((seg) => seg.trim().replace(/^[A-Za-z]+/, ""))
    .join("/");
}

// Sort key: workstream number, then level, then item letter -- e.g.
// "TE1.2b" < "TE2.2a" < "TE2.2b" < "TE2.2c" < "TE3.2a", matching how the
// workstreams themselves are numbered rather than the order questions
// happen to appear in.
function activitySortKey(activityId: string): [number, number, string] {
  const first = activityId.split("/")[0].trim();
  const m = first.match(/^[A-Za-z]*(\d+)\.(\d+)([A-Za-z]*)$/);
  if (!m) return [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, activityId];
  return [Number(m[1]), Number(m[2]), m[3]];
}

function compareActivities(a: RoadmapEntry, b: RoadmapEntry): number {
  const [aw, al, ai] = activitySortKey(a.activityId ?? "");
  const [bw, bl, bi] = activitySortKey(b.activityId ?? "");
  if (aw !== bw) return aw - bw;
  if (al !== bl) return al - bl;
  return ai.localeCompare(bi);
}

/**
 * The Level-3 progression gate: no dimension may advance beyond Level 3
 * until *every* dimension has reached at least Level 3 -- this is the
 * framework's own stated rule (see the goal-setting note shown during the
 * assessment, and the roadmap workbook's Instructions sheet: "Level 3 ...
 * is the minimum level of maturity required ... across all dimensions").
 */
export function allDimensionsReachedLevel3(
  dimensions: Dimension[],
  answers: AssessmentAnswers,
): boolean {
  return dimensions.every((d) => roundedLevel(dimensionAverage(d, answers) ?? 1) >= 3);
}

/**
 * Applies the Level-3 progression gate to one dimension's target: while
 * `gated` is true, immediate actions are pulled only up to Level 3, even if
 * this dimension's own short-term target is set higher -- the priority
 * before every dimension has cleared the Level 3 baseline is getting there
 * everywhere, not any one dimension's more ambitious goal. Once every
 * dimension has reached Level 3, each dimension's actual short-term target
 * applies uncapped. This affects only which actions are pulled, never the
 * chart, which always plots the respondent's actual chosen targets.
 */
export function getEffectiveTargetLevel(shortTermTarget: Level, gated: boolean): Level {
  return gated ? (Math.min(shortTermTarget, 3) as Level) : shortTermTarget;
}

/**
 * Immediate actions for one dimension: activities/outcomes covering the gap
 * between the dimension's current stage and the given target level only
 * (the caller resolves whether that's the raw short-term target or the
 * overall-score-capped version — see getEffectiveTargetLevel).
 *
 * Computed per-question (using each question's own level) so a question that
 * has already reached the target isn't given redundant lower-level actions,
 * but the result is a single flat list for the dimension, sorted by
 * workstream/level/item (e.g. 1.2b, 2.2a, 2.2b, 2.2c, 3.2a...) rather than
 * grouped by question -- the question text itself was already shown during
 * the assessment and repeating it here just makes the panel long. Entries
 * with no real activity to surface (internal-only "no roadmap activity" /
 * "Blocked: ..." sequencing notes) were already filtered out at
 * data-extraction time, so nothing further needs suppressing here.
 */
export function getImmediateActions(
  dimension: Dimension,
  answers: AssessmentAnswers,
  targetLevel: Level,
  roadmap: RoadmapData,
): ImmediateActions {
  const avg = dimensionAverage(dimension, answers) ?? 1;
  const currentStage = roundedLevel(avg);
  const dimRoadmap = roadmap.dimensions[dimension.id] ?? {};

  if (targetLevel <= currentStage) {
    // The dimension's own target is already met by its rounded average --
    // but rounding can mask individual questions still genuinely below the
    // Level 3 baseline (2.51 rounds up to 3). Only worth checking once the
    // dimension has actually reached that baseline; below it, "no action
    // needed" already means the respondent simply hasn't asked to progress
    // yet, which is a different, unremarkable case.
    if (currentStage >= 3) {
      const gapActivities: SortedActivity[] = [];
      for (const q of dimension.questions) {
        const qLevel = answers[q.id];
        if (qLevel === undefined || qLevel >= 3) continue;
        const entries = (dimRoadmap[String(q.number)] ?? []).filter(
          (e) => e.fromLevel >= qLevel && e.fromLevel < 3,
        );
        for (const e of entries) {
          gapActivities.push({ ...e, displayId: stripDimensionPrefix(e.activityId ?? "") });
        }
      }
      if (gapActivities.length > 0) {
        gapActivities.sort(compareActivities);
        return {
          dimensionId: dimension.id,
          noActionNeeded: false,
          minimumReachedWithGaps: true,
          currentStage,
          targetLevel,
          activities: gapActivities,
        };
      }
    }

    return {
      dimensionId: dimension.id,
      noActionNeeded: true,
      minimumReachedWithGaps: false,
      currentStage,
      targetLevel,
      activities: [],
    };
  }

  const activities: SortedActivity[] = [];

  for (const q of dimension.questions) {
    const qLevel = (answers[q.id] ?? currentStage) as Level;
    if (qLevel >= targetLevel) continue;

    const entries = (dimRoadmap[String(q.number)] ?? []).filter(
      (e) => e.fromLevel >= qLevel && e.fromLevel < targetLevel,
    );

    for (const e of entries) {
      activities.push({ ...e, displayId: stripDimensionPrefix(e.activityId ?? "") });
    }
  }

  activities.sort(compareActivities);

  return {
    dimensionId: dimension.id,
    noActionNeeded: false,
    minimumReachedWithGaps: false,
    currentStage,
    targetLevel,
    activities,
  };
}
