"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { FacultyLectureHistory } from "@/components/faculty/FacultyLectureHistory";
import { Button } from "@/components/ui/Button";

export default function FacultyLectureHistoryPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login/faculty");
      else if (role !== "faculty") router.push("/login/faculty");
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== "faculty") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-orange" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/faculty/dashboard")} className="shrink-0 p-2 h-auto rounded-xl">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="text-brand-orange" />
              Lecture History
            </h1>
            <p className="text-slate-500">View and track your completed lectures</p>
          </div>
        </div>

        <FacultyLectureHistory />
        
      </div>
    </div>
  );
}
