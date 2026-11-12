import React, { useContext, useEffect, useRef, useState } from "react";
import { CookieContext } from "../../Contexts/CookieContext";
import { CREATE_CONTENT } from "../../serverRequests/ServerRequests";
import ImageCropperModal from "../ImageCropperModal/ImageCropperModal";

export default function AddContentModal({
  isOpen,
  onClose,
  mirrorId,
  mirrorName = "Mirror Display",
  mirrorWidth = 1920,
  mirrorHeight = 1080,
  onContentAdded,
}) {
  const { getCookie } = useContext(CookieContext);
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(5);
  const [fileDimensions, setFileDimensions] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [videoFitMode, setVideoFitMode] = useState("cover"); // "cover" (crop to fill) or "contain" (letterbox)
  const [videoAlignment, setVideoAlignment] = useState("center center");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const targetWidth = Number(mirrorWidth) || 1920;
  const targetHeight = Number(mirrorHeight) || 1080;
  const isPortrait = targetHeight > targetWidth;
  const orientationText = isPortrait
    ? "Portrait (Vertical)"
    : targetWidth === targetHeight
    ? "Square"
    : "Landscape (Horizontal)";

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setFile(null);
      setOriginalFile(null);
      setPreviewUrl("");
      setDuration(5);
      setFileDimensions(null);
      setIsCropperOpen(false);
      setVideoFitMode("cover");
      setVideoAlignment("center center");
      setIsSubmitting(false);
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMessage("");

    // Auto-fill title from filename if empty
    if (!title) {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(baseName);
    }

    const fileUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(fileUrl);

    // Detect file resolution
    if (selectedFile.type.startsWith("image/")) {
      setOriginalFile(selectedFile);
      const img = new Image();
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        setFileDimensions(dims);
        if (dims.width !== targetWidth || dims.height !== targetHeight) {
          // Open image cropper automatically so user can crop to mirror size
          setIsCropperOpen(true);
        }
      };
      img.src = fileUrl;
    } else if (selectedFile.type.startsWith("video/")) {
      setOriginalFile(null);
      const video = document.createElement("video");
      video.onloadedmetadata = () => {
        setFileDimensions({ width: video.videoWidth, height: video.videoHeight });
      };
      video.src = fileUrl;
    } else {
      setOriginalFile(null);
      setFileDimensions(null);
    }
  };

  const handleCropComplete = (croppedFile, newPreviewUrl, dims) => {
    setFile(croppedFile);
    setPreviewUrl(newPreviewUrl);
    setFileDimensions(dims);
    setErrorMessage("");
  };

  const onSelectFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const isExactMatch =
    fileDimensions &&
    fileDimensions.width === targetWidth &&
    fileDimensions.height === targetHeight;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a content title.");
      return;
    }
    if (!file) {
      setErrorMessage("Please select an image or MP4 video file to upload.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    // Strict exact dimensions check only applies to images; videos auto-fit and use video output preview
    if (isImage && fileDimensions && !isExactMatch) {
      setErrorMessage(
        `Uploaded image dimensions (${fileDimensions.width} × ${fileDimensions.height} px) do not match mirror resolution (${targetWidth} × ${targetHeight} px). Please use the image cropper.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    const loginKey = getCookie("login_key") || "adminpassword";

    const uploadW = isVideo ? targetWidth : (fileDimensions ? fileDimensions.width : targetWidth);
    const uploadH = isVideo ? targetHeight : (fileDimensions ? fileDimensions.height : targetHeight);

    CREATE_CONTENT(
      loginKey,
      title.trim(),
      description.trim(),
      file,
      mirrorId,
      duration,
      uploadW,
      uploadH
    )
      .then(() => {
        setIsSubmitting(false);
        if (onContentAdded) onContentAdded(title.trim());
        onClose();
      })
      .catch((err) => {
        console.error("Upload to mirror error:", err);
        setErrorMessage(
          err.message || "Failed to upload content to mirror. Supported formats: JPG, PNG, WEBP, MP4."
        );
        setIsSubmitting(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg font-bold text-black tracking-tight">
                Add Content to Mirror
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              Target mirror: <strong className="text-neutral-800">{mirrorName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {/* Mirror Resolution Warning Banner */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                <span>Display Resolution Notice:</span>
                <span className="font-mono bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-md font-bold text-[11px]">
                  {targetWidth} × {targetHeight} px
                </span>
                <span className="text-[11px] font-medium text-amber-800">({orientationText})</span>
              </div>
              <p className="text-amber-900/80 leading-relaxed text-[11px]">
                Please upload media formatted in this mirror's native resolution (<strong>{targetWidth} × {targetHeight}</strong>). Media with different aspect ratios or lower resolution will be fitted to screen and may appear stretched, cropped, or letterboxed.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Media File Upload Area */}
          <div>
            <label className="block text-xs font-bold text-black mb-1.5">
              Select Media File <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-black bg-neutral-100"
                  : "border-neutral-300 hover:border-black bg-neutral-50/80 hover:bg-neutral-100/70"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.mp4"
                onChange={onSelectFileInput}
                className="hidden"
              />

              {file ? (
                <div className="w-full flex flex-col items-center gap-3">
                  {/* File preview */}
                  {file.type.startsWith("image/") ? (
                    <div className="relative max-h-44 max-w-full rounded-xl overflow-hidden border border-neutral-200 shadow-2xs">
                      <img src={previewUrl} alt="Preview" className="max-h-44 object-contain mx-auto" />
                    </div>
                  ) : (
                    /* Video Output Preview shaped to mirror dimensions (Portrait / Landscape) */
                    <div className="w-full flex flex-col items-center gap-2.5">
                      <div className="flex items-center justify-between w-full max-w-sm px-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-black">
                            {isPortrait ? "Portrait Video Crop Preview" : "Video Screen Output Preview"}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                          {targetWidth} × {targetHeight} px
                        </span>
                      </div>

                      {/* Simulated Display Screen Bezel matching mirror aspect ratio */}
                      <div
                        className="relative rounded-2xl overflow-hidden bg-black border-4 border-neutral-900 shadow-xl flex items-center justify-center transition-all duration-200"
                        style={
                          isPortrait
                            ? {
                                height: "320px",
                                width: `${Math.max(140, Math.round(320 * (targetWidth / targetHeight)))}px`,
                                maxWidth: "100%",
                              }
                            : {
                                width: "100%",
                                maxWidth: "380px",
                                aspectRatio: `${targetWidth} / ${targetHeight}`,
                                maxHeight: "220px",
                              }
                        }
                      >
                        {/* Display Top Bezel Chin */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-neutral-800 rounded-full z-20 pointer-events-none opacity-60" />

                        {/* Video Element Cropped into Screen Dimensions */}
                        <video
                          src={previewUrl}
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                          className={`w-full h-full ${
                            videoFitMode === "contain" ? "object-contain" : "object-cover"
                          } bg-black block`}
                          style={{
                            objectPosition: videoAlignment,
                          }}
                        />

                        {/* Live Crop Badge Overlay */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-1 rounded-md z-20 flex items-center justify-between pointer-events-none border border-white/10">
                          <span className="truncate">
                            {videoFitMode === "contain" ? "Letterbox Fit" : (isPortrait ? "Portrait Cropped" : "Full Screen Crop")}
                          </span>
                          <span className="shrink-0">{targetWidth} × {targetHeight}</span>
                        </div>
                      </div>

                      {/* Video Crop Controls: Crop to Fill vs Letterbox Fit & Positioning */}
                      <div className="flex items-center justify-center gap-2 flex-wrap text-xs pt-0.5">
                        <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                          <button
                            type="button"
                            onClick={() => setVideoFitMode("cover")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                              videoFitMode === "cover"
                                ? "bg-black text-white shadow-2xs"
                                : "text-neutral-600 hover:text-black"
                            }`}
                          >
                            Crop to Fill {isPortrait ? "Portrait" : "Screen"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setVideoFitMode("contain")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                              videoFitMode === "contain"
                                ? "bg-black text-white shadow-2xs"
                                : "text-neutral-600 hover:text-black"
                            }`}
                          >
                            Fit (Letterbox)
                          </button>
                        </div>

                        {videoFitMode === "cover" && (
                          <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                            {isPortrait ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setVideoAlignment("left center")}
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    videoAlignment === "left center"
                                      ? "bg-white text-black shadow-2xs font-bold"
                                      : "text-neutral-500 hover:text-black"
                                  }`}
                                  title="Align video crop to left side"
                                >
                                  Left
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVideoAlignment("center center")}
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    videoAlignment === "center center"
                                      ? "bg-white text-black shadow-2xs font-bold"
                                      : "text-neutral-500 hover:text-black"
                                  }`}
                                  title="Align video crop to center"
                                >
                                  Center
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVideoAlignment("right center")}
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    videoAlignment === "right center"
                                      ? "bg-white text-black shadow-2xs font-bold"
                                      : "text-neutral-500 hover:text-black"
                                  }`}
                                  title="Align video crop to right side"
                                >
                                  Right
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setVideoAlignment("center top")}
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    videoAlignment === "center top"
                                      ? "bg-white text-black shadow-2xs font-bold"
                                      : "text-neutral-500 hover:text-black"
                                  }`}
                                  title="Align video crop to top"
                                >
                                  Top
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVideoAlignment("center center")}
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    videoAlignment === "center center"
                                      ? "bg-white text-black shadow-2xs font-bold"
                                      : "text-neutral-500 hover:text-black"
                                  }`}
                                  title="Align video crop to center"
                                >
                                  Center
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVideoAlignment("center bottom")}
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                    videoAlignment === "center bottom"
                                      ? "bg-white text-black shadow-2xs font-bold"
                                      : "text-neutral-500 hover:text-black"
                                  }`}
                                  title="Align video crop to bottom"
                                >
                                  Bottom
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xs font-bold text-black truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                    </p>
                  </div>

                  {/* Resolution Comparison Badge & Cropper Trigger */}
                  {file.type.startsWith("image/") ? (
                    fileDimensions && (
                      isExactMatch ? (
                        <div className="w-full flex items-center justify-between gap-2 flex-wrap bg-emerald-50 border border-emerald-300 rounded-xl p-2.5">
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Verified: {fileDimensions.width} × {fileDimensions.height} px matches mirror dimensions</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCropperOpen(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-neutral-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Adjust Crop</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-left space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>Resolution Mismatch ({fileDimensions.width} × {fileDimensions.height} px)</span>
                            </div>
                            <span className="text-[10px] font-mono text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-bold">
                              Target: {targetWidth} × {targetHeight} px
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900/90 leading-normal">
                            This mirror strictly requires <strong>{targetWidth} × {targetHeight} px</strong>. Crop this image to the exact mirror dimensions below.
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsCropperOpen(true);
                            }}
                            className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                          >
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Crop Image to Mirror Size ({targetWidth} × {targetHeight} px)</span>
                          </button>
                        </div>
                      )
                    )
                  ) : (
                    /* Video output ready banner (No crop required) */
                    <div className="w-full p-3 rounded-2xl bg-neutral-900 text-white border border-neutral-800 text-left flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <div className="text-xs space-y-0.5 flex-1 min-w-0">
                        <div className="font-bold text-white flex items-center justify-between gap-2 flex-wrap">
                          <span>Video Output Ready</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                            Auto Fit • No Crop Needed
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-normal">
                          Videos stream natively in their original aspect ratio and automatically scale to fit the <strong>{targetWidth} × {targetHeight} px</strong> display.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreviewUrl("");
                      setFileDimensions(null);
                    }}
                    className="text-[11px] text-neutral-500 hover:text-red-600 underline cursor-pointer"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-200 text-black flex items-center justify-center mb-2.5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-black">
                    Drag and drop your file here, or <span className="underline">browse</span>
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Supports JPG, PNG, WEBP, and MP4 up to 50MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-black mb-1.5">
              Content Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Promo, Main Banner"
              className="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-bold text-black mb-1.5">
              Description <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief note or campaign tag for this media..."
              className="w-full px-3.5 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors resize-none"
            />
          </div>

          {/* Time to Stay (Duration) - for Images */}
          {(!file || !file.type.startsWith("video/")) && (
            <div>
              <label className="block text-xs font-bold text-black mb-1.5">
                Time to Stay on Screen
              </label>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium">
                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-neutral-500">Duration:</span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="bg-transparent font-bold text-black outline-none cursor-pointer pr-1"
                  >
                    <option value={2}>2 seconds (Fast)</option>
                    <option value={3}>3 seconds</option>
                    <option value={4}>4 seconds</option>
                    <option value={5}>5 seconds (Default)</option>
                    <option value={7}>7 seconds</option>
                    <option value={8}>8 seconds</option>
                    <option value={10}>10 seconds</option>
                    <option value={15}>15 seconds</option>
                    <option value={20}>20 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={45}>45 seconds</option>
                    <option value={60}>60 seconds (1 min)</option>
                  </select>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Time this slide displays before transitioning to the next item
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {fileDimensions && !isExactMatch && file?.type.startsWith("image/") ? (
              <button
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 bg-black hover:bg-neutral-800 text-white cursor-pointer transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Crop Image to Mirror Size</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || (file?.type.startsWith("image/") && fileDimensions && !isExactMatch)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors bg-black hover:bg-neutral-800 disabled:opacity-50 text-white cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Uploading to Mirror...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{file?.type.startsWith("video/") ? "Add Video to Mirror" : "Add to Mirror"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Interactive Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageFile={originalFile || file}
        targetWidth={targetWidth}
        targetHeight={targetHeight}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

