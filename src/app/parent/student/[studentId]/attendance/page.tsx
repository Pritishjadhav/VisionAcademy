"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late";
}

export default function StudentAttendancePage() {
  const { studentId } = useParams() as { studentId: string };
  const router = useRouter();
  const { user, dbUser } = useAuth();

  const [studentName, setStudentName] = useState("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
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

    const attQ = query(
      collection(db, "attendance"),
      where("studentId", "==", studentId)
    );

    const unsubscribe = onSnapshot(attQ, (attSnap) => {
      const fetchedRecords: AttendanceRecord[] = [];
      attSnap.forEach((doc) => {
        fetchedRecords.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      fetchedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAttendance(fetchedRecords);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId, user, dbUser, router]);

  if (loading) {
    return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  const totalClasses = attendance.length;
  const presentCount = attendance.filter(r => r.status === "present" || r.status === "late").length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href={`/parent/student/${studentId}`}>
          <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance History</h1>
          <p className="text-slate-500">{studentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Classes</p>
          <p className="text-4xl font-bold text-slate-900">{totalClasses}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">Present/Late</p>
          <p className="text-4xl font-bold text-green-700">{presentCount}</p>
        </div>
        <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-brand-blue uppercase tracking-wider mb-2">Attendance</p>
          <p className="text-4xl font-bold text-brand-blue">{attendancePercentage}%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Detailed History</h2>
        {attendance.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            No attendance records found for this student.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="text-slate-400" size={18} />
                  <span className="font-medium text-slate-700">
                    {new Date(record.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {record.status === "present" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    <CheckCircle2 size={14} /> Present
                  </span>
                )}
                {record.status === "absent" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                    <XCircle size={14} /> Absent
                  </span>
                )}
                {record.status === "late" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                    <Clock size={14} /> Late
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
