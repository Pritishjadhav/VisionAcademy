"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ParentDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login/parent");
      else if (role !== "parent") router.push("/login/parent");
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== "parent") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Parent Dashboard</h1>
        <p className="text-slate-500">Welcome to your dashboard.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <p>Information about your child&apos;s progress will appear here.</p>
      </div>
    </div>
  );
}
