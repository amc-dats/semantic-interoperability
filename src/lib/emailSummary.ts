import {
  allDimensionsReachedLevel3,
  getEffectiveTargetLevel,
  getImmediateActions,
  stageNameForAverage,
} from "./scoring";
import type { AssessmentAnswers, Dimension, RoadmapData, Scores, TargetsByDimension } from "../types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Renders the same "immediate actions" content shown on the Results screen
 * (see ImmediateActionsPanel.tsx) as a plain HTML string, so the results
 * email can include it without duplicating the scoring/roadmap logic on
 * the backend -- the Function App has no access to the question/roadmap
 * data, only the frontend does. Kept intentionally simpler than the React
 * version (no CSS classes, inline styling only, since email HTML can't
 * rely on an external stylesheet).
 */
export function renderImmediateActionsHtml(
  dimensions: Dimension[],
  answers: AssessmentAnswers,
  targets: TargetsByDimension,
  roadmap: RoadmapData,
): string {
  const gated = !allDimensionsReachedLevel3(dimensions, answers);
  const technical = dimensions.find((d) => d.id === "technical");
  const others = dimensions.filter((d) => d.id !== "technical");

  const sections: string[] = [];

  if (gated) {
    sections.push(
      `<p style="color:#52514e;font-size:13px;">Level 3 is the minimum baseline across all five dimensions, and no dimension can progress further until every dimension reaches it — so immediate actions below focus on reaching Level 3 everywhere first.</p>`,
    );
  }

  const renderDimensionBlock = (dim: Dimension, label: string) => {
    const effectiveTarget = getEffectiveTargetLevel(targets[dim.id].shortTerm, gated);
    const actions = getImmediateActions(dim, answers, effectiveTarget, roadmap);

    let body: string;
    if (actions.noActionNeeded) {
      body = `<p style="color:#52514e;font-size:13px;font-style:italic;">Target already met at the current stage — no immediate action needed for this dimension.</p>`;
    } else {
      const note = actions.minimumReachedWithGaps
        ? `<p style="color:#52514e;font-size:13px;font-style:italic;">Minimum Level 3 reached. Areas to prioritise in the short term are those with the lowest scores.</p>`
        : "";
      const items =
        actions.activities.length === 0
          ? `<p style="color:#52514e;font-size:13px;font-style:italic;">No specific roadmap activities are catalogued for this gap yet.</p>`
          : actions.activities
              .map(
                (a) =>
                  `<li style="margin-bottom:8px;"><strong>${escapeHtml(a.displayId)}:</strong> ${escapeHtml(a.activity)}${
                    a.outcome
                      ? `<br/><span style="color:#898781;font-size:12px;">Outcome: ${escapeHtml(a.outcome)}</span>`
                      : ""
                  }</li>`,
              )
              .join("");
      body = `${note}<ul style="padding-left:18px;margin:8px 0;">${items}</ul>`;
    }

    return `<h3 style="margin:20px 0 4px;font-size:15px;">${escapeHtml(label)}</h3>${body}`;
  };

  if (technical) {
    sections.push(renderDimensionBlock(technical, "Technical (priority — do this first)"));
  }
  for (const dim of others) {
    sections.push(renderDimensionBlock(dim, dim.name));
  }

  return sections.join("\n");
}

export function renderScoreSummaryHtml(
  dimensions: Dimension[],
  scores: Scores,
  targets: TargetsByDimension,
): string {
  const rows = dimensions
    .map((dim) => {
      const s = scores.byDimension[dim.id];
      const t = targets[dim.id];
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e1e0d9;">${escapeHtml(dim.name)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e1e0d9;text-align:right;">${s.average.toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e1e0d9;text-align:right;">${t.shortTerm}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e1e0d9;text-align:right;">${t.longTerm}</td>
      </tr>`;
    })
    .join("");

  return `
    <p style="font-size:15px;">
      <strong>Overall score: ${scores.overall.toFixed(2)} — ${escapeHtml(stageNameForAverage(scores.overall))}</strong>
    </p>
    <table style="border-collapse:collapse;width:100%;font-size:13px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:6px 10px;border-bottom:2px solid #c3c2b7;">Dimension</th>
          <th style="text-align:right;padding:6px 10px;border-bottom:2px solid #c3c2b7;">Current</th>
          <th style="text-align:right;padding:6px 10px;border-bottom:2px solid #c3c2b7;">Short-term target</th>
          <th style="text-align:right;padding:6px 10px;border-bottom:2px solid #c3c2b7;">Long-term target</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
