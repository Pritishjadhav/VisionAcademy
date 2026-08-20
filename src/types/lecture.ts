export interface FacultyLecture {
  id: string;
  facultyId: string;
  facultyName: string;
  date: string; // YYYY-MM-DD format
  batch: string;
  subject: string;
  numberOfLectures: number;
  totalHours: number;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
