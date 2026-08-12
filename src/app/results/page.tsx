/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowLeft, Filter } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

const engineeringResults = [
  { name: "Pawar Pratiksha", college: "NIT Nagpur (CS)", img: "" },
  { name: "Barne Vibhavari", college: "PICT", img: "" },
  { name: "Lunawat Akash", college: "PICT", img: "" },
  { name: "Sawale Krishna", college: "PICT", img: "" },
  { name: "Khaladkar Sanskar", college: "PICT", img: "" },
  { name: "Jadhav Pritish", college: "VIT", img: "/student photo/pritish.jpeg" },
  { name: "Apurva Kohinkar", college: "VIT", img: "" },
  { name: "Rale Aryan", college: "VIT", img: "" },
  { name: "Lende Vedant", college: "VIT", img: "" },
  { name: "Jondhale Jaysen", college: "VIT", img: "" },
  { name: "Thite Anushka", college: "Cummins", img: "" },
  { name: "Argade Shruti", college: "Cummins", img: "" },
  { name: "Salunke Bhakti", college: "Cummins", img: "" },
  { name: "Dalvi Vaishnavi", college: "PCCOE", img: "" },
  { name: "Khaire Sanket", college: "PCCOE", img: "" },
  { name: "Pangavhane Purva", college: "PCCOE", img: "" },
];

const medicalResults = [
  { name: "Pacharne Shantanu", college: "MBBS", img: "" },
  { name: "Tagad Hitesh", college: "MBBS", img: "" },
  { name: "Sandbhor Omkar", college: "MBBS", img: "" },
  { name: "Bindle Pratiksha", college: "BDS", img: "" },
  { name: "Bankar Vaishnavi", college: "BDS", img: "" },
  { name: "Yelbhar Bhakti", college: "BAMS", img: "" },
  { name: "Totre Kartik", college: "BAMS", img: "" },
  { name: "Dherange Shubham", college: "BAMS", img: "" },
  { name: "Jaid Shruti", college: "BHMS", img: "" },
  { name: "Dhangar Lalit", college: "BHMS", img: "" },
  { name: "Bhandari Roshani", college: "BHMS", img: "" },
  { name: "Bhogade Shraddha", college: "BHMS", img: "" },
  { name: "Sutar Pranjali", college: "BHMS", img: "" },
  { name: "Chavan Rachna", college: "Physiotherapy (LTCOP)", img: "" },
  { name: "Gorde Pritam", college: "Govt. MBBS", img: "" },
  { name: "Medge Aryan", college: "Semi Govt. MBBS", img: "" },
];

const academicYears = [
 {
 year: "2023-2024",
 students: [
   ...engineeringResults.map(s => ({ ...s, stream: "Engineering" })),
   ...medicalResults.map(s => ({ ...s, stream: "Medical" }))
 ],
 }
];

import { RedirectIfLoggedIn } from "@/components/auth/RedirectIfLoggedIn";

export default function ResultsPage() {
 const [activeFilter, setActiveFilter] = useState("All");

 return (
   <RedirectIfLoggedIn>
 <div className="py-24 bg-slate-50 min-h-screen">
 <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
 
 <div className="mb-12">
 <Link href="/">
 <Button variant="ghost" size="sm" className="mb-8">
 <ArrowLeft size={18} /> Back to Home
 </Button>
 </Link>
 <SectionHeading 
 title="Our Hall of Fame" 
 subtitle="Celebrating the exceptional achievements of our students over the years." 
 />
 
 {/* Filter Buttons */}
 <div className="flex flex-wrap justify-center gap-3 mt-8">
   <button 
     onClick={() => setActiveFilter("All")}
     className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${activeFilter === "All" ? "bg-brand-blue text-white shadow-md scale-105" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
   >
     <Filter size={16} /> All Streams
   </button>
   <button 
     onClick={() => setActiveFilter("Engineering")}
     className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${activeFilter === "Engineering" ? "bg-brand-orange text-white shadow-md scale-105" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
   >
     Engineering
   </button>
   <button 
     onClick={() => setActiveFilter("Medical")}
     className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${activeFilter === "Medical" ? "bg-emerald-600 text-white shadow-md scale-105" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
   >
     Medical
   </button>
 </div>
 </div>

 <div className="space-y-24">
 {academicYears.map((yearGroup) => {
   const filteredStudents = yearGroup.students.filter(student => activeFilter === "All" || student.stream === activeFilter);
   
   if (filteredStudents.length === 0) return null;

   return (
 <div key={yearGroup.year}>
 <div className="flex items-center gap-4 mb-10">
 <div className="h-px bg-slate-200 flex-grow" />
 <h3 className="text-3xl font-extrabold text-brand-blue px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
 Batch {yearGroup.year}
 </h3>
 <div className="h-px bg-slate-200 flex-grow" />
 </div>

 <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <AnimatePresence mode="popLayout">
 {filteredStudents.map((student, studentIndex) => (
 <motion.div
 layout
 key={`${student.name}-${studentIndex}`}
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.8 }}
 transition={{ duration: 0.3, delay: (studentIndex % 8) * 0.05 }}
 className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center"
 >
 <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-brand-orange/20 bg-gradient-to-br from-brand-orange/10 to-brand-orange/30 flex items-center justify-center text-3xl font-black text-brand-orange">
 {student.img ? (
   <img src={student.img} alt={student.name} className="w-full h-full object-cover" />
 ) : (
   <span>{student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
 )}
 </div>
 <h4 className="font-bold text-xl text-slate-900 mb-2">{student.name}</h4>
 
 <div className="flex items-center gap-1.5 text-brand-orange font-medium text-sm mt-auto pt-4 border-t border-slate-100 w-full justify-center">
 <GraduationCap size={16} />
 <span>{student.college}</span>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </motion.div>
 </div>
 )})}
 </div>

 </div>
 </div>
 </RedirectIfLoggedIn>
 );
}
