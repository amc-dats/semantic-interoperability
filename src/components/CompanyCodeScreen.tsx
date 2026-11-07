import { useState } from "react";
import { ApiError, orgCreate, orgJoin, orgNewRound } from "../lib/api";
import type { OrgInfo } from "../lib/api";

interface Props {
  onDone: (orgCode: string | null, orgRound: number | null) => void;
}

type Mode = "choose" | "create" | "join";

export function CompanyCodeScreen({ onDone }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [info, setInfo] = useState<OrgInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingRound, setConfirmingRound] = useState(false);

  const run = async (fn: () => Promise<OrgInfo>, notFound?: string) => {
    setBusy(true);
    setError(null);
    try {
      setInfo(await fn());
    } catch (err) {
      if (err instanceof ApiError && err.status === 404 && notFound) setError(notFound);
      else if (err instanceof ApiError && err.status === 400) setError("Please check what you entered and try again.");
      else setError("Something went wrong. You can try again, or skip this step.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.code);
      setCopied(true);
    } catch {
      /* clipboard unavailable: the code is shown on screen anyway */
    }
  };

  const reset = () => {
    setMode("choose");
    setInfo(null);
    setError(null);
    setConfirmingRound(false);
    setCopied(false);
  };

  return (
    <div className="card">
      <div className="eyebrow">Optional</div>
      <h1>Working with colleagues?</h1>
      <p className="lede">
        A company code groups results from colleagues who each complete the
        assessment. You will see your own results and the average for everyone
        using the same code, and the code lets you run a follow-up later to see
        how things have changed. Codes are random and no names or email
        addresses are collected. You can also skip this and complete the
        assessment on your own.
      </p>

      {mode === "choose" && (
        <div className="actions-row">
          <button className="btn btn-text" onClick={() => onDone(null, null)}>
            Skip
          </button>
          <button className="btn btn-secondary" onClick={() => setMode("join")}>
            I have a company code
          </button>
          <button className="btn btn-primary" onClick={() => setMode("create")}>
            Create a company code
          </button>
        </div>
      )}

      {mode === "create" && !info && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="org-name">
              A short name for your company or team
            </label>
            <input
              id="org-name"
              type="text"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme"
            />
            <p className="field-hint">
              2 to 12 letters or digits. A random suffix is added so your code is
              unique, for example ACME-4K7Q.
            </p>
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="actions-row">
            <button className="btn btn-text" onClick={reset} disabled={busy}>
              Back
            </button>
            <button
              className="btn btn-primary"
              disabled={busy || name.replace(/[^A-Za-z0-9]/g, "").length < 2}
              onClick={() => run(() => orgCreate(name))}
            >
              {busy ? "Creating…" : "Create code"}
            </button>
          </div>
        </>
      )}

      {mode === "create" && info && (
        <>
          <div className="org-code-box" aria-live="polite">
            <span className="org-code">{info.code}</span>
            <button className="btn btn-secondary" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="field-hint">
            Share this code with colleagues so their results are grouped with
            yours. Keep a note of it: you will need it to see the company
            average again and to run a follow-up assessment.
          </p>
          <div className="actions-row">
            <button className="btn btn-primary" onClick={() => onDone(info.code, info.round)}>
              Continue
            </button>
          </div>
        </>
      )}

      {mode === "join" && !info && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="org-code">
              Your company code
            </label>
            <input
              id="org-code"
              type="text"
              value={codeInput}
              maxLength={20}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().trim())}
              placeholder="e.g. ACME-4K7Q"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="actions-row">
            <button className="btn btn-text" onClick={reset} disabled={busy}>
              Back
            </button>
            <button
              className="btn btn-primary"
              disabled={busy || codeInput.length < 7}
              onClick={() => run(() => orgJoin(codeInput), "We couldn't find that code. Check it and try again.")}
            >
              {busy ? "Checking…" : "Join"}
            </button>
          </div>
        </>
      )}

      {mode === "join" && info && (
        <>
          <div className="org-code-box">
            <span className="org-code">{info.code}</span>
          </div>
          <p className="field-hint">
            Assessment round {info.round}: {info.responses}{" "}
            {info.responses === 1 ? "colleague has" : "colleagues have"} completed it so far.
          </p>
          {error && <p className="error-text">{error}</p>}
          {info.responses > 0 && (
            <div className="form-note">
              <p style={{ marginTop: 0 }}>
                Is your company repeating the assessment to measure progress? Start
                a new round. Earlier results are kept, and anyone joining with this
                code afterwards will be in the new round.
              </p>
              {!confirmingRound ? (
                <button className="btn btn-secondary" onClick={() => setConfirmingRound(true)} disabled={busy}>
                  Start a new round
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={async () => {
                    await run(() => orgNewRound(info.code));
                    setConfirmingRound(false);
                  }}
                >
                  {busy ? "Starting…" : `Confirm: start round ${info.round + 1}`}
                </button>
              )}
            </div>
          )}
          <div className="actions-row">
            <button className="btn btn-text" onClick={reset}>
              Use a different code
            </button>
            <button className="btn btn-primary" onClick={() => onDone(info.code, info.round)}>
              Continue in round {info.round}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
