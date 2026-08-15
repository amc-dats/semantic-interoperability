import { useState } from "react";

interface Props {
  onSendAndContinue: (email: string) => Promise<void>;
  onContinueWithoutEmail: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailOptInScreen({ onSendAndContinue, onContinueWithoutEmail }: Props) {
  const [wantsEmail, setWantsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email);

  const handleSend = async () => {
    setTouched(true);
    if (!valid) return;
    setSending(true);
    setError(null);
    try {
      await onSendAndContinue(email);
    } catch {
      setError("Something went wrong sending the email. You can continue without it.");
      setSending(false);
    }
  };

  return (
    <div className="card">
      <div className="eyebrow">Optional</div>
      <h1>Email these results?</h1>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={wantsEmail}
          onChange={(e) => setWantsEmail(e.target.checked)}
        />
        <span>Would you like these results emailed to you?</span>
      </label>

      {wantsEmail && (
        <div className={"field" + (touched && !valid ? " field-error" : "")} style={{ marginTop: 16 }}>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@example.com"
          />
          {touched && !valid && <div className="error-text">Enter a valid email address.</div>}
          <p className="field-hint">
            Your email address will not be stored — it is used only to send this
            email and is then discarded.
          </p>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="actions-row">
        <button className="btn btn-secondary" onClick={onContinueWithoutEmail} disabled={sending}>
          {wantsEmail ? "Skip" : "Continue"}
        </button>
        {wantsEmail && (
          <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send and continue"}
          </button>
        )}
      </div>
    </div>
  );
}
