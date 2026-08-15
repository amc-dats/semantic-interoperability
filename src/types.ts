export type Level = 1 | 2 | 3 | 4 | 5;

export const DIMENSION_ORDER = [
  "technical",
  "semantic",
  "organisational",
  "cultural",
  "strategic_governance",
] as const;

export type DimensionId = (typeof DIMENSION_ORDER)[number];

// Which wording the respondent saw throughout the assessment. Scoring,
// roadmap activities, and stored levels (1-5) are identical either way --
// only the displayed question/descriptor text differs.
export type WordingVariant = "technical" | "plainEnglish";

export type WordedText = Record<WordingVariant, string>;

export interface QuestionLevel {
  level: Level;
  text: WordedText;
}

export interface Question {
  id: string;
  number: number;
  text: WordedText;
  levels: QuestionLevel[];
}

export interface Dimension {
  id: DimensionId;
  name: string;
  questionCount: number;
  questions: Question[];
}

export interface AssessmentData {
  dimensions: Dimension[];
}

export interface RoadmapEntry {
  fromLevel: number;
  toLevel: number | null;
  activityId: string | null;
  activity: string;
  outcome: string | null;
}

export interface RoadmapData {
  dimensions: Record<string, Record<string, RoadmapEntry[]>>;
}

// ---- Business context ----

export interface BusinessContext {
  productsOrServices: string | null;
  industrySector: string | null;
  industrySectorOther: string | null;
  siteStructure: string | null;
  geographicReach: string | null;
  portfolioRange: string | null;
  regulatoryEnvironment: string[]; // multi-select
  regulatoryEnvironmentOther: string | null;
  otEstateAgeDiversity: string | null;
  sizeHeadcountBand: string | null;
}

export const EMPTY_BUSINESS_CONTEXT: BusinessContext = {
  productsOrServices: null,
  industrySector: null,
  industrySectorOther: null,
  siteStructure: null,
  geographicReach: null,
  portfolioRange: null,
  regulatoryEnvironment: [],
  regulatoryEnvironmentOther: null,
  otEstateAgeDiversity: null,
  sizeHeadcountBand: null,
};

// ---- Assessment answers ----

export type AssessmentAnswers = Record<string, Level>; // questionId -> level

export interface DimensionTargets {
  shortTerm: Level;
  longTerm: Level;
}

export type TargetsByDimension = Record<DimensionId, DimensionTargets>;

// ---- Validation survey ----

export interface ValidationAnswers {
  utility: Level | null;
  effectiveness: Level | null;
  easeOfUse: Level | null;
  generality: Level | null;
  openText: string;
}

export const EMPTY_VALIDATION: ValidationAnswers = {
  utility: null,
  effectiveness: null,
  easeOfUse: null,
  generality: null,
  openText: "",
};

// ---- Scores ----

export interface DimensionScore {
  dimensionId: DimensionId;
  average: number;
  currentLevel: Level; // rounded, clamped
  stageName: string;
}

export interface Scores {
  byDimension: Record<DimensionId, DimensionScore>;
  overall: number;
}

// ---- Full submission payload (flat, matches Table Storage model) ----

export interface SubmissionPayload {
  responseId: string;
  timestamp: string;
  consent: boolean;
  wordingVariant: WordingVariant;
  businessContext: BusinessContext;
  assessment: AssessmentAnswers;
  scores: Record<DimensionId, number> & { overall: number };
  goals: Record<`${DimensionId}_shortTerm` | `${DimensionId}_longTerm`, Level>;
  validation: ValidationAnswers | null;
}
