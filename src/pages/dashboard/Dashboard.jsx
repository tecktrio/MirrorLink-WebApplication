import React, { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { CookieContext } from "../../Contexts/CookieContext";
import { CHECK_PLAN } from "../../serverRequests/ServerRequests";
import PublicAccountActions from "../../components/PublicAccountActions";
import "./Dashboard.css";

export default function Dashboard() {
  const { getCookie } = useContext(CookieContext);
  const { pathname } = useLocation();
  const [planActive, setPlanActive] = useState(null);

  useEffect(() => {
    const loginKey = getCookie("login_key");
    if (!loginKey) return;
    CHECK_PLAN(loginKey).then((result) => setPlanActive(Boolean(result.plan_active))).catch(() => setPlanActive(null));
  }, [getCookie]);

  if (pathname === "/" || pathname === "/pricing") return <Outlet />;

  return (
    <div className="ml-console">
      <header className="ml-console-header">
        <div className="ml-console-header-inner">
          <Link to="/setup" className="ml-console-brand"><span>M</span><strong>MirrorLink</strong></Link>
          <nav className="ml-console-nav" aria-label="Control panel">
            <Link to="/setup">Sites</Link>
            <Link to="/manage_mirrors">Mirrors</Link>
            <Link to="/manage_contents">Content</Link>
            <Link to="/manage_menus">Menus</Link>
            <Link to="/subscription">Subscription</Link>
          </nav>
          <PublicAccountActions className="ml-console-account" />
        </div>
      </header>
      {planActive === false && (
        <div className="ml-explore-banner"><span><b>Explore mode</b> · Your setup is saved, but mirrors stay offline until you subscribe.</span><Link to="/pricing">View plan <b>→</b></Link></div>
      )}
      <main className="ml-console-main"><Outlet /></main>
      <footer className="ml-console-footer"><span>MirrorLink · Wireless display management</span><Link to="/subscription">Subscription details</Link></footer>
    </div>
  );
}
