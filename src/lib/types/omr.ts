export type OmrExamType = "JEE" | "NEET";

export interface OmrTest {
  id: string;
  testName: string;
  testDate: string;
  batch: string;
  examType: OmrExamType;
  totalQuestions: number;
  choices: 4;
  marksPerCorrectAnswer: number;
  marksPerWrongAnswer: number;
  maxMarks: number;
  answerKey?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface OmrResult {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  testName: string;
  testDate: string;
  batch: string;
  examType: OmrExamType;
  totalQuestions: number;
  maxMarks: number;
  marksObtained: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  positiveMarks: number;
  negativeMarks: number;
  percentage: number;
  selectedAnswers: Array<number | null>;
  createdAt: string;
  updatedAt: string;
}

export function omrQuestionNumbers(examType: OmrExamType): number[] {
  if (examType === "JEE") {
    return [
      ...Array.from({ length: 20 }, (_, index) => index + 1),
      ...Array.from({ length: 20 }, (_, index) => index + 26),
      ...Array.from({ length: 20 }, (_, index) => index + 51),
    ];
  }
  return Array.from({ length: 180 }, (_, index) => index + 1);
}
