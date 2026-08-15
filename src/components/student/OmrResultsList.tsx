"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { getOmrResultsForStudent } from "@/actions/omr";
import { getRequiredIdToken } from "@/lib/auth-token";
import { JEE_NUMERICAL_QUESTIONS, OmrResult, omrQuestionNumbers } from "@/lib/types/omr";

export function OmrResultsList({ studentId }: { studentId: string }) {
  const [results, setResults] = useState<OmrResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadResults() {
      try {
        const data = await getOmrResultsForStudent(await getRequiredIdToken(), studentId);
        if (active) {
          setResults(data);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load OMR results.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadResults();
    return () => {
      active = false;
    };
  }, [studentId]);

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <FileCheck2 className="text-brand-blue" size={24} />
        <div>
          <h2 className="text-xl font-bold text-slate-900">OMR Test Results</h2>
          <p className="text-sm text-slate-500">Offline JEE and NEET test performance</p>
        </div>
      </div>
      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 text-slate-500">Loading OMR results...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-700">{error}</div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 text-slate-500">No OMR results published yet.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((result) => (
            <article key={result.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">{result.testName}</h3>
                  <p className="text-sm text-slate-500 mt-1">{result.examType} · {result.testDate} · {result.batch}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-brand-blue">{result.marksObtained}</p>
                  <p className="text-xs text-slate-500">out of {result.maxMarks}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="rounded-xl bg-green-50 p-2">
                  <CheckCircle2 className="mx-auto text-green-600" size={16} />
                  <p className="font-bold text-green-700 mt-1">{result.correctAnswers}</p>
                  <p className="text-[10px] text-green-700">Correct</p>
                </div>
                <div className="rounded-xl bg-red-50 p-2">
                  <XCircle className="mx-auto text-red-600" size={16} />
                  <p className="font-bold text-red-700 mt-1">{result.wrongAnswers}</p>
                  <p className="text-[10px] text-red-700">Wrong</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <p className="font-bold text-slate-700 mt-5">{result.unattempted}</p>
                  <p className="text-[10px] text-slate-600">Unattempted</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-600 mt-4">
                Score: {result.percentage}% · Positive: +{result.positiveMarks} · Negative: −{result.negativeMarks}
              </p>
              {result.examType === "JEE" && (
                <p className="text-xs text-amber-700 mt-2 mb-4">
                  Numerical section: {result.numericalCorrect ?? 0} correct · {result.numericalWrong ?? 0} wrong · {result.numericalUnattempted ?? 15} blank
                </p>
              )}
              
              {result.answerKey && result.selectedAnswers && (
                <div className="mt-4">
                  <p className="font-semibold text-slate-700 mb-2 text-sm">Question Breakdown</p>
                  <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 max-h-64 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {omrQuestionNumbers(result.examType, result.totalQuestions).map((qNum, i) => {
                        const isNumerical = result.examType === "JEE" && JEE_NUMERICAL_QUESTIONS.includes(qNum);
                        let status = "";
                        let studentChoiceStr = "";
                        let correctChoiceStr = "";
                        
                        if (isNumerical) {
                          const numIdx = JEE_NUMERICAL_QUESTIONS.indexOf(qNum);
                          const numStat = result.numericalAnswers?.[numIdx] || "blank";
                          status = numStat === "correct" ? "bg-green-100 text-green-800" : numStat === "wrong" ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-800";
                          studentChoiceStr = numStat === "correct" ? "✓" : numStat === "wrong" ? "✗" : "-";
                        } else {
                          let idx = i;
                          if (result.examType === "JEE") {
                            if (qNum >= 1 && qNum <= 20) idx = qNum - 1;
                            else if (qNum >= 26 && qNum <= 45) idx = qNum - 26 + 20;
                            else if (qNum >= 51 && qNum <= 70) idx = qNum - 51 + 40;
                          }
                          
                          const studentChoice = result.selectedAnswers[idx];
                          const correctChoice = result.answerKey![idx];
                          
                          if (studentChoice === null) {
                            status = "bg-slate-200 text-slate-800";
                            studentChoiceStr = "-";
                          } else if (studentChoice === correctChoice) {
                            status = "bg-green-100 text-green-800";
                            studentChoiceStr = String.fromCharCode(64 + studentChoice);
                          } else {
                            status = "bg-red-100 text-red-800";
                            studentChoiceStr = String.fromCharCode(64 + studentChoice);
                          }
                          correctChoiceStr = correctChoice ? String.fromCharCode(64 + correctChoice) : "?";
                        }
                        
                        return (
                          <div key={qNum} className={`flex flex-col items-center justify-center p-1.5 rounded-md text-xs font-medium ${status}`}>
                            <span className="opacity-75 text-[10px]">Q{qNum}</span>
                            <span className="font-bold text-sm leading-none mt-0.5">{studentChoiceStr}</span>
                            {!isNumerical && studentChoiceStr !== "-" && studentChoiceStr !== correctChoiceStr && (
                              <span className="text-[9px] opacity-75 mt-0.5">(Ans: {correctChoiceStr})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
