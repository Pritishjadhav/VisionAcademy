"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Test, TestResult } from "@/lib/types/test";
import { Loader2, ArrowLeft, Trophy, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StudentResultPage() {
  const { testId } = useParams() as { testId: string };
  const router = useRouter();
  const { user, dbUser } = useAuth();
  
  const [test, setTest] = useState<Test | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      if (!testId || !user) return;
      try {
        const tSnap = await getDoc(doc(db, "tests", testId));
        if (tSnap.exists()) {
          setTest({ id: tSnap.id, ...tSnap.data() } as Test);
        } else {
          router.replace("/student/tests");
          return;
        }

        const resQ = query(collection(db, "results"), where("testId", "==", testId), where("studentId", "==", user.uid));
        const resSnap = await getDocs(resQ);
        if (!resSnap.empty) {
          setResult({ id: resSnap.docs[0].id, ...resSnap.docs[0].data() } as TestResult);
        } else {
          toast.error("Result not found");
          router.replace("/student/tests");
        }
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [testId, user, router]);

  if (loading || !test || !result) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const chartData = [
    { name: 'Physics', accuracy: result.subjectWiseAccuracy.Physics, marks: result.subjectWiseMarks.Physics },
    { name: 'Chemistry', accuracy: result.subjectWiseAccuracy.Chemistry, marks: result.subjectWiseMarks.Chemistry },
    { name: 'Mathematics', accuracy: result.subjectWiseAccuracy.Mathematics, marks: result.subjectWiseMarks.Mathematics },
    { name: 'Biology', accuracy: result.subjectWiseAccuracy.Biology, marks: result.subjectWiseMarks.Biology },
  ].filter(d => d.marks !== 0 || d.accuracy !== 0); // Only show subjects attempted/present in test

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/student/tests">
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowLeft size={20} className="text-slate-700" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 line-clamp-1">Result: {test.testName}</h1>
            <p className="text-slate-500">View your detailed performance report</p>
          </div>
        </div>
        {result.submissionType !== 'Auto Submitted' && (
          <Link href={`/student/tests/${test.id}/review`}>
            <Button variant="outline" className="border-brand-blue text-brand-blue">
              Review Answers
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Marks Obtained</p>
            <p className="text-2xl font-bold text-slate-900">{result.marksObtained} <span className="text-sm text-slate-500">/ {result.totalMarks}</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center">
            <BarChart size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Percentage</p>
            <p className="text-2xl font-bold text-slate-900">{result.percentage}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Overall Accuracy</p>
            <p className="text-2xl font-bold text-slate-900">{result.overallAccuracy}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Time Taken</p>
            <p className="text-2xl font-bold text-slate-900">{formatTime(result.timeTaken)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attempt Statistics */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Attempt Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={24} />
                <span className="font-medium text-green-800">Correct Answers</span>
              </div>
              <span className="font-bold text-green-700 text-xl">{result.correctAnswers}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={24} />
                <span className="font-medium text-red-800">Wrong Answers</span>
              </div>
              <span className="font-bold text-red-700 text-xl">{result.wrongAnswers}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-slate-600" size={24} />
                <span className="font-medium text-slate-700">Unattempted</span>
              </div>
              <span className="font-bold text-slate-700 text-xl">{result.unattempted}</span>
            </div>
          </div>
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Subject-wise Accuracy (%)</h2>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="accuracy" name="Accuracy (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Not enough data for chart.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
