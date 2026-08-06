/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import { StudentFormModal } from "@/components/admin/StudentFormModal";
import { AdminManagement } from "@/components/admin/AdminManagement";
import toast from "react-hot-toast";
import { deleteStudentUser } from "@/actions/users";

interface Student {
  id: string;
  name: string;
  mobile: string;
  parentMobile?: string;
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(data);
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    try {
      const result = await deleteStudentUser(id);
      if (result.success) {
        toast.success("Student deleted successfully");
        fetchStudents();
      } else {
        toast.error(result.error || "Failed to delete student");
      }
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.mobile.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500">Add, edit, and manage student access.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            setEditingStudent(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Student
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
              placeholder="Search by name or mobile..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
              <tr>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Mobile Number</th>
                <th className="py-4 px-6">Parent Mobile</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">Loading students...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">{student.name}</td>
                    <td className="py-4 px-6 text-slate-600">{student.mobile}</td>
                    <td className="py-4 px-6 text-slate-600">{student.parentMobile || "-"}</td>
                    <td className="py-4 px-6 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEditingStudent(student);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                        title="Edit Student"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStudents}
        student={editingStudent}
      />
      
      <AdminManagement />
    </div>
  );
}
