"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
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

export default function StudentTheoryPage() {
  const { studentId } = useParams() as { studentId: string };
  const router = useRouter();
  const { user, dbUser } = useAuth();

  const [studentName, setStudentName] = useState("");
  const [theoryMarks, setTheoryMarks] = useState<TheoryMark[]>([]);
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

    const theoryQ = query(
      collection(db, "theoryMarks"),
      where("studentId", "==", studentId)
    );

    const unsubscribe = onSnapshot(theoryQ, (theorySnap) => {
      const fetchedMarks: TheoryMark[] = [];
      theorySnap.forEach((doc) => {
        fetchedMarks.push({ id: doc.id, ...doc.data() } as TheoryMark);
      });
      fetchedMarks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTheoryMarks(fetchedMarks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId, user, dbUser, router]);

  if (loading) {
    return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href={`/parent/student/${studentId}`}>
          <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Theory Marks</h1>
          <p className="text-slate-500">{studentName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {theoryMarks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
            No theory marks found for this student.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
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
                      {theoryMarks.map(mark => {
                        const percentage = mark.totalMarks > 0 ? Math.round((mark.marksObtained / mark.totalMarks) * 100) : 0;
                        return (
                          <tr key={mark.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-900">{mark.testName}</p>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
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
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold ${percentage >= 75 ? 'bg-green-50 text-green-700' :
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
            </div>

            <div>
              <TheoryPerformanceChart marks={theoryMarks} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
