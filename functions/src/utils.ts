// functions/src/utils.ts
import * as admin from "firebase-admin";
import {HttpsError} from "firebase-functions/v2/https";
import {z} from "zod";

export const db = admin.firestore();
export const auth = admin.auth();

// Create timestamp using milliseconds for compatibility
export const now = () => Date.now();
export const addHours = (ts: number, h: number) => ts + h * 3600_000;

// Simple per-UID rate limit: X calls per window for a given key
export async function enforceRateLimit(uid: string, key: string, max: number, windowSec: number) {
  const doc = db.doc(`rate_limits/${uid}_${key}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(doc);
    const nowTs = now();

    if (!snap.exists) {
      // First time - create the document
      tx.set(doc, {count: 1, resetAt: addHours(nowTs, windowSec / 3600)});
      return;
    }

    const data = snap.data()!;
    const resetAt = data.resetAt as number;
    const expired = resetAt < nowTs;

    if (expired) {
      // Window expired - reset the counter
      tx.set(doc, {count: 1, resetAt: addHours(nowTs, windowSec / 3600)});
    } else {
      // Within window - check limit and increment
      if (data.count >= max) {
        throw new HttpsError("resource-exhausted", "RATE_LIMIT");
      }
      tx.set(doc, {count: (data.count || 0) + 1, resetAt});
    }
  });
}

// Schemas
export const CreateParentSchema = z.object({
  displayName: z.string().min(2).max(40),
  locale: z.string().nullable().optional(),
});

export const CreateStudentSchema = z.object({
  displayName: z.string().min(2).max(40),
  year: z.number().int().min(4).max(12),
  prefs: z.object({style: z.enum(["video", "text", "steps"]).default("text")}).optional(),
});

export const CodeSchema = z.object({
  code: z.string().trim().min(8).max(8).regex(/^[A-Z0-9]{8}$/),
});

export function assertAuth(uid: string | undefined) {
  if (!uid) throw new HttpsError("unauthenticated", "AUTH_REQUIRED");
}

export function assertRole(uid: string | undefined, token: any, role: "parent" | "student") {
  assertAuth(uid);
  // Allow bootstrap when role not yet set
  if (token?.role && token.role !== role) {
    throw new HttpsError("permission-denied", "ROLE_MISMATCH");
  }
}

export function makeCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusable chars
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function setRole(uid: string, role: "parent" | "student") {
  await auth.setCustomUserClaims(uid, {role});
}
