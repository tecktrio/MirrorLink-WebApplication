import React, { useContext, useEffect, useRef, useState } from "react";
import { CookieContext } from "../../Contexts/CookieContext";
import { CREATE_CONTENT } from "../../serverRequests/ServerRequests";

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
  const [previewUrl, setPreviewUrl] = useState("");
  const [duration, setDuration] = useState(5);
  const [fileDimensions, setFileDimensions] = useState(null);
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
      setPreviewUrl("");
      setDuration(5);
      setFileDimensions(null);
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
      const img = new Image();
      img.onload = () => {
        setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = fileUrl;
    } else if (selectedFile.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.onloadedmetadata = () => {
        setFileDimensions({ width: video.videoWidth, height: video.videoHeight });
      };
      video.src = fileUrl;
    } else {
      setFileDimensions(null);
    }
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
    if (fileDimensions && !isExactMatch) {
      setErrorMessage(
        `Uploaded media dimensions (${fileDimensions.width} × ${fileDimensions.height} px) do not match mirror resolution (${targetWidth} × ${targetHeight} px). All uploads must match the mirror dimensions.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    const loginKey = getCookie("login_key") || "adminpassword";

    CREATE_CONTENT(
      loginKey,
      title.trim(),
      description.trim(),
      file,
      mirrorId,
      duration,
      fileDimensions ? fileDimensions.width : null,
      fileDimensions ? fileDimensions.height : null
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
                    <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xs font-bold text-black truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                    </p>
                  </div>

                  {/* Resolution Comparison Badge */}
                  {fileDimensions && (
                    isExactMatch ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Verified: Exactly {fileDimensions.width} × {fileDimensions.height} px matches mirror dimensions</span>
                      </div>
                    ) : (
                      <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200 text-left space-y-1">
                        <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
                          <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Resolution Mismatch — Upload Blocked</span>
                        </div>
                        <p className="text-[11px] text-red-700 leading-normal">
                          Uploaded file is <strong className="font-mono">{fileDimensions.width} × {fileDimensions.height} px</strong>, but this mirror strictly requires <strong className="font-mono">{targetWidth} × {targetHeight} px</strong>.
                        </p>
                        <p className="text-[11px] text-red-600 font-medium">
                          Uploaded contents must match the mirror dimensions. Please upload an image or video resized to {targetWidth} × {targetHeight} px.
                        </p>
                      </div>
                    )
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
            <button
              type="submit"
              disabled={isSubmitting || (fileDimensions && !isExactMatch)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors ${
                fileDimensions && !isExactMatch
                  ? "bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300"
                  : "bg-black hover:bg-neutral-800 disabled:opacity-50 text-white cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Uploading to Mirror...</span>
                </>
              ) : fileDimensions && !isExactMatch ? (
                <>
                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Matches Mirror Dimensions Required</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add to Mirror</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

