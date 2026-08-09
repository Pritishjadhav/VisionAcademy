"use server";

import { adminDb } from "@/lib/firebase/admin";

export async function deleteTest(testId: string) {
  try {
    const batch = adminDb.batch();

    // 1. Delete the test document
    const testRef = adminDb.collection("tests").doc(testId);
    batch.delete(testRef);

    // 2. Find and delete all questions associated with this test
    const questionsSnapshot = await adminDb.collection("questions").where("testId", "==", testId).get();
    questionsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 3. Find and delete all results associated with this test
    const resultsSnapshot = await adminDb.collection("results").where("testId", "==", testId).get();
    resultsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch operation
    await batch.commit();

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting test:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete test completely" };
  }
}
