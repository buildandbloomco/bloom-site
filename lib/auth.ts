import "server-only";
import { cookies } from "next/headers";
import { safeEqual, sign, verify } from "./crypto";
import { getClient } from "./data";
import type { Client } from "./types";

const CLIENT_COOKIE = "bb_client";
const ADMIN_COOKIE = "bb_admin";
const CLIENT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function startClientSession(clientId: string) {
  (await cookies()).set(CLIENT_COOKIE, sign(clientId, CLIENT_MAX_AGE), { ...cookieBase, maxAge: CLIENT_MAX_AGE });
}

export async function endClientSession() {
  (await cookies()).delete(CLIENT_COOKIE);
}

export async function currentClient(): Promise<Client | null> {
  const id = verify((await cookies()).get(CLIENT_COOKIE)?.value);
  if (!id) return null;
  return getClient(id);
}

export function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  if (process.env.NODE_ENV !== "production") return "bloom-admin";
  return null;
}

export function checkAdminPassword(input: string): boolean {
  const p = adminPassword();
  return !!p && safeEqual(input, p);
}

export async function startAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, sign("admin", ADMIN_MAX_AGE), { ...cookieBase, maxAge: ADMIN_MAX_AGE });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  return verify((await cookies()).get(ADMIN_COOKIE)?.value) === "admin";
}
