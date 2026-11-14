import { NextResponse } from "next/server";
import { ApiError, caller } from "@/lib/api";
import { enrollWorkstation, KIOSK_COOKIE } from "@/lib/services/testing";

/**
 * POST /api/v1/workstations/:id/enroll: City staff run this ON the testing-room computer.
 * The computer receives a secret kiosk cookie (httpOnly, never visible to the user).
 */
export async function POST(req: Request, { params }: RouteContext<"/api/v1/workstations/[id]/enroll">) {
  try {
    const me = await caller(req, ["city"]);
    const { workstation, token } = await enrollWorkstation(me, (await params).id);
    const res = NextResponse.json({ enrolled: true, workstation: workstation.label });
    res.cookies.set(KIOSK_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  } catch (e) {
    const status = e instanceof ApiError ? e.status : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status });
  }
}
