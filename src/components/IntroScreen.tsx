interface Props {
  onContinue: () => void;
}

export function IntroScreen({ onContinue }: Props) {
  return (
    <div className="card">
      <div className="eyebrow">Interoperability Maturity Self-Assessment</div>
      <h1>Welcome to the Semantic Interoperability Roadmap</h1>
      <div className="consent-text">
        <p>
          This self-assessment supports a research project at Cranfield University
          investigating how organisations can improve their interoperability, the
          ability of systems like PLM, ERP, and MES to share data with shared
          meaning, not just shared connectivity.
        </p>
        <p>
          It forms part of a Design Science Research study developing a maturity
          framework and roadmap that organisations can use to identify where they
          currently stand and what to prioritise next as they embark on their
          digital journey.
        </p>
        <p>
          Your responses, combined with others', help validate whether this
          framework holds up across different organisations and industries.
        </p>
        <p style={{ marginBottom: 0 }}>
          Participation is voluntary and anonymous: no personal or identifying
          information is collected, and you may stop at any point without giving a
          reason. Your responses are used solely for academic research, in line
          with the UK Data Protection Act 2018. Completing the assessment takes
          around 15–20 minutes and ends with a personalised summary of your
          results. By continuing, you confirm that you understand this and consent
          to take part.
        </p>
      </div>
      <div className="actions-row">
        <button className="btn btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
