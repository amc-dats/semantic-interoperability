interface Props {
  onContinue: () => void;
}

// Set VITE_VIDEO_URL once the video is exported and hosted on Azure Blob
// Storage (see README) to embed it here without further code changes.
const VIDEO_URL = import.meta.env.VITE_VIDEO_URL;

export function VideoScreen({ onContinue }: Props) {
  return (
    <div className="card">
      <div className="eyebrow">Introduction</div>
      <h1>A short introduction</h1>
      {VIDEO_URL ? (
        <div className="video-wrap">
          <video src={VIDEO_URL} controls preload="metadata" />
        </div>
      ) : (
        <div className="video-wrap">
          <div className="video-placeholder">
            <strong>Video coming soon</strong>
            This prototype doesn't have the introduction video wired up yet — it
            will play here once it's exported and hosted. You can continue to the
            assessment in the meantime.
          </div>
        </div>
      )}
      <div className="actions-row">
        <button className="btn btn-primary" onClick={onContinue}>
          {VIDEO_URL ? "Continue" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
