"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Test, Question, StudentAnswer } from "@/lib/types/test";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export default function StudentReviewPage() {
  const { testId } = useParams() as { testId: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer | null>(null);
  const [batchAverages, setBatchAverages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviewData() {
      if (!testId || !user) return;
      try {
        const tSnap = await getDoc(doc(db, "tests", testId));
        if (tSnap.exists()) {
          setTest({ id: tSnap.id, ...tSnap.data() } as Test);
        } else {
          router.replace("/student/tests");
          return;
        }

        // Fetch Answers
        if (isPractice) {
          const storedAnswers = sessionStorage.getItem(`practiceAnswers_${testId}`);
          if (storedAnswers) {
            setStudentAnswers(JSON.parse(storedAnswers) as StudentAnswer);
          } else {
            setStudentAnswers(null);
          }
        } else {
          const ansQ = query(collection(db, "studentAnswers"), where("testId", "==", testId), where("studentId", "==", user.uid));
          const ansSnap = await getDocs(ansQ);
          if (!ansSnap.empty) {
            const ansData = { id: ansSnap.docs[0].id, ...ansSnap.docs[0].data() } as StudentAnswer;
            if (ansData.submissionType === 'Auto Submitted') {
              toast.error("Review is not allowed for auto-submitted tests due to rule violations.");
              router.replace(`/student/tests/${testId}/result`);
              return;
            }
            setStudentAnswers(ansData);
          } else {
            setStudentAnswers(null);
          }
        }

        // Fetch Questions
        const qQ = query(collection(db, "questions"), where("testId", "==", testId));
        const qSnap = await getDocs(qQ);
        const qs = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[];
        qs.sort((a, b) => a.questionNumber - b.questionNumber);
        setQuestions(qs);

        // Compute Batch Averages dynamically
        const allAnsQ = query(collection(db, "studentAnswers"), where("testId", "==", testId));
        const allAnsSnap = await getDocs(allAnsQ);
        const sums: Record<string, { total: number; count: number }> = {};
        allAnsSnap.forEach(docSnap => {
          const data = docSnap.data() as StudentAnswer;
          // Skip invalid/auto-submitted attempts for average calculation
          if (data.submissionType === 'Auto Submitted' || data.submissionType === 'Violation') return;
          
          if (data.answers) {
            Object.entries(data.answers).forEach(([qid, ansState]) => {
              if (ansState.timeSpent && ansState.timeSpent > 0) {
                if (!sums[qid]) sums[qid] = { total: 0, count: 0 };
                sums[qid].total += ansState.timeSpent;
                sums[qid].count += 1;
              }
            });
          }
        });

        const avgs: Record<string, number> = {};
        Object.keys(sums).forEach(qid => {
          avgs[qid] = Math.round(sums[qid].total / sums[qid].count);
        });
        setBatchAverages(avgs);

      } catch (error) {
        console.error("Error fetching review data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviewData();
  }, [testId, user, router]);

  if (loading || !test) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  const formatTime = (seconds: number) => {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/student/tests/${testId}/result${isPractice ? '?practice=true' : ''}`}>
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowLeft size={20} className="text-slate-700" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 line-clamp-1">Review: {test.testName}</h1>
            <p className="text-slate-500">Question by question analysis</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const ans = studentAnswers?.answers?.[q.id];

          let isAttempted = false;
          let isCorrect = false;

          if (q.questionType === 'MCQ') {
            isAttempted = !!ans?.selectedOption;
            isCorrect = isAttempted && ans?.selectedOption === q.correctOption;
          } else if (q.questionType === 'MSQ') {
            isAttempted = !!ans?.selectedOptions && ans.selectedOptions.length > 0;
            if (isAttempted && ans?.selectedOptions) {
              const sortedAns = [...ans.selectedOptions].sort();
              const sortedCorr = [...(q.correctOptions || [])].sort();
              isCorrect = JSON.stringify(sortedAns) === JSON.stringify(sortedCorr);
            }
          } else if (q.questionType === 'Integer') {
            isAttempted = ans?.enteredInteger !== undefined && ans?.enteredInteger !== null;
            isCorrect = isAttempted && ans?.enteredInteger === q.correctInteger;
          }

          const statusColor = !studentAnswers ? 'border-slate-300' : !isAttempted ? 'border-slate-300' : isCorrect ? 'border-green-400' : 'border-red-400';
          const headerBg = !studentAnswers ? 'bg-slate-50' : !isAttempted ? 'bg-slate-100' : isCorrect ? 'bg-green-50' : 'bg-red-50';
          const headerBorder = !studentAnswers ? 'border-slate-200' : !isAttempted ? 'border-slate-200' : isCorrect ? 'border-green-200' : 'border-red-200';

          return (
            <div key={q.id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${statusColor}`}>
              <div className={`p-4 border-b flex justify-between items-center ${headerBg} ${headerBorder}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${!studentAnswers ? 'bg-brand-blue' : !isAttempted ? 'bg-slate-400' : isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-800">{q.subject}</span>
                </div>
                {studentAnswers && (
                  <div className="flex items-center gap-2 font-medium">
                    {!isAttempted ? (
                      <><AlertCircle size={18} className="text-slate-500" /> <span className="text-slate-600">Skipped (0 Marks)</span></>
                    ) : isCorrect ? (
                      <><CheckCircle2 size={18} className="text-green-600" /> <span className="text-green-700">Correct (+{q.marks} Marks)</span></>
                    ) : (
                      <><XCircle size={18} className="text-red-600" /> <span className="text-red-700">Wrong (-{q.negativeMarks} Marks)</span></>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Time Stats */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Clock size={16} />
                    <span className="font-medium">Your Time:</span>
                    <span className="font-bold">{formatTime(ans?.timeSpent || 0)}</span>
                  </div>
                  {batchAverages[q.id] !== undefined && (
                    <div className="flex items-center gap-2 text-sm bg-blue-50 text-brand-blue px-3 py-1.5 rounded-lg border border-blue-100">
                      <Clock size={16} />
                      <span className="font-medium">Batch Avg:</span>
                      <span className="font-bold">{formatTime(batchAverages[q.id])}</span>
                    </div>
                  )}
                </div>

                <p className="text-lg text-slate-800 font-medium whitespace-pre-wrap mb-6">{q.questionText}</p>

                {q.questionType !== 'Integer' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const isOptionSelected =
                        (q.questionType === 'MCQ' && ans?.selectedOption === opt) ||
                        (q.questionType === 'MSQ' && ans?.selectedOptions?.includes(opt));

                      const isOptionCorrect =
                        (q.questionType === 'MCQ' && q.correctOption === opt) ||
                        (q.questionType === 'MSQ' && q.correctOptions?.includes(opt));

                      let optClass = "border-slate-200 bg-slate-50";

                      if (isOptionCorrect && isOptionSelected) optClass = "border-green-500 bg-green-50 ring-2 ring-green-500/20";
                      else if (isOptionCorrect && !isOptionSelected) optClass = "border-green-500 bg-green-50 ring-2 ring-green-500/20"; // Highlight correct answer always
                      else if (!isOptionCorrect && isOptionSelected) optClass = "border-red-500 bg-red-50 ring-2 ring-red-500/20";

                      return (
                        <div key={opt} className={`p-4 rounded-xl border ${optClass}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2">
                              <span className="font-bold text-slate-500">{opt}.</span>
                              <span className="text-slate-800">{q.options![opt as keyof typeof q.options]}</span>
                            </div>
                            {isOptionSelected && (
                              <span className="text-xs font-bold px-2 py-1 bg-white border rounded shadow-sm text-slate-600">Your Answer</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.questionType === 'Integer' && (
                  <div className={`grid grid-cols-1 ${studentAnswers ? 'sm:grid-cols-2' : ''} gap-4 mb-6`}>
                    {studentAnswers && (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="text-sm text-slate-500 mb-1 font-medium">Your Answer</p>
                        <p className={`text-lg font-bold ${!isAttempted ? 'text-slate-400' : isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {isAttempted ? ans?.enteredInteger : 'Skipped'}
                        </p>
                      </div>
                    )}
                    <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                      <p className="text-sm text-green-600/70 mb-1 font-medium">Correct Answer</p>
                      <p className="text-lg font-bold text-green-700">{q.correctInteger}</p>
                    </div>
                  </div>
                )}

                {q.explanation && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-2">Explanation</h4>
                    <p className="text-blue-900/80 whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
