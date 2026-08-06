"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const features = [
 "IIT-JEE",
 "NEET",
 "MHT-CET",
 "Expert Faculty",
 "Small Batch Size",
 "Personal Attention",
 "Regular Tests",
 "Best Results",
];

export function FeaturesSection() {
 return (
 <section className="py-12 bg-white border-b border-slate-100 ">
 <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {features.map((feature, index) => (
 <motion.div
 key={index}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: index * 0.1 }}
 whileHover={{ scale: 1.05, y: -5 }}
 className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-default"
 >
 <CheckCircle2 className="text-brand-orange shrink-0" size={24} />
 <span className="font-semibold text-slate-800 ">
 {feature}
 </span>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
