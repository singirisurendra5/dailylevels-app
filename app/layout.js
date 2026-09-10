import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "DailyLevels — Daily Index Levels",
  description:
    "Enter any market's opening price to get instant resistance and support levels.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        {children}
        {/* Cashfree's checkout SDK — only used once a trader clicks Pay */}
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
