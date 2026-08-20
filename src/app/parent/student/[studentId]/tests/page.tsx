"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, Calendar, Clock, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { Test, TestResult } from "@/lib/types/test";
import { format } from "date-fns";
import { OmrResultsList } from "@/components/student/OmrResultsList";
import { OnlineTestsPerformanceChart } from "@/components/student/OnlineTestsPerformanceChart";

interface ExtendedTestResult extends TestResult {
  testDetails: Test;
}

export default function StudentTestsPage() {
  const { studentId } = useParams() as { studentId: string };
  const router = useRouter();
  const { user, dbUser } = useAuth();

  const [studentName, setStudentName] = useState("");
  const [results, setResults] = useState<ExtendedTestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !dbUser || !studentId) return;

    if (!(dbUser.studentIds as string[])?.includes(studentId)) {
      router.replace("/parent/dashboard");
      return;
    }

    getDoc(doc(db, "students", studentId)).then(stuSnap => {
      if (stuSnap.exists()) {
        setStudentName(stuSnap.data().name);
      }
    });

    const resQ = query(
      collection(db, "results"),
      where("studentId", "==", studentId)
    );

    const unsubscribe = onSnapshot(resQ, async (resSnap) => {
      try {
        const sortedDocs = [...resSnap.docs].sort((a, b) => {
          const aData = a.data() as TestResult;
          const bData = b.data() as TestResult;
          return new Date(aData.createdAt).getTime() - new Date(bData.createdAt).getTime();
        });

        const latestResults = new Map<string, TestResult>();
        for (const rDoc of sortedDocs) {
          const resultData = rDoc.data() as TestResult;
          latestResults.set(resultData.testId, { ...resultData, id: rDoc.id });
        }

        const extResults: ExtendedTestResult[] = [];

        for (const rData of Array.from(latestResults.values())) {
          const tSnap = await getDoc(doc(db, "tests", rData.testId));
          if (tSnap.exists()) {
            extResults.push({ ...rData, testDetails: { id: tSnap.id, ...tSnap.data() } as Test } as ExtendedTestResult);
          }
        }

        extResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setResults(extResults);
        setLoading(false);
      } catch (error) {
        console.error("Error processing results:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [studentId, user, dbUser, router]);

  if (loading) {
    return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const completedTests = results.map(r => r.testDetails);
  const resultsMap = results.reduce((acc, curr) => {
    acc[curr.testId] = curr;
    return acc;
  }, {} as Record<string, TestResult>);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href={`/parent/student/${studentId}`}>
          <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Online Tests & Results</h1>
          <p className="text-slate-500">{studentName}</p>
        </div>
      </div>

      <div className="space-y-8">
        <OmrResultsList studentId={studentId} />
        
        {results.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Test Results</h2>
              <div className="grid grid-cols-1 gap-4">
                {results.map((result) => (
                  <div key={result.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{result.testDetails.testName}</h3>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {format(new Date(result.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatTime(result.timeTaken)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 md:border-l md:border-slate-100 md:pl-6 shrink-0">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-blue">{result.marksObtained}</div>
                        <div className="text-xs font-medium text-slate-500">Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{Math.round(result.percentage)}%</div>
                        <div className="text-xs font-medium text-slate-500">Percentage</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <OnlineTestsPerformanceChart tests={completedTests} results={resultsMap} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Tests Completed</h2>
            <p className="text-slate-500 max-w-sm mx-auto">
              {studentName} hasn&apos;t completed any online tests yet. When they do, their results and performance analytics will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
