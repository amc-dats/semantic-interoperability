interface Props {
  onContinue: () => void;
}

// Set VITE_VIDEO_URL once the video is exported and hosted on Azure Blob
// Storage (see README) to embed it here without further code changes.
const VIDEO_URL = import.meta.env.VITE_VIDEO_URL;

const DEFAULT_PLAYBACK_RATE = 1.2;

// Defaulting playback speed isn't a plain HTML attribute -- set both
// properties on the element directly once it mounts (defaultPlaybackRate
// for the rate a fresh play() starts at, playbackRate so it's already in
// effect even before the respondent presses play).
function setDefaultPlaybackRate(video: HTMLVideoElement | null) {
  if (!video) return;
  video.defaultPlaybackRate = DEFAULT_PLAYBACK_RATE;
  video.playbackRate = DEFAULT_PLAYBACK_RATE;
}

export function VideoScreen({ onContinue }: Props) {
  return (
    <div className="card">
      <div className="eyebrow">Introduction</div>
      <h1>A short introduction</h1>
      {VIDEO_URL ? (
        <div className="video-wrap">
          <video ref={setDefaultPlaybackRate} src={VIDEO_URL} controls preload="metadata" />
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
