import "server-only";
import { Resend } from "resend";
import {
  renderInviteEmail,
  renderInviteText,
  type JamInvite,
} from "./emailTemplate";

export type { JamInvite };

// Transactional email via Resend. The API key is a send-only restricted key
// (it can't list domains), so delivery depends on the `letsjam.so` domain being
// verified in the Resend dashboard. Callers run this best-effort and never fail
// the surrounding request on a send error (the invite modal's copy-link is the
// fallback path).
const FROM = "letsJam <invites@letsjam.so>";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Send a "Join Jam" invitation to each recipient in one batched call. Throws on
// a Resend error so the caller can log it; returns silently if no key is set or
// there's nothing to send.
export async function sendJamInvites(invites: JamInvite[]): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping Jam invite emails");
    return;
  }
  if (invites.length === 0) return;

  const payload = invites.map((invite) => ({
    from: FROM,
    to: invite.to,
    subject: `${invite.hostName} invited you to a jam`,
    html: renderInviteEmail(invite),
    text: renderInviteText(invite),
  }));

  const { error } = await resend.batch.send(payload);
  if (error) {
    throw new Error(`Resend batch send failed: ${error.message}`);
  }
}
