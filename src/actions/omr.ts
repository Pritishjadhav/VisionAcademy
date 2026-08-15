"use server";

import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin, requireUser } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import type { OmrExamType, OmrNumericalStatus, OmrResult, OmrTest } from "@/lib/types/omr";

const BATCHES = new Set([
  "11th IIT-JEE Integrated",
  "12th IIT-JEE Integrated",
  "11th NEET Integrated",
  "12th NEET Integrated",
]);

function validateExamType(value: string): asserts value is OmrExamType {
  if (value !== "JEE" && value !== "NEET" && value !== "CUSTOM") {
    throw new Error("Select JEE, NEET, or Custom.");
  }
}

export async function getOmrSetupData(idToken: string, batch: string) {
  const actor = await requireAdmin(idToken);
  enforceRateLimit(`action:get-omr-setup:${actor.uid}`, 120);
  if (!BATCHES.has(batch)) throw new Error("Select a valid batch.");

  const [testsSnapshot, studentsSnapshot] = await Promise.all([
    adminDb.collection("omrTests").where("batch", "==", batch).get(),
    adminDb.collection("students").where("batch", "==", batch).get(),
  ]);
  const tests = testsSnapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }) as OmrTest)
    .sort((a, b) => b.testDate.localeCompare(a.testDate));
  const students = studentsSnapshot.docs
    .map((document) => ({
      id: document.id,
      name: String(document.data().name || "Student"),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { tests, students };
}

export async function getOmrResultsForStudent(idToken: string, studentId: string) {
  const actor = await requireUser(idToken);
  enforceRateLimit(`action:get-omr-results:${actor.uid}`, 120);
  if (!studentId) throw new Error("Student is required.");

  if (actor.role === "student" && actor.uid !== studentId) {
    throw new Error("You cannot view another student's results.");
  }
  if (actor.role === "parent") {
    const parentSnapshot = await adminDb.collection("parents").doc(actor.uid).get();
    const studentIds = parentSnapshot.data()?.studentIds;
    if (!Array.isArray(studentIds) || !studentIds.includes(studentId)) {
      throw new Error("You cannot view this student's results.");
    }
  }
  if (actor.role === "faculty") {
    throw new Error("You cannot view student OMR results.");
  }

  const snapshot = await adminDb.collection("omrResults").where("studentId", "==", studentId).get();
  return snapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }) as OmrResult)
    .sort((a, b) => b.testDate.localeCompare(a.testDate));
}

export async function createOmrTest(
  idToken: string,
  input: {
    testName: string;
    testDate: string;
    batch: string;
    examType: string;
    totalQuestions?: number;
    choices?: number;
    marksPerCorrectAnswer: number;
    marksPerWrongAnswer: number;
    answerKey: number[];
  },
) {
  const actor = await requireAdmin(idToken);
  enforceRateLimit(`action:create-omr-test:${actor.uid}`, 20);
  validateExamType(input.examType);
  const omrQuestions = input.examType === "JEE"
    ? 60
    : input.examType === "NEET"
      ? 180
      : Number(input.totalQuestions);
  const totalQuestions = input.examType === "JEE" ? 75 : omrQuestions;
  const choices = input.examType === "CUSTOM" ? Number(input.choices) : 4;
  if (!input.testName.trim() || !input.testDate) throw new Error("Test name and date are required.");
  if (!BATCHES.has(input.batch)) throw new Error("Select a valid batch.");
  if (input.examType === "CUSTOM" && (!Number.isInteger(omrQuestions) || omrQuestions < 1 || omrQuestions > 180)) {
    throw new Error("Custom tests support 1 to 180 questions.");
  }
  if (!Number.isInteger(choices) || choices < 2 || choices > 5) {
    throw new Error("Select between 2 and 5 choices.");
  }
  if (
    input.answerKey.length !== omrQuestions
    || input.answerKey.some((answer) => answer < 1 || answer > choices)
  ) {
    throw new Error("Complete the answer key before creating the test.");
  }
  if (input.marksPerCorrectAnswer <= 0 || input.marksPerWrongAnswer < 0) {
    throw new Error("Enter a valid marking scheme.");
  }

  const now = new Date().toISOString();
  const document = {
    testName: input.testName.trim(),
    testDate: input.testDate,
    batch: input.batch,
    examType: input.examType,
    totalQuestions,
    omrQuestions,
    choices,
    marksPerCorrectAnswer: input.marksPerCorrectAnswer,
    marksPerWrongAnswer: input.marksPerWrongAnswer,
    maxMarks: totalQuestions * input.marksPerCorrectAnswer,
    answerKey: input.answerKey,
    createdAt: now,
    updatedAt: now,
  };
  const reference = await adminDb.collection("omrTests").add(document);
  return { success: true, test: { id: reference.id, ...document } };
}

export async function saveOmrResult(
  idToken: string,
  input: {
    testId: string;
    studentId: string;
    selectedAnswers: Array<number | null>;
    numericalAnswers?: OmrNumericalStatus[];
  },
) {
  const actor = await requireAdmin(idToken);
  enforceRateLimit(`action:save-omr-result:${actor.uid}`, 60);
  const [testSnapshot, studentSnapshot] = await Promise.all([
    adminDb.collection("omrTests").doc(input.testId).get(),
    adminDb.collection("students").doc(input.studentId).get(),
  ]);
  if (!testSnapshot.exists) throw new Error("OMR test not found.");
  if (!studentSnapshot.exists) throw new Error("Student not found.");
  const test = testSnapshot.data()!;
  const student = studentSnapshot.data()!;
  if (student.batch !== test.batch) throw new Error("The student is not in this test batch.");
  const omrQuestions = test.omrQuestions ?? (test.examType === "JEE" ? 60 : test.totalQuestions);
  if (input.selectedAnswers.length !== omrQuestions) throw new Error("Invalid graded answer count.");
  const numericalAnswers = test.examType === "JEE" ? input.numericalAnswers : [];
  if (
    test.examType === "JEE"
    && (
      !Array.isArray(numericalAnswers)
      || numericalAnswers.length !== 15
      || numericalAnswers.some((status) => !["correct", "wrong", "blank"].includes(status))
    )
  ) {
    throw new Error("Complete the manual status for all 15 JEE numerical questions.");
  }

  let correctAnswers = 0;
  let wrongAnswers = 0;
  let unattempted = 0;
  input.selectedAnswers.forEach((answer, index) => {
    if (answer === null) unattempted += 1;
    else if (answer === test.answerKey[index]) correctAnswers += 1;
    else wrongAnswers += 1;
  });
  const numericalCorrect = numericalAnswers?.filter((status) => status === "correct").length ?? 0;
  const numericalWrong = numericalAnswers?.filter((status) => status === "wrong").length ?? 0;
  const numericalUnattempted = numericalAnswers?.filter((status) => status === "blank").length ?? 0;
  correctAnswers += numericalCorrect;
  wrongAnswers += numericalWrong;
  unattempted += numericalUnattempted;
  const positiveMarks = correctAnswers * test.marksPerCorrectAnswer;
  const negativeMarks = wrongAnswers * test.marksPerWrongAnswer;
  const marksObtained = positiveMarks - negativeMarks;
  const totalQuestions = test.examType === "JEE" ? 75 : test.totalQuestions;
  const maxMarks = totalQuestions * test.marksPerCorrectAnswer;
  const now = new Date().toISOString();
  const result = {
    testId: input.testId,
    studentId: input.studentId,
    studentName: student.name || "Student",
    testName: test.testName,
    testDate: test.testDate,
    batch: test.batch,
    examType: test.examType,
    totalQuestions,
    maxMarks,
    marksObtained,
    correctAnswers,
    wrongAnswers,
    unattempted,
    positiveMarks,
    negativeMarks,
    percentage: Number(((marksObtained / maxMarks) * 100).toFixed(2)),
    selectedAnswers: input.selectedAnswers,
    numericalAnswers: numericalAnswers ?? [],
    numericalCorrect,
    numericalWrong,
    numericalUnattempted,
    answerKey: test.answerKey,
    createdAt: now,
    updatedAt: now,
  };
  await adminDb.collection("omrResults").doc(`${input.testId}_${input.studentId}`).set(result);
  return { success: true, result };
}

export async function deleteOmrTest(idToken: string, testId: string) {
  const actor = await requireAdmin(idToken);
  enforceRateLimit(`action:delete-omr-test:${actor.uid}`, 10);
  
  if (!testId) throw new Error("Test ID is required.");

  // Delete all results associated with this test
  const resultsSnapshot = await adminDb.collection("omrResults").where("testId", "==", testId).get();
  
  const batch = adminDb.batch();
  
  // Delete results
  resultsSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // Delete the test itself
  const testRef = adminDb.collection("omrTests").doc(testId);
  batch.delete(testRef);
  
  await batch.commit();
  
  return { success: true };
}
