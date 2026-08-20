"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ArrowLeft, BookOpen, Calendar, Target, Award, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { TheoryPerformanceChart } from "@/components/student/TheoryPerformanceChart";

interface TheoryMark {
  id: string;
  testId: string;
  testName: string;
  subject: string;
  date: string;
  totalMarks: number;
  marksObtained: number;
  createdAt: string;
}

export default function StudentTheoryMarksPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [marks, setMarks] = useState<TheoryMark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login/student");
      else if (role !== "student") router.push("/login/student");
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function fetchTheoryMarks() {
      if (!user?.uid) return;
      
      try {
        const q = query(
          collection(db, "theoryMarks"),
          where("studentId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TheoryMark[];
        
        // Sort by date descending client-side to avoid needing an index right away
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setMarks(data);
      } catch (error) {
        console.error("Error fetching theory marks:", error);
        toast.error("Failed to load theory marks");
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.uid && role === "student") {
      fetchTheoryMarks();
    }
  }, [user?.uid, role]);

  if (authLoading || !user || role !== "student") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  // Calculate overall performance
  let overallPercentage = 0;
  if (marks.length > 0) {
    const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMax = marks.reduce((sum, m) => sum + m.totalMarks, 0);
    overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <button 
        onClick={() => router.push("/student/dashboard")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Theory Marks</h1>
          <p className="text-slate-500">Your performance in offline assessments.</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
          <Loader2 className="animate-spin text-brand-blue mx-auto mb-4" size={32} />
          <p>Loading your marks...</p>
        </div>
      ) : marks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-orange/5 text-brand-orange rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Marks Found</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            You haven't been graded for any theory tests yet. Check back later when your teachers have uploaded the results.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-brand-blue/5 text-brand-blue rounded-full flex items-center justify-center shrink-0">
              <Award size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Overall Performance</h2>
              <p className="text-sm text-slate-500">Based on {marks.length} tests taken</p>
            </div>
            <div className="ml-auto text-right">
              <div className={`text-4xl font-bold ${
                overallPercentage >= 75 ? 'text-green-600' :
                overallPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {overallPercentage}%
              </div>
            </div>
          </div>

          {marks.length > 0 && (
            <TheoryPerformanceChart marks={marks} />
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm font-medium border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">Test Name</th>
                    <th className="py-4 px-6">Subject</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Marks Obtained</th>
                    <th className="py-4 px-6 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marks.map(mark => {
                    const percentage = Math.round((mark.marksObtained / mark.totalMarks) * 100);
                    return (
                      <tr key={mark.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-900">{mark.testName}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                            {mark.subject}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {new Date(mark.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right font-medium">
                          <span className="text-slate-900">{mark.marksObtained}</span>
                          <span className="text-slate-400"> / {mark.totalMarks}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold ${
                            percentage >= 75 ? 'bg-green-50 text-green-700' :
                            percentage >= 60 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
