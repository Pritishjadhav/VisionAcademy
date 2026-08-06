/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "../ui/SectionHeading";
import { Check, Star } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "@/lib/utils";

const courses = [
 {
 title: "Integrated Batch",
 subtitle: "(11th + 12th JEE/NEET)",
 price: "₹1,80,000",
 features: [
 "Complete 11th Syllabus",
 "Complete 12th Syllabus",
 "JEE Preparation",
 "NEET Preparation",
 "Premium Test Series",
 "Printed Study Material",
 "Personalized Doubt Solving",
 ],
 highlighted: true,
 },
 {
 title: "Regular Batch",
 subtitle: "(College + Coaching)",
 price: "₹60,000",
 features: [
 "11th Syllabus",
 "12th Syllabus",
 "Evening Batch Timings",
 "Weekly Tests",
 "Digital Notes",
 "Personal Guidance",
 ],
 highlighted: false,
 },
 {
 title: "MHT-CET Crash Course",
 subtitle: "Fast Track Preparation",
 price: "₹15,000",
 features: [
 "Fast Track Revision",
 "Full Length Mock Tests",
 "Previous Year Practice Papers",
 "Important Questions Bank",
 "Exam Strategy Sessions",
 ],
 highlighted: false,
 },
];

export function CoursesSection() {
  return (
    <section id="courses" className="py-24 relative bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 relative z-10">
        <SectionHeading 
          title="Premium Learning Programs" 
          subtitle="Choose the perfect batch to start your journey towards excellence." 
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "relative rounded-3xl p-8 flex flex-col h-full transition-all duration-300",
                course.highlighted 
                  ? "bg-white border-2 border-brand-orange shadow-[0_8px_30px_rgba(249,115,22,0.12)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.15)]" 
                  : "bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300"
              )}
            >
              {/* Highlight Badge */}
              {course.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-orange to-amber-500 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md border border-white/20 whitespace-nowrap">
                  Most Popular Choice
                </div>
              )}

              <div className="text-center mb-8 mt-2">
                <p className={cn("text-xs font-bold uppercase tracking-widest mb-3", course.highlighted ? "text-brand-orange" : "text-brand-blue")}>
                  {course.subtitle}
                </p>
                <h3 className="text-2xl font-black mb-4 text-slate-900">{course.title}</h3>
                
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {course.price}
                  </span>
                </div>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4">
                  {course.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={cn(
                        "mt-1 p-1 rounded-full shrink-0 flex items-center justify-center", 
                        course.highlighted 
                          ? "bg-brand-orange/10 text-brand-orange" 
                          : "bg-slate-100 text-slate-500"
                      )}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="font-medium text-sm text-slate-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <a 
                  href="#contact"
                  className={cn(
                  "block text-center w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300",
                  course.highlighted 
                    ? "bg-brand-orange text-white hover:bg-orange-600 shadow-md shadow-brand-orange/20" 
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                )}>
                  Enroll Now
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
