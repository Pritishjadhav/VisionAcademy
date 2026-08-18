export type OmrExamType = "JEE" | "NEET" | "CUSTOM";
export type OmrNumericalStatus = "correct" | "wrong" | "blank";

export interface OmrTest {
  id: string;
  testName: string;
  testDate: string;
  batch: string;
  examType: OmrExamType;
  totalQuestions: number;
  omrQuestions?: number;
  numericalQuestions?: number;
  choices: number;
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
  numericalAnswers?: OmrNumericalStatus[];
  numericalCorrect?: number;
  numericalWrong?: number;
  numericalUnattempted?: number;
  answerKey?: number[];
  createdAt: string;
  updatedAt: string;
}

export function omrQuestionNumbers(examType: OmrExamType, questionCount: number): number[] {
  if (examType === "JEE") {
    return [
      ...Array.from({ length: 20 }, (_, index) => index + 1),
      ...Array.from({ length: 20 }, (_, index) => index + 26),
      ...Array.from({ length: 20 }, (_, index) => index + 51),
    ];
  }
  return Array.from({ length: questionCount }, (_, index) => index + 1);
}

export const JEE_NUMERICAL_QUESTIONS = [
  ...Array.from({ length: 5 }, (_, index) => index + 21),
  ...Array.from({ length: 5 }, (_, index) => index + 46),
  ...Array.from({ length: 5 }, (_, index) => index + 71),
];
