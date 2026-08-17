"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, BookOpen, UserCircle, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function FacultyDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  
  const [facultyData, setFacultyData] = useState<{name: string, subject: string, gender?: string, photoUrl?: string} | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

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

        {/* Quick Stats or Features could go here in the future */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
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
