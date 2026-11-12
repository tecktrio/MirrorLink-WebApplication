import React, { useContext } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { CookieContext } from "../../Contexts/CookieContext";

export default function Dashboard() {
  const { setCookie } = useContext(CookieContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setCookie("login_key", "", -1);
    setCookie("username", "", -1);
    setCookie("mirror_id", "", -1);
    setCookie("site_id", "", -1);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex flex-col font-sans">
      {/* Global Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-black text-white border-b border-neutral-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/setup"
              className="flex items-center gap-2.5 group"
              title="Return to Sites Overview"
            >
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.4"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-0.5">
                  Mirror<span className="font-normal text-neutral-400">Link</span>
                </h1>
                <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-semibold hidden sm:block">
                  Smart Signage Platform
                </p>
              </div>
            </Link>
          </div>

          {/* Right Account Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
              AD
            </div>
            <span className="text-xs text-neutral-300 font-medium hidden sm:inline">Admin</span>

            <button
              onClick={handleLogout}
              className="ml-1 px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors border border-neutral-800 hover:border-neutral-700 cursor-pointer flex items-center gap-1.5"
              title="Sign out of administration"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
