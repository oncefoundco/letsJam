// Client-safe dot-voting constants + types. Kept separate from lib/sessions.ts
// (which pulls in @vercel/kv + the AI SDK) so client components can import these
// without dragging server-only code into the browser bundle.

export const DOTS_PER_PARTICIPANT = 5;
export const REFINE_OPTION_ID = "refine";

export type JamOption = {
  id: string;
  title: string;
  body: string;
  attribution: string;
  authorId?: string;
};

export type DotAllocation = {
  participantId: string;
  optionId: string; // a JamOption id, or REFINE_OPTION_ID
  dots: number;
  round: number;
};

export type DotResolution =
  | { resolution: "pending"; round: number }
  | { resolution: "decided"; round: number; option: JamOption }
  | { resolution: "refining"; round: number };
