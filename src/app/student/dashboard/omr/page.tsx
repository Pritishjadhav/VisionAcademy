"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OmrResultsList } from "@/components/student/OmrResultsList";

export default function StudentOmrMarksPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login/student");
      else if (role !== "student") router.push("/login/student");
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== "student") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <OmrResultsList studentId={user.uid} />
    </div>
  );
}
