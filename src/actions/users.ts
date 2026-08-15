"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { requireAdmin, requireSelfOrAdmin, requireSuperAdmin } from "@/lib/server/auth";

export async function createStudentUser(idToken: string, data: { name: string, mobile: string, parentMobile: string, email?: string, gender?: string, dateOfBirth?: string, batch?: string }) {
  try {
    const actor = await requireAdmin(idToken);
    enforceRateLimit(`action:create-student:${actor.uid}`, 10);
    // Generate synthetic email
    const cleanMobile = data.mobile.replace(/[^0-9]/g, '');
    const mobileWithoutCode = cleanMobile.startsWith('91') && cleanMobile.length > 10 ? cleanMobile.substring(2) : cleanMobile;
    const formattedMobile = `+91${mobileWithoutCode}`;
    const formattedParentMobile = data.parentMobile ? `+91${data.parentMobile.replace(/[^0-9]/g, '').replace(/^91/, '')}` : "";
    
    const email = data.email || `${mobileWithoutCode}@visionacademy.com`;
    const password = mobileWithoutCode; // Default password is the 10-digit mobile number

    let userRecord;
    try {
      // Create auth user
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: data.name,
      });
    } catch (authError: unknown) {
      if (authError && typeof authError === 'object' && 'code' in authError && (authError as {code: string}).code === 'auth/email-already-exists') {
        return { success: false, error: "A student with this mobile number already exists." };
      }
      throw authError;
    }
    
    // Create firestore document for student with the SAME UID
    await adminDb.collection("students").doc(userRecord.uid).set({
      name: data.name,
      mobile: formattedMobile,
      parentMobile: formattedParentMobile,
      email: data.email || "",
      gender: data.gender || "",
      dateOfBirth: data.dateOfBirth || "",
      batch: data.batch || "",
      role: "student",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Create parent record if provided
    if (formattedParentMobile) {
      const parentMobileWithoutCode = formattedParentMobile.replace('+91', '');
      const parentEmail = `${parentMobileWithoutCode}@visionacademy.com`;
      const parentPassword = parentMobileWithoutCode;
      
      let parentUid;
      
      try {
        // Try to create the parent auth user
        const parentRecord = await adminAuth.createUser({
          email: parentEmail,
          password: parentPassword,
          displayName: "Parent of " + data.name,
        });
        parentUid = parentRecord.uid;
        
        // Create new parent document
        await adminDb.collection("parents").doc(parentUid).set({
          mobile: formattedParentMobile,
          studentIds: [userRecord.uid],
          role: "parent",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
      } catch (parentAuthError: unknown) {
        if (parentAuthError && typeof parentAuthError === 'object' && 'code' in parentAuthError && (parentAuthError as {code: string}).code === 'auth/email-already-exists') {
          // Parent already exists in Auth, fetch their UID
          const existingParent = await adminAuth.getUserByEmail(parentEmail);
          parentUid = existingParent.uid;
          
          // Update their existing parent document
          const parentDocRef = adminDb.collection("parents").doc(parentUid);
          const parentDoc = await parentDocRef.get();
          
          if (parentDoc.exists) {
            const parentData = parentDoc.data();
            const currentStudentIds = parentData?.studentIds || [];
            if (!currentStudentIds.includes(userRecord.uid)) {
              await parentDocRef.update({
                studentIds: [...currentStudentIds, userRecord.uid],
                updatedAt: new Date().toISOString()
              });
            }
          } else {
            // Missing firestore doc, recreate it
            await parentDocRef.set({
              mobile: formattedParentMobile,
              studentIds: [userRecord.uid],
              role: "parent",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } else {
          console.error("Failed to create parent auth user:", parentAuthError);
        }
      }
    }

    return { success: true, uid: userRecord.uid };
  } catch (error: unknown) {
    console.error("Error creating student:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create student on server" };
  }
}

export async function deleteStudentUser(idToken: string, uid: string) {
  try {
    const actor = await requireAdmin(idToken);
    enforceRateLimit(`action:delete-student:${actor.uid}`, 10);
    const studentDocRef = adminDb.collection("students").doc(uid);
    const studentDoc = await studentDocRef.get();

    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: unknown) {
      // If user doesn't exist in Auth, just proceed to delete Firestore doc
      if (authError && typeof authError === 'object' && 'code' in authError && (authError as {code: string}).code !== 'auth/user-not-found') {
        throw authError;
      }
    }
    
    // Remove student ID from parent's record if applicable
    if (studentDoc.exists) {
      const studentData = studentDoc.data();
      if (studentData?.parentMobile) {
        const parentQuery = await adminDb.collection("parents").where("mobile", "==", studentData.parentMobile).get();
        if (!parentQuery.empty) {
          const parentDoc = parentQuery.docs[0];
          const parentData = parentDoc.data();
          const updatedStudentIds = (parentData.studentIds || []).filter((id: string) => id !== uid);
          
          if (updatedStudentIds.length === 0) {
            // No more students for this parent, so delete them permanently from Auth and Firestore
            try {
              await adminAuth.deleteUser(parentDoc.id);
            } catch (err) {
              console.error("Failed to delete parent auth user during student deletion:", err);
            }
            await parentDoc.ref.delete();
          } else {
            // Parent still has other students, just update the array
            await parentDoc.ref.update({
              studentIds: updatedStudentIds,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    }
    
    // Delete from Firestore
    await studentDocRef.delete();
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting student:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete student on server" };
  }
}

export async function createAdminUser(idToken: string, email: string) {
  try {
    const actor = await requireSuperAdmin(idToken);
    enforceRateLimit(`action:create-admin:${actor.uid}`, 5);
    const temporaryPassword = randomBytes(12).toString("base64url");
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: email,
        password: temporaryPassword,
        displayName: "Admin",
      });
    } catch (authError: unknown) {
      if (authError && typeof authError === 'object' && 'code' in authError && (authError as {code: string}).code === 'auth/email-already-exists') {
        return { success: false, error: "An admin with this email already exists." };
      }
      throw authError;
    }
    
    // Create firestore document for admin with the SAME UID
    await adminDb.collection("admins").doc(userRecord.uid).set({
      email: email,
      role: "admin",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, uid: userRecord.uid, temporaryPassword };
  } catch (error: unknown) {
    console.error("Error creating admin:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create admin on server" };
  }
}

export async function deleteAdminUser(idToken: string, uid: string) {
  try {
    const actor = await requireSuperAdmin(idToken);
    enforceRateLimit(`action:delete-admin:${actor.uid}`, 5);
    // Prevent deletion of master admin
    const adminDoc = await adminDb.collection("admins").doc(uid).get();
    if (adminDoc.exists && adminDoc.data()?.email === 'visionacademy7979@gmail.com') {
      return { success: false, error: "The master admin account cannot be deleted." };
    }

    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authError: unknown) {
      if (authError && typeof authError === 'object' && 'code' in authError && (authError as {code: string}).code !== 'auth/user-not-found') {
        throw authError;
      }
    }
    
    // Delete from Firestore
    await adminDb.collection("admins").doc(uid).delete();
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting admin:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete admin on server" };
  }
}

export async function checkUserExistsByMobile(mobile: string, type: 'student' | 'parent') {
  try {
    const normalizedMobile = mobile.replace(/\D/g, "").slice(-10);
    const requestHeaders = await headers();
    const clientIp = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
      || requestHeaders.get("x-real-ip")
      || "unknown";
    enforceRateLimit(`action:mobile-lookup-ip:${clientIp}`, 20, 5 * 60_000);
    enforceRateLimit(`action:mobile-lookup:${type}:${normalizedMobile}`, 8, 5 * 60_000);
    const collectionName = type === 'student' ? 'students' : 'parents';
    const querySnapshot = await adminDb.collection(collectionName).where('mobile', '==', mobile).get();
    
    if (querySnapshot.empty) {
      return { exists: false };
    }
    
    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;
    const userData = userDoc.data();
    
    try {
      // Fetch the actual auth user to get their true login email
      const authUser = await adminAuth.getUser(uid);
      return { exists: true, email: authUser.email || userData.email || null };
    } catch (authError) {
      // Fallback to firestore email if auth fetch fails
      return { exists: true, email: userData.email || null };
    }
  } catch (error) {
    console.error("Error checking user existence:", error);
    return { exists: false, error: "Failed to check user existence" };
  }
}

export async function linkParentAccount(idToken: string, studentUid: string, studentName: string, parentMobile: string) {
  if (!parentMobile) return { success: false, error: "No parent mobile provided" };
  
  try {
    const actor = await requireSelfOrAdmin(idToken, studentUid);
    enforceRateLimit(`action:link-parent:${actor.uid}`, 5);
    const formattedParentMobile = parentMobile.startsWith('+91') ? parentMobile : `+91${parentMobile.replace(/[^0-9]/g, '')}`;
    const parentMobileWithoutCode = formattedParentMobile.replace('+91', '');
    const parentEmail = `${parentMobileWithoutCode}@visionacademy.com`;
    const parentPassword = parentMobileWithoutCode;
    
    let parentUid;
    
    try {
      // Try to create the parent auth user
      const parentRecord = await adminAuth.createUser({
        email: parentEmail,
        password: parentPassword,
        displayName: "Parent of " + studentName,
      });
      parentUid = parentRecord.uid;
      
      // Create new parent document
      await adminDb.collection("parents").doc(parentUid).set({
        mobile: formattedParentMobile,
        studentIds: [studentUid],
        role: "parent",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
    } catch (parentAuthError: unknown) {
      if (parentAuthError && typeof parentAuthError === 'object' && 'code' in parentAuthError && (parentAuthError as {code: string}).code === 'auth/email-already-exists') {
        // Parent already exists in Auth, fetch their UID
        const existingParent = await adminAuth.getUserByEmail(parentEmail);
        parentUid = existingParent.uid;
        
        // Update their existing parent document
        const parentDocRef = adminDb.collection("parents").doc(parentUid);
        const parentDoc = await parentDocRef.get();
        
        if (parentDoc.exists) {
          const parentData = parentDoc.data();
          const currentStudentIds = parentData?.studentIds || [];
          if (!currentStudentIds.includes(studentUid)) {
            await parentDocRef.update({
              studentIds: [...currentStudentIds, studentUid],
              updatedAt: new Date().toISOString()
            });
          }
        } else {
          // Missing firestore doc, recreate it
          await parentDocRef.set({
            mobile: formattedParentMobile,
            studentIds: [studentUid],
            role: "parent",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        console.error("Failed to create parent auth user:", parentAuthError);
        throw parentAuthError;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error linking parent account:", error);
    return { success: false, error: "Failed to link parent account" };
  }
}
