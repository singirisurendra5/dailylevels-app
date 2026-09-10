import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Cashfree calls this URL directly (server-to-server) once a payment
// succeeds or fails — this is the ONLY place that is allowed to turn a
// subscription "active". The redirect back to /payment/callback in the
// browser is just for the trader's benefit; it is never trusted on its
// own, because a redirect can be faked or interrupted.
//
// Set this route's full URL (https://yourdomain.vercel.app/api/cashfree/webhook)
// in the Cashfree dashboard under Developers -> Webhooks, subscribed to
// the PAYMENT_SUCCESS_WEBHOOK and PAYMENT_FAILED_WEBHOOK events.
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") || "";
  const timestamp = req.headers.get("x-webhook-timestamp") || "";

  const expectedSignature = crypto
    .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
    .update(timestamp + rawBody)
    .digest("base64");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const orderId = payload?.data?.order?.order_id;
  const paymentStatus = payload?.data?.payment?.payment_status; // "SUCCESS" | "FAILED" | ...
  if (!orderId) {
    return NextResponse.json({ ok: true }); // nothing we can act on
  }

  const admin = supabaseAdmin();
  const { data: rows } = await admin
    .from("subscriptions")
    .select("*")
    .eq("cf_order_id", orderId)
    .limit(1);
  const sub = rows && rows[0];
  if (!sub) {
    return NextResponse.json({ ok: true });
  }

  if (paymentStatus === "SUCCESS") {
    const validUntil = new Date();
    if (sub.plan === "yearly") {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1);
    }
    await admin
      .from("subscriptions")
      .update({ status: "active", valid_until: validUntil.toISOString() })
      .eq("id", sub.id);
  } else if (paymentStatus) {
    await admin
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("id", sub.id);
  }

  return NextResponse.json({ ok: true });
}
