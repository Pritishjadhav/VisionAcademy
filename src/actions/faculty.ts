"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function createFacultyUser(email: string) {
  try {
    let userRecord;
    try {
      // Create auth user with email as both username and password
      userRecord = await adminAuth.createUser({
        email: email,
        password: email, // Set password to exactly the email as requested
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

    return { success: true, uid: userRecord.uid };
  } catch (error: unknown) {
    console.error("Error creating faculty:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create faculty on server" };
  }
}

export async function deleteFacultyUser(uid: string) {
  try {
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
