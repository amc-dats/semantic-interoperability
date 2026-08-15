import type { Dimension } from "../types";

interface Props {
  dimensions: Dimension[];
  currentIndex: number;
  subStep: "questions" | "targets";
}

export function ProgressIndicator({ dimensions, currentIndex, subStep }: Props) {
  const current = dimensions[currentIndex];
  const stepLabel = subStep === "targets" ? "Set your targets" : "Questions";

  return (
    <div className="progress">
      <div className="progress-label">
        <span>
          Dimension {currentIndex + 1} of {dimensions.length}: {current.name}
        </span>
        <span>{stepLabel}</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${((currentIndex + (subStep === "targets" ? 0.5 : 0)) / dimensions.length) * 100}%`,
          }}
        />
      </div>
      <div className="dimension-pills">
        {dimensions.map((d, i) => (
          <div
            key={d.id}
            className={
              "dimension-pill" +
              (i < currentIndex ? " is-done" : i === currentIndex ? " is-current" : "")
            }
            title={d.name}
          />
        ))}
      </div>
    </div>
  );
}
