import React, { useState } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import "./LandingPage.css";
import "./PricingPlan.css";
import PublicAccountActions from "../../components/PublicAccountActions";

const demoScreenUrl = "https://screen.bigburry.com?mirror_name=demo";
const viewerUrl = (process.env.REACT_APP_VIEWER_URL || "https://screen.bigburry.com").replace(/\/+$/, "");

const applications = [
  {
    number: "01",
    tag: "EVENTS & WEDDINGS",
    title: "Bride & groom photos and videos",
    text: "Show brides and grooms high-definition photos, romantic reels, and celebration videos live for guests during weddings and receptions.",
    icon: "♡",
  },
  {
    number: "02",
    tag: "RESTAURANTS & CAFETERIA",
    title: "Showing ads and dynamic menus",
    text: "Display chef specials, combo discounts, real-time prices, and mouth-watering promo ads across counters and dining areas.",
    icon: "☷",
  },
  {
    number: "03",
    tag: "PUBLIC LED SCREENS",
    title: "Public ad LED billboard screens",
    text: "Broadcast high-impact commercial campaigns, scheduled sponsor ads, and community notices on outdoor and indoor LED displays.",
    icon: "↗",
  },
  {
    number: "04",
    tag: "ANNUAL DAY & STAGE",
    title: "Annual day program bg displays",
    text: "Run captivating backdrop loops, event schedules, ceremony visual themes, and speaker intros for school or corporate annual day programs.",
    icon: "★",
  },
  {
    number: "05",
    tag: "CORPORATE & CONFERENCES",
    title: "Wireless presentations",
    text: "Stream keynote pitch decks, team slides, live briefings, and training materials cleanly to meeting room TVs without HDMI cables.",
    icon: "▶",
  },
  {
    number: "06",
    tag: "MANUFACTURING & LOGISTICS",
    title: "Manufacturing & logistics warnings",
    text: "Show real-time safety warnings, hazard alerts, shift dispatch quotas, forklift zone alerts, and factory floor KPI stats instantly.",
    icon: "⚠",
  },
  {
    number: "07",
    tag: "HEALTHCARE & CLINICS",
    title: "Healthcare for showing next ticket",
    text: "Display live queue numbers, next patient calling alerts, doctor room allocations, and waiting lounge guides in real time.",
    icon: "＋",
  },
  {
    number: "08",
    tag: "RETAIL & SHOWROOMS",
    title: "In-store product promos & flash sales",
    text: "Highlight trending collections, limited-time discount banners, brand video lookbooks, and new arrivals directly at the point of sale.",
    icon: "✦",
  },
];

function Arrow({ diagonal = false }) {
  if (diagonal) {
    return (
      <span aria-hidden="true" className="ml-arrow inline-flex items-center justify-center">
        <svg className="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17L17 7M7 7h10v10" />
        </svg>
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="ml-arrow inline-flex items-center justify-center">
      <svg className="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </span>
  );
}

function ScreenVisual() {
  return (
    <div className="ml-visual-wrapper">
      <div className="ml-visual" aria-label="Preview of content playing on a MirrorLink display">
        <div className="ml-screen p-0 bg-black overflow-hidden relative aspect-video">
          <iframe
            src={demoScreenUrl}
            title="ScreenPilot Live Display Demo"
            className="w-full h-full border-0 pointer-events-none"
            allow="autoplay; fullscreen; encrypted-media"
            loading="eager"
          />
        </div>
      </div>
      {/* Hardware Pedestal Stand for Hero Screen */}
      <div className="ml-tv-mount ml-hero-stand">
        <div className="ml-tv-neck ml-hero-neck" />
        <div className="ml-tv-base ml-hero-base" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const controlPanelPath = Cookies.get("login_key") ? "/setup" : "/login";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(demoScreenUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="ml-landing">
      <header className="ml-nav">
        <a className="ml-brand" href="#top" aria-label="ScreenPilot home"><img src="/logo.png" alt="ScreenPilot" className="h-12 sm:h-14 md:h-16 w-auto max-w-[280px] sm:max-w-[340px] md:max-w-[400px] object-contain" /></a>
        <a className="ml-brand" href="#top" aria-label="ScreenPilot by Bigburry home"><img src="/logo.png" alt="ScreenPilot by Bigburry - Cloud Screen Management" className="h-12 sm:h-14 md:h-16 w-auto max-w-[280px] sm:max-w-[340px] md:max-w-[400px] object-contain" /></a>
        <nav className="ml-nav-links" aria-label="Main navigation">
          <Link to="/pricing">Subscription plans</Link>
        </nav>
        <PublicAccountActions className="ml-nav-cta" />
      </header>

      <main id="top">
        <section className="ml-hero">
          <div className="ml-hero-copy">
            <div className="ml-eyebrow"><span /> WIRELESS DISPLAY MANAGEMENT</div>
            <h1>Your screens.<br /><span>In sync.</span></h1>
            <p className="ml-hero-description">Put the right content on every screen, wherever your business happens. Manage it all from one simple control panel.</p>
            <div className="ml-hero-actions">
              <Link className="ml-button ml-button-dark" to={controlPanelPath}>Open control panel <Arrow /></Link>
              <a className="ml-button ml-button-light" href={demoScreenUrl} target="_blank" rel="noreferrer">
                <div className="ml-hero-btn-col">
                  <span className="ml-hero-btn-title">Try in your screen</span>
                  <span className="ml-hero-btn-free">Free</span>
                </div>
                <Arrow diagonal />
              </a>
            </div>
            <div className="ml-hero-note"><span className="ml-note-line" /> One place to manage. Any screen to share.</div>
          </div>
          <div className="ml-hero-art"><ScreenVisual /><div className="ml-float-card"><span className="ml-float-icon">↗</span><span><strong>Updated everywhere</strong><small>Your screens stay in sync</small></span><span className="ml-float-check">✓</span></div><div className="ml-hero-index">01 / 04</div></div>
        </section>

        <section className="ml-proof" aria-label="ScreenPilot benefits">
          <span>MADE FOR REAL-WORLD SPACES</span><i /> <span>MANAGE CONTENT FROM ONE PLACE</span><i /> <span>PLAY IT WIRELESSLY</span>
        </section>

        {/* Interactive Multi-Screen Landscape Simulation */}
        <section className="ml-simulation-section" id="simulation" aria-label="Live Display Network Simulation">
          <div className="ml-sim-header">
            <div className="ml-eyebrow"><span /> LIVE MULTI-SCREEN SIMULATION</div>
            <h2>Broadcast across any screen.<br />All in landscape. In real time.</h2>
            <p>From huge video walls and medium digital displays to mobile screens in staff hands — see how one update syncs everywhere.</p>
          </div>

          {/* Device Mockups Stage (All in Landscape) */}
          <div className="ml-sim-stage">
            {/* 1. Large TV Mockup (Landscape 16:9, e.g. 75" Display) */}
            <div className="ml-mockup ml-mockup-large-tv">
              <div className="ml-mock-bezel">
                <div className="ml-mock-screen">
                  <iframe
                    src={demoScreenUrl}
                    title="Large TV Live Display"
                    className="w-full h-full border-0 pointer-events-none"
                    allow="autoplay; fullscreen; encrypted-media"
                    loading="eager"
                  />
                </div>
              </div>
              {/* Premium TV Stand for Large TV */}
              <div className="ml-tv-mount">
                <div className="ml-tv-neck" />
                <div className="ml-tv-base" />
              </div>
              <div className="ml-mock-caption">
                <strong>Large TV</strong>
                <span>Video Wall</span>
              </div>
            </div>

            {/* 2. Small TV / Secondary Display (Landscape 16:9, e.g. 32" Display) */}
            <div className="ml-mockup ml-mockup-small-tv">
              <div className="ml-mock-bezel">
                <div className="ml-mock-screen">
                  <iframe
                    src={demoScreenUrl}
                    title="Small TV Live Display"
                    className="w-full h-full border-0 pointer-events-none"
                    allow="autoplay; fullscreen; encrypted-media"
                    loading="lazy"
                  />
                </div>
              </div>
              {/* Premium TV Stand for Small TV */}
              <div className="ml-tv-mount ml-tv-mount-sm">
                <div className="ml-tv-neck ml-tv-neck-sm" />
                <div className="ml-tv-base ml-tv-base-sm" />
              </div>
              <div className="ml-mock-caption">
                <strong>Small TV</strong>
                <span>Counter / Booth</span>
              </div>
            </div>

            {/* 3. Mobile Device in Landscape with Desktop/Desk Cradle Stand */}
            <div className="ml-mockup ml-mockup-mobile">
              <div className="ml-mock-bezel ml-mock-mobile-bezel">
                <div className="ml-mobile-camera-notch" />
                <div className="ml-mock-screen">
                  <iframe
                    src={demoScreenUrl}
                    title="Mobile Live Display"
                    className="w-full h-full border-0 pointer-events-none"
                    allow="autoplay; fullscreen; encrypted-media"
                    loading="lazy"
                  />
                </div>
              </div>
              {/* Desktop Cradle / Kickstand for Mobile in Landscape */}
              <div className="ml-mobile-stand">
                <div className="ml-mobile-cradle-neck" />
                <div className="ml-mobile-cradle-base" />
              </div>
              <div className="ml-mock-caption">
                <strong>Mobile</strong>
                <span>Handheld</span>
              </div>
            </div>
          </div>

          {/* Actions: Copy Link & Try It Now */}
          <div className="ml-sim-actions-container">
            <button
              type="button"
              onClick={handleCopy}
              className="ml-demo-copy-btn"
              aria-label="Copy screen unique link"
            >
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              <span className="ml-copy-icon">{copied ? "✓" : "⎘"}</span>
            </button>
            <a
              href={demoScreenUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-demo-launch-btn"
            >
              <div className="ml-launch-text-col">
                <span className="ml-launch-title">Try it now</span>
                <span className="ml-launch-free">Free</span>
              </div>
              <Arrow diagonal />
            </a>
          </div>
        </section>

        <section className="ml-applications" id="applications">
          <div className="ml-section-head">
            <div>
              <div className="ml-eyebrow"><span /> REAL-WORLD VERSATILITY</div>
              <h2>Usecases</h2>
            </div>
          </div>
          <div className="ml-app-grid">
            {applications.map((item) => (
              <article className="ml-app-card" key={item.number}>
                <div className="ml-card-top">
                  <span className="ml-card-number">{item.number}</span>
                  <span className="ml-card-icon">{item.icon}</span>
                </div>
                <div className="ml-card-tag">{item.tag}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a href="#how-it-works" aria-label={`Learn how ${item.title.toLowerCase()} works`}>
                  See how it works <Arrow />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="ml-plan" id="pricing">
          <div className="ml-plan-intro">
            <div className="ml-eyebrow"><span /> TRANSPARENT PLANS. EVERYTHING INCLUDED.</div>
            <h2>Room to grow,<br />built right in.</h2>
            <p>Start free with 1 site, 1 mirror, and unlimited content, or choose Business for your entire display network.</p>
          </div>
          <div className="ml-plan-label">
            <Link className="ml-button ml-button-dark" to="/pricing">
              <span>View subscription plans</span>
              <Arrow />
            </Link>
          </div>
        </section>

        <section className="ml-how" id="how-it-works">
          <div className="ml-how-left">
            <div className="ml-eyebrow"><span /> SIMPLE BY DESIGN</div>
            <h2>From control<br />to screen.</h2>
            <p>Organize your displays, choose what to show, and let ScreenPilot take care of the connection.</p>
            <Link className="ml-button ml-button-light" to={controlPanelPath}>Get started <Arrow /></Link>
          </div>
          <div className="ml-steps">
            <div className="ml-step">
              <span className="ml-step-number">01</span>
              <div className="ml-step-content">
                <h3>Set up your screens</h3>
                <p>Copy your screen unique link and search it on any of the browsers in your screens.</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-step-copy-link-btn"
                  aria-label="Copy screen link"
                >
                  <span className="ml-copy-icon">{copied ? "✓" : "⎘"}</span>
                  <span>{copied ? "Link Copied!" : "Copy screen link"}</span>
                </button>
              </div>
              <span className="ml-step-icon" aria-hidden="true">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="7" y="7" width="10" height="10" fill="currentColor" fillOpacity="0.25" />
                </svg>
              </span>
            </div>
            <div className="ml-step">
              <span className="ml-step-number">02</span>
              <div className="ml-step-content">
                <h3>Choose what to show</h3>
                <p>Arrange menus, videos, announcements or queue updates.</p>
              </div>
              <span className="ml-step-icon" aria-hidden="true">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="17" y2="16" />
                </svg>
              </span>
            </div>
            <div className="ml-step">
              <span className="ml-step-number">03</span>
              <div className="ml-step-content">
                <h3>Keep everything current</h3>
                <p>Make an update in the control panel and share it with your screens.</p>
              </div>
              <span className="ml-step-icon" aria-hidden="true">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </span>
            </div>
          </div>
        </section>

        <section className="ml-final-cta"><div><div className="ml-eyebrow"><span /> READY WHEN YOU ARE</div><h2>Let's get your screens<br />connected.</h2></div><div className="ml-final-actions"><Link className="ml-button ml-button-dark" to={controlPanelPath}>Go to control panel <Arrow /></Link><a className="ml-text-link" href={demoScreenUrl} target="_blank" rel="noreferrer">Try in your screen <Arrow diagonal /></a></div></section>
      </main>

      <footer className="ml-footer"><a className="ml-brand" href="#top"><img src="/logo.png" alt="ScreenPilot" className="h-10 sm:h-12 w-auto max-w-[220px] sm:max-w-[260px] object-contain" /></a><span>Wireless display management.</span><div><Link to={controlPanelPath}>Control panel</Link><a href={viewerUrl} target="_blank" rel="noreferrer">Viewer</a><span>© {new Date().getFullYear()} ScreenPilot</span><a className="ml-footer-credit" href="https://bigburry.com" target="_blank" rel="noopener noreferrer">Made by Bigburry Hypersystems LLP</a></div></footer>
    </div>
  );
}
