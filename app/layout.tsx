import type { Metadata } from "next";
import { DM_Sans, Public_Sans, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const queens = localFont({
  variable: "--font-queens",
  display: "swap",
  src: [
    { path: "../public/fonts/QueensCompressedTrial-Air.ttf", weight: "200", style: "normal" },
    { path: "../public/fonts/QueensCompressedTrial-AirItalic.ttf", weight: "200", style: "italic" },
    { path: "../public/fonts/QueensCompressedTrial-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/QueensCompressedTrial-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "../public/fonts/QueensCompressedTrial-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/QueensCompressedTrial-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/QueensCompressedTrial-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/QueensCompressedTrial-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "../public/fonts/QueensCompressedTrial-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../public/fonts/QueensCompressedTrial-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "Together — What can we solve together?",
  description:
    "Together is a Neverfound venture exploring how teams collaborate with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${publicSans.variable} ${inter.variable} ${queens.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}

        {/* Corner-rounding filter for the Morph Train loader (app/_components/
            MorphTrain.tsx): blur, then re-sharpen the alpha so straight edges
            stay crisp while the sharp points (triangle/star) come out rounded.
            Mounted once here so it's available app-wide without duplicate IDs. */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id="mt-round">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
