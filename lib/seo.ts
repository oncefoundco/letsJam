/**
 * Single source of truth for site-wide SEO/brand metadata. Imported by the
 * root layout (metadata + JSON-LD), the sitemap, robots, and the OG image so
 * the brand string and canonical URL never drift between them.
 */

// Canonical production origin. No trailing slash.
export const SITE_URL = "https://letsjam.so";

export const SITE_NAME = "letsJam";
export const SITE_TAGLINE = "The AI decision room for teams";

export const SITE_DESCRIPTION =
  "letsJam runs the methodology that takes your team from “what are we actually solving?” to a decision everyone commits to — in one focused session.";

// Profiles that prove "all of these are the same letsJam". This is the lever
// that disambiguates the brand from the other "let's jam" sites (music meetup,
// fashion shop, etc.): each authoritative profile linking back to SITE_URL
// teaches Google they're one entity. Fill in with REAL urls once they exist —
// e.g. LinkedIn company page, X/Twitter, Crunchbase, Product Hunt. Leave the
// array empty rather than guessing; a wrong sameAs hurts more than none.
export const SAME_AS: string[] = [];
