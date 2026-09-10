// The ladder: today's opening price, and the resistance/support levels
// around it. Kept in one file so both the calculator page and (later,
// if you add server-side checks) any API route use the exact same math.

export const LEVELS = [
  { key: "r4", label: "Resistance 4", mult: 1.0112, side: "sell" },
  { key: "r3", label: "Resistance 3", mult: 1.0084, side: "sell" },
  { key: "r2", label: "Resistance 2", mult: 1.0056, side: "sell" },
  { key: "r1", label: "Resistance 1", mult: 1.0028, side: "sell" },
  { key: "open", label: "Open", mult: 1, side: "open" },
  { key: "s1", label: "Support 1", mult: 0.9972, side: "buy" },
  { key: "s2", label: "Support 2", mult: 0.9944, side: "buy" },
  { key: "s3", label: "Support 3", mult: 0.9916, side: "buy" },
  { key: "s4", label: "Support 4", mult: 0.9888, side: "buy" },
];

export function computeLevels(openPrice) {
  return LEVELS.map((l) => ({ ...l, price: openPrice * l.mult }));
}

export function formatINR(n) {
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const PLAN_PRICES = {
  monthly: { amount: 499, label: "₹499", period: "per month" },
  yearly: { amount: 1999, label: "₹1999", period: "per year" },
};
