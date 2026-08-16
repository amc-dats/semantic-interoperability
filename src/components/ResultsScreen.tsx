import type { AssessmentAnswers, Dimension, RoadmapData, Scores, TargetsByDimension } from "../types";
import { stageNameForAverage } from "../lib/scoring";
import { CombinedMaturityChart } from "./CombinedMaturityChart";
import { ImmediateActionsPanel } from "./ImmediateActionsPanel";

interface Props {
  dimensions: Dimension[];
  answers: AssessmentAnswers;
  targets: TargetsByDimension;
  scores: Scores;
  roadmap: RoadmapData;
  onContinue: () => void;
}

export function ResultsScreen({ dimensions, answers, targets, scores, roadmap, onContinue }: Props) {
  const overallStageName = stageNameForAverage(scores.overall);

  return (
    <div className="card">
      <div className="eyebrow">Your results</div>
      <h1>Interoperability maturity results</h1>

      <div className="overall-score">
        <span className="value">{scores.overall.toFixed(2)}</span>
        <span className="value-stage">— {overallStageName}</span>
        <span className="label">
          Overall maturity score
          <br />
          (average across all five dimensions)
        </span>
      </div>

      <CombinedMaturityChart dimensions={dimensions} scores={scores} targets={targets} />

      <hr className="divider" />

      <ImmediateActionsPanel
        dimensions={dimensions}
        answers={answers}
        targets={targets}
        roadmap={roadmap}
      />

      <div className="actions-row">
        <button className="btn btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
