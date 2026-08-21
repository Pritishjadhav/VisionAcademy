"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../ui/Button";
import { Dna, Stethoscope, Microscope, BookOpen, Target, GraduationCap } from "lucide-react";

const InstagramIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const StethoscopeEmojiIcon = ({ className = "" }: { className?: string }) => (
  <span className={`${className} flex items-center justify-center text-[6rem] md:text-[9rem] scale-[1.2]`} role="img" aria-label="stethoscope">
    🩺
  </span>
);

const BenzeneIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`${className} scale-[2.5] md:scale-[3]`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* C-C Single Bonds */}
    <line x1="53.9" y1="32.25" x2="63.4" y2="37.75" />
    <line x1="63.4" y1="62.25" x2="53.9" y2="67.75" />
    <line x1="32.7" y1="55.5" x2="32.7" y2="44.5" />

    {/* C-C Double Bonds */}
    <line x1="65.8" y1="44.5" x2="65.8" y2="55.5" />
    <line x1="68.8" y1="44.5" x2="68.8" y2="55.5" />

    <line x1="45.35" y1="69.05" x2="35.85" y2="63.55" />
    <line x1="46.85" y1="66.45" x2="37.35" y2="60.95" />

    <line x1="35.85" y1="39.05" x2="45.35" y2="33.55" />
    <line x1="37.35" y1="36.45" x2="46.85" y2="30.95" />

    {/* C-H Bonds */}
    <line x1="50" y1="24" x2="50" y2="13" />
    <line x1="72.5" y1="37" x2="81.8" y2="31.5" />
    <line x1="72.5" y1="63" x2="81.8" y2="68.5" />
    <line x1="50" y1="76" x2="50" y2="87" />
    <line x1="27.5" y1="63" x2="18.2" y2="68.5" />
    <line x1="27.5" y1="37" x2="18.2" y2="31.5" />

    {/* Carbon Atoms */}
    <text x="50" y="30" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">C</text>
    <text x="67.3" y="40" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">C</text>
    <text x="67.3" y="60" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">C</text>
    <text x="50" y="70" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">C</text>
    <text x="32.7" y="60" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">C</text>
    <text x="32.7" y="40" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">C</text>

    {/* Hydrogen Atoms */}
    <text x="50" y="7" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H</text>
    <text x="89" y="27.5" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H</text>
    <text x="89" y="72.5" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H</text>
    <text x="50" y="93" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H</text>
    <text x="11" y="72.5" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H</text>
    <text x="11" y="27.5" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H</text>
  </svg>
);

const AmoebaIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`${className} scale-[2.5] md:scale-[3]`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* Amoeba body path */}
    <path d="M 50 10 C 70 5, 90 20, 85 45 C 80 70, 95 85, 65 95 C 40 105, 15 85, 10 60 C 5 40, 20 15, 50 10 Z" fill="currentColor" fillOpacity="0.1" strokeWidth="1.5" />
    {/* Nucleus */}
    <circle cx="45" cy="45" r="8" fill="currentColor" fillOpacity="0.4" />
    <circle cx="43" cy="43" r="2" fill="white" />
    {/* Vacuoles */}
    <circle cx="65" cy="30" r="4" stroke="currentColor" />
    <circle cx="30" cy="70" r="6" stroke="currentColor" />
    <circle cx="70" cy="70" r="3" stroke="currentColor" />
  </svg>
);

const CustomStethoscopeIcon = ({ className = "" }: { className?: string }) => (
  <Stethoscope className={`${className} scale-[2.0] md:scale-[2.5]`} />
);

const floatingFormulas = [
  // Math
  { text: "∫eˣdx = eˣ+C", left: "18%", top: "8%", delay: 0, color: "text-blue-500/30" },
  { text: "lim(x→0) sin(x)/x = 1", left: "45%", top: "10%", delay: 1, color: "text-purple-500/30" },
  { text: "cos²θ + sin²θ = 1", left: "15%", top: "85%", delay: 3, color: "text-indigo-500/30" },

  // Physics
  { text: "E = mc²", left: "60%", top: "80%", delay: 1.5, color: "text-orange-500/30" },
  { text: "F = G(m₁m₂)/r²", left: "10%", top: "45%", delay: 2.5, color: "text-red-500/30" },
  { text: "V = IR", left: "90%", top: "25%", delay: 0.5, color: "text-yellow-500/30" },

  // Chemistry
  { text: "PV = nRT", left: "86%", top: "65%", delay: 2, color: "text-green-500/30" },
  { text: "ΔG = ΔH - TΔS", left: "25%", top: "25%", delay: 3.5, color: "text-emerald-500/30" },
  { text: "C₆H₆ (Benzene)", left: "35%", top: "75%", delay: 4, color: "text-teal-500/30" },

  // Biology & Medicine
  { text: "C₆H₁₂O₆ + 6O₂", left: "50%", top: "28%", delay: 1.2, color: "text-rose-500/30" },
  { text: "", icon: BenzeneIcon, left: "85%", top: "85%", delay: 2.8, color: "text-pink-500/30" },
  { text: "", icon: Dna, left: "70%", top: "15%", delay: 2.2, color: "text-emerald-500/30" },
  { text: "", icon: StethoscopeEmojiIcon, left: "82%", top: "50%", delay: 1.7, color: "text-brand-orange/30" },
  { text: "", icon: AmoebaIcon, left: "42%", top: "58%", delay: 3.1, color: "text-purple-500/30" },
];

export function HeroSection() {
  return (
    <section className="relative flex flex-col justify-center overflow-hidden bg-slate-50 pt-8 pb-16 lg:pt-16 lg:pb-24">

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-blue/10 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/10 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />

      {/* Floating Formulas */}
      {floatingFormulas.map((formula, i) => (
        <motion.div
          key={i}
          className={`absolute font-mono text-xl md:text-3xl font-bold select-none z-0 flex items-center justify-center whitespace-nowrap ${formula.color}`}
          style={{ left: formula.left, top: formula.top }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            rotate: [0, 8, -8, 0],
          }}
          transition={{
            duration: 6 + (i % 3),
            repeat: Infinity,
            delay: formula.delay,
            ease: "easeInOut",
          }}
        >
          {formula.icon ? <formula.icon className="w-10 h-10 md:w-14 md:h-14 opacity-80" /> : formula.text}
        </motion.div>
      ))}

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 w-full -mt-8 lg:-mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <div className="inline-block mb-6 px-5 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue font-bold text-sm backdrop-blur-md shadow-sm">
              ✨ Igniting Minds, Shaping Futures
            </div>

            <h1
              className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-sm leading-[1.1]"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">VISION</span> <span className="text-brand-orange">ACADEMY</span>
            </h1>

            <h2 className="text-2xl lg:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-purple-600 to-brand-orange drop-shadow-sm">
              Building Future Engineers & Doctors
            </h2>

            <p className="max-w-xl text-lg lg:text-xl text-slate-600 mb-8 font-medium leading-relaxed">
              Join the most trusted coaching institute. We provide expert guidance,
              personal attention, and a competitive environment to help you crack IIT-JEE and NEET.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/#courses" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="text-lg px-8 py-6 rounded-2xl shadow-xl shadow-brand-blue/20 w-full hover:-translate-y-1 transition-transform">
                  Explore Courses
                </Button>
              </Link>
              <Link href="/#contact" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-2xl bg-white/50 backdrop-blur-sm border-2 w-full hover:bg-white hover:-translate-y-1 transition-all">
                  Contact Us
                </Button>
              </Link>
            </div>

            {/* Trust Indicators & Socials */}
            <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <div className="flex items-center gap-5">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-slate-200 shadow-md overflow-hidden flex items-center justify-center z-10 text-xl bg-gradient-to-br from-slate-100 to-slate-300">
                      👤
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-600 flex flex-col items-start">
                  <span className="font-extrabold text-slate-900 text-lg">1,000+</span>
                  <span>Students Selected</span>
                </div>
              </div>

              {/* Instagram Link */}
              <div className="hidden sm:block w-px h-12 bg-slate-200"></div>

              <a
                href="https://www.instagram.com/visionacademy_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-slate-600 hover:text-brand-orange transition-colors w-fit font-medium group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-brand-orange/10 transition-colors shadow-sm border border-slate-200 group-hover:border-brand-orange/20">
                  <InstagramIcon size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-bold text-slate-900">Follow Us</span>
                  <span>On Instagram</span>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Right Column: Visual Composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block h-[600px] w-full"
          >
            {/* Center glowing orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-brand-blue to-purple-400 rounded-full blur-[80px] opacity-30 animate-pulse"></div>

            {/* Center Academy Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="absolute inset-[-15px] rounded-full border border-brand-orange/20 animate-[spin_12s_linear_infinite] border-dashed pointer-events-none"></div>
              <div className="absolute inset-[-30px] rounded-full border border-brand-blue/15 animate-[spin_20s_linear_infinite_reverse] border-dashed pointer-events-none"></div>

              <div className="relative w-48 h-48 md:w-60 md:h-60 bg-white/95 backdrop-blur-2xl p-2.5 rounded-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white flex items-center justify-center hover:scale-[1.03] transition-transform duration-500 cursor-default group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-orange/5 to-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img src="/logo.jpeg" alt="Vision Academy Logo" className="w-full h-full object-contain rounded-full relative z-10" />
              </div>
            </div>

            {/* Orbiting Subject Pills */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[12%] right-[10%] z-20"
            >
              <div className="relative group cursor-default">
                {/* Glowing backdrop aura */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                {/* Main Pill */}
                <div className="relative bg-white/90 backdrop-blur-3xl pr-6 pl-2 py-2 rounded-full shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] border border-white flex items-center gap-4 hover:-translate-y-1 transition-all duration-300">
                  {/* Icon Container */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500 rounded-full opacity-0 group-hover:animate-ping transition-all duration-700"></div>
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300 z-10 border border-blue-400/30">
                      <Microscope size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800 text-[16px] leading-tight group-hover:text-blue-600 transition-colors">IIT-JEE</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Engineering</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [8, -8, 8] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[45%] -left-[10%] z-20"
            >
              <div className="relative group cursor-default">
                {/* Glowing backdrop aura */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                {/* Main Pill */}
                <div className="relative bg-white/90 backdrop-blur-3xl pr-6 pl-2 py-2 rounded-full shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] border border-white flex items-center gap-4 hover:-translate-y-1 transition-all duration-300">
                  {/* Icon Container */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-0 group-hover:animate-ping transition-all duration-700"></div>
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 z-10 border border-emerald-400/30">
                      <Stethoscope size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800 text-[16px] leading-tight group-hover:text-emerald-600 transition-colors">NEET UG</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Medical</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
              className="absolute bottom-[10%] right-[5%] z-20"
            >
              <div className="relative group cursor-default">
                {/* Glowing backdrop aura */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                {/* Main Pill */}
                <div className="relative bg-white/90 backdrop-blur-3xl pr-6 pl-2 py-2 rounded-full shadow-[0_10px_40px_-10px_rgba(168,85,247,0.3)] border border-white flex items-center gap-4 hover:-translate-y-1 transition-all duration-300">
                  {/* Icon Container */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <div className="absolute inset-0 bg-purple-500 rounded-full opacity-0 group-hover:animate-ping transition-all duration-700"></div>
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-lg group-hover:-rotate-12 transition-transform duration-300 z-10 border border-purple-400/30">
                      <Target size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800 text-[16px] leading-tight group-hover:text-purple-600 transition-colors">MHT-CET</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_5px_rgba(168,85,247,0.8)]"></div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">State Exam</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-[80%] left-[20%] z-20"
            >
              <div className="relative group cursor-default">
                {/* Glowing backdrop aura */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-brand-orange rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                {/* Main Pill */}
                <div className="relative bg-white/90 backdrop-blur-3xl pr-6 pl-2 py-2 rounded-full shadow-[0_10px_40px_-10px_rgba(249,115,22,0.3)] border border-white flex items-center gap-4 hover:-translate-y-1 transition-all duration-300">
                  {/* Icon Container */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <div className="absolute inset-0 bg-brand-orange rounded-full opacity-0 group-hover:animate-ping transition-all duration-700"></div>
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-brand-orange text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 z-10 border border-orange-400/30">
                      <BookOpen size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800 text-[16px] leading-tight group-hover:text-brand-orange transition-colors">Foundation</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse shadow-[0_0_5px_rgba(249,115,22,0.8)]"></div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Early Start</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Decorative Orbit Rings */}
            {/* Outer Static Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] border-[1px] border-slate-200/50 rounded-full pointer-events-none"></div>

            {/* Inner Ring with Premium Elegant Flare */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] border-[1px] border-slate-300/40 rounded-full pointer-events-none"
            >
               {/* Elegant Optical Flare */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <div className="relative flex items-center justify-center">
                   {/* Massive soft ambient glow */}
                   <div className="absolute w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                   {/* Focused inner glow */}
                   <div className="absolute w-12 h-12 bg-indigo-400/30 rounded-full blur-xl"></div>
                   {/* Solid core orb (no borders, just pure light) */}
                   <div className="relative w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_20px_4px_rgba(59,130,246,0.8)]"></div>
                 </div>
               </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
