import { useEffect, useState } from "react";
import type { AssessmentAnswers, Dimension, Level, TargetsByDimension, WordingVariant } from "../types";
import { dimensionAverage, isDimensionComplete, roundedLevel } from "../lib/scoring";
import { DIMENSION_MATURITY_DESCRIPTORS } from "../data/dimensionMaturityDescriptors";
import { ProgressIndicator } from "./ProgressIndicator";

interface Props {
  dimensions: Dimension[];
  answers: AssessmentAnswers;
  setAnswers: (a: AssessmentAnswers) => void;
  targets: TargetsByDimension;
  setTargets: (t: TargetsByDimension) => void;
  wordingVariant: WordingVariant;
  onAllComplete: () => void;
}

type SubStep = "questions" | "targets";

export function AssessmentFlow({
  dimensions,
  answers,
  setAnswers,
  targets,
  setTargets,
  wordingVariant,
  onAllComplete,
}: Props) {
  const [dimensionIndex, setDimensionIndex] = useState(0);
  const [subStep, setSubStep] = useState<SubStep>("questions");

  // Advancing dimension or sub-step (questions <-> targets) doesn't change
  // App's top-level `stage`, so it needs its own scroll-to-top -- otherwise
  // finishing a long dimension's questions leaves the targets screen (or the
  // next dimension) scrolled to wherever the questions screen ended.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [dimensionIndex, subStep]);

  const dimension = dimensions[dimensionIndex];
  const complete = isDimensionComplete(dimension, answers);

  const setAnswer = (questionId: string, level: Level) => {
    setAnswers({ ...answers, [questionId]: level });
  };

  const goToTargets = () => {
    const avg = dimensionAverage(dimension, answers) ?? 1;
    const defaultLevel = roundedLevel(avg);
    if (!targets[dimension.id]) {
      setTargets({
        ...targets,
        [dimension.id]: { shortTerm: defaultLevel, longTerm: defaultLevel },
      });
    }
    setSubStep("targets");
  };

  const confirmTargets = () => {
    if (dimensionIndex < dimensions.length - 1) {
      setDimensionIndex(dimensionIndex + 1);
      setSubStep("questions");
    } else {
      onAllComplete();
    }
  };

  const dimTargets = targets[dimension.id];
  const descriptors = DIMENSION_MATURITY_DESCRIPTORS[dimension.id];

  const targetSelect = (label: string, value: Level, onSelect: (lvl: Level) => void) => (
    <div className="field">
      <label className="field-label">{label}</label>
      <select value={value} onChange={(e) => onSelect(Number(e.target.value) as Level)}>
        {([1, 2, 3, 4, 5] as Level[]).map((lvl) => (
          <option key={lvl} value={lvl}>
            {lvl} — {descriptors[lvl].label}: {descriptors[lvl].descriptor}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="card">
      <ProgressIndicator dimensions={dimensions} currentIndex={dimensionIndex} subStep={subStep} />

      {subStep === "questions" ? (
        <>
          <h1>{dimension.name} dimension</h1>
          <p className="lede">
            For each question, choose the description that best matches current
            practice in your organisation.
          </p>

          {dimension.questions.map((q) => (
            <div className="question-block" key={q.id}>
              <div className="question-text">
                <span className="question-number">{q.number}.</span>
                {q.text[wordingVariant]}
              </div>
              <select
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, Number(e.target.value) as Level)}
              >
                <option value="" disabled>
                  Select the best match…
                </option>
                {q.levels.map((lvl) => (
                  <option key={lvl.level} value={lvl.level}>
                    {lvl.level} — {lvl.text[wordingVariant]}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="actions-row">
            <button className="btn btn-primary" disabled={!complete} onClick={goToTargets}>
              {complete ? "Next" : `Answer all ${dimension.questions.length} questions to continue`}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>Set your targets</h1>
          <p className="lede">
            Based on your answers, your organisation's current level for{" "}
            <strong>{dimension.name}</strong> is level{" "}
            {roundedLevel(dimensionAverage(dimension, answers) ?? 1)}. Choose where you'd
            like to be in the short term and the long term.
          </p>

          <p className="goal-note">
            Level 3 is the recommended minimum for each dimension in the long
            term. Dimensions can't progress beyond Level 3 until all five
            dimensions reach at least Level 3, so a lower long-term target
            here will also constrain progress elsewhere.
          </p>

          {targetSelect("Short-term target", dimTargets?.shortTerm ?? 1, (lvl) =>
            setTargets({
              ...targets,
              [dimension.id]: { shortTerm: lvl, longTerm: dimTargets?.longTerm ?? 1 },
            }),
          )}

          {targetSelect("Long-term target", dimTargets?.longTerm ?? 1, (lvl) =>
            setTargets({
              ...targets,
              [dimension.id]: { shortTerm: dimTargets?.shortTerm ?? 1, longTerm: lvl },
            }),
          )}

          <p className="form-note">
            Once you continue, you won't be able to come back and change your answers
            for the {dimension.name} dimension.
          </p>

          <div className="actions-row">
            <button className="btn btn-primary" onClick={confirmTargets}>
              {dimensionIndex < dimensions.length - 1 ? "Next dimension" : "See my results"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
