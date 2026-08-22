import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Pairing frozen in docs/DESIGN_SYSTEM.md §3. Jakarta carries display weight,
// Inter carries UI and body. The starter's Geist pairing reads as developer-tool.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
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
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
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
