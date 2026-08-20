"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, CalendarCheck, FileText, BookOpen, IndianRupee, ListChecks, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface FeePayment {
  id?: string;
  studentId: string;
  amount: number;
  date: string;
  receiptNo: string;
  remarks: string;
  createdAt?: string;
}

export default function ParentStudentDashboard() {
  const { studentId } = useParams() as { studentId: string };
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  
  const [studentName, setStudentName] = useState("");
  const [studentBatch, setStudentBatch] = useState("");
  const [attendanceStats, setAttendanceStats] = useState<{ total: number, present: number } | null>(null);
  
  const [totalFees, setTotalFees] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [feesLoading, setFeesLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user || !dbUser || !studentId) return;

    if (!(dbUser.studentIds as string[])?.includes(studentId)) {
      router.replace("/parent/dashboard");
      return;
    }

    getDoc(doc(db, "students", studentId)).then(stuSnap => {
      if (stuSnap.exists()) {
        const data = stuSnap.data();
        setStudentName(data.name);
        setStudentBatch(data.batch);
        setTotalFees(data.totalFees || 0);
      }
    });

    const attQ = query(
      collection(db, "attendance"),
      where("studentId", "==", studentId)
    );

    const unsubscribeAtt = onSnapshot(attQ, (snapshot) => {
      let total = 0;
      let present = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.status === "present" || data.status === "late") present++;
      });
      setAttendanceStats({ total, present });
      setStatsLoading(false);
    });

    const feesQ = query(collection(db, "feePayments"), where("studentId", "==", studentId));
    const unsubscribeFees = onSnapshot(feesQ, (feesSnap) => {
      let paid = 0;
      feesSnap.forEach(d => {
        paid += d.data().amount || 0;
      });
      setTotalPaid(paid);
      setFeesLoading(false);
    });

    return () => {
      unsubscribeAtt();
      unsubscribeFees();
    };
  }, [studentId, user, dbUser, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  const remainingFees = Math.max(0, totalFees - totalPaid);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/parent/dashboard">
          <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{studentName || 'Student Dashboard'}</h1>
          <p className="text-slate-500 text-lg">Batch: {studentBatch || 'N/A'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-2 bg-gradient-to-r from-brand-orange to-brand-blue" />
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-blue">
                <CalendarCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Attendance</h3>
                <p className="text-sm text-slate-500">Overall Percentage</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {statsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-brand-orange" size={24} />
                </div>
              ) : attendanceStats && attendanceStats.total > 0 ? (
                <>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-medium">Attendance</span>
                      <span className={`text-2xl font-bold ${
                        (attendanceStats.present / attendanceStats.total) * 100 >= 75 ? 'text-green-600' : 
                        (attendanceStats.present / attendanceStats.total) * 100 >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round((attendanceStats.present / attendanceStats.total) * 100)}%
                      </span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-xs text-slate-500 font-medium">Classes Attended</span>
                      <span className="font-semibold text-slate-900">{attendanceStats.present} / {attendanceStats.total}</span>
                    </div>
                  </div>
                  
                  <Link href={`/parent/student/${studentId}/attendance`} className="block w-full">
                    <button className="w-full py-2.5 text-sm font-medium text-brand-blue bg-brand-blue/5 rounded-xl hover:bg-brand-blue/10 transition-colors">
                      View Full History
                    </button>
                  </Link>
                </>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <p className="text-slate-500 text-sm">No attendance records found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Online Tests Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
          <div className="h-2 bg-gradient-to-r from-brand-blue to-brand-orange" />
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-blue">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Online Tests</h3>
                <p className="text-sm text-slate-500">Practice and evaluate</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center mb-4">
                <p className="text-slate-500 text-sm">Access upcoming, live, and completed online tests.</p>
              </div>
              <Link href={`/parent/student/${studentId}/tests`} className="w-full">
                <button className="w-full py-2.5 text-sm font-medium text-brand-orange bg-brand-orange/5 rounded-xl hover:bg-brand-orange/10 transition-colors">
                  Go to Online Tests
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Theory Marks Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
          <div className="h-2 bg-gradient-to-r from-brand-orange to-brand-blue" />
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-orange">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Theory Marks</h3>
                <p className="text-sm text-slate-500">View offline test results</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center mb-4">
                <p className="text-slate-500 text-sm">Access marks for all offline/theory tests.</p>
              </div>
              <Link href={`/parent/student/${studentId}/theory`} className="w-full">
                <button className="w-full py-2.5 text-sm font-medium text-brand-blue bg-brand-blue/5 rounded-xl hover:bg-brand-blue/10 transition-colors">
                  Go to Theory Marks
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Fees Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
          <div className="h-2 bg-gradient-to-r from-brand-blue to-green-500" />
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-green-600">
                <IndianRupee size={24} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fees Summary</h3>
                <p className="text-sm text-slate-500">Track payments</p>
              </div>
            </div>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {feesLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-green-600" size={24} />
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Total Fees</span>
                      <span className="font-semibold text-slate-900">₹{totalFees.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Paid</span>
                      <span className="font-bold text-green-600">₹{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Remaining</span>
                      <span className="font-bold text-brand-orange">₹{remainingFees.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Link href={`/parent/student/${studentId}/fees`} className="block w-full">
                    <button className="w-full py-2.5 text-sm font-medium text-green-700 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                      View Payment History
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
