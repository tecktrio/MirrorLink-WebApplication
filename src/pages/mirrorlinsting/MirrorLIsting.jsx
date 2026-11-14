import React, { useContext, useEffect, useState } from "react";
import {
  GET_AVAILABLE_MIRRORS_ON_SITE,
  DELETE_MIRROR,
} from "../../serverRequests/ServerRequests";
import { useNavigate } from "react-router-dom";
import {
  Navigate_To_Contentlist,
} from "../../constants";
import { CookieContext } from "../../Contexts/CookieContext";
import MirrorListingModal from "../../components/Modal/MirrorListingModal";
import SelectMirror from "../SelectMirror/SelectMirror";
import AddMirrorModal from "../../components/AddMirrorModal/AddMirrorModal";

export default function MirrorListing({ site_id, site_name = "Selected Site", onCountChange }) {
  const [mirrorlist, setMirrorlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const { getCookie, setCookie } = useContext(CookieContext);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMirrorModalOpen, setIsAddMirrorModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchMirrors = () => {
    let login_key = getCookie("login_key") || "adminpassword";
    if (site_id != null) {
      setLoading(true);
      GET_AVAILABLE_MIRRORS_ON_SITE(login_key, site_id)
        .then((res) => {
          setMirrorlist(res.data || []);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading mirrors for site:", error);
          setMirrorlist([]);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchMirrors();
  }, [site_id]);

  const handleConfigureMirror = (id) => {
    setCookie("mirror_id", id, 1);
    navigate(Navigate_To_Contentlist);
  };

  const handleDeleteMirror = (id, mirrorName) => {
    if (!window.confirm(`Are you sure you want to delete mirror display "${mirrorName || 'this screen'}"? This action cannot be undone.`)) {
      return;
    }
    let login_key = getCookie("login_key") || "adminpassword";
    DELETE_MIRROR(login_key, id)
      .then(() => {
        setMirrorlist((prev) => prev.filter((m) => m._id !== id));
        setStatusMsg(`Mirror "${mirrorName || 'screen'}" deleted.`);
        if (onCountChange) onCountChange();
        setTimeout(() => setStatusMsg(""), 3500);
      })
      .catch((err) => {
        console.error("Delete mirror error:", err);
        alert("Failed to delete mirror: " + (err.message || 'Server error'));
      });
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-black">
            Assigned Mirrors ({mirrorlist.length})
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Displays and screens currently configured to broadcast at this location
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddMirrorModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Register a new mirror display directly to this site"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Mirror</span>
          </button>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-medium rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Link an existing unassigned mirror to this site"
          >
            <span>Assign Existing</span>
          </button>
        </div>
      </div>

      {/* Mirrors Grid / List */}
      {loading ? (
        <div className="p-8 text-center text-neutral-400 text-sm bg-white rounded-2xl border border-neutral-200">
          Syncing mirrors...
        </div>
      ) : mirrorlist.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-black flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-black mb-1">No Mirrors Linked to This Site</h4>
          <p className="text-xs text-neutral-500 max-w-sm mb-4">
            Add a new display screen or assign existing unassigned mirrors to start broadcasting.
          </p>
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <button
              onClick={() => setIsAddMirrorModalOpen(true)}
              className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Mirror Screen</span>
            </button>
            <button
              onClick={openModal}
              className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-medium rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Assign Existing Mirror
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mirrorlist.map((mirror, idx) => (
            <div
              key={idx}
              onClick={() => handleConfigureMirror(mirror._id)}
              className="group bg-white hover:bg-neutral-50/70 border border-neutral-200/90 hover:border-black rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-black group-hover:text-black">{mirror.mirror_name}</h4>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{mirror.mirror_description || "Mirror Display Screen"}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                    mirror.playback_state === 'paused'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {mirror.playback_state === 'paused' ? 'Paused' : 'Active'}
                  </span>
                </div>

                {/* Mirror Meta info & Stream URL */}
                <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2 text-[11px] text-neutral-500">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-neutral-700">Stream Name: </span>
                      <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-black">{mirror.mirror_name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-700">Resolution: </span>
                      <span className="font-medium text-black">{mirror.mirror_width || 1920} × {mirror.mirror_height || 1080}</span>
                    </div>
                  </div>

                  {/* Direct Stream URL Bar */}
                  <div className="flex items-center justify-between gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-200/80">
                    <span className="font-mono text-[10px] text-neutral-700 truncate select-all">
                      {`${(process.env.REACT_APP_VIEWER_URL || 'https://mirror.bigburry.com').replace(/\/+$/, '')}?mirror_name=${encodeURIComponent(mirror.mirror_name)}`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const viewerBase = (process.env.REACT_APP_VIEWER_URL || 'https://mirror.bigburry.com').replace(/\/+$/, '');
                        const targetUrl = `${viewerBase}?mirror_name=${encodeURIComponent(mirror.mirror_name)}`;
                        navigator.clipboard.writeText(targetUrl);
                        setStatusMsg(`Stream URL copied for "${mirror.mirror_name}"`);
                        setTimeout(() => setStatusMsg(''), 2500);
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-neutral-300 rounded text-[10px] font-semibold text-black shrink-0 transition-colors cursor-pointer shadow-2xs"
                      title="Copy direct stream URL"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-400">
                  {mirror.contents?.length || 0} media playlist items
                </span>

                <span className="text-xs font-semibold text-black flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Setup Playlist</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to register a new mirror screen directly */}
      <AddMirrorModal
        isOpen={isAddMirrorModalOpen}
        onClose={() => setIsAddMirrorModalOpen(false)}
        siteId={site_id}
        siteName={site_name}
        onMirrorAdded={(mirrorName) => {
          fetchMirrors();
          if (onCountChange) onCountChange();
          setStatusMsg(`Registered and linked mirror "${mirrorName}" to this site.`);
          setTimeout(() => setStatusMsg(""), 3500);
        }}
      />

      {/* Modal to assign mirrors to site */}
      <MirrorListingModal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-2">
          <h3 className="text-lg font-bold text-slate-800">Assign Mirrors to Site</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Select unassigned mirrors to add to this site.
          </p>
          <div className="no-scrollbar">
            <SelectMirror site_id={site_id} handleclose={closeModal} onMirrorAdded={fetchMirrors} />
          </div>
        </div>
      </MirrorListingModal>
    </div>
  );
}
