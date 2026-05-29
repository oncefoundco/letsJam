// Shared avatar palette + helpers. Client-safe: no server-only imports here
// (lib/sessions.ts pulls in @vercel/kv and must not be imported by client code),
// so the palette lives here and sessions.ts re-imports it.

export const AVATAR_COLORS = [
  "#9fd5f1",
  "#f9f6b8",
  "#d4f0da",
  "#b9caf5",
  "#ffd9fd",
  "#fed7aa",
  "#bae6fd",
  "#bbf7d0",
  "#e9d5ff",
  "#fecaca",
] as const;

// First initial of the first and last name parts, uppercased — e.g.
// "Anjila Bhandari" → "AB", "Simon" → "S". Splits on spaces and hyphens to
// match the Whereby SDK's own initial logic. Returns "" for an empty name.
export function getInitials(name: string): string {
  const parts = name.trim().split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

// Deterministic color pick from the palette, derived from the name. Stable for
// the same name across every viewer; two distinct names usually differ, so two
// people who share an initial still get different colors.
export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
