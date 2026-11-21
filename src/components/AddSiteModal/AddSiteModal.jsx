import React, { useContext, useEffect, useState } from "react";
import { CookieContext } from "../../Contexts/CookieContext";
import { ADD_SITE_IN_ACCOUNT, UPDATE_SITE } from "../../serverRequests/ServerRequests";

export default function AddSiteModal({
  isOpen,
  onClose,
  onSiteAdded,
  onSiteUpdated,
  siteToEdit = null,
  disabled = false,
  disabledMessage = "",
}) {
  const { getCookie } = useContext(CookieContext);
  const [siteName, setSiteName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditMode = Boolean(siteToEdit && siteToEdit._id);

  useEffect(() => {
    if (isOpen) {
      if (siteToEdit) {
        setSiteName(siteToEdit.site_name || "");
        setDescription(siteToEdit.site_description || "");
      } else {
        setSiteName("");
        setDescription("");
      }
      setErrorMessage("");
      setIsSubmitting(false);
    } else {
      setSiteName("");
      setDescription("");
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen, siteToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEditMode && disabled) {
      setErrorMessage(disabledMessage || "Plan limit reached for locations/sites.");
      return;
    }
    if (!siteName.trim()) {
      setErrorMessage("Location Name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    const loginKey = getCookie("login_key") || "adminpassword";

    if (isEditMode) {
      UPDATE_SITE(loginKey, siteToEdit._id, siteName.trim(), description.trim() || "")
        .then((res) => {
          setIsSubmitting(false);
          if (onSiteUpdated) onSiteUpdated({ ...siteToEdit, site_name: siteName.trim(), site_description: description.trim() || "" });
          onClose();
        })
        .catch((err) => {
          console.error("Update site error:", err);
          setErrorMessage(err.message || "Failed to update location. Please try again.");
          setIsSubmitting(false);
        });
    } else {
      ADD_SITE_IN_ACCOUNT(loginKey, siteName.trim(), description.trim() || "")
        .then((res) => {
          setIsSubmitting(false);
          if (onSiteAdded) onSiteAdded(siteName.trim());
          onClose();
        })
        .catch((err) => {
          console.error("Add site error:", err);
          setErrorMessage(err.message || "Failed to create location. Please try again.");
          setIsSubmitting(false);
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 text-black flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-black tracking-tight">
                {isEditMode ? "Edit Location" : "Create New Location"}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {isEditMode
                ? "Update your location, branch, or room details and description."
                : "Add a location, branch, or room to group your digital displays."}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {!isEditMode && disabled && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl font-medium flex items-center justify-between gap-2">
              <span>{disabledMessage || "Plan limit reached: You cannot add more locations under your current plan."}</span>
              <a href="/pricing" className="font-bold underline shrink-0">Upgrade →</a>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g., Downtown Location, Reception Lobby"
              className="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-black">
                Location Description <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Room 102, 2nd floor retail display, stockroom or main lobby screens..."
              className="w-full px-3.5 py-2 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none transition-colors resize-none"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Provide context about the room, floor, shelf, or physical spot where this display is placed.
            </p>
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
              disabled={isSubmitting || (!isEditMode && disabled)}
              title={(!isEditMode && disabled) ? (disabledMessage || "Plan limit reached") : ""}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors ${
                (isSubmitting || (!isEditMode && disabled))
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300"
                  : "bg-black hover:bg-neutral-800 text-white cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{isEditMode ? "Saving Changes..." : "Creating Location..."}</span>
                </>
              ) : (!isEditMode && disabled) ? (
                <span>Plan Limit Reached</span>
              ) : (
                <>
                  {isEditMode ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span>{isEditMode ? "Save Changes" : "Create Location"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

