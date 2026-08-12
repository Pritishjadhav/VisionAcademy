"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export function RedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin" || role === "super_admin") {
        router.push("/admin/dashboard");
      } else if (role === "student") {
        router.push("/student/dashboard");
      } else if (role === "parent") {
        router.push("/parent/dashboard");
      }
    }
  }, [user, role, loading, router]);

  // If user is definitely logged in, we are redirecting them, so don't render the main website content
  if (!loading && user && role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F4C81]" size={40} />
      </div>
    );
  }

  // During loading (server-side and initial client render) and when logged out,
  // we render the children to ensure perfect SEO for the public website.
  return <>{children}</>;
}

