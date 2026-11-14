import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * ImageCropperModal
 * Allows interactive cropping of any image to match a mirror's exact native resolution.
 * - Aspect ratio strictly locked to targetWidth / targetHeight
 * - Interactive pan & zoom (wheel, touch pinch, slider)
 * - 90-degree rotation support
 * - Preset alignments: Fill (Cover), Fit (Contain), Reset Center
 * - Rule-of-thirds grid overlay
 * - High-resolution Canvas export rendering at exact targetWidth x targetHeight px
 */
export default function ImageCropperModal({
  isOpen,
  onClose,
  imageFile,
  targetWidth = 1920,
  targetHeight = 1080,
  title = "Crop Image to Mirror Resolution",
  onCropComplete,
}) {
  const containerRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // Transform states
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [maxZoom, setMaxZoom] = useState(4);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Dragging interaction states
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });

  // Dimensions of the preview viewport and the crop box inside it
  const [containerSize, setContainerSize] = useState({ width: 500, height: 420 });
  const [isProcessing, setIsProcessing] = useState(false);

  const tWidth = Number(targetWidth) || 1920;
  const tHeight = Number(targetHeight) || 1080;
  const targetAspect = tWidth / tHeight;
  const isPortrait = tHeight > tWidth;
  const orientationLabel = isPortrait ? "Portrait" : (tWidth === tHeight ? "Square" : "Landscape");

  // Load image when file or prop changes
  useEffect(() => {
    if (!isOpen || !imageFile) {
      setImageSrc(null);
      setImageObj(null);
      setNaturalSize({ width: 0, height: 0 });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      return;
    }

    let objectUrl = "";
    if (typeof imageFile === "string") {
      objectUrl = imageFile;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImageObj(img);
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageSrc(objectUrl);
      };
      img.src = objectUrl;
    } else if (imageFile instanceof Blob || imageFile instanceof File) {
      objectUrl = URL.createObjectURL(imageFile);
      const img = new Image();
      img.onload = () => {
        setImageObj(img);
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageSrc(objectUrl);
      };
      img.src = objectUrl;
    }

    return () => {
      if (objectUrl && typeof imageFile !== "string") {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, imageFile]);

  // Update container size on resize or mount
  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(rect.width, 320),
          height: Math.max(rect.height, 360),
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isOpen]);

  // Compute crop box dimensions in preview coordinate system
  const padding = 28;
  const maxCropW = Math.max(containerSize.width - padding * 2, 100);
  const maxCropH = Math.max(containerSize.height - padding * 2, 100);

  let cropBoxW = maxCropW;
  let cropBoxH = cropBoxW / targetAspect;

  if (cropBoxH > maxCropH) {
    cropBoxH = maxCropH;
    cropBoxW = cropBoxH * targetAspect;
  }

  // Base scale calculation: image scale that covers the crop box at 1.0 zoom
  const computeBaseDimensions = useCallback(() => {
    if (!imageObj || !naturalSize.width || !naturalSize.height) {
      return { baseWidth: cropBoxW, baseHeight: cropBoxH, coverScale: 1 };
    }
    // Check if image is rotated 90 or 270 deg
    const isSwapped = rotation === 90 || rotation === 270;
    const effectiveImgW = isSwapped ? naturalSize.height : naturalSize.width;
    const effectiveImgH = isSwapped ? naturalSize.width : naturalSize.height;

    // Scale to cover the crop box completely
    const scaleW = cropBoxW / effectiveImgW;
    const scaleH = cropBoxH / effectiveImgH;
    const coverScale = Math.max(scaleW, scaleH);

    return {
      baseWidth: naturalSize.width * coverScale,
      baseHeight: naturalSize.height * coverScale,
      coverScale,
    };
  }, [imageObj, naturalSize, cropBoxW, cropBoxH, rotation]);

  // Reset to initial centered & covering state when image loads or rotation changes
  useEffect(() => {
    if (imageObj && naturalSize.width) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setMinZoom(0.3);
      setMaxZoom(4.0);
    }
  }, [imageObj, naturalSize, rotation]);

  // Mouse / Touch handlers for panning
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = { ...offset };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    setOffset({
      x: offsetStartRef.current.x + deltaX,
      y: offsetStartRef.current.y + deltaY,
    });
  };

  const handlePointerUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0015;
    setZoom((prev) => Math.min(Math.max(prev + zoomDelta, minZoom), maxZoom));
  };

  const rotateClockwise = () => {
    setRotation((prev) => (prev + 90) % 360);
    setOffset({ x: 0, y: 0 });
  };

  const fitContain = () => {
    if (!naturalSize.width) return;
    const isSwapped = rotation === 90 || rotation === 270;
    const effW = isSwapped ? naturalSize.height : naturalSize.width;
    const effH = isSwapped ? naturalSize.width : naturalSize.height;
    const scaleW = cropBoxW / effW;
    const scaleH = cropBoxH / effH;
    const containScale = Math.min(scaleW, scaleH);
    const { coverScale } = computeBaseDimensions();
    const relativeZoom = containScale / coverScale;
    setZoom(Math.max(relativeZoom, minZoom));
    setOffset({ x: 0, y: 0 });
  };

  const fitCover = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Perform final high-resolution crop onto Canvas
  const handleApplyCrop = () => {
    if (!imageObj || !naturalSize.width || !naturalSize.height) return;

    setIsProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = tWidth;
      canvas.height = tHeight;
      const ctx = canvas.getContext("2d");

      // Enable premium quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill with solid dark neutral in case user chose a contained crop with outer margin
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, tWidth, tHeight);

      // Ratio between target canvas and preview crop box
      const previewToCanvasRatio = tWidth / cropBoxW;
      const { baseWidth, baseHeight } = computeBaseDimensions();

      const canvasDrawW = baseWidth * zoom * previewToCanvasRatio;
      const canvasDrawH = baseHeight * zoom * previewToCanvasRatio;
      const canvasOffsetX = offset.x * previewToCanvasRatio;
      const canvasOffsetY = offset.y * previewToCanvasRatio;

      ctx.save();
      // Move to canvas center + pan offset
      ctx.translate(tWidth / 2 + canvasOffsetX, tHeight / 2 + canvasOffsetY);
      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw image centered at the translated coordinate
      ctx.drawImage(
        imageObj,
        -canvasDrawW / 2,
        -canvasDrawH / 2,
        canvasDrawW,
        canvasDrawH
      );
      ctx.restore();

      // Determine output mime type (preserve PNG if transparency, else standard high-quality JPEG)
      const mimeType = (imageFile && imageFile.type === "image/png") ? "image/png" : "image/jpeg";
      const quality = 0.95;

      canvas.toBlob((blob) => {
        setIsProcessing(false);
        if (!blob) {
          alert("Failed to render cropped image.");
          return;
        }

        const originalName = imageFile?.name || "cropped_content.jpg";
        const cleanBaseName = originalName.replace(/\.[^/.]+$/, "");
        const ext = mimeType === "image/png" ? ".png" : ".jpg";
        const newFileName = `${cleanBaseName}_${tWidth}x${tHeight}${ext}`;

        const croppedFile = new File([blob], newFileName, {
          type: mimeType,
          lastModified: Date.now(),
        });

        const newPreviewUrl = URL.createObjectURL(croppedFile);

        if (onCropComplete) {
          onCropComplete(croppedFile, newPreviewUrl, {
            width: tWidth,
            height: tHeight,
          });
        }
        onClose();
      }, mimeType, quality);
    } catch (err) {
      console.error("Canvas crop error:", err);
      setIsProcessing(false);
      alert("Error generating cropped image. Please try again.");
    }
  };

  if (!isOpen) return null;

  const { baseWidth, baseHeight } = computeBaseDimensions();
  const currentRenderW = baseWidth * zoom;
  const currentRenderH = baseHeight * zoom;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="bg-white text-neutral-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-black tracking-tight">
                {title}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Output size:</span>
              <strong className="text-neutral-800 font-mono bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                {tWidth} × {tHeight} px
              </strong>
              <span className="text-neutral-500 font-medium text-[11px]">({orientationLabel})</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Cancel crop"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewport Workspace */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="relative flex-1 bg-neutral-100 min-h-[360px] sm:min-h-[420px] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        >
          {/* Transforming Image */}
          {imageSrc && (
            <div
              className="absolute pointer-events-none transition-transform duration-75 ease-out will-change-transform"
              style={{
                width: `${currentRenderW}px`,
                height: `${currentRenderH}px`,
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={imageSrc}
                alt="Source preview"
                className="w-full h-full object-fill pointer-events-none select-none block"
                draggable={false}
              />
            </div>
          )}

          {/* Semi-transparent Dimming Backdrop around Crop Area */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.72)`,
              width: `${cropBoxW}px`,
              height: `${cropBoxH}px`,
              margin: "auto",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />

          {/* Active Crop Box Frame & Grid */}
          <div
            className="absolute pointer-events-none border-2 border-white/90 rounded-sm shadow-2xl"
            style={{
              width: `${cropBoxW}px`,
              height: `${cropBoxH}px`,
              margin: "auto",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            {/* Rule of Thirds Grid */}
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>

            {/* Corner Markers */}
            <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400" />

            {/* Center Target Indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 pointer-events-none" />

            {/* Resolution Badge at bottom corner of crop box */}
            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/20 select-none">
              {tWidth} × {tHeight}
            </div>
          </div>

          {/* Interactive Hint */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] text-neutral-300 pointer-events-none border border-neutral-700/50">
            Drag to reposition • Scroll or use slider to zoom
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 bg-white border-t border-neutral-200 space-y-3 shrink-0">
          {/* Zoom Slider and Transform Buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 flex-1 min-w-0 sm:min-w-[200px]">
              <span className="text-[11px] font-semibold text-neutral-500 shrink-0">Zoom</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.1, minZoom))}
                className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="Zoom out"
              >
                −
              </button>
              <input
                type="range"
                min={minZoom}
                max={maxZoom}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-black h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.1, maxZoom))}
                className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                title="Zoom in"
              >
                +
              </button>
              <span className="text-[11px] font-mono text-neutral-500 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fitCover}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium cursor-pointer transition-colors"
                title="Fill the entire crop area without black bars"
              >
                Fill
              </button>
              <button
                type="button"
                onClick={fitContain}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium cursor-pointer transition-colors"
                title="Fit full image inside the frame"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={rotateClockwise}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                title="Rotate 90 degrees clockwise"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Rotate 90°</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-500">
              Output: <span className="font-mono font-bold text-neutral-900">{tWidth} × {tHeight} px</span>
              {naturalSize.width > 0 && (
                <span className="text-neutral-400 ml-2">
                  (Source: {naturalSize.width} × {naturalSize.height} px)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing || !imageObj}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Apply Crop ({tWidth} × {tHeight})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
