export type QuestionType = 'MCQ' | 'MSQ' | 'Integer';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type Subject = 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
export type Batch = '11th IIT-JEE Integrated' | '12th IIT-JEE Integrated' | '11th NEET Integrated' | '12th NEET Integrated';

export interface Question {
  id: string;
  testId: string;
  questionNumber: number;
  questionText: string;
  subject: Subject;
  questionType: QuestionType;
  imageUrl?: string;
  options?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  optionImages?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  correctOption?: string; // For MCQ (e.g., 'A')
  correctOptions?: string[]; // For MSQ (e.g., ['A', 'C'])
  correctInteger?: number; // For Integer
  marks: number;
  negativeMarks: number;
  explanation?: string;
  difficultyLevel: DifficultyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: string;
  testName: string;
  description?: string;
  batch: Batch;
  testDate: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  totalDuration: number; // in minutes
  totalMarks: number;
  negativeMarkingEnabled: boolean;
  marksPerCorrectAnswer: number;
  marksPerWrongAnswer: number;
  instructions: string;
  createdAt: string;
  updatedAt: string;
  status: 'Draft' | 'Published'; // Admin can draft before publishing
}

export interface StudentAnswer {
  id: string;
  testId: string;
  studentId: string;
  answers: {
    [questionId: string]: {
      status: 'Answered' | 'Marked for Review' | 'Answered & Marked for Review' | 'Not Answered' | 'Not Visited';
      selectedOption?: string | null; // For MCQ
      selectedOptions?: string[]; // For MSQ
      enteredInteger?: number | null; // For Integer
      timeSpent: number; // seconds spent on this question
    };
  };
  submitted: boolean;
  submittedAt?: string;
  startedAt: string;
  submissionType?: 'Normal' | 'Auto Submitted' | 'Violation';
  violationReason?: string;
}

export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  totalMarks: number;
  marksObtained: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  positiveMarks: number;
  negativeMarks: number;
  percentage: number;
  rank?: number;
  percentile?: number;
  timeTaken: number; // in seconds
  subjectWiseMarks: {
    Physics: number;
    Chemistry: number;
    Mathematics: number;
    Biology: number;
  };
  subjectWiseAccuracy: {
    Physics: number;
    Chemistry: number;
    Mathematics: number;
    Biology: number;
  };
  overallAccuracy: number;
  createdAt: string;
  submissionType?: 'Normal' | 'Auto Submitted';
  violationReason?: string;
}

export interface Ranking {
  id: string; // typically testId
  testId: string;
  batch: Batch;
  students: {
    studentId: string;
    score: number;
    rank: number;
    percentile: number;
  }[];
  updatedAt: string;
}
