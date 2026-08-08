"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, CalendarCheck, FileText, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { StudentAttendanceHistoryModal } from "@/components/admin/StudentAttendanceHistoryModal";

export default function StudentDashboard() {
  const { user, role, loading, dbUser } = useAuth();
  const router = useRouter();
  
  const [attendanceStats, setAttendanceStats] = useState<{ total: number, present: number } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

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
    name: dbUser?.name || "Student"
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-slate-500 text-lg">
          Welcome to your dashboard, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-blue">{dbUser?.name || "Student"}</span>.
        </p>
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
      </div>
      <StudentAttendanceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        student={currentStudent}
      />
    </div>
  );
}
