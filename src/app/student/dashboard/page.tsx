"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, CalendarCheck, FileText, BookOpen, DollarSign, ListChecks, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { StudentAttendanceHistoryModal } from "@/components/admin/StudentAttendanceHistoryModal";
import { StudentFeesHistoryModal } from "@/components/student/StudentFeesHistoryModal";
import { FeePayment } from "@/components/admin/FeePaymentModal";


export default function StudentDashboard() {
  const { user, role, loading, dbUser } = useAuth();
  const router = useRouter();
  
  const [attendanceStats, setAttendanceStats] = useState<{ total: number, present: number } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [totalFees, setTotalFees] = useState(0);
  const [isFeesHistoryModalOpen, setIsFeesHistoryModalOpen] = useState(false);
  const [feesLoading, setFeesLoading] = useState(true);

  const [statsLoading, setStatsLoading] = useState(true);

  const [batchName, setBatchName] = useState<string | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login/student");
      else if (role !== "student") router.push("/login/student");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    async function fetchAttendance() {
      if (!user?.uid) return;
      try {
        const q = query(
          collection(db, "attendance"),
          where("studentId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        let total = 0;
        let present = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          total++;
          if (data.status === "present" || data.status === "late") present++;
        });
        setAttendanceStats({ total, present });
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setStatsLoading(false);
      }
    }
    
    if (user?.uid && role === "student") {
      fetchAttendance();
    }
  }, [user?.uid, role]);

  useEffect(() => {
    async function fetchFees() {
      if (!user?.uid) return;
      try {
        const studentDoc = await getDoc(doc(db, "students", user.uid));
        if (studentDoc.exists()) {
          setTotalFees(studentDoc.data().totalFees || 0);
          setBatchName(studentDoc.data().batch || null);
        }

        const feesQ = query(collection(db, "feePayments"), where("studentId", "==", user.uid));
        const feesSnap = await getDocs(feesQ);
        const payments = feesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment));
        payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFeePayments(payments);
      } catch (error) {
        console.error("Error fetching fees:", error);
      } finally {
        setFeesLoading(false);
      }
    }

    if (user?.uid && role === "student") {
      fetchFees();
    }
  }, [user?.uid, role]);

  useEffect(() => {
    async function fetchSchedule() {
      if (!batchName) {
        setScheduleLoading(false);
        return;
      }
      try {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const q = query(
          collection(db, "timetables"),
          where("batchId", "==", batchName)
        );
        const snapshot = await getDocs(q);
        let schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter client-side to avoid requiring composite indexes
        schedules = schedules.filter((s: any) => s.date === today);
        
        schedules.sort((a: any, b: any) => a.time.localeCompare(b.time)); // simplistic sort
        setTodaySchedule(schedules);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setScheduleLoading(false);
      }
    }

    fetchSchedule();
  }, [batchName]);

  if (loading || !user || role !== "student") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  // Construct a student object for the history modal to consume
  const currentStudent = {
    id: user.uid,
    name: (dbUser?.name as string) || "Student"
  };

  const totalPaid = feePayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingFees = Math.max(0, totalFees - totalPaid);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-slate-500 text-lg">
          Welcome to your dashboard, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-blue">{(dbUser?.name as string) || "Student"}</span>.
        </p>
      </div>
      
      {!scheduleLoading && todaySchedule.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-brand-blue/10 to-brand-orange/10 rounded-2xl p-6 border border-brand-blue/20 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-brand-blue" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Today's Schedule</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySchedule.map((schedule) => (
              <div key={schedule.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm flex flex-col justify-center">
                <span className="text-sm font-semibold text-brand-orange mb-1">{schedule.time}</span>
                <span className="font-bold text-slate-900 text-lg">{schedule.subject}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <h3 className="text-lg font-bold text-slate-900">My Attendance</h3>
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
                  
                  <button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full py-2.5 text-sm font-medium text-brand-blue bg-brand-blue/5 rounded-xl hover:bg-brand-blue/10 transition-colors"
                  >
                    View Full History
                  </button>
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
                <p className="text-slate-500 text-sm">Access your upcoming, live, and completed online tests.</p>
              </div>
              <Link href="/student/tests" className="w-full">
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
                <p className="text-slate-500 text-sm">Access your marks for all offline/theory tests.</p>
              </div>
              <Link href="/student/dashboard/theory" className="w-full">
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
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fees Summary</h3>
                <p className="text-sm text-slate-500">Track your payments</p>
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
                  
                  <button 
                    onClick={() => setIsFeesHistoryModalOpen(true)}
                    className="w-full py-2.5 text-sm font-medium text-green-700 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    View Payment History
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* OMR Results Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-purple-600">
                <ListChecks size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">OMR Results</h3>
                <p className="text-sm text-slate-500">View graded answer sheets</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center mb-4">
                <p className="text-slate-500 text-sm">Access your physical OMR test results and graded sheets.</p>
              </div>
              <Link href="/student/dashboard/omr" className="w-full">
                <button className="w-full py-2.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                  Go to OMR Marks
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <StudentAttendanceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        student={currentStudent}
      />
      <StudentFeesHistoryModal
        isOpen={isFeesHistoryModalOpen}
        onClose={() => setIsFeesHistoryModalOpen(false)}
        feePayments={feePayments}
        totalFees={totalFees}
        totalPaid={totalPaid}
        remainingFees={remainingFees}
      />
    </div>
  );
}
