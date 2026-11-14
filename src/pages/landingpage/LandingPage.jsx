import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import "./PricingPlan.css";
import PublicAccountActions from "../../components/PublicAccountActions";

const viewerUrl = (process.env.REACT_APP_VIEWER_URL || "https://mirror.bigburry.com").replace(/\/+$/, "");

const applications = [
  {
    number: "01",
    title: "Menus that stay in sync",
    text: "Update daily specials, prices and promotions once. Keep every screen across your restaurant or hotel current.",
    icon: "☷",
    tag: "HOSPITALITY",
  },
  {
    number: "02",
    title: "Stream content to any display",
    text: "Turn TVs and connected displays into digital signage for campaigns, announcements, videos and branded content.",
    icon: "▶",
    tag: "CONTENT STREAMING",
  },
  {
    number: "03",
    title: "Keep waiting rooms moving",
    text: "Show queue tickets, now-serving numbers and helpful updates wirelessly on screens throughout your hospital or clinic.",
    icon: "＋",
    tag: "HEALTHCARE",
  },
  {
    number: "04",
    title: "Manage ads and promotions",
    text: "Keep campaigns fresh across your displays, from retail promotions to lobby notices, classroom updates and office announcements.",
    icon: "↗",
    tag: "AD MANAGEMENT",
  },
];

function Arrow({ diagonal = false }) {
  return <span aria-hidden="true" className="ml-arrow">{diagonal ? "↗" : "→"}</span>;
}

function ScreenVisual() {
  return (
    <div className="ml-visual" aria-label="Preview of content playing on a MirrorLink display">
      <div className="ml-visual-top"><span className="ml-live-dot" /> LIVE DISPLAY <span className="ml-visual-time">SCREEN 04 · CONNECTED</span></div>
      <div className="ml-screen">
        <div className="ml-screen-copy">
          <span className="ml-screen-eyebrow">TODAY AT THE TABLE</span>
          <strong>Good food.<br />Good company.</strong>
          <span className="ml-screen-sub">A little something for everyone.</span>
          <span className="ml-screen-cta">EXPLORE THE MENU <Arrow /></span>
        </div>
        <div className="ml-food-art" aria-hidden="true">
          <div className="ml-plate"><div className="ml-food"><i /><i /><i /><i /><b /><b /><b /></div></div>
          <span className="ml-art-leaf ml-leaf-one">✳</span><span className="ml-art-leaf ml-leaf-two">✳</span>
        </div>
      </div>
      <div className="ml-visual-bottom"><span>MENU · LUNCH</span><span><i /> PLAYING NOW</span></div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="ml-landing">
      <header className="ml-nav">
        <a className="ml-brand" href="#top" aria-label="MirrorLink home"><span className="ml-brand-mark">M</span><span>MirrorLink</span></a>
        <nav className="ml-nav-links" aria-label="Main navigation">
          <a href="#applications">What you can do</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
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
              <Link className="ml-button ml-button-dark" to="/login">Open control panel <Arrow /></Link>
              <a className="ml-button ml-button-light" href={viewerUrl} target="_blank" rel="noreferrer">Open viewer <Arrow diagonal /></a>
            </div>
            <div className="ml-hero-note"><span className="ml-note-line" /> One place to manage. Any screen to share.</div>
          </div>
          <div className="ml-hero-art"><ScreenVisual /><div className="ml-float-card"><span className="ml-float-icon">↗</span><span><strong>Updated everywhere</strong><small>Your screens stay in sync</small></span><span className="ml-float-check">✓</span></div><div className="ml-hero-index">01 / 04</div></div>
        </section>

        <section className="ml-proof" aria-label="MirrorLink benefits">
          <span>MADE FOR REAL-WORLD SPACES</span><i /> <span>MANAGE CONTENT FROM ONE PLACE</span><i /> <span>PLAY IT WIRELESSLY</span>
        </section>

        <section className="ml-applications" id="applications">
          <div className="ml-section-head"><div><div className="ml-eyebrow"><span /> ONE PLATFORM, MANY POSSIBILITIES</div><h2>Make every screen<br />work harder.</h2></div><p>From the front desk to the dining room, MirrorLink helps you share useful, timely information on the displays you already have.</p></div>
          <div className="ml-app-grid">{applications.map((item) => <article className="ml-app-card" key={item.number}><div className="ml-card-top"><span className="ml-card-number">{item.number}</span><span className="ml-card-icon">{item.icon}</span></div><div className="ml-card-tag">{item.tag}</div><h3>{item.title}</h3><p>{item.text}</p><a href="#how-it-works" aria-label={`Learn how ${item.title.toLowerCase()} works`}>See how it works <Arrow /></a></article>)}</div>
        </section>

        <section className="ml-plan" id="pricing"><div className="ml-plan-intro"><div className="ml-eyebrow"><span /> ONE PLAN. EVERYTHING INCLUDED.</div><h2>Room to grow,<br />built right in.</h2><p>One straightforward subscription for your whole display network. No per-screen add-ons.</p></div><div className="ml-plan-label"><Link className="ml-button ml-button-dark" to="/pricing">Subscribe now <Arrow /></Link></div></section>

        <section className="ml-how" id="how-it-works"><div className="ml-how-left"><div className="ml-eyebrow"><span /> SIMPLE BY DESIGN</div><h2>From control<br />to screen.</h2><p>Organize your displays, choose what to show, and let MirrorLink take care of the connection.</p><Link className="ml-button ml-button-light" to="/login">Get started <Arrow /></Link></div><div className="ml-steps"><div className="ml-step"><span>01</span><div><h3>Set up your screens</h3><p>Connect a display and give it a place in your workspace.</p></div><span className="ml-step-icon">▣</span></div><div className="ml-step"><span>02</span><div><h3>Choose what to show</h3><p>Arrange menus, videos, announcements or queue updates.</p></div><span className="ml-step-icon">▤</span></div><div className="ml-step"><span>03</span><div><h3>Keep everything current</h3><p>Make an update in the control panel and share it with your screens.</p></div><span className="ml-step-icon">↗</span></div></div></section>

        <section className="ml-final-cta"><div><div className="ml-eyebrow"><span /> READY WHEN YOU ARE</div><h2>Let's get your screens<br />connected.</h2></div><div className="ml-final-actions"><Link className="ml-button ml-button-dark" to="/login">Go to control panel <Arrow /></Link><a className="ml-text-link" href={viewerUrl} target="_blank" rel="noreferrer">Go to viewer <Arrow diagonal /></a></div></section>
      </main>

      <footer className="ml-footer"><a className="ml-brand" href="#top"><span className="ml-brand-mark">M</span><span>MirrorLink</span></a><span>Wireless display management.</span><div><Link to="/login">Control panel</Link><a href={viewerUrl} target="_blank" rel="noreferrer">Viewer</a><span>© {new Date().getFullYear()} MirrorLink</span></div></footer>
    </div>
  );
}
