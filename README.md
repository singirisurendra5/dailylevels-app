# DailyLevels — setup guide

This is a real, deployable version of the calculator: traders sign up, subscribe
through Cashfree, and get access for the length of their plan. It has three
moving parts you'll need accounts for — **Supabase** (login + database),
**Cashfree** (payments), and **Vercel** (hosting) — plus **GitHub** to connect
the code to Vercel. None of these need coding experience to set up; follow the
steps in order.

Budget about 45–60 minutes for the first setup.

## 1. Supabase (accounts + subscription database)

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project
   (pick any name and a strong database password — save that password somewhere).
2. Once the project is ready, open **SQL Editor** in the left sidebar → **New query**.
3. Open `supabase/schema.sql` from this project, copy its contents, paste into
   the SQL editor, and click **Run**. This creates the `subscriptions` table.
4. Go to **Project Settings → API**. You'll need three values from this page later:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — keep
     this one secret, never put it in any file that goes to GitHub.
5. (Optional, speeds up testing) Go to **Authentication → Providers → Email**
   and turn off "Confirm email" so test accounts can log in immediately without
   clicking an email link. Turn it back on before you launch for real.

## 2. Cashfree (payments)

1. Go to [cashfree.com](https://www.cashfree.com) and sign up as a merchant.
   You can start testing immediately in **Sandbox/Test mode** before your
   business KYC is approved for live payments.
2. In the Cashfree dashboard, go to **Developers → API Keys** and switch to
   **Test Mode**. Copy:
   - **App ID** → `CASHFREE_APP_ID`
   - **Secret Key** → `CASHFREE_SECRET_KEY`
3. Leave `CASHFREE_BASE_URL` as the sandbox URL in `.env.local.example` for now.
4. You'll add the **webhook URL** in Cashfree only after your first deploy to
   Vercel (step 4 below), because you need your live site address first.
5. When your KYC is approved and you're ready to accept real payments, switch
   the dashboard to **Live Mode**, copy the live App ID/Secret Key, and update
   the same environment variables in Vercel (`CASHFREE_BASE_URL` becomes
   `https://api.cashfree.com/pg`, `NEXT_PUBLIC_CASHFREE_MODE` becomes
   `production`).

## 3. Push this code to GitHub

1. Go to [github.com](https://github.com), sign up if you don't have an
   account, and create a **new empty repository** (e.g. `dailylevels-app`) —
   don't add a README or .gitignore when creating it, since this project
   already has them.
2. On your computer (or wherever you have this project folder), open a
   terminal in this folder and run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/dailylevels-app.git
   git push -u origin main
   ```
   (Replace the URL with the one GitHub shows you after creating the repo.)

## 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com), sign up (you can sign up directly
   with your GitHub account, which makes this step easier).
2. Click **Add New → Project**, and import the GitHub repo you just pushed.
3. Before clicking Deploy, open **Environment Variables** and add every
   value from `.env.local.example`, filled in with your real values from
   steps 1–2 above. Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL Vercel shows
   you on this screen (e.g. `https://dailylevels-app.vercel.app`) — you may need
   to deploy once first to learn the exact URL, then edit this one variable
   and redeploy.
4. Click **Deploy**. After it finishes, open the live URL to confirm the page
   loads.
5. Back in the Cashfree dashboard, go to **Developers → Webhooks**, add a
   new webhook pointing to:
   ```
   https://YOUR-VERCEL-DOMAIN/api/cashfree/webhook
   ```
   and subscribe it to the `PAYMENT_SUCCESS_WEBHOOK` and
   `PAYMENT_FAILED_WEBHOOK` events.

## 5. Test the full flow

1. Open your live site, create a test trader account, and subscribe using
   [Cashfree's test card/UPI details](https://www.cashfree.com/docs/payments/online/resources/test-cards)
   (real money is never charged in Test Mode).
2. After paying, you should land on a "confirming payment" screen for a
   couple of seconds, then be sent home with the calculator unlocked and
   the status pill showing your plan and valid-till date.
3. In Supabase, open **Table Editor → subscriptions** to see the row created
   for that payment — status should read `active`.

## Going live

Once you're ready for real traders and real money:
- Switch Cashfree to Live Mode and update the `CASHFREE_*` and
  `NEXT_PUBLIC_CASHFREE_MODE` environment variables in Vercel.
- Re-enable "Confirm email" in Supabase Authentication settings.
- Consider a custom domain in Vercel (**Project → Settings → Domains**)
  instead of the default `.vercel.app` address, and update
  `NEXT_PUBLIC_SITE_URL` and the Cashfree webhook URL to match.
- Revisit the SEBI compliance question before scaling up (auto price
  fetch, per-stock alerts, etc. change the risk profile — see your earlier
  conversation with Claude about this).

## What's intentionally NOT built yet

- Auto price fetch, price alerts, and multi-stock coverage — queued for
  after launch, as discussed.
- Password reset flow (a trader who forgets their password currently has
  no self-serve way to reset it — Supabase supports this, it just isn't
  wired up in this first version).
- Any admin view of subscribers — for now, check the Supabase Table Editor
  directly.
