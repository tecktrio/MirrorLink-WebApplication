import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MirrorListing from "../mirrorlinsting/MirrorLIsting";
import AddSiteModal from "../../components/AddSiteModal/AddSiteModal";
import {
  GET_AVAILABLE_SITES,
  GET_ALL_MIRRORS,
  DELETE_SITE,
} from "../../serverRequests/ServerRequests";
import { CookieContext } from "../../Contexts/CookieContext";

export default function Setup() {
  const { getCookie, setCookie } = useContext(CookieContext);
  const [availableSiteList, setAvailableSiteList] = useState([]);
  const [allMirrors, setAllMirrors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedsite, setSelectedsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [maxSites, setMaxSites] = useState(1);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const login_key = getCookie("login_key") || "adminpassword";

  const loadData = () => {
    setLoading(true);

    Promise.all([
      GET_AVAILABLE_SITES(login_key).catch(() => ({ data: [] })),
      GET_ALL_MIRRORS(login_key).catch(() => ({ data: [] })),
    ])
      .then(([sitesRes, mirrorsRes]) => {
        const sites = sitesRes?.data || [];
        const mirrors = mirrorsRes?.data || [];
        const max = sitesRes?.max_sites || sitesRes?.limits?.sites || 1;
        setAvailableSiteList(sites);
        setAllMirrors(mirrors);
        setMaxSites(max);
        setIsLimitReached(Boolean(sitesRes?.limit_reached || sites.length >= max));

        // Keep selected site if it still exists in the list
        const cookieSiteId = getCookie("site_id");
        if (cookieSiteId && sites.some((s) => String(s._id) === String(cookieSiteId))) {
          setSelectedsite((prev) => prev || cookieSiteId);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading sites and mirrors:", error);
        setAvailableSiteList([]);
        setAllMirrors([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [login_key]);

  const handleSelectSite = (siteId) => {
    setSelectedsite(siteId);
    setCookie("site_id", siteId);
  };

  const handleBackToSites = () => {
    setSelectedsite("");
    setCookie("site_id", "");
  };

  const handleDeleteSite = (siteId, siteName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete site "${siteName || 'this site'}"? Displays in this site will become unassigned.`)) {
      return;
    }

    DELETE_SITE(login_key, siteId)
      .then(() => {
        setAvailableSiteList((prev) => prev.filter((s) => s._id !== siteId));
        if (selectedsite === siteId) {
          handleBackToSites();
        }
        setStatusMsg(`Site "${siteName || 'location'}" deleted successfully.`);
        setTimeout(() => setStatusMsg(""), 3500);
      })
      .catch((err) => {
        console.error("Delete site error:", err);
        alert("Failed to delete site: " + (err.message || 'Server error'));
      });
  };

  const filteredSites = availableSiteList.filter((site) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (site.site_name || "").toLowerCase().includes(q) ||
      (site.site_description || "").toLowerCase().includes(q)
    );
  });

  const activeSiteObj = availableSiteList.find((s) => String(s._id) === String(selectedsite));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-12 sm:p-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-500">Loading your sites and displays...</p>
        </div>
      ) : selectedsite && activeSiteObj ? (
        /* ============================================================ */
        /* LEVEL 2: INSIDE SELECTED SITE -> MIRRORS MANAGEMENT         */
        /* ============================================================ */
        <div className="space-y-6">
          {/* Breadcrumb Navigation Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToSites}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-100 text-black border border-neutral-200 text-xs font-bold rounded-full shadow-2xs transition-colors cursor-pointer"
                title="Return to Sites Overview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                <span>All Sites</span>
              </button>
              <span className="text-neutral-300 text-xs">/</span>
              <span className="text-xs font-bold text-black truncate max-w-xs sm:max-w-md">
                {activeSiteObj.site_name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSiteToEdit(activeSiteObj);
                  setIsAddSiteModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs text-black bg-white hover:bg-neutral-100 border border-neutral-200 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 font-bold shadow-2xs"
                title="Edit this location"
              >
                <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Location</span>
              </button>
              <button
                onClick={(e) => handleDeleteSite(activeSiteObj._id, activeSiteObj.site_name, e)}
                className="px-3.5 py-2 text-xs text-black hover:text-red-600 bg-white hover:bg-red-50 border border-neutral-200 hover:border-red-200 rounded-full transition-colors cursor-pointer font-bold shadow-2xs"
                title="Delete this site"
              >
                Delete Site
              </button>
            </div>
          </div>

          {/* Active Site Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 text-black flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-black text-black tracking-tight">
                    {activeSiteObj.site_name}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black text-white">
                    Active Location
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 max-w-xl font-medium">
                  {activeSiteObj.site_description || "Displays configured at this location"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={loadData}
                title="Refresh site mirrors"
                className="p-2.5 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl text-black transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mirrors Grid inside this site */}
          <MirrorListing
            site_id={selectedsite}
            site_name={activeSiteObj.site_name}
            onCountChange={loadData}
          />
        </div>
      ) : (
        /* ============================================================ */
        /* LEVEL 1: ALL SITES OVERVIEW                                  */
        /* ============================================================ */
        <div className="space-y-6">
          {/* Overview Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Configured Sites
                </p>
                <h3 className="text-2xl font-black text-black tracking-tight mt-1">
                  {availableSiteList.length}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Physical branches & locations</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-black flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Total Displays
                </p>
                <h3 className="text-2xl font-black text-black tracking-tight mt-1">
                  {allMirrors.length}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Smart mirrors & screens</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-black flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Plan Limit Warning Banner */}
          {isLimitReached && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-amber-800 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>You have reached the maximum allowed sites ({availableSiteList.length}/{maxSites}) on your current plan.</span>
              </div>
              <Link to="/pricing" className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors">
                Upgrade Plan
              </Link>
            </div>
          )}

          {/* Section Header Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-black tracking-tight">Sites & Locations</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Select a location to manage its displays and presentation playlists.
              </p>
            </div>
            <button
              onClick={() => {
                if (isLimitReached) return;
                setSiteToEdit(null);
                setIsAddSiteModalOpen(true);
              }}
              disabled={isLimitReached}
              title={isLimitReached ? `Plan limit reached (${availableSiteList.length}/${maxSites} sites). Upgrade your plan to add more sites.` : undefined}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isLimitReached
                  ? "bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed opacity-80"
                  : "bg-black hover:bg-neutral-800 text-white cursor-pointer"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Site</span>
              {isLimitReached && (
                <span className="text-[10px] bg-neutral-300 text-neutral-700 px-1.5 py-0.5 rounded-full font-bold ml-1">
                  Limit reached
                </span>
              )}
            </button>
          </div>

          {/* Search Filter */}
          {availableSiteList.length > 0 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sites by name or description..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-medium text-black outline-none shadow-2xs transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Sites Grid converted to Google Drive style table */}
          {filteredSites.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-black flex items-center justify-center mb-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-black mb-1">
                {availableSiteList.length === 0 ? "No Sites Configured Yet" : "No Matching Sites Found"}
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mb-5">
                {availableSiteList.length === 0
                  ? "Create your first site location to start adding and managing mirror screens."
                  : "Try a different search keyword."}
              </p>
              {availableSiteList.length === 0 && (
                <button
                  onClick={() => {
                    setSiteToEdit(null);
                    setIsAddSiteModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Your First Site</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
              {/* Google Drive Table Header */}
              <div className="flex items-center justify-between py-2.5 px-3 sm:px-4 border-b border-neutral-200/90 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider select-none">
                <div className="flex items-center gap-1.5 flex-1">
                  <span>Site Name</span>
                  <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="hidden md:block w-28">
                  <span>Owner</span>
                </div>
                <div className="hidden sm:block w-32">
                  <span>Assigned Displays</span>
                </div>
                <div className="w-24 text-right">
                  <span>Actions</span>
                </div>
              </div>

              {/* Google Drive Rows */}
              <div className="divide-y divide-neutral-100">
                {filteredSites.map((site) => {
                  const mirrorCount = allMirrors.filter(
                    (m) => String(m.site_id) === String(site._id)
                  ).length;

                  return (
                    <div
                      key={site._id}
                      onClick={() => handleSelectSite(site._id)}
                      className="group w-full flex items-center justify-between py-3 px-3 sm:px-4 hover:bg-neutral-50/90 transition-colors cursor-pointer select-none"
                    >
                      {/* Name / Icon */}
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 shrink-0">
                          <svg className="w-6 h-6 fill-neutral-600" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900 group-hover:text-black text-sm truncate">
                              {site.site_name}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 shrink-0">
                              {mirrorCount} {mirrorCount === 1 ? "Screen" : "Screens"}
                            </span>
                          </div>
                          {site.site_description && (
                            <p className="text-xs text-neutral-500 truncate max-w-md mt-0.5">
                              {site.site_description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Owner Column */}
                      <div className="hidden md:flex items-center gap-2 w-28 shrink-0 text-xs text-neutral-600">
                        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                        <span>me</span>
                      </div>

                      {/* Assigned Displays Column */}
                      <div className="hidden sm:flex items-center w-32 shrink-0 text-xs text-neutral-500">
                        <span>{mirrorCount} {mirrorCount === 1 ? "Mirror linked" : "Mirrors linked"}</span>
                      </div>

                      {/* Actions Column */}
                      <div
                        className="flex items-center justify-end gap-1.5 w-24 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSiteToEdit(site);
                            setIsAddSiteModalOpen(true);
                          }}
                          className="w-7 h-7 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 flex items-center justify-center transition-colors"
                          title="Edit location"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteSite(site._id, site.site_name, e)}
                          className="w-7 h-7 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Delete site"
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
        </div>
      )}

      {/* Add / Edit Site Modal */}
      <AddSiteModal
        isOpen={isAddSiteModalOpen}
        siteToEdit={siteToEdit}
        disabled={!siteToEdit && isLimitReached}
        disabledMessage={isLimitReached ? `You have reached your plan limit of ${maxSites} ${maxSites === 1 ? 'site' : 'sites'}. Upgrade to create more sites.` : ''}
        onClose={() => {
          setIsAddSiteModalOpen(false);
          setSiteToEdit(null);
        }}
        onSiteAdded={(newSiteName) => {
          loadData();
          setStatusMsg(`Location "${newSiteName}" created successfully.`);
          setTimeout(() => setStatusMsg(""), 3500);
        }}
        onSiteUpdated={(updatedSite) => {
          loadData();
          setStatusMsg(`Location "${updatedSite.site_name}" updated successfully.`);
          setTimeout(() => setStatusMsg(""), 3500);
        }}
      />
    </div>
  );
}
