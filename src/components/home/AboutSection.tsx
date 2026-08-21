"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "../ui/SectionHeading";
import { BookOpen, Users, Trophy, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import Link from "next/link";

const features = [
  {
    title: "Expert Faculty",
    description: "Learn from top educators who have produced top ranks in JEE and NEET.",
    icon: <Users size={24} />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-100",
  },
  {
    title: "Daily Practice",
    description: "Rigorous testing to track performance and improve accuracy.",
    icon: <BookOpen size={24} />,
    color: "text-brand-orange",
    bgColor: "bg-orange-50 border-orange-100",
  },
  {
    title: "Personal Mentorship",
    description: "One-to-one mentoring, doubt solving sessions, and regular feedback.",
    icon: <Lightbulb size={24} />,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-100",
  },
  {
    title: "Proven Results",
    description: "Consistent track record of producing city toppers in competitive exams.",
    icon: <Trophy size={24} />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
];

/* eslint-disable @next/next/no-img-element */
export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Premium Elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Grid Pattern Background overlay for professional tech feel */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <SectionHeading 
          title="About Vision Academy" 
          subtitle="Empowering students with knowledge, skills, and confidence to achieve their dreams." 
        />

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          
          {/* Left Column: Visuals */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main Image Container */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[4/4] lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-white z-10 group">
              <div className="absolute inset-0 bg-brand-blue/10 mix-blend-multiply z-10 group-hover:opacity-0 transition-opacity duration-700" />
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
                alt="Students studying" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
            </div>
            
            {/* Floating Element: 10+ Years */}
            <motion.div 
              animate={{ y: [15, -15, 15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-4 sm:-left-12 z-20 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-2xl border border-white flex items-center gap-4"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-blue to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
                <span className="text-2xl sm:text-3xl font-black tracking-tighter">10+</span>
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Years of</p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Excellence</p>
              </div>
            </motion.div>

            {/* Floating Element: #1 Institute */}
            <motion.div 
              animate={{ y: [-15, 15, -15] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -top-10 -right-4 sm:-right-10 z-20 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-2xl border border-white hidden md:flex flex-col items-center justify-center gap-2"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-brand-orange to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/30">
                <Trophy className="text-white" size={28} />
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">#1</p>
                <p className="text-xs sm:text-sm font-bold text-brand-orange uppercase tracking-wider mt-1">Institute</p>
              </div>
            </motion.div>

            {/* Floating Element: Logo Badge (Bottom Right) */}
            <motion.div 
              animate={{ y: [12, -12, 12] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
              className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 z-20 bg-white/80 backdrop-blur-2xl p-2 sm:p-3 rounded-[2.5rem] shadow-2xl border border-white flex flex-col items-center justify-center"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden p-2 sm:p-4">
                <img src="/logo.jpeg" alt="Vision Academy Logo" className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" />
              </div>
            </motion.div>

            {/* Decorative background shape */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-[105%] bg-gradient-to-br from-brand-blue/10 to-brand-orange/5 rounded-[3rem] -z-10 rotate-3" />
          </motion.div>

          {/* Right Column: Text & Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col h-full justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-brand-blue font-semibold text-sm w-fit mb-6">
              <Sparkles size={16} />
              <span>Premium Education</span>
            </div>

            <h3 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-[1.15] tracking-tight">
              We Don&apos;t Just Teach, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-blue-600 to-brand-orange">We Transform.</span>
            </h3>
            
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              At Vision Academy, we believe that every student has the potential to excel. Our approach isn&apos;t just about teaching; it&apos;s about creating an ecosystem where students can thrive, discover their potential, and build the foundation for a successful career.
            </p>

            {/* Premium Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {features.map((item, index) => (
                <div key={index} className="flex flex-col gap-4 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 group cursor-default relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full pointer-events-none" />
                  
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${item.bgColor} ${item.color} transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm relative z-10`}>
                    {item.icon}
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
               <Link href="/#courses">
                  <Button size="lg" variant="primary" className="gap-2 px-8 py-6 rounded-2xl shadow-xl shadow-brand-blue/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-blue/30 transition-all text-lg font-semibold group">
                    Explore Our Courses 
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
               </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
