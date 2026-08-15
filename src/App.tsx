import { useEffect, useMemo, useState } from "react";
import "./App.css";

import assessmentDataRaw from "./data/assessment-data.json";
import roadmapDataRaw from "./data/roadmap-data.json";
import type {
  AssessmentAnswers,
  AssessmentData,
  BusinessContext,
  RoadmapData,
  SubmissionPayload,
  TargetsByDimension,
  ValidationAnswers,
  WordingVariant,
} from "./types";
import { DIMENSION_ORDER, EMPTY_BUSINESS_CONTEXT, EMPTY_VALIDATION } from "./types";
import { computeScores } from "./lib/scoring";
import { submitAssessment, sendResultsEmail } from "./lib/api";

import { IntroScreen } from "./components/IntroScreen";
import { VideoScreen } from "./components/VideoScreen";
import { BusinessContextScreen } from "./components/BusinessContextScreen";
import { AssessmentFlow } from "./components/AssessmentFlow";
import { ResultsScreen } from "./components/ResultsScreen";
import { EmailOptInScreen } from "./components/EmailOptInScreen";
import { ValidationScreen } from "./components/ValidationScreen";
import { ThankYouScreen } from "./components/ThankYouScreen";

const assessmentData = assessmentDataRaw as AssessmentData;
const roadmapData = roadmapDataRaw as RoadmapData;

// Keep dimensions in the sequence mandated by the brief, regardless of JSON order.
const dimensions = DIMENSION_ORDER.map(
  (id) => assessmentData.dimensions.find((d) => d.id === id)!,
);

type Stage =
  | "intro"
  | "video"
  | "businessContext"
  | "assessment"
  | "results"
  | "email"
  | "validation"
  | "thankyou";

function newResponseId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `resp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const [responseId] = useState(newResponseId);
  const [consent, setConsent] = useState(false);
  const [businessContext, setBusinessContext] = useState<BusinessContext>(
    EMPTY_BUSINESS_CONTEXT,
  );
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [targets, setTargets] = useState<TargetsByDimension>(
    {} as TargetsByDimension,
  );
  const [validation, setValidation] = useState<ValidationAnswers>(EMPTY_VALIDATION);
  const [wordingVariant, setWordingVariant] = useState<WordingVariant>("plainEnglish");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const scores = useMemo(() => computeScores(dimensions, answers), [answers]);

  // Single-page app, no routing -- each "screen" is really the same page
  // re-rendering, so the browser has no reason to reset scroll on its own.
  // Without this, navigating on from partway down a long screen (e.g. the
  // results page) leaves the next screen scrolled to the same position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  const buildPayload = (includeValidation: boolean): SubmissionPayload => {
    const goals = {} as SubmissionPayload["goals"];
    for (const dim of dimensions) {
      const t = targets[dim.id];
      goals[`${dim.id}_shortTerm`] = t.shortTerm;
      goals[`${dim.id}_longTerm`] = t.longTerm;
    }
    const scoreRecord = {} as SubmissionPayload["scores"];
    for (const dim of dimensions) {
      scoreRecord[dim.id] = scores.byDimension[dim.id].average;
    }
    scoreRecord.overall = scores.overall;

    return {
      responseId,
      timestamp: new Date().toISOString(),
      consent,
      wordingVariant,
      businessContext,
      assessment: answers,
      scores: scoreRecord,
      goals,
      validation: includeValidation ? validation : null,
    };
  };

  const handleConsent = () => {
    setConsent(true);
    setStage("video");
  };

  const handleAssessmentComplete = async () => {
    setStage("results");
    try {
      await submitAssessment(buildPayload(false));
    } catch (err) {
      console.error("Failed to submit assessment", err);
      setSubmitError(
        "We couldn't save your results to the server just now, but you can still view them below.",
      );
    }
  };

  const handleSendEmail = async (email: string) => {
    await sendResultsEmail(email, buildPayload(false));
    setStage("validation");
  };

  const handleValidationSubmit = async () => {
    try {
      await submitAssessment(buildPayload(true));
    } catch (err) {
      console.error("Failed to submit validation feedback", err);
    }
    setStage("thankyou");
  };

  return (
    <div className="page">
      {stage === "intro" && <IntroScreen onContinue={handleConsent} />}

      {stage === "video" && <VideoScreen onContinue={() => setStage("businessContext")} />}

      {stage === "businessContext" && (
        <BusinessContextScreen
          value={businessContext}
          onChange={setBusinessContext}
          wordingVariant={wordingVariant}
          onWordingVariantChange={setWordingVariant}
          onNext={() => setStage("assessment")}
        />
      )}

      {stage === "assessment" && (
        <AssessmentFlow
          dimensions={dimensions}
          answers={answers}
          setAnswers={setAnswers}
          targets={targets}
          setTargets={setTargets}
          wordingVariant={wordingVariant}
          onAllComplete={handleAssessmentComplete}
        />
      )}

      {stage === "results" && (
        <>
          {submitError && (
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="error-text" style={{ margin: 0 }}>
                {submitError}
              </p>
            </div>
          )}
          <ResultsScreen
            dimensions={dimensions}
            answers={answers}
            targets={targets}
            scores={scores}
            roadmap={roadmapData}
            wordingVariant={wordingVariant}
            onContinue={() => setStage("email")}
          />
        </>
      )}

      {stage === "email" && (
        <EmailOptInScreen
          onSendAndContinue={handleSendEmail}
          onContinueWithoutEmail={() => setStage("validation")}
        />
      )}

      {stage === "validation" && (
        <ValidationScreen
          value={validation}
          onChange={setValidation}
          onSubmit={handleValidationSubmit}
          onSkip={() => setStage("thankyou")}
        />
      )}

      {stage === "thankyou" && <ThankYouScreen />}
    </div>
  );
}
