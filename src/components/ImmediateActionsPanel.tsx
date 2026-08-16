import {
  allDimensionsReachedLevel3,
  getEffectiveTargetLevel,
  getImmediateActions,
  type SortedActivity,
} from "../lib/scoring";
import type { AssessmentAnswers, Dimension, RoadmapData, TargetsByDimension } from "../types";

interface Props {
  dimensions: Dimension[]; // in fixed app order, Technical first
  answers: AssessmentAnswers;
  targets: TargetsByDimension;
  roadmap: RoadmapData;
}

function ActivityList({ activities }: { activities: SortedActivity[] }) {
  return (
    <>
      {activities.map((a, i) => (
        // A handful of source activity IDs are (incorrectly) reused for
        // genuinely different activities -- see the extraction script's
        // duplicate-ID warning -- so displayId alone isn't a safe key.
        <div className="action-item" key={`${i}-${a.displayId}`}>
          <strong>{a.displayId}: </strong>
          {a.activity}
          {a.outcome && <div className="outcome">Outcome: {a.outcome}</div>}
        </div>
      ))}
    </>
  );
}

export function ImmediateActionsPanel({ dimensions, answers, targets, roadmap }: Props) {
  const gated = !allDimensionsReachedLevel3(dimensions, answers);

  const technical = dimensions.find((d) => d.id === "technical");
  const others = dimensions.filter((d) => d.id !== "technical");

  const technicalTarget = technical
    ? getEffectiveTargetLevel(targets.technical.shortTerm, gated)
    : null;
  const technicalActions =
    technical && technicalTarget
      ? getImmediateActions(technical, answers, technicalTarget, roadmap)
      : null;

  return (
    <div className="dimension-result">
      <h3>Immediate actions</h3>

      {gated && (
        <p className="no-action-note" style={{ marginBottom: 16 }}>
          Level 3 is the minimum baseline across all five dimensions, and no
          dimension can progress further until every dimension reaches it —
          so immediate actions below focus on reaching Level 3 everywhere
          first.
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
          {technicalActions.minimumReachedWithGaps && (
            <p className="no-action-note" style={{ marginBottom: 10 }}>
              Minimum Level 3 reached. Areas to prioritise in the short term are
              those with the lowest scores.
            </p>
          )}
          <ActivityList activities={technicalActions.activities} />
        </div>
      )}

      {others.map((dim) => {
        const effectiveTarget = getEffectiveTargetLevel(targets[dim.id].shortTerm, gated);
        const actions = getImmediateActions(dim, answers, effectiveTarget, roadmap);
        return (
          <div className="actions-panel" key={dim.id}>
            <div className="section-heading">{dim.name}</div>
            {actions.noActionNeeded ? (
              <p className="no-action-note">
                Target already met at the current stage — no immediate action
                needed for this dimension.
              </p>
            ) : (
              <>
                {actions.minimumReachedWithGaps && (
                  <p className="no-action-note" style={{ marginBottom: 10 }}>
                    Minimum Level 3 reached. Areas to prioritise in the short term
                    are those with the lowest scores.
                  </p>
                )}
                {actions.activities.length === 0 ? (
                  <p className="no-action-note">
                    No specific roadmap activities are catalogued for this gap yet.
                  </p>
                ) : (
                  <ActivityList activities={actions.activities} />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
