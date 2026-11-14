import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { SERVER_URL } from "../../serverRequests/ServerRequests";
import "./PricingPage.css";
import PublicAccountActions from "../../components/PublicAccountActions";

const benefits = [
  "Up to 10 sites",
  "Up to 50 mirrors at each site",
  "Unlimited content on every mirror",
  "Unlimited logins for every mirror",
  "Menus, streaming, queue displays and ad management",
];

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

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
        body: JSON.stringify({ service: "create_subscription", login_key: loginKey }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.status_text || "Could not start checkout.");
      if (!data.subscription_id) {
        setMessage(data.status_text || "Your subscription is already active.");
        setMessageType("success");
        setLoading(false);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay Checkout did not load. Check your connection and try again.");

      const checkout = new window.Razorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "MirrorLink",
        description: "MirrorLink Business · ₹12,999 per month",
        image: `${window.location.origin}/logo.png`,
        prefill: { name: Cookies.get("username") || "", email: "", contact: "" },
        theme: { color: "#080808" },
        handler: async (payment) => {
          try {
            const verified = await fetch(`${SERVER_URL}Billing`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                service: "verify_subscription",
                login_key: loginKey,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,
              }),
            });
            const result = await verified.json();
            if (!verified.ok) throw new Error(result.status_text || "Payment verification failed.");
            setMessage("Payment authorization verified. Razorpay will activate monthly billing when the subscription is active.");
            setMessageType("success");
          } catch (error) {
            setMessage(error.message);
            setMessageType("error");
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      checkout.on("payment.failed", (event) => {
        setMessage(event.error?.description || "Payment authorization was not completed. You can try again.");
        setMessageType("error");
        setLoading(false);
      });
      checkout.open();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <div className="ml-pricing-page">
      <header className="ml-price-nav">
        <Link className="ml-price-brand" to="/"><span>M</span> MirrorLink</Link>
        <div className="ml-pricing-nav-right"><Link to="/">Back to home <b>↗</b></Link><PublicAccountActions /></div>
      </header>
      <main className="ml-pricing-main">
        <div className="ml-price-heading"><span>ONE SIMPLE SUBSCRIPTION</span><h1>Everything your<br />screens need.</h1><p>One plan with the full MirrorLink toolkit, ready to scale with your business.</p></div>
        <section className="ml-price-card" aria-labelledby="ml-plan-title">
          <div className="ml-price-card-head"><div><span className="ml-price-kicker">ALL-IN-ONE PLAN</span><h2 id="ml-plan-title">MirrorLink Business</h2></div><span className="ml-included">EVERYTHING INCLUDED</span></div>
          <div className="ml-price-amount"><span>₹</span>12,999<small> / month</small></div>
          <p className="ml-price-tax">Recurring monthly billing securely handled by Razorpay.</p>
          <div className="ml-price-rule" />
          <div className="ml-includes-title">YOUR SUBSCRIPTION INCLUDES</div>
          <ul>{benefits.map((benefit) => <li key={benefit}><span>✓</span>{benefit}</li>)}</ul>
          {message && <div className={`ml-billing-message ml-message-${messageType}`} role="status">{message}</div>}
          {Cookies.get("login_key") ? (
            <>
              <button className="ml-subscribe-button" type="button" onClick={startSubscription} disabled={loading}>{loading ? "Opening secure checkout…" : "Subscribe with Razorpay"}<span>→</span></button>
              <Link className="ml-skip-subscription" to="/setup">Skip subscription for now <span>Explore the control panel and build your setup first</span></Link>
            </>
          ) : (
            <>
              <Link className="ml-subscribe-button" to="/login?next=/pricing">Sign in to subscribe <span>→</span></Link>
              <Link className="ml-skip-subscription" to="/login?next=/setup">Skip subscription for now <span>Sign in to explore sites, mirrors and content</span></Link>
            </>
          )}
          <p className="ml-price-terms">By subscribing, you authorize recurring monthly charges through Razorpay. Razorpay subscriptions support up to 120 monthly charges; renew after 10 years to continue.</p>
        </section>
        <div className="ml-price-foot"><span>Secure checkout</span><i /> <span>Monthly recurring billing</span><i /> <Link to="/login">Already subscribed? Open control panel <b>↗</b></Link></div>
      </main>
      <footer className="ml-pricing-footer"><Link className="ml-price-brand" to="/"><span>M</span> MirrorLink</Link><small>Wireless display management.</small></footer>
    </div>
  );
}
