"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { getOmrResultsForStudent } from "@/actions/omr";
import { getRequiredIdToken } from "@/lib/auth-token";
import { OmrResult } from "@/lib/types/omr";

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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
