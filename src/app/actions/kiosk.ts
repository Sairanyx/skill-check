"use server";

import { cookies } from "next/headers";
import { KIOSK_COOKIE } from "@/lib/services/testing";

/** Removes the EXAM room computer mark from this browser, so normal logins work again (demo and testing). */
export async function leaveKioskMode() {
  (await cookies()).delete(KIOSK_COOKIE);
}
