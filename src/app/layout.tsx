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
    "Reserve your jet ski online in seconds. Choose your date, pick your ride, and hit the waves! Serving Freeport, Destin, Panama City Beach, and the Emerald Coast with top-quality jet ski rentals.",
  keywords: "jet ski rental, jet ski booking, water sports, Freeport FL, Destin FL, Panama City Beach FL, Emerald Coast, jet ski near me",
  openGraph: {
    title: "Jet's Ski Rentals | Book Your Jet Ski Adventure",
    description: "Reserve your jet ski online in seconds. Choose your date, pick your ride, and hit the waves!",
    type: "website",
    url: "https://getwetwithjet.com",
    images: [
      {
        url: "https://getwetwithjet.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jet's Ski Rentals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jet's Ski Rentals | Book Your Jet Ski Adventure",
    description: "Reserve your jet ski online in seconds. Choose your date, pick your ride, and hit the waves!",
    images: ["https://getwetwithjet.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
