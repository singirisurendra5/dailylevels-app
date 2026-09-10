"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

// Cashfree redirects the trader's browser here after checkout. This page
// never unlocks anything by itself — it just polls the subscriptions
// table until the webhook (the only trusted source) has flipped the row
// to "active", then sends the trader home.
export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }
    let tries = 0;
    const interval = setInterval(async () => {
      tries += 1;
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("cf_order_id", orderId)
        .limit(1);
      const row = data && data[0];
      if (row?.status === "active") {
        clearInterval(interval);
        setStatus("active");
        setTimeout(() => router.replace("/"), 1200);
      } else if (row?.status === "expired") {
        clearInterval(interval);
        setStatus("failed");
      } else if (tries > 15) {
        clearInterval(interval);
        setStatus("timeout");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [orderId, router]);

  return (
    <div className="wrap">
      <div className="card center-card" style={{ marginTop: 60 }}>
        <span className="big-icon">⏳</span>
        {status === "checking" && (
          <p className="copy">Confirming your payment with Cashfree…</p>
        )}
        {status === "active" && (
          <p className="copy">Payment confirmed — unlocking your calculator…</p>
        )}
        {status === "failed" && (
          <p className="copy">
            Payment didn&apos;t go through. You can try again from the home
            page.
          </p>
        )}
        {status === "timeout" && (
          <p className="copy">
            Still confirming — this can take a minute on Cashfree&apos;s
            side. Refresh this page shortly, or check the home page.
          </p>
        )}
        {status === "error" && (
          <p className="copy">
            Missing order reference. Go back to the home page and try again.
          </p>
        )}
        <button className="link-btn" onClick={() => router.replace("/")}>
          ← back to home
        </button>
      </div>
    </div>
  );
}
