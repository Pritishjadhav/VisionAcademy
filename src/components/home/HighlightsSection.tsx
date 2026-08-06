/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion } from "framer-motion";

const row1 = [
  "🎓 Offline Classes", 
  "📝 Mock Tests", 
  "🎯 Career Guidance", 
  "💡 Doubt Solving"
];

const row2 = [
  "📚 PYQ Solving", 
  "🔄 Revision Sessions", 
  "📖 Theory Tests", 
  "👨‍🏫 Expert Faculty"
];

const row3 = [
  "📊 Topic-wise Tests", 
  "✍️ Subjective Tests", 
  "📘 Vision Academy Modules",
  "🎯 Regular PTM" // Added an extra item to balance the row length
];

// To ensure seamless loop on ultrawide monitors, we repeat the items multiple times per block
const getRepeatedItems = (items: string[]) => {
  return [...items, ...items, ...items, ...items];
};

export function HighlightsSection() {
  return (
    <section className="py-16 bg-slate-50 overflow-hidden relative">
      {/* Decorative blurs */}
      <div className="absolute -left-40 top-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-40 bottom-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 md:gap-8 max-w-[2560px] mx-auto">
        <MarqueeRow items={row1} direction="left" />
        <MarqueeRow items={row2} direction="right" />
        <MarqueeRow items={row3} direction="left" />
      </div>
    </section>
  );
}

function MarqueeRow({ items, direction }: { items: string[], direction: "left" | "right" }) {
  const repeatedItems = getRepeatedItems(items);
  
  return (
    <div className="flex overflow-hidden group py-2 mask-edges">
      <div 
        className={`flex w-max ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"} group-hover:[animation-play-state:paused]`}
      >
        <div className="flex gap-4 md:gap-6 px-2 md:px-3">
          {repeatedItems.map((item, idx) => (
            <Chip key={`block1-${idx}`}>{item}</Chip>
          ))}
        </div>
        <div className="flex gap-4 md:gap-6 px-2 md:px-3">
          {repeatedItems.map((item, idx) => (
            <Chip key={`block2-${idx}`}>{item}</Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="whitespace-nowrap px-6 py-3 md:px-8 md:py-4 rounded-full bg-white/80 glass border border-slate-200 shadow-sm hover:shadow-lg hover:border-brand-blue/20 hover:scale-105 transition-all duration-300 text-slate-700 hover:text-brand-blue font-semibold text-base md:text-lg flex items-center justify-center cursor-default">
      {children}
    </div>
  );
}
