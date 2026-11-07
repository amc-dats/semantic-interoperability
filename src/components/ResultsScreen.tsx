import type { AssessmentAnswers, Dimension, RoadmapData, Scores, TargetsByDimension } from "../types";
import { stageNameForAverage } from "../lib/scoring";
import { CombinedMaturityChart } from "./CombinedMaturityChart";
import { ImmediateActionsPanel } from "./ImmediateActionsPanel";
import { CompanyAveragePanel } from "./CompanyAveragePanel";

interface Props {
  dimensions: Dimension[];
  answers: AssessmentAnswers;
  targets: TargetsByDimension;
  scores: Scores;
  roadmap: RoadmapData;
  orgCode?: string | null;
  orgRound?: number | null;
  companyReady?: boolean;
  onContinue: () => void;
}

export function ResultsScreen({
  dimensions,
  answers,
  targets,
  scores,
  roadmap,
  orgCode,
  orgRound,
  companyReady,
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

      {orgCode && orgRound && (
        <CompanyAveragePanel
          dimensions={dimensions}
          scores={scores}
          orgCode={orgCode}
          orgRound={orgRound}
          ready={!!companyReady}
        />
      )}

      <hr className="divider" />

      <ImmediateActionsPanel
        dimensions={dimensions}
        answers={answers}
        targets={targets}
        roadmap={roadmap}
      />

      <p className="print-only">
        Interoperability Maturity Self-Assessment, printed{" "}
        {new Date().toLocaleDateString("en-GB")}
        {orgCode ? `, company code ${orgCode}` : ""}
      </p>

      <div className="actions-row no-print">
        <button className="btn btn-secondary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <button className="btn btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
      <p className="field-hint no-print">
        To keep a copy of your results, choose “Save as PDF” as the destination
        in the print window.
      </p>
    </div>
  );
}
