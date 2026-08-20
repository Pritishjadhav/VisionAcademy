/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { FacultyLecture } from "@/types/lecture";
import { Calendar, Clock, BookOpen, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { getLocalYYYYMMDD } from "@/lib/utils";

export function FacultyLectureHistory() {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<FacultyLecture[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "thisWeek" | "thisMonth" | "custom">("all");

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    
    const q = query(
      collection(db, "facultyLectures"),
      where("facultyId", "==", user.uid)
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
      toast.error("Failed to load lecture history");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading history...</td>
                </tr>
              ) : filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No lecture records found.</td>
                </tr>
              ) : (
                filteredLectures.map((lecture) => (
                  <tr key={lecture.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      {new Date(lecture.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{lecture.batch}</td>
                    <td className="py-4 px-6 text-slate-600">{lecture.subject}</td>
                    <td className="py-4 px-6 text-slate-600">{lecture.numberOfLectures}</td>
                    <td className="py-4 px-6 font-medium text-slate-900">{lecture.totalHours}</td>
                    <td className="py-4 px-6 text-slate-500 text-sm max-w-[200px] truncate" title={lecture.description}>
                      {lecture.description || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
