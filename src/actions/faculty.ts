"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { randomBytes } from "node:crypto";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireAdmin } from "@/lib/server/auth";

export async function createFacultyUser(idToken: string, email: string) {
  try {
    const actor = await requireAdmin(idToken);
    enforceRateLimit(`action:create-faculty:${actor.uid}`, 8);
    const temporaryPassword = randomBytes(12).toString("base64url");
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: email,
        password: temporaryPassword,
        displayName: "Faculty",
      });
    } catch (authError: unknown) {
      if (authError && typeof authError === 'object' && 'code' in authError && (authError as {code: string}).code === 'auth/email-already-exists') {
        return { success: false, error: "A faculty with this email already exists." };
      }
      throw authError;
    }
    
    // Create firestore document for faculty with the SAME UID
    await adminDb.collection("faculty").doc(userRecord.uid).set({
      email: email,
      role: "faculty",
      name: "",
      mobile: "",
      subject: "",
      dateOfBirth: "",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, uid: userRecord.uid, temporaryPassword };
  } catch (error: unknown) {
    console.error("Error creating faculty:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create faculty on server" };
  }
}

export async function deleteFacultyUser(idToken: string, uid: string) {
  try {
    const actor = await requireAdmin(idToken);
    enforceRateLimit(`action:delete-faculty:${actor.uid}`, 8);
    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: unknown) {
      if (authError && typeof authError === 'object' && 'code' in authError && (authError as {code: string}).code !== 'auth/user-not-found') {
        throw authError;
      }
    }
    
    // Delete from Firestore
    await adminDb.collection("faculty").doc(uid).delete();
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting faculty:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete faculty on server" };
  }
}
