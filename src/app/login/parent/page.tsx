"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PhoneLoginForm } from "@/components/auth/PhoneLoginForm";
import { Users, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function ParentLoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role === "parent") {
      router.push("/parent/dashboard");
    }
  }, [loading, user, role, router]);

  if (loading || (user && role === "parent")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      <Link 
        href="/"
        className="fixed top-24 right-6 z-50 p-2.5 bg-white/60 hover:bg-white text-slate-600 hover:text-red-500 rounded-full backdrop-blur-md transition-all shadow-sm hover:shadow-md border border-slate-200"
        title="Close and return to Home"
      >
        <X size={24} />
      </Link>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-64 -right-64 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
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
            <div className="flex items-center gap-2 mb-2 text-green-600">
              <Users size={28} />
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Parent Login</h1>
            </div>
            <p className="text-slate-500 font-medium">Track your child&apos;s academic progress</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-100">
            <PhoneLoginForm 
              type="parent" 
              onBack={() => router.push("/login")} 
              onSuccess={() => router.push("/parent/dashboard")} 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
