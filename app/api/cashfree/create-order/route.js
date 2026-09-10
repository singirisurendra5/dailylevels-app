import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { PLAN_PRICES } from "../../../../lib/levels";

// Called from the browser after a trader picks a plan. Creates the
// Cashfree order server-side (so the secret key never reaches the
// browser) and records a "pending" subscription row that the webhook
// will flip to "active" once Cashfree confirms the payment.
export async function POST(req) {
  try {
    const { plan, phone } = await req.json();

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { error: "A valid 10-digit phone number is required by Cashfree" },
        { status: 400 }
      );
    }

    // Identify the signed-in trader from the Supabase access token the
    // browser sends in the Authorization header.
    const accessToken = (req.headers.get("authorization") || "").replace(
      "Bearer ",
      ""
    );
    if (!accessToken) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: userData, error: userError } = await anon.auth.getUser(
      accessToken
    );
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const user = userData.user;

    const orderId = `sub_${plan}_${Date.now()}_${user.id.slice(0, 8)}`;
    const amount = PLAN_PRICES[plan].amount;

    const cfRes = await fetch(`${process.env.CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2026-01-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_email: user.email,
          customer_phone: phone.replace(/\D/g, "").slice(-10),
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/callback?order_id={order_id}`,
        },
        order_note: `plan:${plan}`,
      }),
    });

    const cfData = await cfRes.json();
    if (!cfRes.ok) {
      return NextResponse.json(
        { error: cfData.message || "Cashfree order creation failed" },
        { status: 502 }
      );
    }

    const admin = supabaseAdmin();
    const { error: insertError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      plan,
      status: "pending",
      cf_order_id: orderId,
    });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      payment_session_id: cfData.payment_session_id,
      order_id: orderId,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
