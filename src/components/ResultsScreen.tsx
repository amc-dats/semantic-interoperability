import type { AssessmentAnswers, Dimension, RoadmapData, Scores, TargetsByDimension, WordingVariant } from "../types";
import { stageNameForAverage } from "../lib/scoring";
import { CombinedMaturityChart } from "./CombinedMaturityChart";
import { ImmediateActionsPanel } from "./ImmediateActionsPanel";

interface Props {
  dimensions: Dimension[];
  answers: AssessmentAnswers;
  targets: TargetsByDimension;
  scores: Scores;
  roadmap: RoadmapData;
  wordingVariant: WordingVariant;
  onContinue: () => void;
}

export function ResultsScreen({
  dimensions,
  answers,
  targets,
  scores,
  roadmap,
  wordingVariant,
  onContinue,
}: Props) {
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

      <table className="summary-table">
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Current</th>
            <th>Short-term target</th>
            <th>Long-term target</th>
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dim) => {
            const score = scores.byDimension[dim.id];
            const t = targets[dim.id];
            return (
              <tr key={dim.id}>
                <td>{dim.name}</td>
                <td className="num">{score.average.toFixed(2)}</td>
                <td className="num">{t.shortTerm}</td>
                <td className="num">{t.longTerm}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <hr className="divider" />

      <ImmediateActionsPanel
        dimensions={dimensions}
        answers={answers}
        targets={targets}
        scores={scores}
        roadmap={roadmap}
        wordingVariant={wordingVariant}
      />

      <div className="actions-row">
        <button className="btn btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
