"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "../ui/SectionHeading";
import { Check, ArrowRight, Sparkles, GraduationCap, Target, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const courses = [
  {
    title: "Integrated Batch",
    subtitle: "11th + 12th JEE/NEET",
    description: "Our flagship program designed for students aiming for top engineering and medical colleges.",
    price: "₹1,80,000",
    icon: GraduationCap,
    color: "from-brand-orange/20 to-orange-50",
    iconColor: "text-brand-orange",
    buttonColor: "bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange hover:to-orange-500 text-white shadow-lg shadow-brand-orange/25",
    features: [
      "Complete 11th & 12th Syllabus",
      "Advanced JEE/NEET Preparation",
      "Premium Test Series Included",
      "Printed Premium Study Material",
      "Personalized 1-on-1 Doubt Solving",
    ],
    highlighted: true,
    badge: "Most Popular Choice",
  },
  {
    title: "Regular Batch",
    subtitle: "College + Coaching",
    description: "Perfect balance of state board curriculum and competitive exam preparation.",
    price: "₹60,000",
    icon: BookOpen,
    color: "from-brand-blue/10 to-blue-50",
    iconColor: "text-brand-blue",
    buttonColor: "bg-white text-brand-blue border-2 border-brand-blue/20 hover:border-brand-blue hover:bg-brand-blue/5",
    features: [
      "11th & 12th Board Syllabus",
      "Evening Batch Timings",
      "Weekly Performance Tests",
      "Regular Theory Test",
      "Career & Personal Guidance",
    ],
    highlighted: false,
  },
  {
    title: "MHT-CET Crash Course",
    subtitle: "Fast Track Preparation",
    description: "Intensive short-term program focused entirely on cracking the MHT-CET exam.",
    price: "₹15,000",
    icon: Target,
    color: "from-purple-500/10 to-purple-50",
    iconColor: "text-purple-600",
    buttonColor: "bg-white text-purple-600 border-2 border-purple-500/20 hover:border-purple-600 hover:bg-purple-500/5",
    features: [
      "Fast Track Topic Revision",
      "Full Length Mock Tests",
      "Previous Year Practice Papers",
      "Important Questions Bank",
      "Special Exam Strategy Sessions",
    ],
    highlighted: false,
  },
];

export function CoursesSection() {
  return (
    <section id="courses" className="py-24 relative overflow-hidden bg-slate-50">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-orange/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-brand-blue/5 blur-[120px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-200/60 text-brand-orange font-medium text-sm mb-6"
          >
            <Sparkles size={16} />
            <span>Premium Learning Experience</span>
          </motion.div>
          <SectionHeading
            title="Choose Your Path to Excellence"
            subtitle="Expertly crafted programs tailored for different learning needs and goals."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {courses.map((course, index) => {
            const Icon = course.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "group relative rounded-[2rem] p-8 flex flex-col h-full bg-white transition-all duration-500 hover:-translate-y-2",
                  course.highlighted
                    ? "border border-brand-orange/20 shadow-[0_20px_60px_-15px_rgba(249,115,22,0.15)] ring-1 ring-brand-orange/20"
                    : "border border-slate-200/80 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:border-slate-300"
                )}
              >
                {/* Highlight Badge */}
                {course.highlighted && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-orange to-amber-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg border border-white/20 whitespace-nowrap flex items-center gap-1.5 z-20">
                    <Star size={14} className="fill-white" />
                    {course.badge}
                  </div>
                )}

                {/* Top Gradient Mesh / Decor */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-32 rounded-t-[2rem] bg-gradient-to-b opacity-50",
                  course.color,
                  "to-transparent"
                )} />

                <div className="relative z-10 mb-8 mt-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100",
                      course.iconColor
                    )}>
                      <Icon size={28} strokeWidth={2.5} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{course.title}</h3>
                  <p className={cn("text-sm font-bold uppercase tracking-wider mb-4", course.iconColor)}>
                    {course.subtitle}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed min-h-[40px]">
                    {course.description}
                  </p>
                </div>

                <div className="relative z-10 flex items-end gap-1 mb-8 pb-8 border-b border-slate-100">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {course.price}
                  </span>
                </div>

                <div className="relative z-10 flex-grow mb-10">
                  <ul className="space-y-4">
                    {course.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 group/item">
                        <div className={cn(
                          "mt-0.5 p-1 rounded-full shrink-0 flex items-center justify-center transition-colors duration-300",
                          course.highlighted
                            ? "bg-brand-orange/10 text-brand-orange group-hover/item:bg-brand-orange group-hover/item:text-white"
                            : "bg-slate-100 text-slate-500 group-hover/item:bg-slate-800 group-hover/item:text-white"
                        )}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="font-medium text-[15px] text-slate-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative z-10 mt-auto">
                  <a
                    href="#contact"
                    className={cn(
                      "flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300",
                      course.buttonColor
                    )}>
                    <span>Enroll Now</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  );
}
