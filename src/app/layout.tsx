import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

/**
 * ABC Diatype, self-hosted from /fonts. It carries both body and display —
 * the previous Inter + Jakarta pairing is gone, so nothing is fetched from
 * Google Fonts any more.
 *
 * Diatype ships no italic cut here, so `.display-accent` deliberately keeps its
 * serif fallback for the one italic word in the hero.
 */
const diatype = localFont({
  variable: "--font-diatype",
  display: "swap",
  src: [
    { path: "../../fonts/ABCDiatype-Thin.otf", weight: "100", style: "normal" },
    { path: "../../fonts/ABCDiatype-Light.otf", weight: "300", style: "normal" },
    { path: "../../fonts/ABCDiatype-Regular.otf", weight: "400", style: "normal" },
    { path: "../../fonts/ABCDiatype-Medium.otf", weight: "500", style: "normal" },
    { path: "../../fonts/ABCDiatype-Bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: {
    default: "GlobeTrotter — Plan multi-city trips, beautifully",
    template: "%s · GlobeTrotter",
  },
  description:
    "Build day-by-day itineraries across multiple cities, track every dollar against your budget, and share the finished plan with a single link.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${diatype.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow-lg)",
            },
          }}
        />
      </body>
    </html>
  );
}
