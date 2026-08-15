import type {
  AssessmentAnswers,
  Dimension,
  DimensionId,
  Level,
  RoadmapData,
  RoadmapEntry,
  Scores,
  WordingVariant,
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

export interface QuestionActionGroup {
  questionNumber: number;
  questionText: string;
  currentLevel: Level;
  activities: RoadmapEntry[];
}

export interface ImmediateActions {
  dimensionId: DimensionId;
  noActionNeeded: boolean;
  currentStage: Level;
  targetLevel: Level;
  questionGroups: QuestionActionGroup[];
}

/**
 * The overall-score cap (brief section 5): while the respondent's overall
 * score is still below 2, every dimension's immediate actions are pulled
 * only up to Level 3, even if a dimension's own short-term target is set
 * higher — the priority while still early-stage is the Level-3 baseline
 * everywhere, not any one dimension's more ambitious goal. Above an overall
 * score of 2, each dimension's actual short-term target applies uncapped.
 * This affects only which actions are pulled, never the chart, which always
 * plots the respondent's actual chosen targets.
 */
export function getEffectiveTargetLevel(shortTermTarget: Level, overallScore: number): Level {
  return overallScore < 2 ? (Math.min(shortTermTarget, 3) as Level) : shortTermTarget;
}

/**
 * Immediate actions for one dimension: activities/outcomes covering the gap
 * between the dimension's current stage and the given target level only
 * (the caller resolves whether that's the raw short-term target or the
 * overall-score-capped version — see getEffectiveTargetLevel).
 *
 * Computed per-question (using each question's own level) so a question that
 * has already reached the target isn't given redundant lower-level actions.
 * Entries with no real activity to surface (internal-only "no roadmap
 * activity" / "Blocked: ..." sequencing notes) were already filtered out at
 * data-extraction time, so nothing further needs suppressing here.
 */
export function getImmediateActions(
  dimension: Dimension,
  answers: AssessmentAnswers,
  targetLevel: Level,
  roadmap: RoadmapData,
  wordingVariant: WordingVariant,
): ImmediateActions {
  const avg = dimensionAverage(dimension, answers) ?? 1;
  const currentStage = roundedLevel(avg);

  if (targetLevel <= currentStage) {
    return {
      dimensionId: dimension.id,
      noActionNeeded: true,
      currentStage,
      targetLevel,
      questionGroups: [],
    };
  }

  const dimRoadmap = roadmap.dimensions[dimension.id] ?? {};
  const questionGroups: QuestionActionGroup[] = [];

  for (const q of dimension.questions) {
    const qLevel = (answers[q.id] ?? currentStage) as Level;
    if (qLevel >= targetLevel) continue;

    const entries = (dimRoadmap[String(q.number)] ?? [])
      .filter((e) => e.fromLevel >= qLevel && e.fromLevel < targetLevel)
      .sort((a, b) => a.fromLevel - b.fromLevel);

    if (entries.length > 0) {
      questionGroups.push({
        questionNumber: q.number,
        questionText: q.text[wordingVariant],
        currentLevel: qLevel,
        activities: entries,
      });
    }
  }

  return {
    dimensionId: dimension.id,
    noActionNeeded: false,
    currentStage,
    targetLevel,
    questionGroups,
  };
}
