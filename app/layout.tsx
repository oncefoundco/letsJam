import type { Metadata } from "next";
import { DM_Sans, Public_Sans, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SAME_AS,
} from "@/lib/seo";

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

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Child routes set their own title; Next appends the brand. e.g. a page
    // titled "Pricing" renders "Pricing · letsJam".
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "letsJam",
    "team decision making",
    "decision meeting",
    "meeting decisions software",
    "strategic decisions",
    "team alignment tool",
    "AI meeting facilitation",
    "decision room",
  ],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  // og:image / twitter:image are supplied by app/opengraph-image.tsx and
  // app/twitter-image.tsx (Next wires them in automatically).
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/**
 * JSON-LD structured data. The @graph ties three entities together by @id so
 * Google can build a single "letsJam" brand entity (and tell it apart from the
 * other "let's jam" sites). sameAs (from lib/seo) is the disambiguation lever —
 * fill it with real social/profile URLs to strengthen the entity.
 */
function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        ...(SAME_AS.length > 0 ? { sameAs: SAME_AS } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // schema is static and fully controlled here — safe to inject as-is.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

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
      <head>
        <StructuredData />
      </head>
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
