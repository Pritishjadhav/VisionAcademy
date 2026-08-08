"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function createStudentUser(data: { name: string, mobile: string, parentMobile: string, email?: string, gender?: string, dateOfBirth?: string, batch?: string }) {
  try {
    // Generate synthetic email
    const cleanMobile = data.mobile.replace(/[^0-9]/g, '');
    const mobileWithoutCode = cleanMobile.startsWith('91') ? cleanMobile.substring(2) : cleanMobile;
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

export async function deleteStudentUser(uid: string) {
  try {
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

export async function createAdminUser(email: string) {
  try {
    let userRecord;
    try {
      // Create auth user with email as both username and password
      userRecord = await adminAuth.createUser({
        email: email,
        password: email, // Set password to exactly the email as requested
        displayName: "Admin",
      });
    } catch (authError: unknown) {
      if (authError && typeof authError === 'object' && 'code' in authError && (authError as {code: string}).code === 'auth/email-already-exists') {
        return { success: false, error: "An admin with this email already exists." };
      }
      throw authError;
    }
    
    // Create firestore document for admin with the SAME UID
    // Give them 'super_admin' full access as requested
    await adminDb.collection("admins").doc(userRecord.uid).set({
      email: email,
      role: "super_admin",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: unknown) {
    console.error("Error creating admin:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create admin on server" };
  }
}

export async function deleteAdminUser(uid: string) {
  try {
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
    const collectionName = type === 'student' ? 'students' : 'parents';
    const querySnapshot = await adminDb.collection(collectionName).where('mobile', '==', mobile).get();
    
    if (querySnapshot.empty) {
      return { exists: false };
    }
    
    const userData = querySnapshot.docs[0].data();
    return { exists: true, email: userData.email || null };
  } catch (error) {
    console.error("Error checking user existence:", error);
    return { exists: false, error: "Failed to check user existence" };
  }
}
