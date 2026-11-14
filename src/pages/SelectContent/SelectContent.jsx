import React, { useContext, useEffect, useState } from "react";
import {
  ASSIGN_CONTENT_TO_MIRROR,
  GET_ALL_CONTENTS,
} from "../../serverRequests/ServerRequests";
import { CookieContext } from "../../Contexts/CookieContext";

export default function SelectContent({ mirror_id, existing_content_ids = [], handleclose, onContentAdded }) {
  const [selectedContentList, setSelectedContentList] = useState([]);
  const [availableContentList, setAvailableContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getCookie } = useContext(CookieContext);

  useEffect(() => {
    let login_key = getCookie("login_key") || "adminpassword";
    setLoading(true);
    GET_ALL_CONTENTS(login_key)
      .then((res) => {
        const all = res.data || [];
        const existingSet = new Set((existing_content_ids || []).map((id) => String(id)));
        const unassigned = all.filter((item) => !existingSet.has(String(item._id)));
        setAvailableContentList(unassigned);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading contents:", err);
        setAvailableContentList([]);
        setLoading(false);
      });
  }, [existing_content_ids]);

  const HandleAddMirror = async () => {
    if (selectedContentList.length === 0) return;
    setIsSubmitting(true);
    let login_key = getCookie("login_key") || "adminpassword";
    let selectedContentIDList = selectedContentList.map((content) => content._id);
    try {
      await ASSIGN_CONTENT_TO_MIRROR(login_key, selectedContentIDList, mirror_id);
      setSelectedContentList([]);
      if (onContentAdded) onContentAdded();
      if (handleclose) handleclose();
    } catch (err) {
      console.error("Error assigning contents:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const HandleSelectContent = (content) => {
    setAvailableContentList(availableContentList.filter((item) => item._id !== content._id));
    setSelectedContentList([...selectedContentList, content]);
  };

  const HandleDeSelectContent = (content) => {
    setAvailableContentList([...availableContentList, content]);
    setSelectedContentList(
      selectedContentList.filter((item) => (item._id || item) !== (content._id || content))
    );
  };

  return (
    <div className="space-y-5">
      {/* Selected Contents */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-black mb-2">
          Selected for Playlist ({selectedContentList.length})
        </p>
        {selectedContentList.length === 0 ? (
          <div className="p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-center text-xs text-neutral-400">
            No items selected. Click available media below to add to playlist.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedContentList.map((content, key) => (
              <div
                onClick={() => HandleDeSelectContent(content)}
                key={key}
                className="bg-neutral-100 border-2 border-black rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-200/60 transition-colors"
                title="Click to remove from selection"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 text-xs font-bold uppercase">
                    {content.content_format || "IMG"}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-black truncate">{content.content_title}</h5>
                    <p className="text-xs text-neutral-500 truncate">{content.content_description || "Media asset"}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-600 font-semibold shrink-0 hover:text-red-600">Remove ✕</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Contents */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
          Available Media Library ({availableContentList.length})
        </p>
        {loading ? (
          <div className="p-6 text-center text-neutral-400 text-xs">Loading media assets...</div>
        ) : availableContentList.length === 0 ? (
          <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-xs text-neutral-400">
            All library items are already added to this mirror's playlist, or no media has been uploaded yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {availableContentList.map((content, key) => (
              <div
                onClick={() => HandleSelectContent(content)}
                key={key}
                className="bg-white border border-neutral-200 hover:border-black rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-all shadow-2xs group"
                title="Click to select this content"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center shrink-0 text-xs font-bold uppercase">
                    {content.content_format || "FILE"}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-black truncate">{content.content_title}</h5>
                    <p className="text-xs text-neutral-500 truncate">{content.content_description || "Uploaded content"}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 font-semibold group-hover:text-black shrink-0">+ Add</span>
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
          disabled={selectedContentList.length === 0 || isSubmitting}
          className={`w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl text-white font-medium text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
            selectedContentList.length > 0 && !isSubmitting
              ? "bg-black hover:bg-neutral-800"
              : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
          }`}
        >
          <span>{isSubmitting ? "Adding to Mirror..." : `Add ${selectedContentList.length} Item(s) to Mirror`}</span>
        </button>
      </div>
    </div>
  );
}
