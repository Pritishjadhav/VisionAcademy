"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Student {
  id: string;
  name: string;
}

interface StudentAttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late";
}

export function StudentAttendanceHistoryModal({ isOpen, onClose, student }: StudentAttendanceHistoryModalProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !student) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "attendance"),
          where("studentId", "==", student.id)
        );
        
        const snapshot = await getDocs(q);
        const fetchedRecords: AttendanceRecord[] = [];
        
        snapshot.forEach((doc) => {
          fetchedRecords.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
        });
        
        // Sort by date descending
        fetchedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setRecords(fetchedRecords);
      } catch (error) {
        console.error("Error fetching attendance history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const totalClasses = records.length;
  const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Attendance History</h2>
            <p className="text-sm text-slate-500">{student.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-slate-900">{totalClasses}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl border border-green-100">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Present</p>
            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
          </div>
          <div className="bg-brand-blue/5 p-3 rounded-xl border border-brand-blue/10">
            <p className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1">Percentage</p>
            <p className="text-2xl font-bold text-brand-blue">{attendancePercentage}%</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No attendance records found for this student.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="text-slate-400" size={18} />
                    <span className="font-medium text-slate-700">
                      {new Date(record.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {record.status === "present" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      <CheckCircle size={14} /> Present
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
    </div>
  );
}
