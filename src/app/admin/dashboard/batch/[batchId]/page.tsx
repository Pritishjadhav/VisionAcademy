"use client";

import { useState, useEffect, use } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Search, Trash2, Edit, Mail, Phone, ArrowLeft, User } from "lucide-react";
import { StudentFormModal } from "@/components/admin/StudentFormModal";
import { AttendanceManagerModal } from "@/components/admin/AttendanceManagerModal";
import { StudentAttendanceHistoryModal } from "@/components/admin/StudentAttendanceHistoryModal";
import toast from "react-hot-toast";
import { deleteStudentUser } from "@/actions/users";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRequiredIdToken } from "@/lib/auth-token";

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
  photoURL?: string;
}

const BATCHES = [
  "11th IIT-JEE Integrated",
  "12th IIT-JEE Integrated",
  "11th NEET Integrated",
  "12th NEET Integrated"
];

export default function BatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const batchName = decodeURIComponent(resolvedParams.batchId);
  const isUnassigned = batchName === "Unassigned";

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceManagerOpen, setIsAttendanceManagerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [viewingHistoryStudent, setViewingHistoryStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, { total: number, present: number }>>({});



  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      
      const filteredForBatch = isUnassigned 
        ? data.filter(s => !s.batch || !BATCHES.includes(s.batch))
        : data.filter(s => s.batch === batchName);

      setStudents(filteredForBatch);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students in real-time");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [batchName, isUnassigned]);

  useEffect(() => {
    if (isUnassigned) return;

    const q = query(
      collection(db, "attendance"),
      where("batch", "==", batchName)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats: Record<string, { total: number, present: number }> = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const sid = data.studentId;
        if (!stats[sid]) {
          stats[sid] = { total: 0, present: 0 };
        }
        
        stats[sid].total += 1;
        if (data.status === "present" || data.status === "late") {
          stats[sid].present += 1;
        }
      });
      
      setAttendanceStats(stats);
    });
    
    return () => unsubscribe();
  }, [batchName, isUnassigned]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student's profile?")) return;
    
    try {
      const result = await deleteStudentUser(await getRequiredIdToken(), id);
      if (result.success) {
        toast.success("Student deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete student");
      }
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(search.toLowerCase()) ||
    student.mobile?.includes(search) ||
    student.email?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{isUnassigned ? "Unassigned Students" : batchName}</h1>
          <p className="text-slate-500">Manage students for this batch.</p>
        </div>
        
        {!isUnassigned && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}/scores`)}>
              All Test Scores
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/dashboard/tests?batch=${encodeURIComponent(batchName)}`)}>
              Schedule Online Test
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}/theory`)}>
              Add Theory Mark
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/grade-omr?batch=${encodeURIComponent(batchName)}`)}>
              OMR Checker
            </Button>
            <Button variant="gradient" onClick={() => setIsAttendanceManagerOpen(true)}>
              Mark / Edit Attendance
            </Button>
          </div>
        )}
      </div>



      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
            placeholder="Search by name, email, or mobile..."
          />
        </div>
        <div className="text-slate-500 font-medium px-4 py-2 bg-slate-50 rounded-xl">
          Total: {filteredStudents.length} Students
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
          Loading students...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm font-medium border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Roll No</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Contact</th>
                  <th className="py-4 px-6">Parent</th>
                  {!isUnassigned && <th className="py-4 px-6">Attendance</th>}
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">No students found.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6">
                        {isUnassigned ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-slate-100 text-slate-500">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{student.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                {student.batch || "No batch selected"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Link 
                            href={`/admin/dashboard/batch/${encodeURIComponent(batchName)}/student/${student.id}`}
                            className="flex items-center gap-3 group -ml-2 p-2 rounded-xl hover:bg-brand-blue/5 transition-colors"
                          >
                            {student.photoURL ? (
                              <img src={student.photoURL} alt={student.name} className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:ring-2 ring-brand-blue/50 transition-all" />
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-brand-orange/10 text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-colors">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900 group-hover:text-brand-blue transition-colors">{student.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                {`${student.gender || "Not set"} • ${student.dateOfBirth || "No DOB"}`}
                              </p>
                            </div>
                          </Link>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                          <Phone size={14} className="text-slate-400" />
                          <a href={`tel:${student.mobile}`} className="hover:text-brand-orange transition-colors">{student.mobile}</a>
                        </div>
                        {student.email && !student.email.includes("@visionacademy.com") && (
                          <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                            <Mail size={14} className="text-slate-400" />
                            <a href={`mailto:${student.email}`} className="hover:text-brand-orange transition-colors">{student.email}</a>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {student.parentMobile ? (
                          <span className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <a href={`tel:${student.parentMobile}`} className="hover:text-brand-orange transition-colors">{student.parentMobile}</a>
                          </span>
                        ) : "-"}
                      </td>
                      {!isUnassigned && (
                        <td className="py-4 px-6">
                          {(() => {
                            const stats = attendanceStats[student.id];
                            if (!stats || stats.total === 0) {
                              return <span className="text-sm text-slate-400">No records</span>;
                            }
                            const percentage = Math.round((stats.present / stats.total) * 100);
                            return (
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${
                                  percentage >= 75 ? 'text-green-600' : 
                                  percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {percentage}%
                                </span>
                                <span className="text-xs text-slate-400">({stats.present}/{stats.total})</span>
                              </div>
                            );
                          })()}
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {!isUnassigned && (
                            <Link 
                              href={`/admin/dashboard/batch/${encodeURIComponent(batchName)}/student/${student.id}`}
                              className="px-3 py-1.5 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 border border-brand-blue/20 hover:border-brand-blue/30 rounded-lg transition-all flex items-center gap-1.5 text-sm font-semibold shadow-sm"
                              title="View Full Profile"
                            >
                              <User size={14} /> Profile
                            </Link>
                          )}
                          <button 
                            onClick={() => {
                              setEditingStudent(student);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                            title="Edit Profile"
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StudentFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
          router.push("/admin/dashboard");
        }}
        student={editingStudent}
      />
      
      {!isUnassigned && (
        <AttendanceManagerModal 
          isOpen={isAttendanceManagerOpen}
          onClose={() => setIsAttendanceManagerOpen(false)}
          batchName={batchName}
          students={students}
        />
      )}

      <StudentAttendanceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        student={viewingHistoryStudent}
      />
    </div>
  );
}
