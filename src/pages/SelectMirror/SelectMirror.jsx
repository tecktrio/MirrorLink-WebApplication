import React, { useContext, useEffect, useState } from "react";
import {
  ASSIGN_MIRROR_TO_SITE,
  GET_ALL_UNASSIGNED_MIRRORS,
} from "../../serverRequests/ServerRequests";
import { CookieContext } from "../../Contexts/CookieContext";

export default function SelectMirror({ site_id, handleclose, onMirrorAdded }) {
  const [selectedMirrorList, setSelectedMirrorList] = useState([]);
  const [availableMirrorList, setAvailableMirrorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getCookie } = useContext(CookieContext);

  useEffect(() => {
    let login_key = getCookie("login_key") || "adminpassword";
    setLoading(true);
    GET_ALL_UNASSIGNED_MIRRORS(login_key)
      .then((res) => {
        setAvailableMirrorList(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading unassigned mirrors:", err);
        setAvailableMirrorList([]);
        setLoading(false);
      });
  }, []);

  const HandleAddMirror = async () => {
    if (selectedMirrorList.length === 0) return;
    setIsSubmitting(true);
    let login_key = getCookie("login_key") || "adminpassword";
    try {
      await ASSIGN_MIRROR_TO_SITE(login_key, selectedMirrorList, site_id);
      setSelectedMirrorList([]);
      if (onMirrorAdded) onMirrorAdded();
      if (handleclose) handleclose();
    } catch (err) {
      console.error("Error assigning mirrors:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const HandleSelectMirror = (mirror) => {
    setSelectedMirrorList([...selectedMirrorList, mirror]);
    setAvailableMirrorList(availableMirrorList.filter((item) => item._id !== mirror._id));
  };

  const HandleDeSelectMirror = (mirror) => {
    setAvailableMirrorList([...availableMirrorList, mirror]);
    setSelectedMirrorList(selectedMirrorList.filter((item) => item._id !== mirror._id));
  };

  return (
    <div className="space-y-5">
      {/* Selected Mirrors to Add */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-black">
            Selected Mirrors to Add ({selectedMirrorList.length})
          </p>
        </div>
        {selectedMirrorList.length === 0 ? (
          <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-center text-xs text-neutral-400">
            No mirrors selected yet. Click an available mirror below to select it.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedMirrorList.map((mirror, key) => (
              <div
                onClick={() => HandleDeSelectMirror(mirror)}
                key={key}
                className="bg-neutral-100 border-2 border-black rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-200/60 transition-colors"
                title="Click to remove from selection"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-black">{mirror.mirror_name}</h5>
                    <p className="text-xs text-neutral-500">{mirror.mirror_description || "Mirror display"}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-600 font-semibold hover:text-red-600">Remove ✕</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Unassigned Mirrors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Available Unassigned Mirrors ({availableMirrorList.length})
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-center text-neutral-400 text-xs">Loading available mirrors...</div>
        ) : availableMirrorList.length === 0 ? (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-xs text-neutral-400">
            All your mirrors are already assigned, or no mirrors have been created yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {availableMirrorList.map((mirror, key) => (
              <div
                onClick={() => HandleSelectMirror(mirror)}
                key={key}
                className="bg-white border border-neutral-200 hover:border-black rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-all shadow-2xs group"
                title="Click to select this mirror"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-neutral-300 group-hover:border-black flex items-center justify-center shrink-0 text-transparent">
                    •
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-black">{mirror.mirror_name}</h5>
                    <p className="text-xs text-neutral-500">{mirror.mirror_description || "Available mirror display"}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-semibold group-hover:text-black">+ Add</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-neutral-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleclose}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={HandleAddMirror}
          disabled={selectedMirrorList.length === 0 || isSubmitting}
          className={`w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl text-white font-medium text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
            selectedMirrorList.length > 0 && !isSubmitting
              ? "bg-black hover:bg-neutral-800"
              : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
          }`}
        >
          <span>{isSubmitting ? "Linking..." : `Link ${selectedMirrorList.length} Mirror(s)`}</span>
        </button>
      </div>
    </div>
  );
}
