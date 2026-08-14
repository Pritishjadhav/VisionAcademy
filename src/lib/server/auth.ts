import { adminAuth, adminDb } from "@/lib/firebase/admin";

export type VerifiedAppUser = {
  uid: string;
  role: "super_admin" | "admin" | "student" | "parent" | "faculty";
};

async function getRole(uid: string): Promise<VerifiedAppUser["role"] | null> {
  const collections = ["admins", "students", "parents", "faculty"] as const;
  for (const collectionName of collections) {
    const snapshot = await adminDb.collection(collectionName).doc(uid).get();
    if (!snapshot.exists) continue;
    const data = snapshot.data();
    if (collectionName === "admins") {
      if (data?.enabled === false) return null;
      return data?.role === "super_admin" ? "super_admin" : "admin";
    }
    if (collectionName === "students") return "student";
    if (collectionName === "parents") return "parent";
    return "faculty";
  }
  return null;
}

export async function requireUser(idToken: string): Promise<VerifiedAppUser> {
  if (!idToken) throw new Error("Authentication required.");
  const decoded = await adminAuth.verifyIdToken(idToken);
  const role = await getRole(decoded.uid);
  if (!role) throw new Error("Your account is not authorized.");
  return { uid: decoded.uid, role };
}

export async function requireAdmin(idToken: string): Promise<VerifiedAppUser> {
  const user = await requireUser(idToken);
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("Administrator access required.");
  }
  return user;
}

export async function requireSuperAdmin(idToken: string): Promise<VerifiedAppUser> {
  const user = await requireUser(idToken);
  if (user.role !== "super_admin") {
    throw new Error("Super administrator access required.");
  }
  return user;
}

export async function requireSelfOrAdmin(idToken: string, targetUid: string): Promise<VerifiedAppUser> {
  const user = await requireUser(idToken);
  if (user.uid !== targetUid && user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("You cannot modify this account.");
  }
  return user;
}
