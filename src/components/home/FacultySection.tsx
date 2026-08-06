/* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";

// Icons
const Instagram = ({size=16}: {size?:number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
const Linkedin = ({size=16}: {size?:number}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;

const faculty = [
  {
    name: "Mayur Sir",
    subject: "Founder & Mathematics Expert",
    initials: "MS",
    color: "from-slate-800 to-slate-900",
    image: "/mayur sir.jpeg",
  },
  {
    name: "Santosh Sir",
    subject: "English Expert",
    initials: "SS",
    color: "from-purple-500 to-violet-600",
    image: "/santosh sir.jpeg",
  },
  {
    name: "Prem Sir",
    subject: "Chemistry Expert",
    initials: "PS",
    color: "from-rose-400 to-red-500",
    image: "/prem sir.jpeg",
  },
  {
    name: "Sager Sir",
    subject: "Physics Expert",
    initials: "SS",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Pranav Sir",
    subject: "Physics Expert",
    initials: "PS",
    color: "from-cyan-400 to-blue-500",
    image: "/pranav sir.jpeg",
  },
  {
    name: "Amol Sir",
    subject: "Biology Expert",
    initials: "AS",
    color: "from-emerald-400 to-teal-500",
  },
  {
    name: "Avinash Sir",
    subject: "Chemistry Expert",
    initials: "AS",
    color: "from-amber-400 to-orange-500",
  },
];

export function FacultySection() {
  // Double the array for seamless infinite scrolling
  const scrollItems = [...faculty, ...faculty];

  return (
    <section id="faculty" className="py-24 bg-white overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 text-center">
        <SectionHeading 
          title="Meet Our Expert Faculty" 
          subtitle="Learn from the best educators with years of experience in mentoring top rankers." 
        />
      </div>

      {/* Marquee Animation */}
      <div className="relative w-full max-w-[1600px] mx-auto mt-16 mb-8">
        {/* Left and Right gradient masks for smooth fade */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        
        <div className="flex overflow-hidden marquee-container">
          <div className="flex gap-6 py-4 animate-faculty-marquee">
            {scrollItems.map((member, idx) => {
              const isFounder = member.name === "Mayur Sir";
              
              return (
              <div 
                key={`${member.name}-${idx}`} 
                className={`w-72 shrink-0 rounded-2xl p-8 border flex flex-col items-center text-center transition-all hover:-translate-y-1 relative overflow-hidden ${
                  isFounder 
                    ? 'bg-gradient-to-b from-brand-orange/[0.08] to-white border-brand-orange/30 shadow-[0_10px_30px_rgba(249,115,22,0.1)]' 
                    : 'bg-slate-50 border-slate-100 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Optional premium subtle glow for Founder */}
                {isFounder && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange to-brand-blue" />
                )}

                {/* Premium Gradient Avatar */}
                <div className={`w-32 h-32 rounded-full mb-5 flex items-center justify-center text-4xl font-black text-white bg-gradient-to-br ${member.color} shadow-md border-4 border-white relative z-10 overflow-hidden`}>
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.initials
                  )}
                </div>
                
                <h4 className="font-bold text-xl text-slate-900 mb-2 relative z-10">{member.name}</h4>
                
                <div className={`flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-6 relative z-10 ${isFounder ? 'px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full border border-brand-orange/20' : 'text-brand-orange'}`}>
                  <BookOpen size={14} />
                  <span>{member.subject}</span>
                </div>

                {/* Socials */}
                <div className="flex gap-3 relative z-10">
                  <a href="#" className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                    isFounder 
                      ? 'bg-white border-brand-orange/20 text-slate-400 hover:text-brand-orange border' 
                      : 'bg-white border-slate-100 text-slate-400 hover:text-brand-blue border'
                  }`}>
                    <Linkedin size={14} />
                  </a>
                  <a href="#" className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                    isFounder 
                      ? 'bg-white border-brand-orange/20 text-slate-400 hover:text-brand-orange border' 
                      : 'bg-white border-slate-100 text-slate-400 hover:text-brand-blue border'
                  }`}>
                    <Instagram size={14} />
                  </a>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes faculty-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 12px)); /* Half width minus half gap */ }
        }
        .animate-faculty-marquee {
          animation: faculty-marquee 30s linear infinite;
          width: max-content;
        }
        
        /* This properly pauses the animation when the user hovers over the container */
        .marquee-container:hover .animate-faculty-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
