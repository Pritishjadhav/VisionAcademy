/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { FacultyLecture } from "@/types/lecture";
import { Button } from "@/components/ui/Button";
import { Plus, Edit2, Trash2, Calendar, Clock, BookOpen, X, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { getLocalYYYYMMDD } from "@/lib/utils";

interface Props {
  facultyId: string;
  facultyName: string;
}

export function FacultyLectureTracking({ facultyId, facultyName }: Props) {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<FacultyLecture[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "thisWeek" | "thisMonth" | "custom">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<FacultyLecture | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    batch: "",
    subject: "",
    numberOfLectures: 1,
    totalHours: 1.5,
    description: "",
  });

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "facultyLectures"),
      where("facultyId", "==", facultyId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FacultyLecture[];
      
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLectures(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lectures:", error);
      toast.error("Failed to load lectures");
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyId]);

  const handleOpenModal = (lecture?: FacultyLecture) => {
    if (lecture) {
      setEditingLecture(lecture);
      setFormData({
        date: lecture.date,
        batch: lecture.batch,
        subject: lecture.subject,
        numberOfLectures: lecture.numberOfLectures,
        totalHours: lecture.totalHours,
        description: lecture.description || "",
      });
    } else {
      setEditingLecture(null);
      setFormData({
        date: getLocalYYYYMMDD(),
        batch: "",
        subject: "",
        numberOfLectures: 1,
        totalHours: 1.5,
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLecture(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      const lectureData = {
        facultyId,
        facultyName,
        date: formData.date,
        batch: formData.batch,
        subject: formData.subject,
        numberOfLectures: Number(formData.numberOfLectures),
        totalHours: Number(formData.totalHours),
        description: formData.description,
        updatedAt: new Date().toISOString(),
      };

      if (editingLecture) {
        await updateDoc(doc(db, "facultyLectures", editingLecture.id), lectureData);
        toast.success("Lecture updated successfully");
      } else {
        await addDoc(collection(db, "facultyLectures"), {
          ...lectureData,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
        toast.success("Lecture added successfully");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving lecture:", error);
      toast.error("Failed to save lecture");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lecture record?")) return;
    try {
      await deleteDoc(doc(db, "facultyLectures", id));
      toast.success("Lecture deleted");
    } catch (error) {
      console.error("Error deleting lecture:", error);
      toast.error("Failed to delete lecture");
    }
  };

  // Filter Logic
  const getFilteredLectures = () => {
    return lectures.filter((lecture) => {
      const lectureDate = new Date(lecture.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (activeFilter === "today") {
        return lecture.date === getLocalYYYYMMDD(today);
      }
      if (activeFilter === "thisWeek") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return lectureDate >= startOfWeek;
      }
      if (activeFilter === "thisMonth") {
        return lectureDate.getMonth() === today.getMonth() && lectureDate.getFullYear() === today.getFullYear();
      }
      if (activeFilter === "custom") {
        if (dateFilter && lecture.date !== dateFilter) return false;
        if (startDate && lecture.date < startDate) return false;
        if (endDate && lecture.date > endDate) return false;
        return true;
      }
      return true;
    });
  };

  const filteredLectures = getFilteredLectures();
  
  const totalHours = filteredLectures.reduce((sum, l) => sum + l.totalHours, 0);
  const totalLecturesCount = filteredLectures.reduce((sum, l) => sum + l.numberOfLectures, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-brand-orange" />
            Lecture Tracking
          </h2>
          <p className="text-slate-500">Track and manage lecture hours.</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="gradient">
          <Plus size={18} className="mr-2" />
          Add Lecture
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Lectures (Filtered)</p>
            <p className="text-2xl font-bold text-slate-900">{totalLecturesCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Hours (Filtered)</p>
            <p className="text-2xl font-bold text-slate-900">{totalHours} Hours</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveFilter("all"); setDateFilter(""); setStartDate(""); setEndDate(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All Time
          </button>
          <button
            onClick={() => setActiveFilter("today")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter === "today" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveFilter("thisWeek")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter === "thisWeek" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            This Week
          </button>
          <button
            onClick={() => setActiveFilter("thisMonth")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter === "thisMonth" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            This Month
          </button>
          <button
            onClick={() => setActiveFilter("custom")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeFilter === "custom" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            <Filter size={16} /> Custom
          </button>
        </div>

        {activeFilter === "custom" && (
          <div className="flex flex-wrap items-end gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Specific Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div className="text-slate-400 text-sm font-medium">OR</div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date Range (Start)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date Range (End)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
              <tr>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Batch</th>
                <th className="py-4 px-6">Subject</th>
                <th className="py-4 px-6">Lectures</th>
                <th className="py-4 px-6">Hours</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading records...</td>
                </tr>
              ) : filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No lecture records found.</td>
                </tr>
              ) : (
                filteredLectures.map((lecture) => (
                  <tr key={lecture.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">{new Date(lecture.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-slate-600">{lecture.batch}</td>
                    <td className="py-4 px-6 text-slate-600">{lecture.subject}</td>
                    <td className="py-4 px-6 text-slate-600">{lecture.numberOfLectures}</td>
                    <td className="py-4 px-6 font-medium text-slate-900">{lecture.totalHours}</td>
                    <td className="py-4 px-6 text-slate-500 text-sm max-w-[200px] truncate" title={lecture.description}>
                      {lecture.description || "-"}
                    </td>
                    <td className="py-4 px-6 flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(lecture)}
                        className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(lecture.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">
                {editingLecture ? "Edit Lecture Record" : "Add Lecture Record"}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JEE 2027 A"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Lectures</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formData.numberOfLectures}
                    onChange={(e) => setFormData({ ...formData, numberOfLectures: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={formData.totalHours}
                    onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Electrostatics basics"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
