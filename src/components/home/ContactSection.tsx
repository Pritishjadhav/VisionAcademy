"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "../ui/SectionHeading";
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { useState } from "react";

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    // Add some hidden fields for formsubmit.co configuration
    formData.append("_subject", "New Callback Request - Vision Academy");
    formData.append("_captcha", "false");
    
    try {
      await fetch("https://formsubmit.co/ajax/visionacademy7979@gmail.com", {
        method: "POST",
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-slate-50 ">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <SectionHeading
          title="Contact Us"
          subtitle="Have questions? Reach out to us. We're here to help you."
        />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.a
              href="tel:+917755999944"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:border-brand-blue/30 hover:shadow-xl transition-all cursor-pointer group block"
            >
              <div className="bg-brand-blue/10 w-14 h-14 rounded-2xl flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
                <Phone size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Phone</h3>
              <p className="text-slate-600 font-medium group-hover:text-brand-orange transition-colors block">+91 7755999944</p>
              <p className="text-slate-500 text-sm mt-1">(Mayur Sir)</p>
            </motion.a>

            <motion.a
              href="mailto:visionacademy7979@gmail.com"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:border-brand-orange/30 hover:shadow-xl transition-all cursor-pointer group block"
            >
              <div className="bg-brand-orange/10 w-14 h-14 rounded-2xl flex items-center justify-center text-brand-orange mb-6 group-hover:scale-110 transition-transform">
                <Mail size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600 font-medium group-hover:text-brand-orange transition-colors block break-all">visionacademy7979@gmail.com</p>
              <p className="text-slate-500 text-sm mt-1">We reply within 24 to 48 hours</p>
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-center gap-4"
            >
               <a href="https://www.instagram.com/visionacademy_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group hover:bg-slate-50 p-2 rounded-2xl transition-colors">
                  <div className="bg-pink-100 w-12 h-12 rounded-xl flex items-center justify-center text-pink-500 shrink-0 group-hover:scale-110 transition-transform">
                    <InstagramIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">Instagram</h3>
                    <p className="text-slate-500 text-xs">@visionacademy_</p>
                  </div>
               </a>
               
               <div className="h-px w-full bg-slate-100"></div>

               <a href="https://www.youtube.com/@VISIONACADEMYmayursir" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group hover:bg-slate-50 p-2 rounded-2xl transition-colors">
                  <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center text-red-600 shrink-0 group-hover:scale-110 transition-transform">
                    <YoutubeIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">YouTube</h3>
                    <p className="text-slate-500 text-xs truncate max-w-[120px] sm:max-w-[140px]">@VISIONACADEMYmayursir</p>
                  </div>
               </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 "
            >
              <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                <Clock size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Office Hours</h3>
              <p className="text-slate-600 font-medium text-[15px]">Monday to Saturday: 9:00 - 18:00</p>
              <p className="text-slate-500 text-sm mt-1">Sunday: 9:00 - 12:00</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 sm:col-span-2"
            >
              <div className="bg-purple-100 w-14 h-14 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <MapPin size={28} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Branch 1</h3>
                  <a href="https://maps.app.goo.gl/ZuiMsSWMFpGZfysp6?g_st=aw" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-brand-orange transition-colors block">
                    Karmare Complex, Above Hotel Saikrupa, Pabal Road, Rajgurunagar.
                  </a>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Branch 2</h3>
                  <p className="text-slate-600 ">Opposite K.T.E.S. School, Post Office Road, Wada Road, Rajgurunagar.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Form & Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col"
          >
            {/* Contact Form */}
            <div className="p-8 relative min-h-[480px] flex flex-col">
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Request a Callback</h3>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-sm font-medium text-slate-700 ">Full Name *</label>
                          <input type="text" id="name" name="name" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="phone" className="text-sm font-medium text-slate-700 ">Phone Number *</label>
                          <input type="tel" id="phone" name="phone" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="+91 0000000000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700 ">Email Address *</label>
                        <input type="email" id="email" name="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="you@example.com" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="course" className="text-sm font-medium text-slate-700 ">Interested Course</label>
                        <select id="course" name="course" defaultValue="" required className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue text-slate-700 ">
                          <option value="" disabled>Choose Interested Course</option>
                          <option value="Integrated Batch (11th+12th)">Integrated Batch (11th+12th)</option>
                          <option value="Regular Batch">Regular Batch</option>
                          <option value="Crash Course">Crash Course</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-slate-700 ">Message (Optional)</label>
                        <textarea id="message" name="message" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none" placeholder="Any specific questions?"></textarea>
                      </div>
                      <Button variant="secondary" className="w-full py-4 mt-4" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Submit Request"}
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent Successfully!</h3>
                    <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                      Thank you for reaching out to Vision Academy. We will reply to your request within 24 to 48 hours.
                    </p>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                      Send Another Request
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Google Maps Integration - Fully Interactive */}
            <div className="h-64 relative mt-auto border-t border-slate-100 group">
              {/* Custom Open in Maps Button */}
              <a
                href="https://maps.app.goo.gl/ZuiMsSWMFpGZfysp6?g_st=aw"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 left-4 z-10 bg-white hover:bg-slate-50 text-slate-900 font-semibold px-4 py-2.5 rounded-lg shadow-md border border-slate-200 text-sm transition-all hover:shadow-lg flex items-center gap-2 opacity-90 hover:opacity-100"
              >
                <MapPin size={16} className="text-brand-orange" />
                Open in Google Maps
              </a>
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://maps.google.com/maps?q=18.852778,73.888639&t=m&z=17&ie=UTF8&iwloc=&output=embed"
                title="Vision Academy Branch 1 Location"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
