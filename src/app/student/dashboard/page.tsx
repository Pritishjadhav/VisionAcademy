"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, CalendarCheck, FileText, BookOpen, IndianRupee, ListChecks, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [allSchedules, setAllSchedules] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
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
      const intervalId = setInterval(fetchAttendance, 2000);
      return () => clearInterval(intervalId);
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
      const intervalId = setInterval(fetchFees, 2000);
      return () => clearInterval(intervalId);
    }
  }, [user?.uid, role]);

  useEffect(() => {
    async function fetchSchedule() {
      if (!batchName) {
        setScheduleLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "timetables"),
          where("batchId", "==", batchName)
        );
        const snapshot = await getDocs(q);
        let schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        
        schedules.sort((a: any, b: any) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        });
        
        // Group by date
        const grouped: Record<string, any[]> = {};
        schedules.forEach(s => {
          if (!grouped[s.date]) grouped[s.date] = [];
          grouped[s.date].push(s);
        });
        
        setAllSchedules(grouped);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setScheduleLoading(false);
      }
    }

    fetchSchedule();
    const intervalId = setInterval(fetchSchedule, 2000);
    return () => clearInterval(intervalId);
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

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toLocaleDateString('en-CA'));
  };

  const displayedSchedules = allSchedules[selectedDate] || [];
  const isToday = selectedDate === new Date().toLocaleDateString('en-CA');
  const dateObj = new Date(selectedDate);
  const dayName = isToday ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dateText = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-slate-500 text-lg">
          Welcome to your dashboard, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-blue">{(dbUser?.name as string) || "Student"}</span>.
        </p>
      </div>
      
      {!scheduleLoading && (
        <div className="mb-8 relative group">
          {/* Decorative background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-brand-orange rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          
          <div className="relative bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-sm border border-slate-100 p-5 sm:p-6 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-blue-600 shadow-md shadow-brand-blue/20 flex items-center justify-center text-white transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <Calendar size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Class Schedule</h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">View your timetable for any day</p>
                </div>
              </div>
              
              {/* Date Selector */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
                <button 
                  onClick={() => shiftDate(-1)}
                  className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-brand-blue hover:shadow-sm transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center justify-center px-4 min-w-[140px]">
                  <span className={`text-sm font-bold ${isToday ? 'text-brand-blue' : 'text-slate-700'}`}>{dayName}</span>
                  <span className="text-[11px] font-medium text-slate-500">{dateText}</span>
                </div>
                <button 
                  onClick={() => shiftDate(1)}
                  className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-brand-blue hover:shadow-sm transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="relative z-10">
              {displayedSchedules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {displayedSchedules.map((schedule, i) => (
                    <div key={schedule.id} className="relative flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-blue/30 hover:-translate-y-1 transition-all duration-300 p-5 group/card">
                      <div className="flex items-center gap-3 mb-3">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isToday ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-500'}`}>
                           <Clock size={18} className={isToday ? "animate-pulse" : ""} />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time</span>
                           <span className={`text-sm font-extrabold ${isToday ? 'text-brand-orange' : 'text-slate-700'}`}>{schedule.time}</span>
                         </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-lg font-black text-slate-800 leading-tight block">{schedule.subject}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
                  <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Calendar size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">No classes scheduled</h3>
                  <p className="text-sm text-slate-500 mt-1">There are no classes assigned to your batch for this date.</p>
                  
                  {!isToday && (
                    <button 
                      onClick={() => setSelectedDate(new Date().toLocaleDateString('en-CA'))}
                      className="mt-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:text-brand-blue hover:border-brand-blue/30 transition-colors"
                    >
                      Back to Today
                    </button>
                  )}
                </div>
              )}
            </div>
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
