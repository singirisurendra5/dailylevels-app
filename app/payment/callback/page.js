import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="wrap">
          <p className="loading-line">Loading…</p>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
