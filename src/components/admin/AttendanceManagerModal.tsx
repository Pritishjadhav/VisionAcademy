"use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { collection, query, where, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Student {
  id: string;
  name: string;
}

interface AttendanceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchName: string;
  students: Student[];
}

export type AttendanceStatus = "present" | "absent" | "late" | null;

export function AttendanceManagerModal({ isOpen, onClose, batchName, students }: AttendanceManagerModalProps) {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset attendance state when date changes or modal opens
    setAttendance({});
    fetchAttendanceForDate(date);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, date, batchName]);

  const fetchAttendanceForDate = async (selectedDate: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "attendance"),
        where("batch", "==", batchName),
        where("date", "==", selectedDate)
      );
      
      const snapshot = await getDocs(q);
      const fetchedData: Record<string, AttendanceStatus> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedData[data.studentId] = data.status as AttendanceStatus;
      });
      
      setAttendance(fetchedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      newAttendance[s.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      students.forEach(student => {
        const status = attendance[student.id];
        if (!status) return; // Skip students who haven't been marked

        const docId = `${student.id}_${date}`;
        const docRef = doc(collection(db, "attendance"), docId);
        
        batch.set(docRef, {
          studentId: student.id,
          batch: batchName,
          date: date,
          status: status,
          timestamp: timestamp
        });
      });

      await batch.commit();
      toast.success("Attendance saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mark or Edit Attendance</h2>
            <p className="text-sm text-slate-500">Batch: {batchName}. Select a date to edit past records.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-brand-orange" size={20} />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue/50 outline-none"
            />
          </div>
          
          <div className="flex gap-2 text-sm">
            <button 
              onClick={() => handleMarkAll("present")}
              className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium transition-colors"
            >
              Mark All Present
            </button>
            <button 
              onClick={() => handleMarkAll("absent")}
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No students found in this batch.
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const status = attendance[student.id];
                return (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-brand-blue/20 transition-colors bg-white">
                    <span className="font-medium text-slate-900 mb-3 sm:mb-0">{student.name}</span>
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                      <button 
                        onClick={() => handleStatusChange(student.id, "present")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          status === "present" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <CheckCircle size={16} /> Present
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, "absent")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          status === "absent" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <XCircle size={16} /> Absent
                      </button>
                      <button 
                        onClick={() => handleStatusChange(student.id, "late")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          status === "late" ? "bg-white text-yellow-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Clock size={16} /> Late
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="gradient" onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>
    </div>
  );
}
