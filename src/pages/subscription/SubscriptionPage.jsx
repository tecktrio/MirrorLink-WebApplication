import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import { GET_SUBSCRIPTION_DETAILS } from "../../serverRequests/ServerRequests";
import "./SubscriptionPage.css";

const formatDate = (timestamp) => {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return "Not available yet";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(value * 1000));
};

export default function SubscriptionPage() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loginKey = Cookies.get("login_key");
    if (!loginKey) {
      setError("Sign in to view your account subscription.");
      setLoading(false);
      return;
    }
    GET_SUBSCRIPTION_DETAILS(loginKey)
      .then(setDetails)
      .catch((requestError) => setError(requestError.message || "Could not load subscription details."))
      .finally(() => setLoading(false));
  }, []);

  const plan = details?.plan || {};
  const subscription = details?.subscription || {};
  const active = Boolean(details?.plan_active);
  const renewalDate = formatDate(subscription.charge_at || subscription.current_end);
  const billingPeriod = plan.period === "monthly" ? "month" : (plan.period || "month");
  const price = "₹12,999";

  return (
    <section className="ml-subscription-page">
      <div className="ml-subscription-heading">
        <div className="ml-eyebrow"><span /> ACCOUNT &amp; BILLING</div>
        <h1>Subscription</h1>
        <p>View your MirrorLink account status, current plan and next renewal.</p>
      </div>

      {loading ? <div className="ml-subscription-notice">Loading your subscription details…</div> : null}
      {error ? <div className="ml-subscription-notice ml-subscription-error" role="alert">{error}</div> : null}

      {!loading && !error && (
        <>
          <article className={`ml-subscription-status ${active ? "is-active" : "is-inactive"}`}>
            <span className="ml-subscription-status-icon" aria-hidden="true">{active ? "✓" : "!"}</span>
            <div><span>ACCOUNT STATUS</span><strong>{active ? "Active" : (subscription.status ? subscription.status.replaceAll("_", " ") : "No active subscription")}</strong></div>
            {!active && <Link to="/pricing">View plans <span aria-hidden="true">→</span></Link>}
          </article>

          <article className="ml-subscription-card">
            <div className="ml-subscription-card-head">
              <div><span className="ml-subscription-kicker">CURRENT PLAN</span><h2>{subscription.plan_name || plan.name || "MirrorLink Business"}</h2></div>
              <span className={`ml-subscription-pill ${active ? "is-active" : "is-inactive"}`}>{active ? "ACTIVE" : "INACTIVE"}</span>
            </div>
            <div className="ml-subscription-price">{price}<small> / {billingPeriod}</small></div>
            <div className="ml-subscription-details">
              <div><span>Next renewal</span><strong>{renewalDate}</strong>{renewalDate === "Not available yet" && <small>Razorpay has not provided the next billing date yet.</small>}</div>
              <div><span>Billing frequency</span><strong>{plan.interval > 1 ? `Every ${plan.interval} ${billingPeriod}s` : `${billingPeriod[0].toUpperCase()}${billingPeriod.slice(1)}`}</strong></div>
              <div><span>Subscription status</span><strong className="capitalize">{subscription.status || "Not subscribed"}</strong></div>
              {subscription.paid_count !== undefined && <div><span>Payments completed</span><strong>{subscription.paid_count}{subscription.total_count ? ` of ${subscription.total_count}` : ""}</strong></div>}
            </div>
            {subscription.razorpay_subscription_id && <p className="ml-subscription-reference">Subscription reference: {subscription.razorpay_subscription_id}</p>}
          </article>

          <div className="ml-subscription-footnote">Plan and renewal details are synced from your MirrorLink billing record.</div>
        </>
      )}
    </section>
  );
}
