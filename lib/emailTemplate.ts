// Pure render functions for transactional emails. No server-only / SDK imports
// so the templates can be previewed and tested in isolation (e.g. a Node
// script that writes the HTML to a file). lib/email.ts imports these.
//
// Built to the letsJam design system (see DESIGN.md): paper #f4f4f4, ink
// #030303 / #1a1a1a, action-blue #3c5bcb, jam-blue #e4ecff, jam-yellow #f9f6b8,
// Queens Compressed display serif (Georgia is its sanctioned fallback), DM Sans
// body. Email can't load the web fonts or render SVG, so the real wordmark ships
// as a hosted PNG and the display serif degrades to Georgia.

export type JamInvite = {
  to: string;
  hostName: string;
  topic: string;
  joinUrl: string;
};

// The wordmark is recreated in HTML/CSS (the "lets" blue pill + "jam" text)
// rather than an <img>. Images make every client fetch + show a loading
// placeholder (and break entirely if the asset isn't deployed); CSS renders
// instantly with no network round-trip. The pill's rotation degrades to a flat
// pill in clients that strip CSS transforms (Outlook) — still on-brand.
// The real Product Sans wordmark (public/email/logo.png), served from the same
// origin that serves the email's join link — so on any deployment (preview or
// prod) the asset is co-located and never 404s or points cross-environment.
function renderLogo(logoUrl: string): string {
  return `<img src="${logoUrl}" width="120" height="41" alt="letsJam" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;width:120px;height:41px;" />`;
}

// Derive the deployment origin from the join URL (which is always
// `${origin}/waiting-room?...`). Falls back to the prod domain.
function originOf(url: string): string {
  const match = /^(https?:\/\/[^/]+)/.exec(url);
  return match ? match[1] : "https://letsjam.so";
}

// Queens Compressed is the site's display face; Georgia is its committed
// fallback (see .heading-display). DM Sans is body; web-safe sans for clients
// without it.
const DISPLAY = "'Queens Compressed',Georgia,'Times New Roman',serif";
const BODY =
  "'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export function renderInviteText({ hostName, topic, joinUrl }: JamInvite): string {
  return [
    `${hostName} invited you to a jam on letsJam.`,
    "",
    `The jam: ${topic}`,
    "",
    `Start jamming: ${joinUrl}`,
  ].join("\n");
}

export function renderInviteEmail({ hostName, topic, joinUrl }: JamInvite): string {
  // Email HTML rules: inline styles only (clients strip <style>/external CSS),
  // table-based layout for Outlook, no JS.
  const safeTopic = escapeHtml(topic);
  const safeHost = escapeHtml(hostName);
  const logoUrl = `${originOf(joinUrl)}/email/logo.png`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>You're invited to a jam</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f4;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${safeHost} invited you to a jam on letsJam.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
      <tr>
        <td align="center" style="padding:48px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;">
            <!-- Logo -->
            <tr>
              <td style="padding:44px 44px 0 44px;">
                ${renderLogo(logoUrl)}
              </td>
            </tr>
            <!-- Headline (display serif) with one jam-yellow spark -->
            <tr>
              <td style="padding:28px 44px 0 44px;">
                <p style="margin:0;font-family:${DISPLAY};font-size:38px;line-height:1.06;letter-spacing:-0.02em;font-weight:400;color:#030303;">${safeHost} invited you to a <span style="background-color:#f9f6b8;padding:0 4px;border-radius:3px;">jam</span></p>
              </td>
            </tr>
            <!-- Supporting line -->
            <tr>
              <td style="padding:16px 44px 0 44px;">
                <p style="margin:0;font-family:${BODY};font-size:15px;line-height:1.55;color:rgba(3,3,3,0.69);">A short, structured working session to think it through together, hosted on letsJam.</p>
              </td>
            </tr>
            <!-- Topic surface (jam-blue) -->
            <tr>
              <td style="padding:24px 44px 0 44px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e4ecff;border-radius:16px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0;font-family:${BODY};font-size:13px;font-weight:600;color:#3c5bcb;">The jam</p>
                      <p style="margin:6px 0 0 0;font-family:${BODY};font-size:16px;line-height:1.45;color:#1a1a1a;">${safeTopic}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- CTA (black pill) -->
            <tr>
              <td style="padding:28px 44px 0 44px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:9999px;background-color:#1a1a1a;">
                      <a href="${joinUrl}" target="_blank" style="display:block;padding:16px 40px;font-family:${BODY};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">Start Jamming</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Link fallback -->
            <tr>
              <td style="padding:18px 44px 0 44px;">
                <p style="margin:0 0 8px 0;font-family:${BODY};font-size:13px;color:rgba(3,3,3,0.55);">Or open this link:</p>
                <a href="${joinUrl}" target="_blank" style="font-family:${BODY};font-size:13px;line-height:1.5;color:#3c5bcb;text-decoration:none;word-break:break-all;">${joinUrl}</a>
              </td>
            </tr>
            <!-- Divider + footer -->
            <tr>
              <td style="padding:32px 44px 40px 44px;">
                <div style="height:1px;background-color:#ececec;line-height:1px;font-size:1px;">&nbsp;</div>
                <p style="margin:20px 0 0 0;font-family:${BODY};font-size:12px;line-height:1.5;color:#6b6b6b;">If you weren't expecting this invitation, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
