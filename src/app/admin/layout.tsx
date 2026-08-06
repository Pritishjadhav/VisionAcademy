"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login/admin");
      } else if (role !== "admin" && role !== "super_admin") {
        router.push("/login/admin");
      }
    }
  }, [user, role, loading, router]);

  if (loading || !user || (role !== "admin" && role !== "super_admin")) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      {children}
    </div>
  );
}
