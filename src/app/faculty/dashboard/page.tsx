"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, BookOpen, UserCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { FacultyLecture } from "@/types/lecture";
import { getLocalYYYYMMDD } from "@/lib/utils";

export default function FacultyDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [facultyData, setFacultyData] = useState<{ name: string, subject: string, gender?: string, photoUrl?: string } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [lectures, setLectures] = useState<FacultyLecture[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login/faculty");
      else if (role !== "faculty") router.push("/login/faculty");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    async function fetchFacultyData() {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "faculty", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFacultyData({
            name: data.name || "Faculty",
            subject: data.subject || "No subject assigned yet",
            gender: data.gender || "",
            photoUrl: data.photoUrl || "",
          });
        }

        // Real-time lectures listener
        const q = query(collection(db, "facultyLectures"), where("facultyId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const lecturesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FacultyLecture[];
          setLectures(lecturesData);
        }, (error) => {
          console.error("Error listening to lectures:", error);
        });

        // Store unsubscribe if needed (we're ignoring cleanup here for simplicity, but could return it)


      } catch (error) {
        console.error("Error fetching faculty data:", error);
      } finally {
        setDataLoading(false);
      }
    }

    if (user?.uid && role === "faculty") {
      fetchFacultyData();
    }
  }, [user?.uid, role]);

  if (loading || !user || role !== "faculty" || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = getLocalYYYYMMDD(today);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const todayLectures = lectures.filter(l => l.date === todayStr);
  const monthlyLectures = lectures.filter(l => {
    const d = new Date(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const stats = {
    todayHours: todayLectures.reduce((sum, l) => sum + l.totalHours, 0),
    todayCount: todayLectures.reduce((sum, l) => sum + l.numberOfLectures, 0),
    monthlyHours: monthlyLectures.reduce((sum, l) => sum + l.totalHours, 0),
    monthlyCount: monthlyLectures.reduce((sum, l) => sum + l.numberOfLectures, 0),
    totalHours: lectures.reduce((sum, l) => sum + l.totalHours, 0),
    totalCount: lectures.reduce((sum, l) => sum + l.numberOfLectures, 0),
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Welcome Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Welcome back, <span className="text-orange-500">{facultyData?.name} {facultyData?.gender === "Female" ? "Madam" : facultyData?.gender === "Male" ? "Sir" : ""}</span>!
              </h1>
              <p className="text-slate-500 text-lg mb-8 sm:mb-0">
                Subject: <span className="font-semibold text-slate-700">{facultyData?.subject}</span>
              </p>

              {!facultyData?.name || facultyData.name === "Faculty" ? (
                <div className="bg-orange-50 text-orange-800 p-4 rounded-xl inline-block mt-6 border border-orange-100">
                  <p className="font-medium flex items-center gap-2">
                    <UserCircle size={20} />
                    Please complete your profile setup.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Profile Avatar */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-orange-50 flex items-center justify-center shrink-0">
              {facultyData?.photoUrl ? (
                <Image src={facultyData.photoUrl} alt="Profile" fill className="object-cover" />
              ) : (
                <User size={48} className="text-orange-300" />
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-500 text-sm font-medium mb-4">Today's Lectures</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.todayHours} <span className="text-lg font-medium text-slate-500">hrs</span></span>
              <span className="text-slate-400 mb-1">({stats.todayCount} lectures)</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-500 text-sm font-medium mb-4">Monthly Lectures</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.monthlyHours} <span className="text-lg font-medium text-slate-500">hrs</span></span>
              <span className="text-slate-400 mb-1">({stats.monthlyCount} lectures)</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-slate-500 text-sm font-medium mb-4">Total Lectures</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-900">{stats.totalHours} <span className="text-lg font-medium text-slate-500">hrs</span></span>
              <span className="text-slate-400 mb-1">({stats.totalCount} lectures)</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/faculty/dashboard/lectures" className="block group">
            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 group-hover:bg-orange-500/10 duration-500 pointer-events-none" />
              
              <div className="relative z-10 w-12 h-12 bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                <BookOpen size={24} />
              </div>
              
              <h3 className="relative z-10 text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                Lecture Tracking
                <svg className="w-5 h-5 text-orange-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </h3>
              
              <p className="relative z-10 text-slate-500 text-sm leading-relaxed">
                View your complete lecture history, detailed statistics, and filter by date.
              </p>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow opacity-50">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Classes & Subjects</h3>
            <p className="text-slate-500 text-sm">
              Manage your teaching schedule and subject materials. (Coming soon)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
