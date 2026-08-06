"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
 title: string;
 subtitle?: string;
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
 return (
 <div className="text-center mb-16">
 <motion.h2
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-100px" }}
 transition={{ duration: 0.6 }}
 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-orange inline-block pb-2"
 >
 {title}
 </motion.h2>
 {subtitle && (
 <motion.p
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-100px" }}
 transition={{ duration: 0.6, delay: 0.2 }}
 className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto"
 >
 {subtitle}
 </motion.p>
 )}
 </div>
 );
}
