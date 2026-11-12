import React, { useContext, useEffect, useState } from "react";
import { CookieContext } from "../../Contexts/CookieContext";
import { GET_CONTENT_DETAILS } from "../../serverRequests/ServerRequests";
import { useNavigate } from "react-router-dom";

export default function UpdateContentpage() {
  const { getCookie } = useContext(CookieContext);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  let content_id = getCookie("content_id");
  let login_key = getCookie("login_key") || "adminpassword";

  useEffect(() => {
    if (content_id) {
      setLoading(true);
      GET_CONTENT_DETAILS(login_key, content_id)
        .then((res) => {
          setContent(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading content details:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [content_id, login_key]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-black hover:text-neutral-700 bg-white px-3.5 py-2 rounded-xl border border-neutral-300 shadow-2xs transition-colors cursor-pointer"
        >
          <span>← Back to Library</span>
        </button>

        {content && (
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-neutral-100 text-black border border-neutral-200">
            {content.content_format?.toUpperCase() || "IMAGE"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
          Loading content preview...
        </div>
      ) : !content ? (
        <div className="p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
          No content found or selected.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
          {/* Media Player Theater */}
          <div className="bg-black flex items-center justify-center min-h-[220px] sm:min-h-[360px] max-h-[580px] overflow-hidden">
            {content.content_format?.toLowerCase() === "mp4" ? (
              <video
                className="w-full max-h-[560px] object-contain"
                src={content.content_url}
                controls
                autoPlay
              />
            ) : (
              <img
                className="w-full max-h-[560px] object-contain"
                src={content.content_url}
                alt={content.content_title}
              />
            )}
          </div>

          {/* Details Footer */}
          <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold text-black">{content.content_title}</h2>
            <p className="text-sm text-neutral-500 mt-1">{content.content_description || "No description provided."}</p>

            <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              <div>
                <span className="font-semibold text-neutral-700">Asset URL: </span>
                <a
                  href={content.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-black underline underline-offset-2 hover:text-neutral-700 break-all"
                >
                  {content.content_url}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
