"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AuthPanel from "../components/AuthPanel";
import Paywall from "../components/Paywall";
import Calculator from "../components/Calculator";
import { PLAN_PRICES } from "../lib/levels";

export default function Home() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [activeSub, setActiveSub] = useState(undefined); // undefined = loading, null = none active

  const checkSubscription = useCallback(async (currentSession) => {
    if (!currentSession) {
      setActiveSub(null);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .gt("valid_until", new Date().toISOString())
      .order("valid_until", { ascending: false })
      .limit(1);
    setActiveSub(data && data[0] ? data[0] : null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkSubscription(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      checkSubscription(s);
    });
    return () => listener.subscription.unsubscribe();
  }, [checkSubscription]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const loading = session === undefined || activeSub === undefined;

  return (
    <div className="wrap">
      <header className="masthead">
        <div>
          <p className="brand-mark">DailyLevels</p>
          <p className="eyebrow">Opening price → today&apos;s levels</p>
          <h1>Daily Index Levels of Any Market</h1>
          <p className="tagline">
            Enter today&apos;s opening price — get the resistance and support
            levels for the session, instantly.
          </p>
          <p className="book-credit">
            From <b>The Singiri&apos;s Book</b> series
          </p>
        </div>

        {!loading && session && (
          <div className={`status-pill${activeSub ? " unlocked" : ""}`}>
            {activeSub ? (
              <span>
                ✓ Subscribed ·{" "}
                {activeSub.plan === "yearly" ? "Yearly" : "Monthly"} — valid
                till{" "}
                {new Date(activeSub.valid_until).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            ) : (
              <span>🔒 Not subscribed</span>
            )}
            <button className="reset-link" onClick={handleLogout}>
              log out
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <p className="loading-line">Loading…</p>
      ) : !session ? (
        <AuthPanel />
      ) : !activeSub ? (
        <Paywall onLogout={handleLogout} />
      ) : (
        <Calculator />
      )}

      <section className="pricing">
        <p className="section-eyebrow">Subscription</p>
        <h2>Plans</h2>
        <p className="sub">
          Paid only — no free tier. One payment unlocks the calculator for
          the plan&apos;s full term.
        </p>
        <div className="price-grid">
          <div
            className={`price-card${
              activeSub?.plan === "monthly" ? " is-current" : ""
            }`}
          >
            {activeSub?.plan === "monthly" && (
              <span className="current-pill">Active</span>
            )}
            <h3>Monthly</h3>
            <div className="amount">
              {PLAN_PRICES.monthly.label}
              <span>/month</span>
            </div>
            <p className="amount-note">Valid for 1 month from payment</p>
            <ul>
              <li>Every instrument you track, no limit</li>
              <li>
                Full resistance & support levels, the moment you enter the
                open
              </li>
              <li>New markets added as they launch</li>
            </ul>
          </div>
          <div
            className={`price-card${
              activeSub?.plan === "yearly" ? " is-current" : ""
            }`}
          >
            {activeSub?.plan === "yearly" && (
              <span className="current-pill">Active</span>
            )}
            <h3>Yearly</h3>
            <div className="amount">
              {PLAN_PRICES.yearly.label}
              <span>/year</span>
            </div>
            <p className="amount-note">
              ≈ ₹167/month · valid for 1 year from payment
            </p>
            <ul>
              <li>Every instrument you track, no limit</li>
              <li>
                Full resistance & support levels, the moment you enter the
                open
              </li>
              <li>New markets added as they launch</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="page-footer">
        Educational tool from The Singiri&apos;s Book series — not
        investment advice. Every level above is calculated automatically the
        moment you enter today&apos;s opening price; rejection still has to
        be confirmed candle-by-candle, and it&apos;s worth backtesting on
        your own charts before trading any instrument. If a level fakes
        through before reversing, move your stop to that swing&apos;s high
        or low instead of the original rejection candle.
      </footer>
    </div>
  );
}
