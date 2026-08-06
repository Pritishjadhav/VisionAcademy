"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Users, ShieldCheck, CheckCircle2, ArrowRight, Home, Loader2 } from "lucide-react";

export default function LoginSelectionPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "admin" || role === "super_admin") router.push("/admin/dashboard");
      else if (role === "student") router.push("/student/dashboard");
      else if (role === "parent") router.push("/parent/dashboard");
    }
  }, [user, role, loading, router]);

  const features = [
    "Expert Faculty",
    "Offline Classroom",
    "Mock Tests",
    "Career Guidance",
    "Doubt Solving",
    "Study Material",
    "Topic Wise Tests",
    "Regular Revision"
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading || (user && role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F4C81]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans selection:bg-[#38BDF8] selection:text-white">
      {/* Animated Background Elements - Clean, Light, Elegant */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-white via-slate-50 to-[#E0F2FE]/30">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00B4D8]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#38BDF8]/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"
        />
        
        {/* Subtle Minimal Dots */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-12">
        
        {/* Header Section */}
        <div className="text-center mb-10 max-w-3xl mx-auto w-full">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center mb-6"
          >
            <div className="w-20 h-20 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center p-3 mb-5 border border-white/50 backdrop-blur-sm">
              <Image src="/logo.jpeg" alt="Vision Academy Logo" width={64} height={64} className="object-contain" priority />
            </div>
            <h2 
              className="text-2xl sm:text-3xl font-bold text-[#0F4C81] tracking-wide uppercase"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              Vision Academy
            </h2>
            <p className="text-[#38BDF8] font-medium text-sm sm:text-base mt-2 tracking-wide uppercase letter-spacing-2">
              &quot;Empowering Students to Build a Brighter Future&quot;
            </p>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight mb-4"
          >
            Welcome to <span className="text-[#0F4C81]">Vision Academy</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-500 font-medium"
          >
            Choose your login portal to continue.
          </motion.p>
        </div>

        {/* Premium Feature Badges */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-3 mb-14 max-w-4xl"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -2, backgroundColor: "#F8FAFC" }}
              className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-200/60 text-sm font-semibold text-slate-600 transition-all cursor-default"
            >
              <CheckCircle2 size={16} className="text-[#00B4D8]" />
              {feature}
            </motion.div>
          ))}
        </motion.div>

        {/* Login Cards Grid - Premium Glass Design */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-6xl"
        >
          {/* Student Card */}
          <Link href="/login/student" className="block h-full group">
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,180,216,0.1)] border border-slate-100 hover:border-[#00B4D8]/30 transition-all duration-400 h-full flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00B4D8] to-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-16 h-16 bg-[#F0F9FF] text-[#00B4D8] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <GraduationCap size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-[#0F4C81] transition-colors">Student Login</h3>
              <p className="text-slate-500 leading-relaxed flex-grow mb-8 font-medium">
                Access study material, attendance, mock tests and your academic dashboard.
              </p>
              <div className="flex items-center text-[#00B4D8] font-semibold group-hover:gap-3 transition-all duration-300 gap-2 mt-auto">
                Login as Student 
                <div className="bg-[#E0F2FE] p-1.5 rounded-full group-hover:bg-[#00B4D8] group-hover:text-white transition-colors">
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Parent Card */}
          <Link href="/login/parent" className="block h-full group">
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(15,76,129,0.1)] border border-slate-100 hover:border-[#0F4C81]/30 transition-all duration-400 h-full flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0F4C81] to-[#1e6ca8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-16 h-16 bg-[#F1F5F9] text-[#0F4C81] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Users size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-[#0F4C81] transition-colors">Parent Login</h3>
              <p className="text-slate-500 leading-relaxed flex-grow mb-8 font-medium">
                Track your child&apos;s attendance, academic progress and important updates.
              </p>
              <div className="flex items-center text-[#0F4C81] font-semibold group-hover:gap-3 transition-all duration-300 gap-2 mt-auto">
                Login as Parent 
                <div className="bg-[#F1F5F9] p-1.5 rounded-full group-hover:bg-[#0F4C81] group-hover:text-white transition-colors">
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Admin Card */}
          <Link href="/login/admin" className="block h-full group">
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="bg-slate-900/5 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(56,189,248,0.15)] border border-slate-200/50 hover:border-[#38BDF8]/50 hover:bg-white/90 transition-all duration-400 h-full flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#38BDF8] to-[#bae6fd] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-16 h-16 bg-white text-[#38BDF8] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-100">
                <ShieldCheck size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-[#0F4C81] transition-colors">Admin Login</h3>
              <p className="text-slate-500 leading-relaxed flex-grow mb-8 font-medium">
                Manage students, parents, staff and overall academy operations.
              </p>
              <div className="flex items-center text-[#38BDF8] font-semibold group-hover:gap-3 transition-all duration-300 gap-2 mt-auto">
                Login as Admin 
                <div className="bg-white shadow-sm p-1.5 rounded-full group-hover:bg-[#38BDF8] group-hover:text-white transition-colors">
                  <ArrowRight size={16} />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom Footer Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full py-10 mt-12 flex flex-col items-center justify-center border-t border-slate-200/60 bg-white/40 backdrop-blur-md"
      >
        <p className="text-slate-500 mb-5 font-medium tracking-wide">
          Need Help? <span className="text-[#0F4C81] font-semibold">Contact Vision Academy Administration</span>
        </p>
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F4C81] transition-all bg-white px-8 py-3.5 rounded-full shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-slate-100 hover:border-[#0F4C81]/20 hover:shadow-[0_8px_25px_rgb(15,76,129,0.1)] hover:-translate-y-0.5 group"
        >
          <Home size={18} className="text-slate-400 group-hover:text-[#0F4C81] transition-colors" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
