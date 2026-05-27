import crypto from "crypto";

// Verify the Whereby-Signature header: "t=<timestamp>,v1=<hex hmac-sha256>".
// signedPayload is "<timestamp>.<rawBody>" (Stripe-style). If Whereby uses a
// different signedPayload shape, the mismatch is logged so we can correct it.
export function verifyWherebySignature(
  rawBody: string,
  header: string | null,
  secret: string
): boolean {
  if (!header) return false;
  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const [k, v] = segment.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    console.warn("[whereby] signature length mismatch", { got: v1, expected });
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

// Resolve the transcript text for a finished transcription.
// access-link returns a (temporary) URL to the transcript file; we then download it.
export async function fetchTranscript(transcriptionId: string): Promise<string> {
  const apiKey = process.env.WHEREBY_API_KEY;
  if (!apiKey) throw new Error("WHEREBY_API_KEY env var is not set");

  const linkRes = await fetch(
    `https://api.whereby.dev/v1/transcriptions/${transcriptionId}/access-link`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!linkRes.ok) {
    throw new Error(
      `access-link ${linkRes.status}: ${await linkRes.text()}`
    );
  }

  const json = (await linkRes.json()) as Record<string, unknown>;
  const link =
    (json.accessLink as string) ??
    (json.url as string) ??
    (json.downloadUrl as string) ??
    (json.link as string);
  if (!link) {
    throw new Error(`No access link field in response: ${JSON.stringify(json)}`);
  }

  const fileRes = await fetch(link);
  if (!fileRes.ok) {
    throw new Error(`transcript download ${fileRes.status}`);
  }
  return await fileRes.text();
}
