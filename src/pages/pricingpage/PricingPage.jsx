import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { SERVER_URL, GET_PLAN_DETAILS, CONVERT_CURRENCY } from "../../serverRequests/ServerRequests";
import "./PricingPage.css";
import PublicAccountActions from "../../components/PublicAccountActions";

const benefits = [
  "Up to 10 sites",
  "Up to 50 mirrors at each site",
  "Unlimited content on every mirror",
  "Unlimited logins for every mirror",
  "Menus, streaming, queue displays and ad management",
];

const ALLOWED_ORIGINS = [
  "https://payments.bigburry.com",
  "http://localhost:5173",
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [plan, setPlan] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [countries, setCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const popupRef = useRef(null);
  const pollTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Initial load: Fetch plan and predicted country pricing from server
  useEffect(() => {
    GET_PLAN_DETAILS()
      .then((res) => {
        if (res) {
          if (res.plan) setPlan(res.plan);
          if (res.conversion) {
            setConversion(res.conversion);
            setSearchQuery(res.conversion.country || "");
          }
          if (Array.isArray(res.countries)) {
            setCountries(res.countries);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load dynamic plan details:", err);
      });
  }, []);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCountry = async (selectedCountry) => {
    setSearchQuery(selectedCountry.name);
    setIsDropdownOpen(false);
    setIsConverting(true);

    try {
      const res = await CONVERT_CURRENCY(selectedCountry.code, selectedCountry.name);
      if (res && res.conversion) {
        setConversion(res.conversion);
      }
    } catch (err) {
      console.warn("Currency conversion request failed:", err);
    } finally {
      setIsConverting(false);
    }
  };

  const filteredCountries = countries.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q)
    );
  });

  const cleanupPopup = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  };

  useEffect(() => {
    const handleMessage = async (event) => {
      // 1. Strict Origin Verification
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;

      const data = event.data || {};

      // 2. Handle Success
      if (data.type === "PAYMENT_SUCCESS") {
        cleanupPopup();
        const loginKey = Cookies.get("login_key");
        const orderId = data.orderId || data.order_id;
        const paymentId = data.paymentId || data.payment_id;
        const signature = data.signature || "";

        try {
          const verified = await fetch(`${SERVER_URL}Billing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              service: "verify_subscription",
              login_key: loginKey,
              order_id: orderId,
              payment_id: paymentId,
              signature: signature,
            }),
          });
          const result = await verified.json();
          if (!verified.ok) {
            throw new Error(result.status_text || "Payment verification failed.");
          }
          setMessage("Payment successful! Your MirrorLink subscription is now active.");
          setMessageType("success");
        } catch (error) {
          setMessage(error.message || "Could not verify payment with server.");
          setMessageType("error");
        } finally {
          setLoading(false);
        }
      }

      // 3. Handle Failure
      if (data.type === "PAYMENT_FAILURE") {
        cleanupPopup();
        setMessage(data.errorMsg || "Payment was not completed. You can try again.");
        setMessageType("error");
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      cleanupPopup();
    };
  }, []);

  const startSubscription = async () => {
    const loginKey = Cookies.get("login_key");
    if (!loginKey) {
      navigate("/login?next=/pricing");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${SERVER_URL}Billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "create_subscription",
          login_key: loginKey,
          country_code: conversion?.country_code || "IN",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.status_text || "Could not start checkout session.");
      if (!data.checkout_url) {
        setMessage(data.status_text || "Your subscription is already active.");
        setMessageType("success");
        setLoading(false);
        return;
      }

      // Centered popup window
      const width = 520;
      const height = 760;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.checkout_url,
        "BigBurryCheckout",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
      );

      if (!popup || popup.closed) {
        setLoading(false);
        setMessage("Popup was blocked by your browser. Please allow popups for this site to complete checkout.");
        setMessageType("error");
        return;
      }

      popupRef.current = popup;

      // Detect if user abruptly closes the checkout window
      pollTimerRef.current = setInterval(() => {
        if (popupRef.current && popupRef.current.closed) {
          cleanupPopup();
          setLoading(false);
        }
      }, 800);
    } catch (error) {
      setMessage(error.message || "Failed to initiate payment session.");
      setMessageType("error");
      setLoading(false);
    }
  };

  const displayCurrencySymbol = conversion ? conversion.symbol : "₹";
  const displayAmount = conversion
    ? Number(conversion.converted_amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : plan?.amount != null
    ? Number(plan.amount).toLocaleString("en-IN")
    : "18,900";
  const billingPeriod = plan?.period === "monthly" ? "month" : (plan?.period || "month");
  const isForeign = conversion && conversion.currency !== "INR";

  return (
    <div className="ml-pricing-page">
      <header className="ml-price-nav">
        <Link className="ml-price-brand" to="/"><span>M</span> MirrorLink</Link>
        <div className="ml-pricing-nav-right"><Link to="/">Back to home <b>↗</b></Link><PublicAccountActions /></div>
      </header>
      <main className="ml-pricing-main">
        <div className="ml-price-heading">
          <span>ONE SIMPLE SUBSCRIPTION</span>
          <h1>Everything your<br />screens need.</h1>
          <p>One plan with the full MirrorLink toolkit, ready to scale with your business.</p>
        </div>
        <section className="ml-price-card" aria-labelledby="ml-plan-title">
          <div className="ml-price-card-head">
            <div>
              <span className="ml-price-kicker">ALL-IN-ONE PLAN</span>
              <h2 id="ml-plan-title">{plan?.name || "MirrorLink Business"}</h2>
            </div>
            <span className="ml-included">EVERYTHING INCLUDED</span>
          </div>

          {/* Interactive Country Search & Currency Selector */}
          <div className="ml-country-selector" ref={dropdownRef}>
            <div className="ml-country-header">
              <span>PRICING REGION</span>
              {conversion?.country && (
                <span className="ml-country-detected-badge">
                  {conversion.country} ({conversion.currency})
                </span>
              )}
            </div>
            <div className="ml-country-search-wrap">
              <input
                type="text"
                className="ml-country-search-input"
                placeholder="Type to search country..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="ml-country-search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    setIsDropdownOpen(true);
                  }}
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {isDropdownOpen && (
              <div className="ml-country-dropdown">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className={`ml-country-option ${conversion?.country_code === c.code ? "is-selected" : ""}`}
                      onClick={() => handleSelectCountry(c)}
                    >
                      <span className="ml-country-option-name">{c.name}</span>
                      <span className="ml-country-option-meta">
                        {c.currency} ({c.symbol.trim()})
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="ml-country-empty">No matching countries found</div>
                )}
              </div>
            )}
          </div>

          <div className="ml-price-amount">
            <span>{displayCurrencySymbol}</span>
            {isConverting ? "..." : displayAmount}
            <small> / {billingPeriod}</small>
          </div>

          {isForeign && (
            <div className="ml-conversion-footnote">
              Base charge ₹18,900 / month · Converted at live rate (1 INR ≈ {conversion.rate.toFixed(4)} {conversion.currency})
            </div>
          )}

          <p className="ml-price-tax">Secure checkout handled by BigBurry Payments.</p>
          <div className="ml-price-rule" />
          <div className="ml-includes-title">YOUR SUBSCRIPTION INCLUDES</div>
          <ul>{benefits.map((benefit) => <li key={benefit}><span>✓</span>{benefit}</li>)}</ul>
          {message && <div className={`ml-billing-message ml-message-${messageType}`} role="status">{message}</div>}
          {Cookies.get("login_key") ? (
            <>
              <button className="ml-subscribe-button" type="button" onClick={startSubscription} disabled={loading}>{loading ? "Opening BigBurry checkout…" : "Subscribe with BigBurry Payments"}<span>→</span></button>
              <Link className="ml-skip-subscription" to="/setup">Skip subscription for now <span>Explore the control panel and build your setup first</span></Link>
            </>
          ) : (
            <>
              <Link className="ml-subscribe-button" to="/login?next=/pricing">Sign in to subscribe <span>→</span></Link>
              <Link className="ml-skip-subscription" to="/login?next=/setup">Skip subscription for now <span>Sign in to explore sites, mirrors and content</span></Link>
            </>
          )}
          <p className="ml-price-terms">By subscribing, you authorize monthly charges processed securely via the BigBurry Payments Gateway.</p>
        </section>
        <div className="ml-price-foot"><span>Secure checkout</span><i /> <span>Monthly recurring billing</span><i /> <Link to="/login">Already subscribed? Open control panel <b>↗</b></Link></div>
      </main>
      <footer className="ml-pricing-footer"><Link className="ml-price-brand" to="/"><span>M</span> MirrorLink</Link><small>Wireless display management.</small><a className="ml-footer-credit" href="https://bigburry.com" target="_blank" rel="noopener noreferrer">Made by Bigburry Hypersystems LLP</a></footer>
    </div>
  );
}
