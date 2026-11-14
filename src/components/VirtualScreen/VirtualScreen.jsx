import React, { useState, useRef, useEffect, useCallback } from "react";
import { SERVER_URL } from "../../serverRequests/ServerRequests";

export default function VirtualScreen({
  mirror,
  activeContent,
  contentList = [],
  currentIndex = 0,
  playbackState = "playing",
  isOnline = true,
  onSelectSlide,
  onStartPresentation,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [internalIndex, setInternalIndex] = useState(currentIndex);
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
  const screenTitle = mirror?.mirror_name || "Mirror Display Screen";
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

  const handlePrevSlide = useCallback((isAuto = false) => {
    if (totalCount === 0) return;
    const prevIdx = (internalIndex - 1 + totalCount) % totalCount;
    if (onSelectSlide) {
      onSelectSlide(prevIdx, playableList[prevIdx]?._id, isAuto);
    }
  }, [totalCount, internalIndex, onSelectSlide, playableList]);

  const handleNextSlide = useCallback((isAuto = false) => {
    if (totalCount === 0) return;
    const nextIdx = (internalIndex + 1) % totalCount;
    if (onSelectSlide) {
      onSelectSlide(nextIdx, playableList[nextIdx]?._id, isAuto);
    }
  }, [totalCount, internalIndex, onSelectSlide, playableList]);

  // Explicitly pause/play HTML5 video element when playbackState changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, resolvedContent]);

  useEffect(() => {
    if (fullscreenVideoRef.current) {
      if (isPaused) {
        fullscreenVideoRef.current.pause();
      } else {
        fullscreenVideoRef.current.play().catch(() => {});
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

  // Automatically start mirror presentation session on mount
  useEffect(() => {
    if (mirror?.mirror_name || mirror?.mirror_id) {
      startPresentationSession();
    }
  }, [mirror?.mirror_name, mirror?.mirror_id]);

  return (
    <>
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Virtual Screen Card Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Default Virtual Mirror ({orientation})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-sm sm:text-base font-bold text-black truncate">
                {screenTitle}
              </h3>
              <span className="text-[10px] font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded font-bold shrink-0">
                {displayResolution}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-neutral-700 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Expand virtual screen to full view"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="hidden sm:inline">Maximize</span>
            </button>
          </div>
        </div>

        {/* Physical TV / Monitor Frame */}
        <div className="bg-[#111111] border border-[#262626] rounded-2xl p-2.5 sm:p-3 shadow-xl relative overflow-hidden flex flex-col items-center">
          {/* Subtle Screen Bezel Reflection */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

          {/* Screen Display Container styled to mirror's native aspect ratio (Width / Height) */}
          <div
            style={{
              aspectRatio: `${mirrorW} / ${mirrorH}`,
              maxHeight: isPortrait ? "520px" : "360px",
            }}
            className="w-full bg-black rounded-xl relative overflow-hidden flex items-center justify-center select-none shadow-inner border border-black/60 mx-auto"
          >
            {!mirrorActive ? (
              <div className="text-center p-6 flex flex-col items-center justify-center text-neutral-300 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </div>
                <h5 className="text-xs font-bold uppercase tracking-wider font-mono">Mirror inactive</h5>
                <p className="text-[11px] text-neutral-500 max-w-xs">Playback is stopped. Reactivate this mirror to resume MQTT content updates.</p>
              </div>
            ) : totalCount === 0 || !resolvedContent ? (
              /* Standby / No Media Screen */
              <div className="text-center p-6 flex flex-col items-center justify-center text-neutral-500 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">Standby • No Content</h5>
                <p className="text-[11px] text-neutral-500 max-w-xs">
                  Assign active media slides ({displayResolution}) to start broadcasting.
                </p>
              </div>
            ) : (
              <>
                {/* Active Media Renderer (Image or Video) */}
                {isVideoContent(resolvedContent) ? (
                  <video
                    ref={videoRef}
                    key={resolvedContent.content_url || resolvedContent._id}
                    src={resolvedContent.content_url}
                    autoPlay={!isPaused}
                    loop={totalCount === 1}
                    muted
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                ) : (
                  <img
                    key={resolvedContent.content_url || resolvedContent._id}
                    src={resolvedContent.content_url}
                    alt={resolvedContent.content_title || "Screen slide"}
                    className="w-full h-full object-cover bg-black"
                  />
                )}

                {/* Paused Floating Badge (keeps frozen frame clearly visible) */}
                {isPaused && (
                  <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center pointer-events-none z-10 animate-fadeIn">
                    <div className="px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-amber-500/60 shadow-xl flex items-center gap-2 text-amber-300">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                      <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-amber-200">
                        PAUSED ON MIRROR
                      </span>
                    </div>
                  </div>
                )}

                {/* Top Corner HUD Badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-20 pointer-events-none">
                  {/* Live Status Pill */}
                  <div className="pointer-events-auto">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-xs border ${
                      isPaused
                        ? "bg-black/75 text-amber-300 border-amber-500/30"
                        : "bg-black/75 text-emerald-400 border-emerald-500/30"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`}></span>
                      <span>{isPaused ? "DEFAULT MIRROR (PAUSED)" : "DEFAULT MIRROR (LIVE)"}</span>
                    </span>
                  </div>

                  {/* Sequence Count and Format Pill */}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/75 backdrop-blur-md text-white border border-white/15 shadow-xs">
                    {currentIndex + 1} / {totalCount} • {resolvedContent.content_format?.toUpperCase() || "IMG"}
                    {resolvedContent.content_format?.toLowerCase() !== "mp4" && (
                      <span className="text-neutral-300 ml-1">({resolvedContent.duration || mirror?.photo_duration || 5}s)</span>
                    )}
                  </span>
                </div>

                {/* Bottom Overlay Info Banner */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 flex items-end justify-between gap-3 text-white z-20 pointer-events-none">
                  <div className="min-w-0 pointer-events-auto">
                    <p className="text-xs font-bold truncate text-white drop-shadow-xs">
                      {resolvedContent.content_title || "Untitled Slide"}
                    </p>
                    {resolvedContent.content_description && (
                      <p className="text-[10px] text-neutral-300 truncate max-w-sm drop-shadow-xs">
                        {resolvedContent.content_description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0 font-medium">
                    {displayResolution}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Bezel Bottom Chin */}
          <div className="pt-2 px-1 w-full flex items-center justify-between text-[9px] font-mono tracking-widest text-neutral-400 uppercase select-none">
            <span className="truncate">MirrorLink Screen • {orientation}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span>{displayResolution} • {resolvedContent?.duration || mirror?.photo_duration || 5}s</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            </div>
          </div>
        </div>

        {/* Mirror Stream Broadcast Status & Direct Viewer URL */}
        <div className="bg-neutral-50/90 border border-neutral-200/90 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
              <span className="text-[11px] font-bold text-black uppercase tracking-wider">
                Live Stream Broadcast
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
              isPaused
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}>
              {isPaused ? "PAUSED" : "RUNNING LIVE"}
            </span>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Stream / Mirror Name
              </span>
              <p className="text-xs font-mono font-bold text-black truncate mt-0.5">
                {screenTitle}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Resolution
              </span>
              <p className="text-xs font-mono font-medium text-neutral-700 mt-0.5">
                {displayResolution}
              </p>
            </div>
          </div>

        </div>

        {/* Screen Controller Toolbar */}
        <div className="space-y-3 pt-1">
          {/* Quick Step Buttons and Slide Counter */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevSlide}
                disabled={totalCount <= 1}
                className="p-2 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                title="Preview previous slide"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                disabled={totalCount <= 1}
                className="p-2 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                title="Preview next slide"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <span className="text-xs font-mono font-medium text-neutral-600 ml-1">
                Slide {totalCount > 0 ? currentIndex + 1 : 0} of {totalCount}
              </span>
            </div>
          </div>

          {/* Quick Slide Navigation Dots / Pills */}
          {totalCount > 1 && (
            <div className="pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {playableList.map((item, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={item._id || idx}
                      type="button"
                      onClick={() => onSelectSlide && onSelectSlide(idx, item._id)}
                      className={`h-7 px-2.5 rounded-md text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? "bg-black text-white shadow-xs"
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200"
                      }`}
                      title={`Jump virtual screen to #${idx + 1}: ${item.content_title || 'Media'}`}
                    >
                      <span>#{idx + 1}</span>
                      <span className="text-[10px] font-normal truncate max-w-[80px]">
                        {item.content_format?.toUpperCase() || 'IMG'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-fadeIn">
          <div className="flex items-center justify-between text-white pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <h4 className="text-base font-bold text-white tracking-tight">{screenTitle}</h4>
                <span className="text-xs font-mono text-neutral-400">({displayResolution})</span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Always-active default virtual mirror broadcast simulation
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-300">
                Slide {currentIndex + 1} of {totalCount}
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close (Esc) ✕
              </button>
            </div>
          </div>

          {/* Fullscreen Video / Image Viewport matching Mirror Dimensions */}
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
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={resolvedContent.content_url}
                    alt={resolvedContent.content_title}
                    className="w-full h-full object-cover"
                  />
                )
              )}

              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/30">
                  <div className="px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-md border border-amber-500/60 text-amber-300 font-mono font-bold text-xs shadow-2xl flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    <span>PAUSED ON SCREEN</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fullscreen Footer Navigation Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-white">
            <button
              onClick={handlePrevSlide}
              disabled={totalCount <= 1}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-30"
            >
              ◀ Previous Slide
            </button>
            <div className="text-center text-xs text-neutral-400">
              <span className="font-semibold text-white">{resolvedContent?.content_title}</span>
              {resolvedContent?.content_description && ` — ${resolvedContent.content_description}`}
            </div>
            <button
              onClick={handleNextSlide}
              disabled={totalCount <= 1}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-30"
            >
              Next Slide ▶
            </button>
          </div>
        </div>
      )}
    </>
  );
}
