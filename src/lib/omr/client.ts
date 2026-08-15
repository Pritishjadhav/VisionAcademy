import { getRequiredIdToken } from "@/lib/auth-token";

export type OmrGradeResult = {
  score: number;
  correct_count: number;
  total_questions: number;
  selected_answers: Array<number | null>;
  confidence: number[];
  graded_image_base64: string;
};

async function readApiError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null);
  return payload?.error || `Request failed with status ${response.status}.`;
}

export async function gradeOmrSheet(
  file: File,
  numQuestions: number,
  numChoices: number,
  answers: number[],
): Promise<OmrGradeResult> {
  const token = await getRequiredIdToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("num_questions", String(numQuestions));
  formData.append("num_choices", String(numChoices));
  formData.append("answer_key", answers.join(","));

  const response = await fetch("/api/omr/grade", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const payload = await response.json();
  return payload.data as OmrGradeResult;
}

export async function downloadOmrSheet(
  questions: number,
  choices: number,
  title: string,
): Promise<void> {
  const token = await getRequiredIdToken();
  const query = new URLSearchParams({
    questions: String(questions),
    choices: String(choices),
    title,
  });
  const response = await fetch(`/api/omr/generate?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await readApiError(response));

  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "vision-academy-omr.pdf";
  anchor.click();
  URL.revokeObjectURL(url);
}
