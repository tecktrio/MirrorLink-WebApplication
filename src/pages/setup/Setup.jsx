import React, { useContext, useEffect, useState } from "react";
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
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
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
        setAvailableSiteList(sites);
        setAllMirrors(mirrors);

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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
                title="Return to Sites Overview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                <span>All Sites</span>
              </button>
              <span className="text-neutral-400 text-xs">/</span>
              <span className="text-xs font-bold text-black truncate max-w-xs sm:max-w-md">
                {activeSiteObj.site_name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDeleteSite(activeSiteObj._id, activeSiteObj.site_name, e)}
                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-neutral-300 hover:border-red-200 rounded-xl transition-colors cursor-pointer"
                title="Delete this site"
              >
                Delete Site
              </button>
            </div>
          </div>

          {/* Active Site Header Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-black tracking-tight">
                    {activeSiteObj.site_name}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Location
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                  {activeSiteObj.site_description || "Displays configured at this location"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={loadData}
                title="Refresh site mirrors"
                className="p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 hover:text-black transition-colors cursor-pointer shrink-0"
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

          {/* Section Header Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-black tracking-tight">Sites & Locations</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Select a location to manage its displays and presentation playlists.
              </p>
            </div>
            <button
              onClick={() => setIsAddSiteModalOpen(true)}
              className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Site</span>
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

          {/* Sites Grid */}
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
                  onClick={() => setIsAddSiteModalOpen(true)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((site) => {
                const mirrorCount = allMirrors.filter(
                  (m) => String(m.site_id) === String(site._id)
                ).length;

                return (
                  <div
                    key={site._id}
                    onClick={() => handleSelectSite(site._id)}
                    className="group bg-white hover:bg-neutral-50/70 border border-neutral-200/90 hover:border-black rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 text-black flex items-center justify-center group-hover:scale-105 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-black">
                          {mirrorCount} {mirrorCount === 1 ? "Mirror" : "Mirrors"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-black mt-3 group-hover:text-black transition-colors">
                        {site.site_name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {site.site_description || "No description provided"}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-black flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>View Mirrors</span>
                        <span>→</span>
                      </span>

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
          )}
        </div>
      )}

      {/* Add Site Modal */}
      <AddSiteModal
        isOpen={isAddSiteModalOpen}
        onClose={() => setIsAddSiteModalOpen(false)}
        onSiteAdded={(newSiteName) => {
          loadData();
          setStatusMsg(`Site "${newSiteName}" created successfully.`);
          setTimeout(() => setStatusMsg(""), 3500);
        }}
      />
    </div>
  );
}
