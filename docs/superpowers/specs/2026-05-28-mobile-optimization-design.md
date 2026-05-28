# Mobile Layout Optimization — Design Spec

**Date:** 2026-05-28
**Scope:** All user-facing screens of the Jam app
**Problem:** Layouts break / overflow on mobile (horizontal scroll, off-screen controls, content cut off)
**Goal:** Fix concrete layout breakage on phone viewports (≥320px) without changing behavior, copy, or visual design.

## Constraints

- **Pure CSS / Tailwind 4 utility changes.** No markup restructuring, no new components, no new files.
- **Mobile-first.** Add responsive utilities; do not regress desktop (current desktop layout is the source of truth).
- **No new patterns.** No hamburger menus, sticky footers, native-style sheets, or bottom navs. Just stop the bleeding.
- **No copy changes.** Hide labels (with `aria-label` preserved) where the cluster doesn't fit; don't rewrite text.

## Findings (per screen)

### 1. `/session` — root flex never stacks
**File:** `app/session/page.tsx:24`

```tsx
<div className="flex min-h-screen items-start gap-6 bg-background p-6 md:gap-8 md:p-8">
  <MainColumn ... />
  <Sidebar ... />   {/* w-full lg:w-[420px] xl:w-[479px] */}
</div>
```

The root is `flex` (row default) at every breakpoint. The sidebar is `w-full` until `lg:w-[420px]`, so on mobile the sidebar takes 100% of the row alongside the video — guaranteed overflow. The sidebar is also `h-[calc(100vh-4rem)]`, so on mobile it pins to viewport height.

**Fix:**
- Root: `flex-col lg:flex-row` so mobile stacks.
- Sidebar: `h-auto lg:h-[calc(100vh-4rem)]`.
- MainColumn: `min-h-[60vh] lg:min-h-[calc(100vh-4rem)]` so the video gets a sensible mobile height without forcing 100vh.

### 2. Waiting-room — mic/camera controls clip off the left edge
**File:** `app/waiting-room/VideoPreview.tsx:60-76`

Mic/camera `IconButton`s positioned `absolute -left-16 top-1/2`. `-left-16` is -64px, while the page gutter is only `px-6` (24px). On mobile they fall outside the viewport.

**Fix (chosen approach: floating-over-video, bottom-center on mobile):**
- Wrap the two icon buttons in a positioning container.
- Mobile (`< sm`): position them at the bottom-center *inside* the video rectangle (`absolute bottom-3 left-1/2 -translate-x-1/2 flex-row`).
- Desktop (`sm:` and up): restore the existing `-left-16 top-1/2 -translate-y-1/2 flex-col` styling.

### 3. Headers with multi-pill action clusters overflow
**Files:**
- `app/start/page.tsx:18-48` — "Session pending" pill + video icon + link icon
- `app/self-reflection/page.tsx:52-89` — camera icon + link icon + timer/Pause pill
- `app/vote/page.tsx:53-90` — timer/Pause pill + camera icon + link icon

Total cluster width on `/self-reflection` and `/vote`: ~46 + 46 + ~180 (timer + Pause) ≈ 280–320px on the right — combined with the logo and `px-6` gutters, breaks below ~400px.

**Fixes:**
- Header right cluster: keep `flex-wrap` allowed via `gap-2 md:gap-3` and remove no-wrap constraints (none present — verify).
- Timer pill (`/self-reflection`, `/vote`): the existing Pause button is text-only. Add a small `PauseIcon` SVG (two vertical bars, 14×14) inside the button, and wrap the "Pause" label in `<span className="hidden sm:inline">Pause</span>` so the label collapses below `sm`. The icon stays visible at all widths. Add `aria-label="Pause"` to the button so screen readers still get the label when the visible text is hidden. (This adds one new SVG component definition per page — `PauseIcon` — which is consistent with the existing per-page `VideoIcon`/`LinkIcon` pattern in the same files.)
- Timer text: keep visible; only the "Pause" label collapses.
- "Session pending" pill on `/start`: shrink padding (`px-4 sm:px-6`) and font (`text-[13px] sm:text-[15px]`) below `sm` so it fits with the icons.
- Header outer padding stays `px-6 py-6 md:px-12 lg:px-16` — already correct.

### 4. Landing — `whitespace-nowrap` forces horizontal scroll
**File:** `app/page.tsx:219-222`

`<span className="whitespace-nowrap">Host meetings where decisions</span>` and the second `<span>` at `text-[44px]` are wider than a 360px viewport.

**Fix:**
- Remove `whitespace-nowrap` from both spans (or qualify as `md:whitespace-nowrap` so mobile flows naturally).
- The `<br/>` between them already ensures the desktop two-line shape; on mobile the longer line will wrap into three lines, which is acceptable.

### 5. Landing — Hero examples are 2-col at every width
**File:** `app/page.tsx:135`

`grid grid-cols-2 gap-x-8 gap-y-6` with 72px image thumbnails inside each card. At ≤360px each cell is ~150px, leaving ~50px for the truncated title + chevron — too cramped.

**Fix:** `grid-cols-1 sm:grid-cols-2`.

### 6. Vote perspective cards — fixed 420px min-height on mobile
**File:** `app/vote/VotePanel.tsx:265, 324`

`min-h-[420px]` is applied at all widths. Three stacked cards on mobile = 1260px+ of forced vertical space.

**Fix:** `min-h-0 lg:min-h-[420px]` on `PerspectiveCard` and `RefineCard` `<article>` elements. Cards still grow with content.

### 7. Inner card padding too heavy on narrow phones
**Files:** Multiple — `p-8 md:p-12` on the main white card across `/start`, `/self-reflection`, `/vote`, `/the-call`.

32px on each side of a 320px viewport leaves 192px for content inside an already-24px-gutter parent.

**Fix:** Change `p-8 md:p-12` → `p-6 md:p-8 lg:p-12` on those `<section>` wrappers (5 occurrences across the four pages).

### 8. `/session` MainColumn left-padding asymmetry
**File:** `app/session/page.tsx:50`

`pr-0 pt-8 lg:pr-16` — fine on desktop, but `pt-8` always applies; on mobile (stacked) the spacing between header and video is fine. No change needed.

## Out of scope (NOT doing)

- Redesigning navigation or moving to a mobile-tab pattern
- Touch-target audits beyond what overflow forces
- Adding hover/focus states beyond what already exists
- Changing the typography scale (we keep `text-[40px] md:text-[48px]` and similar)
- Modal redesign (`InviteModal` and `JoinModal` already use `max-w-[440px]` / `max-w-[560px]` with proper padding — they work on mobile)
- Landing-page section reordering, hero image cropping, or feature card redesign (features section already stacks via `grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_360px]`)

## Verification

After implementation, manually verify each screen at three widths:
- **360px** (small phone, e.g. iPhone SE)
- **390px** (modern phone, e.g. iPhone 15)
- **768px** (small tablet — sanity-check the `sm`→`md` boundary)

For each screen check:
1. No horizontal scroll (`document.documentElement.scrollWidth <= window.innerWidth`)
2. All interactive elements visible (no off-screen buttons)
3. No content truncation that wasn't intentional (avatars, text, icons)
4. Cards/sidebars stack readably

Run `npm run build` and `npm audit` per project pre-push convention.

## Files touched (estimate)

- `app/page.tsx` (landing — fixes 4, 5)
- `app/session/page.tsx` (fix 1)
- `app/waiting-room/VideoPreview.tsx` (fix 2)
- `app/start/page.tsx` (header — fix 3; card padding — fix 7)
- `app/self-reflection/page.tsx` (header — fix 3; card padding — fix 7)
- `app/vote/page.tsx` (header — fix 3; card padding — fix 7)
- `app/vote/VotePanel.tsx` (fix 6)
- `app/the-call/page.tsx` (card padding — fix 7)

8 files, all CSS class-list edits.
