"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, GraduationCap, User, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
interface StudentData {
  id: string;
  name: string;
  batch: string;
  gender: string;
}

export default function ParentDashboard() {
  const { user, role, loading, dbUser } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, { total: number, present: number }>>({});

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login/parent");
      else if (role !== "parent") router.push("/login/parent");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    async function fetchStudents() {
      if (dbUser && dbUser.studentIds && Array.isArray(dbUser.studentIds)) {
        try {
          const studentPromises = dbUser.studentIds.map(async (id: string) => {
            const studentDoc = await getDoc(doc(db, "students", id));
            if (studentDoc.exists()) {
              return { id: studentDoc.id, ...studentDoc.data() } as StudentData;
            }
            return null;
          });
          
          const results = await Promise.all(studentPromises);
          setStudents(results.filter(Boolean) as StudentData[]);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      }
      setLoadingStudents(false);
    }
    
    if (dbUser) {
      fetchStudents();
    }
  }, [dbUser]);

  useEffect(() => {
    async function fetchAttendanceStats() {
      if (students.length === 0) return;
      
      const stats: Record<string, { total: number, present: number }> = {};
      
      await Promise.all(students.map(async (student) => {
        try {
          const q = query(
            collection(db, "attendance"),
            where("studentId", "==", student.id)
          );
          const snapshot = await getDocs(q);
          let total = 0;
          let present = 0;
          snapshot.forEach(doc => {
            const data = doc.data();
            total++;
            if (data.status === "present" || data.status === "late") present++;
          });
          stats[student.id] = { total, present };
        } catch (error) {
          console.error("Error fetching attendance for", student.id, error);
        }
      }));
      
      setAttendanceStats(stats);
    }
    
    fetchAttendanceStats();
  }, [students]);

  if (loading || !user || role !== "parent") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Parent Dashboard</h1>
        <p className="text-slate-500">Welcome to your dashboard. Here you can monitor your children&apos;s progress.</p>
      </div>
      
      {loadingStudents ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-brand-orange" size={32} />
        </div>
      ) : students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => {
            const genderStr = (student.gender || "").toLowerCase();
            const relationText = genderStr === 'female' ? 'daughter' : genderStr === 'male' ? 'son' : 'child';
            
            return (
              <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-2 bg-gradient-to-r from-brand-orange to-brand-blue" />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-brand-blue shadow-sm">
                      <User size={26} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
                      <p className="text-sm font-medium text-brand-orange capitalize">Your {relationText}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1">
                    <div className="flex items-center gap-3 text-slate-700">
                      <GraduationCap size={20} className="text-brand-blue" />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-medium">Assigned Batch</span>
                        <span className="font-semibold text-slate-900">{student.batch || 'Not Assigned'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {attendanceStats[student.id] && attendanceStats[student.id].total > 0 && (
                    <div className="mt-3 flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-medium">Attendance</span>
                        <span className={`text-lg font-bold ${
                          (attendanceStats[student.id].present / attendanceStats[student.id].total) * 100 >= 75 ? 'text-green-600' : 
                          (attendanceStats[student.id].present / attendanceStats[student.id].total) * 100 >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round((attendanceStats[student.id].present / attendanceStats[student.id].total) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link href={`/parent/student/${student.id}`} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-brand-blue rounded-xl hover:bg-brand-blue/90 shadow-sm transition-colors">
                      <User size={18} />
                      View Student Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <p className="text-slate-500">No students linked to this account yet.</p>
        </div>
      )}
    </div>
  );
}
