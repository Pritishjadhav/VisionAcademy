"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && (role === "admin" || role === "super_admin")) {
      router.push("/admin/dashboard");
    }
  }, [loading, user, role, router]);

  if (loading || (user && (role === "admin" || role === "super_admin"))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-64 -right-64 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center p-2 mb-4">
              <Image src="/logo.jpeg" alt="Vision Academy Logo" width={48} height={48} className="object-contain" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-brand-blue">
              <ShieldCheck size={28} />
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Login</h1>
            </div>
            <p className="text-slate-500 font-medium">Secure access for staff and management</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-100">
            <AdminLoginForm 
              onBack={() => router.push("/login")} 
              onSuccess={() => router.push("/admin/dashboard")} 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
