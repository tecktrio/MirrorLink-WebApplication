import React, { useContext, useEffect, useState } from "react";
import { CookieContext } from "../../Contexts/CookieContext";
import { CREATE_MIRROR } from "../../serverRequests/ServerRequests";

const RESOLUTION_OPTIONS = [
  { id: "landscape", label: "1920 × 1080 (Landscape)", width: "1920", height: "1080" },
  { id: "portrait", label: "1080 × 1920 (Portrait)", width: "1080", height: "1920" },
  { id: "4k", label: "3840 × 2160 (4K UHD)", width: "3840", height: "2160" },
  { id: "square", label: "1080 × 1080 (Square)", width: "1080", height: "1080" },
  { id: "custom", label: "Custom Size", width: "", height: "" },
];

export default function AddMirrorModal({
  isOpen,
  onClose,
  siteId,
  siteName = "Selected Site",
  onMirrorAdded,
}) {
  const { getCookie } = useContext(CookieContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState("landscape");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setUsername("");
      setPassword("");
      setSelectedOptionId("landscape");
      setWidth("1920");
      setHeight("1080");
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSelectOption = (option) => {
    setSelectedOptionId(option.id);
    if (option.id !== "custom") {
      setWidth(option.width);
      setHeight(option.height);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Mirror Name is required.");
      return;
    }
    if (!username.trim()) {
      setErrorMessage("Screen ID / Username is required.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Access Key / Password is required.");
      return;
    }

    const parsedW = parseInt(width, 10);
    const parsedH = parseInt(height, 10);
    if (!parsedW || parsedW <= 0 || !parsedH || parsedH <= 0) {
      setErrorMessage("Please specify a valid positive Width and Height for this mirror.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const loginKey = getCookie("login_key") || "adminpassword";

    CREATE_MIRROR(
      loginKey,
      name.trim(),
      description.trim(),
      username.trim(),
      password.trim(),
      String(parsedH),
      String(parsedW),
      siteId || null
    )
      .then(() => {
        setIsSubmitting(false);
        if (onMirrorAdded) onMirrorAdded(name.trim());
        onClose();
      })
      .catch((err) => {
        console.error("Create mirror error:", err);
        setErrorMessage(
          err.message || "Failed to register mirror screen. Please try again."
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
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg font-bold text-black tracking-tight">
                Add New Mirror Display
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configuring display for: <strong className="text-neutral-800">{siteName}</strong>
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mirror Name */}
          <div>
            <label className="block text-xs font-bold text-black mb-1">
              Mirror Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lobby Entrance Screen"
              className="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors"
            />
          </div>

          {/* Mirror Description */}
          <div>
            <label className="block text-xs font-bold text-black mb-1">
              Description <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Vertical 55-inch display at front desk"
              className="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors"
            />
          </div>

          {/* Login Credentials for Mirror Viewer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Screen ID / Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. screen_01"
                className="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Access Key / Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors"
              />
            </div>
          </div>

          {/* Display Resolution */}
          <div className="pt-2 border-t border-neutral-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-black">
                Display Native Resolution
              </label>
              <span className="text-[11px] font-mono font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                {width || 0} × {height || 0} px
              </span>
            </div>

            {/* 4 Presets + Custom Size Option */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {RESOLUTION_OPTIONS.map((opt) => {
                const isActive = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-black text-white border-black font-semibold shadow-2xs"
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Width and Height Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Width (px) {selectedOptionId !== "custom" && <span className="text-neutral-400 font-normal">(Preset)</span>}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={width}
                    readOnly={selectedOptionId !== "custom"}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="1920"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-semibold outline-none transition-colors ${
                      selectedOptionId === "custom"
                        ? "bg-white focus:bg-white border-neutral-300 focus:border-black text-black"
                        : "bg-neutral-100/80 border-neutral-200 text-neutral-700 cursor-not-allowed select-none"
                    }`}
                  />
                  {selectedOptionId !== "custom" && (
                    <span className="absolute right-2.5 top-2.5 text-neutral-400 text-[10px]">
                      🔒
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  Height (px) {selectedOptionId !== "custom" && <span className="text-neutral-400 font-normal">(Preset)</span>}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={height}
                    readOnly={selectedOptionId !== "custom"}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="1080"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-semibold outline-none transition-colors ${
                      selectedOptionId === "custom"
                        ? "bg-white focus:bg-white border-neutral-300 focus:border-black text-black"
                        : "bg-neutral-100/80 border-neutral-200 text-neutral-700 cursor-not-allowed select-none"
                    }`}
                  />
                  {selectedOptionId !== "custom" && (
                    <span className="absolute right-2.5 top-2.5 text-neutral-400 text-[10px]">
                      🔒
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Permanent Resolution Notice */}
            <div className="p-3 bg-neutral-50 border border-neutral-200/90 rounded-xl text-[11px] text-neutral-600 flex items-start gap-2">
              <svg className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Note:</strong> Mirror dimensions are permanent once created and cannot be edited. Users have to create a new mirror to change this size.
              </span>
            </div>
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Registering Mirror...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Mirror</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

