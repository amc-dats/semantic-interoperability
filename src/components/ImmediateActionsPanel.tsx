import { getEffectiveTargetLevel, getImmediateActions, type QuestionActionGroup } from "../lib/scoring";
import type { AssessmentAnswers, Dimension, RoadmapData, Scores, TargetsByDimension, WordingVariant } from "../types";

interface Props {
  dimensions: Dimension[]; // in fixed app order, Technical first
  answers: AssessmentAnswers;
  targets: TargetsByDimension;
  scores: Scores;
  roadmap: RoadmapData;
  wordingVariant: WordingVariant;
}

function QuestionGroups({ groups }: { groups: QuestionActionGroup[] }) {
  return (
    <>
      {groups.map((g) => (
        <div className="action-question" key={g.questionNumber}>
          <div className="action-question-title">
            {g.questionNumber}. {g.questionText}
          </div>
          {g.activities.map((a) => (
            <div className="action-item" key={`${g.questionNumber}-${a.fromLevel}`}>
              <strong>{a.activityId ? `${a.activityId}: ` : ""}</strong>
              {a.activity}
              {a.outcome && <div className="outcome">Outcome: {a.outcome}</div>}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export function ImmediateActionsPanel({
  dimensions,
  answers,
  targets,
  scores,
  roadmap,
  wordingVariant,
}: Props) {
  const overallScore = scores.overall;
  const capped = overallScore < 2;

  const technical = dimensions.find((d) => d.id === "technical");
  const others = dimensions.filter((d) => d.id !== "technical");

  const technicalTarget = technical
    ? getEffectiveTargetLevel(targets.technical.shortTerm, overallScore)
    : null;
  const technicalActions =
    technical && technicalTarget
      ? getImmediateActions(technical, answers, technicalTarget, roadmap, wordingVariant)
      : null;

  return (
    <div className="dimension-result">
      <h3>Immediate actions</h3>

      {capped && (
        <p className="no-action-note" style={{ marginBottom: 16 }}>
          Your overall maturity is still early-stage, so immediate actions below
          focus on reaching the Level 3 baseline across all dimensions first.
        </p>
      )}

      {technicalActions && !technicalActions.noActionNeeded && (
        <div className="actions-panel">
          <div className="dimension-result-header" style={{ marginTop: 0 }}>
            <div className="section-heading" style={{ margin: 0 }}>
              Technical
            </div>
            <span className="stage-tag">Priority — do this first</span>
          </div>
          <p className="form-note" style={{ marginBottom: 10 }}>
            Technical is the foundation the other four dimensions build on, so its
            gap to target is addressed first, regardless of how it scores relative
            to the others.
          </p>
          <QuestionGroups groups={technicalActions.questionGroups} />
        </div>
      )}

      {others.map((dim) => {
        const effectiveTarget = getEffectiveTargetLevel(targets[dim.id].shortTerm, overallScore);
        const actions = getImmediateActions(dim, answers, effectiveTarget, roadmap, wordingVariant);
        return (
          <div className="actions-panel" key={dim.id}>
            <div className="section-heading">{dim.name}</div>
            {actions.noActionNeeded ? (
              <p className="no-action-note">
                Target already met at the current stage — no immediate action
                needed for this dimension.
              </p>
            ) : actions.questionGroups.length === 0 ? (
              <p className="no-action-note">
                No specific roadmap activities are catalogued for this gap yet.
              </p>
            ) : (
              <QuestionGroups groups={actions.questionGroups} />
            )}
          </div>
        );
      })}
    </div>
  );
}
