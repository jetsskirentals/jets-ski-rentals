import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Jet's Ski Rentals | Book Your Jet Ski Adventure",
  description:
    "Reserve your jet ski online in seconds. Choose your date, pick your ride, and hit the waves! Serving Freeport, FL and the Emerald Coast with top-quality jet ski rentals.",
  keywords: "jet ski rental, jet ski booking, water sports, Freeport FL, Emerald Coast, jet ski near me",
  openGraph: {
    title: "Jet's Ski Rentals | Book Your Jet Ski Adventure",
    description: "Reserve your jet ski online in seconds. Choose your date, pick your ride, and hit the waves!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
