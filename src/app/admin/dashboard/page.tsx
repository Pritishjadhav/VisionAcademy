/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Plus, User, GraduationCap, ChevronRight, CheckSquare } from "lucide-react";
import { StudentFormModal } from "@/components/admin/StudentFormModal";
import { AdminManagement } from "@/components/admin/AdminManagement";
import { FacultyManagement } from "@/components/admin/FacultyManagement";
import toast from "react-hot-toast";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  mobile: string;
  parentMobile?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  batch?: string;
  createdAt?: string;
}

const BATCHES = [
  "11th IIT-JEE Integrated",
  "12th IIT-JEE Integrated",
  "11th NEET Integrated",
  "12th NEET Integrated"
];

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students in real-time");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const studentsByBatch = BATCHES.reduce((acc, batch) => {
    acc[batch] = students.filter(s => s.batch === batch);
    return acc;
  }, {} as Record<string, Student[]>);

  // Unassigned or unknown batch students
  const unassignedStudents = students.filter(s => !s.batch || !BATCHES.includes(s.batch));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500">Select a batch to manage its students.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/grade-omr">
            <Button variant="outline" className="flex items-center gap-2">
              <CheckSquare size={18} />
              OMR Grading
            </Button>
          </Link>
          <Button 
            variant="gradient" 
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            Add Student
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
          Loading batches...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BATCHES.map((batch) => (
            <Link 
              href={`/admin/dashboard/batch/${encodeURIComponent(batch)}`} 
              key={batch} 
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md hover:border-brand-blue/30 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-brand-blue/5 transition-colors">
                  <GraduationCap className="text-brand-blue" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{batch}</h2>
                  <p className="text-slate-500 mt-1">{studentsByBatch[batch].length} Students</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-brand-blue transition-colors" />
            </Link>
          ))}

          {unassignedStudents.length > 0 && (
            <Link 
              href={`/admin/dashboard/batch/Unassigned`} 
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between hover:shadow-md hover:border-brand-orange/30 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-brand-orange/5 transition-colors">
                  <User className="text-brand-orange" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Unassigned / Pending Profile</h2>
                  <p className="text-slate-500 mt-1">{unassignedStudents.length} Students</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-brand-orange transition-colors" />
            </Link>
          )}
        </div>
      )}

      <StudentFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
        student={null}
      />
      
      <FacultyManagement />
      <AdminManagement />
    </div>
  );
}
