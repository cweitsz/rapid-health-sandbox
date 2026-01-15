import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = (searchParams.get("key") ?? "").trim();
  const expected = (process.env.RHS_REVIEWER_KEY ?? "").trim();

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Reviewer key not configured" },
      { status: 500 }
    );
  }

  if (key && key === expected) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}

