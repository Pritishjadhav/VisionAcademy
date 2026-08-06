/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element */
"use client";

import { useState } from "react";
import { SectionHeading } from "../ui/SectionHeading";
import { Button } from "../ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

const engineeringResults = [
  { name: "Pawar Pratiksha", college: "NIT Nagpur (CS)", img: "" },
  { name: "Barne Vibhavari", college: "PICT", img: "" },
  { name: "Lunawat Akash", college: "PICT", img: "" },
  { name: "Sawale Krishna", college: "PICT", img: "" },
  { name: "Khaladkar Sanskar", college: "PICT", img: "" },
  { name: "Jadhav Pritish", college: "VIT", img: "/student photo/pritish.jpeg" },
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

export function ResultsSection() {
  // Double the arrays for seamless infinite scrolling
  const engScrollItems = [...engineeringResults, ...engineeringResults];
  const medScrollItems = [...medicalResults, ...medicalResults];

  return (
    <section id="results" className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 text-center">
        <SectionHeading 
          title="Current Academic Year Results" 
          subtitle="Our students consistently secure top ranks and admissions to premier institutes." 
        />
      </div>

      {/* Engineering Row */}
      <div className="mb-16">
        <h3 className="text-2xl font-black text-brand-blue text-center mb-8 uppercase tracking-widest">Engineering</h3>
        <div className="relative w-full max-w-[1600px] mx-auto marquee-container">
          {/* Left and Right gradient masks for smooth fade */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-hidden group">
            <div className="flex gap-6 py-4 animate-marquee">
              {engScrollItems.map((student, idx) => (
                <div 
                  key={`eng-${student.name}-${idx}`} 
                  className="w-64 shrink-0 bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md bg-gradient-to-br from-brand-blue/10 to-brand-blue/30 flex items-center justify-center text-4xl font-black text-brand-blue">
                    {student.img ? (
                      <img src={student.img} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">{student.name}</h4>
                  <div className="flex items-center gap-1.5 text-brand-orange text-sm font-medium">
                    <GraduationCap size={16} />
                    <span>{student.college}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Medical Row */}
      <div className="mb-16">
        <h3 className="text-2xl font-black text-brand-orange text-center mb-8 uppercase tracking-widest">Medical</h3>
        <div className="relative w-full max-w-[1600px] mx-auto marquee-container">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <div className="flex overflow-hidden group">
            <div className="flex gap-6 py-4 animate-marquee-reverse">
              {medScrollItems.map((student, idx) => (
                <div 
                  key={`med-${student.name}-${idx}`} 
                  className="w-64 shrink-0 bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-md bg-gradient-to-br from-brand-orange/10 to-brand-orange/30 flex items-center justify-center text-4xl font-black text-brand-orange">
                    {student.img ? (
                      <img src={student.img} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">{student.name}</h4>
                  <div className="flex items-center gap-1.5 text-brand-orange text-sm font-medium">
                    <GraduationCap size={16} />
                    <span>{student.college}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link href="/results">
          <Button variant="outline" size="lg">
            View All Results
          </Button>
        </Link>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 12px)); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(calc(-50% - 12px)); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
          width: max-content;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 25s linear infinite;
          width: max-content;
        }
        .marquee-container:hover .animate-marquee,
        .marquee-container:hover .animate-marquee-reverse {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
