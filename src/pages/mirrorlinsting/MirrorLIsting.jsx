import React, { useContext, useEffect, useState } from "react";
import {
  GET_AVAILABLE_MIRRORS_ON_SITE,
  DELETE_MIRROR,
} from "../../serverRequests/ServerRequests";
import { useNavigate, Link } from "react-router-dom";
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
  const [maxMirrors, setMaxMirrors] = useState(1);
  const [totalMirrors, setTotalMirrors] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
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
          const list = res.data || [];
          const max = res?.max_mirrors || res?.limits?.max_mirrors || 1;
          const total = res?.total_mirrors_count != null ? res.total_mirrors_count : list.length;
          setMirrorlist(list);
          setMaxMirrors(max);
          setTotalMirrors(total);
          setIsLimitReached(Boolean(res?.limit_reached || total >= max));
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
          <h3 className="text-lg font-black text-black tracking-tight">
            Assigned Mirrors ({mirrorlist.length})
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5 font-medium">
            Displays and screens currently configured to broadcast at this location
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => !isLimitReached && setIsAddMirrorModalOpen(true)}
            disabled={isLimitReached}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-full shadow-2xs transition-all ${
              isLimitReached
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300 shadow-none'
                : 'bg-black hover:bg-neutral-800 text-white cursor-pointer'
            }`}
            title={isLimitReached ? `Plan limit reached (${totalMirrors}/${maxMirrors} screens). Upgrade plan to add more mirrors.` : "Register a new mirror display directly to this site"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Mirror</span>
            {isLimitReached && (
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-neutral-300 text-neutral-700">
                Limit reached
              </span>
            )}
          </button>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-neutral-100 text-black border border-neutral-200 text-xs font-bold rounded-full shadow-2xs transition-colors cursor-pointer"
            title="Link an existing unassigned mirror to this site"
          >
            <span>Assign Existing</span>
          </button>
        </div>
      </div>

      {isLimitReached && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 gap-3">
          <span><b>Plan limit reached:</b> Your plan allows up to {maxMirrors} mirror screen{maxMirrors > 1 ? 's' : ''}. Upgrade to connect more displays.</span>
          <Link to="/pricing" className="font-bold underline hover:text-amber-950 shrink-0">Upgrade Plan →</Link>
        </div>
      )}

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
              onClick={() => !isLimitReached && setIsAddMirrorModalOpen(true)}
              disabled={isLimitReached}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 ${
                isLimitReached
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300 shadow-none'
                  : 'bg-black hover:bg-neutral-800 text-white cursor-pointer'
              }`}
              title={isLimitReached ? `Plan limit reached (${totalMirrors}/${maxMirrors} screens).` : "Add Mirror Screen"}
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
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
          {/* Google Drive Table Header */}
          <div className="flex items-center justify-between py-2.5 px-3 sm:px-4 border-b border-neutral-200/90 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider select-none">
            <div className="flex items-center gap-1.5 flex-1">
              <span>Display Screen</span>
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="hidden md:block w-28">
              <span>Owner</span>
            </div>
            <div className="hidden sm:block w-36">
              <span>Resolution / Items</span>
            </div>
            <div className="w-48 text-right">
              <span>Stream Link & Actions</span>
            </div>
          </div>

          {/* Google Drive Rows */}
          <div className="divide-y divide-neutral-100">
            {mirrorlist.map((mirror, idx) => {
              const viewerBase = (process.env.REACT_APP_VIEWER_URL || 'https://screen.bigburry.com').replace(/\/+$/, '');
              const streamUrl = `${viewerBase}?mirror_name=${encodeURIComponent(mirror.mirror_name)}`;
              const isInactive = mirror.is_active === false || String(mirror.status).toLowerCase() === 'inactive';
              const isPaused = mirror.playback_state === 'paused';

              return (
                <div
                  key={mirror._id || idx}
                  onClick={() => handleConfigureMirror(mirror._id)}
                  className="group w-full flex items-center justify-between py-3 px-3 sm:px-4 hover:bg-neutral-50/90 transition-colors cursor-pointer select-none"
                  title="Configure this mirror's playlist and settings"
                >
                  {/* Name / Display Icon */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                        <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" />
                        <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 group-hover:text-black text-sm truncate">
                          {mirror.mirror_name}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${isInactive
                            ? 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                            : isPaused
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-black text-white'
                          }`}>
                          {isInactive ? 'Inactive' : isPaused ? 'Paused' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate max-w-md mt-0.5">
                        {mirror.mirror_description || "Mirror Display Screen"}
                      </p>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="hidden md:flex items-center gap-2 w-28 shrink-0 text-xs text-neutral-600">
                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <span>me</span>
                  </div>

                  {/* Resolution & playlist count */}
                  <div className="hidden sm:flex flex-col justify-center w-36 shrink-0 text-xs text-neutral-500">
                    <span className="font-mono text-neutral-700 text-[11px] font-semibold">{mirror.mirror_width || 1920} × {mirror.mirror_height || 1080}</span>
                    <span className="text-[10px] text-neutral-400">{mirror.contents?.length || 0} playlist items</span>
                  </div>

                  {/* Stream URL copy & Action buttons */}
                  <div
                    className="flex items-center justify-end gap-2 w-48 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(streamUrl);
                        setStatusMsg(`Stream URL copied for "${mirror.mirror_name}"`);
                        setTimeout(() => setStatusMsg(''), 2500);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-neutral-200 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      title="Copy stream link"
                    >
                      <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfigureMirror(mirror._id)}
                      className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1"
                      title="Configure Playlist"
                    >
                      <span>Playlist</span>
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMirror(mirror._id, mirror.mirror_name);
                      }}
                      className="w-7 h-7 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                      title="Delete screen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Modal to register a new mirror screen directly */}
      <AddMirrorModal
        isOpen={isAddMirrorModalOpen}
        onClose={() => setIsAddMirrorModalOpen(false)}
        siteId={site_id}
        siteName={site_name}
        disabled={isLimitReached}
        disabledMessage={`Your plan allows up to ${maxMirrors} mirror screen${maxMirrors > 1 ? 's' : ''}. Upgrade your plan to add more mirrors.`}
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
