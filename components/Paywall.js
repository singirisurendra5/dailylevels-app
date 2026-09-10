"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { PLAN_PRICES } from "../lib/levels";

export default function Paywall({ onLogout }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired — please log in again.");

      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: selectedPlan, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");

      if (!window.Cashfree) {
        throw new Error("Payment SDK still loading — try again in a moment.");
      }
      const mode = process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox";
      const cashfree = new window.Cashfree({ mode });
      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="card center-card">
      <span className="big-icon">🔒</span>
      <h3>Subscribe to unlock</h3>
      <p className="copy">
        See resistance and support levels for every instrument you track.
      </p>

      {!selectedPlan ? (
        <>
          <div className="plan-grid">
            <button
              type="button"
              className="plan-btn"
              onClick={() => setSelectedPlan("monthly")}
            >
              <span className="pb-amount mono">{PLAN_PRICES.monthly.label}</span>
              <span className="pb-period">{PLAN_PRICES.monthly.period}</span>
            </button>
            <button
              type="button"
              className="plan-btn"
              onClick={() => setSelectedPlan("yearly")}
            >
              <span className="pb-save">save ~67%</span>
              <span className="pb-amount mono">{PLAN_PRICES.yearly.label}</span>
              <span className="pb-period">{PLAN_PRICES.yearly.period}</span>
            </button>
          </div>
          {onLogout && (
            <button type="button" className="link-btn" onClick={onLogout}>
              log out
            </button>
          )}
        </>
      ) : (
        <form className="form-col" onSubmit={pay}>
          <p className="copy">
            Paying {PLAN_PRICES[selectedPlan].label}{" "}
            {PLAN_PRICES[selectedPlan].period}. Cashfree needs a phone number
            for the payment receipt.
          </p>
          <input
            type="tel"
            placeholder="10-digit phone number"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Starting payment…" : `Pay ${PLAN_PRICES[selectedPlan].label}`}
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => setSelectedPlan(null)}
          >
            ← back to plans
          </button>
        </form>
      )}
    </div>
  );
}
