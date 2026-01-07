// functions/src/signup.ts
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {db, now, addHours, enforceRateLimit, CreateParentSchema, CreateStudentSchema, CodeSchema, assertAuth, assertRole, makeCode, setRole} from "./utils";

// Create Parent Profile
export const createParentProfile = onCall(async (request) => {
  const uid = request.auth?.uid;
  const token = request.auth?.token;
  const email = token?.email || null;

  assertAuth(uid);
  await enforceRateLimit(uid!, "createParent", 5, 3600);

  const {displayName, locale} = CreateParentSchema.parse(request.data);

  // Create/merge user + parent docs
  await db.doc(`users/${uid}`).set({
    role: "parent", displayName, email, locale: locale || null, createdAt: now(),
  }, {merge: true});

  await db.doc(`parents/${uid}`).set({
    userId: uid,
    childIds: [],
    rewardConfig: {
      screenTime: {enabled: true, minutesPerPoint: 2, dailyCapMin: 60, allowedWindows: []},
      pocketMoney: {enabled: false, currencyPerPoint: 0.10, weeklyCap: 5.00, requireApproval: true},
      minDailyScoreForUnlock: 10,
    },
    createdAt: now(),
  }, {merge: true});

  await setRole(uid!, "parent");
  return {ok: true};
});

// Create Student Profile (self or post-parent)
export const createStudentProfile = onCall(async (request) => {
  const uid = request.auth?.uid;

  assertAuth(uid);
  await enforceRateLimit(uid!, "createStudent", 5, 3600);

  const {displayName, year, prefs} = CreateStudentSchema.parse(request.data);

  await db.doc(`users/${uid}`).set({
    role: "student", displayName, createdAt: now(),
  }, {merge: true});

  await db.doc(`students/${uid}`).set({
    userId: uid, year, prefs: prefs || {style: "text"}, parentIds: [], createdAt: now(),
  }, {merge: true});

  await setRole(uid!, "student");
  return {ok: true};
});

// Generate Child Invite (Parent only)
export const generateChildInvite = onCall(async (request) => {
  const uid = request.auth?.uid;
  const token = request.auth?.token;

  assertRole(uid, token, "parent");
  await enforceRateLimit(uid!, "genInvite", 20, 3600);

  const code = makeCode(8);
  const expiresAt = addHours(now(), 24);
  const parentId = uid!;

  await db.doc(`link_codes/${code}`).set({
    code, parentId, studentId: null, expiresAt, used: false, createdAt: now(),
  });

  // Optional: store a copy under parent doc
  const parentDoc = db.doc(`parents/${parentId}`);
  const parentSnap = await parentDoc.get();
  const parentData = parentSnap.data() || {};
  const existingCodes = parentData.invitedCodes || [];
  await parentDoc.set({
    ...parentData,
    invitedCodes: [...existingCodes, {code, expiresAt}],
  });

  return {code, expiresAt: new Date(expiresAt).toISOString(), qrData: `link:${code}`};
});

// Link Child With Code (Student only)
export const linkChildWithCode = onCall(async (request) => {
  const uid = request.auth?.uid;
  const token = request.auth?.token;

  assertRole(uid, token, "student");
  await enforceRateLimit(uid!, "linkChild", 30, 3600);

  const {code} = CodeSchema.parse({code: String(request.data?.code || "").toUpperCase()});
  const studentId = uid!;
  const ref = db.doc(`link_codes/${code}`);

  return await db.runTransaction(async (tx) => {
    // ALL READS FIRST - Firestore transaction requirement
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "INVALID_CODE");
    const lc = snap.data()!;

    if (lc.used) throw new HttpsError("failed-precondition", "CODE_USED");
    if ((lc.expiresAt as number) <= Date.now()) {
      throw new HttpsError("deadline-exceeded", "CODE_EXPIRED");
    }
    const parentId = lc.parentId as string;

    const parentRef = db.doc(`parents/${parentId}`);
    const studentRef = db.doc(`students/${studentId}`);

    // Read current documents before any writes
    const parentSnap = await tx.get(parentRef);
    const studentSnap = await tx.get(studentRef);

    const parentData = parentSnap.data() || {};
    const studentData = studentSnap.data() || {};

    const existingChildIds = parentData.childIds || [];
    const existingParentIds = studentData.parentIds || [];

    // Add if not already present
    const updatedChildIds = existingChildIds.includes(studentId) ? existingChildIds : [...existingChildIds, studentId];
    const updatedParentIds = existingParentIds.includes(parentId) ? existingParentIds : [...existingParentIds, parentId];

    // ALL WRITES AFTER ALL READS
    tx.update(ref, {used: true, studentId});
    tx.set(parentRef, {...parentData, childIds: updatedChildIds});
    tx.set(studentRef, {...studentData, parentIds: updatedParentIds});

    return {ok: true, parentId};
  });
});
