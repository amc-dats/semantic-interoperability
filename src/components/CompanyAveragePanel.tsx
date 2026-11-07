import { useEffect, useState } from "react";
import type { Dimension, Scores } from "../types";
import { orgResults } from "../lib/api";
import type { OrgResults } from "../lib/api";

interface Props {
  dimensions: Dimension[];
  scores: Scores;
  orgCode: string;
  orgRound: number;
  ready: boolean; // true once this respondent's own submission has been saved
}

const fmt = (n: number | undefined) => (typeof n === "number" ? n.toFixed(2) : "–");

export function CompanyAveragePanel({ dimensions, scores, orgCode, orgRound, ready }: Props) {
  const [data, setData] = useState<OrgResults | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    orgResults(orgCode)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [orgCode, ready]);

  const thisRound = data?.rounds.find((r) => r.round === orgRound);
  const earlier = data?.rounds.filter((r) => r.round < orgRound) ?? [];

  return (
    <div className="company-panel">
      <h2>Company average</h2>
      <p className="field-hint" style={{ marginTop: 0 }}>
        Company code {orgCode}, assessment round {orgRound}
      </p>

      {failed && <p className="error-text">We couldn't load the company average just now.</p>}
      {!failed && !thisRound && <p className="field-hint">Loading the company average…</p>}

      {thisRound && (
        <>
          <p>
            {thisRound.n === 1
              ? "You are the first to complete this round. Share the code with colleagues and their results will appear in the average."
              : `Average of ${thisRound.n} people in this round, including you.`}
          </p>
          <table className="company-table">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>You</th>
                <th>Company average</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{fmt(scores.byDimension[d.id].average)}</td>
                  <td>{fmt(thisRound.averages[d.id])}</td>
                </tr>
              ))}
              <tr className="company-total">
                <td>Overall</td>
                <td>{fmt(scores.overall)}</td>
                <td>{fmt(thisRound.averages.overall)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {earlier.length > 0 && (
        <p className="field-hint">
          Earlier rounds (overall company average):{" "}
          {earlier.map((r) => `round ${r.round}: ${fmt(r.averages.overall)} (${r.n} ${r.n === 1 ? "person" : "people"})`).join("; ")}
        </p>
      )}
    </div>
  );
}
