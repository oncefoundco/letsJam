import { NextResponse } from "next/server";
import { resolveDots } from "@/lib/sessions";

// Resolve the current round. Host calls this (force=true to advance early);
// the regular path only resolves once everyone has voted. Idempotent.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let force = false;
  try {
    const body = (await req.json()) as { force?: unknown };
    force = body.force === true;
  } catch {
    // empty body is fine
  }

  const result = await resolveDots(id, { force });
  if (!result) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
