"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 50, scale: 0.3, rotate: -45 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, y: 30, scale: 0 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-brand-blue to-cyan-400 text-white shadow-[0_4px_14px_0_rgba(14,165,233,0.4)] hover:shadow-[0_8px_25px_0_rgba(14,165,233,0.6)] focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-all duration-300 group"
          aria-label="Scroll to top"
        >
          {/* Very attractive bouncing arrow */}
          <motion.div
             animate={{ y: [0, -5, 0] }}
             transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowUp size={24} strokeWidth={2.5} className="drop-shadow-sm group-hover:-translate-y-1 transition-transform duration-300" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
