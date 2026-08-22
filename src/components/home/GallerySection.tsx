"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "../ui/SectionHeading";
import { Button } from "../ui/Button";
import { X, Grid } from "lucide-react";

// Temporary 1920x1080 images
const galleryImages = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1920&h=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1920&h=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1920&h=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1920&h=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1920&h=1080&auto=format&fit=crop",
];

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  // We duplicate the images to create a seamless loop
  const duplicatedImages = [...galleryImages, ...galleryImages];

  return (
    <section className="py-16 bg-slate-50 relative overflow-hidden">
      {/* Background Premium Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/3" />

      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 mb-12 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-brand-orange font-semibold text-sm w-fit mb-4 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange"></span>
          </span>
          Campus Tour
        </div>
        <SectionHeading
          title="Life at Vision Academy"
          subtitle="Glimpses of our vibrant learning environment and infrastructure."
        />
      </div>

      <div className="relative w-full overflow-hidden py-6">
        {/* Left and Right Fade Overlays for a smoother look */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-6 w-max animate-marquee-right hover:[animation-play-state:paused]"
          style={{ animationDuration: '40s' }}
        >
          {duplicatedImages.map((src, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(src)}
              className="relative w-[280px] sm:w-[350px] md:w-[450px] lg:w-[500px] shrink-0 aspect-video rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-[6px] border-white cursor-pointer group bg-white hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 flex items-end justify-center pb-4">
                <span className="text-white font-medium bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 text-sm">View Full Image</span>
              </div>
              <img
                src={src}
                alt={`Academy photo ${index + 1}`}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center relative z-20">
        <Button
          onClick={() => setIsViewAllOpen(true)}
          size="md"
          variant="gradient"
          className="gap-2 px-8 py-4 rounded-xl shadow-xl hover:-translate-y-1 transition-all text-base font-bold group"
        >
          <Grid size={20} className="group-hover:scale-110 transition-transform duration-300" />
          View All Photos
        </Button>
      </div>

      {/* Grid View Modal */}
      <AnimatePresence>
        {isViewAllOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white overflow-y-auto"
          >
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Life at Vision Academy</h3>
              <button
                onClick={() => setIsViewAllOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close view all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-8 max-w-[1600px] mx-auto pb-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryImages.map((src, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group"
                    onClick={() => setSelectedImage(src)}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium bg-black/50 px-4 py-2 rounded-full">View</span>
                    </div>
                    <img
                      src={src}
                      alt={`Academy photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors z-[110]"
              aria-label="Close image"
            >
              <X size={28} />
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative flex items-center justify-center max-w-7xl w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Enlarged academy photo"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
