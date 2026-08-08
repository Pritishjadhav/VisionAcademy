"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ArrowLeft, Loader2, Trophy, BarChart, Download } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Test, TestResult } from "@/lib/types/test";
import { Button } from "@/components/ui/Button";

interface StudentResultExt extends TestResult {
  studentName: string;
}

export default function AdminTestResultsPage() {
  const { testId } = useParams() as { testId: string };
  const router = useRouter();
  
  const [test, setTest] = useState<Test | null>(null);
  const [results, setResults] = useState<StudentResultExt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!testId) return;
      try {
        const docRef = doc(db, "tests", testId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTest({ id: docSnap.id, ...docSnap.data() } as Test);
        } else {
          toast.error("Test not found");
          router.push("/admin/dashboard/tests");
          return;
        }

        // Fetch Results
        const q = query(collection(db, "results"), where("testId", "==", testId));
        const resultsSnap = await getDocs(q);
        
        const resultsData: StudentResultExt[] = [];
        
        for (const rDoc of resultsSnap.docs) {
          const rData = rDoc.data() as TestResult;
          // Fetch student name
          const studentDoc = await getDoc(doc(db, "students", rData.studentId));
          const studentName = studentDoc.exists() ? studentDoc.data().name : "Unknown Student";
          const { id, ...restData } = rData;
          resultsData.push({ id: rDoc.id, studentName, ...restData });
        }
        
        // Sort by marks descending
        resultsData.sort((a, b) => b.marksObtained - a.marksObtained);
        setResults(resultsData);
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [testId, router]);

  if (loading || !test) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  const averageScore = results.length > 0 
    ? (results.reduce((acc, curr) => acc + curr.marksObtained, 0) / results.length).toFixed(1)
    : 0;

  const highestScore = results.length > 0 ? results[0].marksObtained : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/tests">
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 line-clamp-1">{test.testName} - Results</h1>
          <p className="text-slate-500">Batch: {test.batch}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Highest Score</p>
            <p className="text-2xl font-bold text-slate-900">{highestScore} / {test.totalMarks}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center">
            <BarChart size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Average Score</p>
            <p className="text-2xl font-bold text-slate-900">{averageScore} / {test.totalMarks}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <BarChart size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Attempts</p>
            <p className="text-2xl font-bold text-slate-900">{results.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Student Rankings</h2>
          <Button variant="outline" className="text-sm h-9">
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
        </div>
        
        {results.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No students have completed this test yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="p-4 font-medium">Rank</th>
                  <th className="p-4 font-medium">Student Name</th>
                  <th className="p-4 font-medium text-right">Score</th>
                  <th className="p-4 font-medium text-right">Percentage</th>
                  <th className="p-4 font-medium text-right">Percentile</th>
                  <th className="p-4 font-medium text-center">Correct/Wrong</th>
                </tr>
              </thead>
              <tbody>
                {results.map((res, idx) => (
                  <tr key={res.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-900">{res.studentName}</td>
                    <td className="p-4 font-bold text-slate-900 text-right">{res.marksObtained}</td>
                    <td className="p-4 font-medium text-slate-600 text-right">{res.percentage}%</td>
                    <td className="p-4 font-medium text-slate-600 text-right">{res.percentile || '-'}</td>
                    <td className="p-4 text-center">
                      <span className="text-green-600 font-medium">{res.correctAnswers}</span> / <span className="text-red-600 font-medium">{res.wrongAnswers}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
