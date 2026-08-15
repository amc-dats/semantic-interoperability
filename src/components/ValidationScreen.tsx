import type { Level, ValidationAnswers } from "../types";

interface Props {
  value: ValidationAnswers;
  onChange: (v: ValidationAnswers) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

const LIKERT_LABELS: Record<Level, string> = {
  1: "Strongly disagree",
  2: "Disagree",
  3: "Neutral",
  4: "Agree",
  5: "Strongly agree",
};

function LikertQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Level | null;
  onChange: (v: Level) => void;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="likert">
        {([1, 2, 3, 4, 5] as Level[]).map((lvl) => (
          <label className="likert-option" key={lvl}>
            <input
              type="radio"
              name={label}
              checked={value === lvl}
              onChange={() => onChange(lvl)}
            />
            <span>{lvl === 1 || lvl === 5 ? LIKERT_LABELS[lvl] : lvl}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function ValidationScreen({ value, onChange, onSubmit, onSkip }: Props) {
  const set = <K extends keyof ValidationAnswers>(key: K, v: ValidationAnswers[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="card">
      <div className="eyebrow">Optional — last step</div>
      <h1>Help validate this research</h1>
      <p className="lede">
        If you have a few more minutes, these questions help validate this
        research for my MSc dissertation at Cranfield University.
      </p>

      <LikertQuestion
        label="Did this self-assessment help you identify where your organisation currently stands on its interoperability journey?"
        value={value.utility}
        onChange={(v) => set("utility", v)}
      />
      <LikertQuestion
        label="Do you believe acting on this roadmap would help your organisation progress towards its interoperability goals?"
        value={value.effectiveness}
        onChange={(v) => set("effectiveness", v)}
      />
      <LikertQuestion
        label="Was the self-assessment clear and straightforward to complete?"
        value={value.easeOfUse}
        onChange={(v) => set("easeOfUse", v)}
      />
      <LikertQuestion
        label="Do you think this framework would be relevant and applicable to organisations in your industry more broadly, not just your own?"
        value={value.generality}
        onChange={(v) => set("generality", v)}
      />

      <div className="field">
        <label className="field-label">
          What, if anything, would make this more useful for your organisation?
        </label>
        <textarea
          value={value.openText}
          onChange={(e) => set("openText", e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="actions-row">
        <button className="btn btn-secondary" onClick={onSkip}>
          Skip
        </button>
        <button className="btn btn-primary" onClick={onSubmit}>
          Submit feedback
        </button>
      </div>
    </div>
  );
}
