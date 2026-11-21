import React, { useState, useRef, useEffect } from "react";
import { SERVER_URL } from "../../serverRequests/ServerRequests";

export default function VirtualScreen({
  mirror,
  activeContent,
  contentList = [],
  currentIndex = 0,
  playbackState = "playing",
  isOnline = true,
  isLiveSyncEnabled = false,
  transitions = [],
  onToggleLiveSync,
  onSelectSlide,
  onTogglePlayPause,
  onStartPresentation,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalIndex, setInternalIndex] = useState(currentIndex);
  const [activeTransitionClass, setActiveTransitionClass] = useState("");
  const prevContentIdRef = useRef(null);
  const videoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

  // Filter out any disabled contents so only active broadcast items are displayed
  const playableList = (contentList || []).filter((item) => item.is_active !== false);
  const totalCount = playableList.length;
  const mirrorActive = mirror?.is_active !== false;
  const isPaused = playbackState === "paused";
  const mirrorW = Number(mirror?.mirror_width) || 1920;
  const mirrorH = Number(mirror?.mirror_height) || 1080;
  const isPortrait = mirrorH > mirrorW;
  const isSquare = mirrorW === mirrorH;
  const orientation = isPortrait ? "Portrait" : (isSquare ? "Square" : "Landscape");
  const displayResolution = `${mirrorW} × ${mirrorH} px`;
  const screenTitle = mirror?.mirror_name || "Program Monitor";
  const isVideoContent = (item) => {
    const format = String(item?.content_format || "").toLowerCase();
    const url = String(item?.content_url || "").toLowerCase().split("?")[0];
    return format.includes("video") || ["mp4", "m4v", "mov", "webm", "ogg", "mkv", "avi"].includes(format) ||
      /\.(mp4|m4v|mov|webm|ogg|mkv|avi)$/.test(url);
  };

  // Sync internal index when parent currentIndex changes externally
  useEffect(() => {
    setInternalIndex(currentIndex);
  }, [currentIndex]);

  // Ensure current display content is an active content
  const resolvedContent = (playableList && playableList.length > 0)
    ? (playableList[internalIndex] || playableList[0])
    : null;

  // Trigger transition effect when slide advances if a transition rule exists
  useEffect(() => {
    const currentId = resolvedContent?._id;
    const prevId = prevContentIdRef.current;
    if (prevId && currentId && prevId !== currentId) {
      const match = (transitions || []).find(
        (t) => String(t.left_content_id) === String(prevId) && String(t.right_content_id) === String(currentId)
      );
      if (match && match.transition_id && match.transition_id !== 'none') {
        const effect = match.transition_id; // 'fade' | 'slide' | 'zoom'
        setActiveTransitionClass(`sp-anim-${effect}`);
        const timer = setTimeout(() => {
          setActiveTransitionClass("");
        }, 650);
        prevContentIdRef.current = currentId;
        return () => clearTimeout(timer);
      }
    }
    prevContentIdRef.current = currentId;
  }, [resolvedContent?._id, transitions]);


  // Explicitly pause/play HTML5 video element when playbackState changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => { });
      }
    }
  }, [isPaused, resolvedContent]);

  useEffect(() => {
    if (fullscreenVideoRef.current) {
      if (isPaused) {
        fullscreenVideoRef.current.pause();
      } else {
        fullscreenVideoRef.current.play().catch(() => { });
      }
    }
  }, [isPaused, isFullscreen, resolvedContent]);

  const startPresentationSession = () => {
    const mName = mirror?.mirror_name || screenTitle || "";
    const mId = mirror?.mirror_id;

    fetch(`${SERVER_URL}Mirror`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "login",
        mirror_name: mName,
        mirror_id: mId,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not start virtual presentation");
        return res.json();
      })
      .then(() => {
        if (onStartPresentation) {
          onStartPresentation();
        }
      })
      .catch((err) => {
        console.warn("Virtual presentation session could not start:", err);
      });
  };

  // Only connect/start live presentation session when explicitly enabled by user
  useEffect(() => {
    if (isLiveSyncEnabled && (mirror?.mirror_name || mirror?.mirror_id)) {
      startPresentationSession();
    }
  }, [isLiveSyncEnabled, mirror?.mirror_name, mirror?.mirror_id]);

  return (
    <>
      <div className="bg-white border border-neutral-200/90 rounded-xl p-3 shadow-2xs space-y-2 font-['Uber_Move_Text']">
        {/* Virtual Screen Header */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-1.5 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full shadow-xs ${
              isLiveSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'
            }`} />
            <h4 className="font-['Uber_Move'] font-bold uppercase tracking-wider text-black text-xs truncate">
              {screenTitle}
            </h4>
            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
              isLiveSyncEnabled
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
            }`}>
              {isLiveSyncEnabled ? 'Live Synced' : 'Local Preview'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Enable Live / Live Synced Button */}
            {onToggleLiveSync && (
              <button
                type="button"
                onClick={onToggleLiveSync}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  isLiveSyncEnabled
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
                title={
                  isLiveSyncEnabled
                    ? 'Live MQTT broadcast sync is ON. Click to disconnect.'
                    : 'Disconnected from MQTT. Click to enable live broadcast sync with physical mirrors.'
                }
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                  }`}
                />
                <span>{isLiveSyncEnabled ? 'Live Synced' : 'Enable Live'}</span>
              </button>
            )}

            <span className="hidden sm:inline font-mono text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-bold border border-neutral-200">
              {displayResolution} • {orientation}
            </span>

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-black rounded transition-colors cursor-pointer"
              title="Expand to Fullscreen Monitor"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Physical TV / Screen Frame */}
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-2 shadow-xl relative overflow-hidden flex flex-col items-center">
          {/* Screen Display Container styled strictly to mirror's native aspect ratio */}
          <div
            style={{
              aspectRatio: `${mirrorW} / ${mirrorH}`,
            }}
            className={`bg-black rounded-lg relative overflow-hidden flex items-center justify-center select-none shadow-inner border border-black/80 mx-auto ${
              isPortrait ? "h-[320px] w-auto max-w-full" : "w-full max-w-full"
            }`}
          >
            {!mirrorActive ? (
              <div className="text-center p-6 flex flex-col items-center justify-center text-neutral-300 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </div>
                <h5 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">Screen Inactive</h5>
                <p className="text-[11px] text-neutral-500 max-w-xs">Playback is paused. Reactivate this screen in the top toolbar to resume broadcasting.</p>
              </div>
            ) : totalCount === 0 || !resolvedContent ? (
              /* Standby / No Media Screen */
              <div className="text-center p-6 flex flex-col items-center justify-center text-neutral-500 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">No sequence media loaded</h5>
                <p className="text-[11px] text-neutral-500 max-w-xs">
                  Drag media from the Available Library onto the timeline below.
                </p>
              </div>
            ) : (
              <>
                {/* Lightweight CSS Transitions: Fade, Slide, Zoom */}
                <style>{`
                  @keyframes spAnimFade {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                  }
                  @keyframes spAnimSlide {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(0); }
                  }
                  @keyframes spAnimZoom {
                    0% { transform: scale(1.12); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  .sp-anim-fade {
                    animation: spAnimFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) both;
                  }
                  .sp-anim-slide {
                    animation: spAnimSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                  }
                  .sp-anim-zoom {
                    animation: spAnimZoom 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                  }
                `}</style>

                {/* Active Media Renderer in native resolution */}
                {isVideoContent(resolvedContent) ? (
                  <video
                    ref={videoRef}
                    key={resolvedContent.content_url || resolvedContent._id}
                    src={resolvedContent.content_url}
                    autoPlay={!isPaused}
                    loop={totalCount === 1}
                    muted
                    playsInline
                    className={`w-full h-full object-contain bg-black ${activeTransitionClass}`}
                  />
                ) : (
                  <img
                    key={resolvedContent.content_url || resolvedContent._id}
                    src={resolvedContent.content_url}
                    alt={resolvedContent.content_title || "Screen slide"}
                    className={`w-full h-full object-contain bg-black ${activeTransitionClass}`}
                  />
                )}

                {/* Paused Floating Watermark */}
                {isPaused && (
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-neutral-700 shadow-xl flex items-center gap-2 text-white">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                      <span className="text-[10px] font-mono tracking-widest uppercase font-bold">
                        PLAYHEAD PAUSED
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Overlay Resolution Tag */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 pt-5 flex items-end justify-between gap-3 text-white z-20 pointer-events-none">
                  <span className="text-[10px] font-mono font-bold text-neutral-300 truncate">
                    {resolvedContent?.content_title || `Slide #${internalIndex + 1}`}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0 font-medium">
                    {displayResolution}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Monitor View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fadeIn">
          <div className="flex items-center justify-between text-white pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white tracking-tight uppercase font-['Uber_Move']">
                Fullscreen Monitor: {screenTitle}
              </h4>
              <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                {displayResolution}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400">
                Slide {internalIndex + 1} of {totalCount}
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Close (Esc) ✕
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
            <div
              style={{
                aspectRatio: `${mirrorW} / ${mirrorH}`,
                maxHeight: "82vh",
                maxWidth: "100%",
              }}
              className="relative w-full h-full max-h-[82vh] bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center border border-neutral-800"
            >
              {resolvedContent && (
                isVideoContent(resolvedContent) ? (
                  <video
                    ref={fullscreenVideoRef}
                    key={resolvedContent.content_url || resolvedContent._id}
                    src={resolvedContent.content_url}
                    autoPlay={!isPaused}
                    loop={totalCount === 1}
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={resolvedContent.content_url}
                    alt={resolvedContent.content_title}
                    className="w-full h-full object-contain"
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
