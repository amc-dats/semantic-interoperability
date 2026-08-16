import { useRef } from "react";

interface Props {
  onContinue: () => void;
}

// Set VITE_VIDEO_URL once the video is exported and hosted on Azure Blob
// Storage (see README) to embed it here without further code changes.
const VIDEO_URL = import.meta.env.VITE_VIDEO_URL;

const DEFAULT_PLAYBACK_RATE = 1.2;

type FullscreenCapableVideo = HTMLVideoElement & {
  webkitRequestFullscreen?: () => void;
  webkitEnterFullscreen?: () => void; // iOS Safari: only the <video> element itself supports this
};

// Browsers only allow requestFullscreen() (and unmuted autoplay) as a
// direct response to a user gesture -- there's no way to default to
// fullscreen without one. This is the practical equivalent: a single
// click that unmutes, plays, and enters fullscreen together.
function playFullscreenWithSound(video: HTMLVideoElement | null) {
  if (!video) return;
  video.muted = false;
  void video.play();
  const el = video as FullscreenCapableVideo;
  if (video.requestFullscreen) {
    void video.requestFullscreen();
  } else if (el.webkitEnterFullscreen) {
    el.webkitEnterFullscreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  }
}

export function VideoScreen({ onContinue }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className="card">
      <div className="eyebrow">Introduction</div>
      <h1>A short introduction</h1>
      {VIDEO_URL ? (
        <div className="video-wrap">
          <video
            ref={(video) => {
              videoRef.current = video;
              if (video) {
                video.defaultPlaybackRate = DEFAULT_PLAYBACK_RATE;
                video.playbackRate = DEFAULT_PLAYBACK_RATE;
              }
            }}
            src={VIDEO_URL}
            controls
            preload="metadata"
            autoPlay
            muted
            playsInline
          >
            <track
              kind="captions"
              src={`${import.meta.env.BASE_URL}captions/intro.vtt`}
              srcLang="en"
              label="English"
              default
            />
          </video>
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
        {VIDEO_URL && (
          <button
            className="btn btn-secondary"
            onClick={() => playFullscreenWithSound(videoRef.current)}
          >
            Watch in fullscreen
          </button>
        )}
        <button className="btn btn-primary" onClick={onContinue}>
          {VIDEO_URL ? "Continue" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
