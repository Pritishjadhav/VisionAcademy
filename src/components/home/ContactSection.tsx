"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "../ui/SectionHeading";
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { useState } from "react";

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const YoutubeIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WhatsappIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
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
              className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Social Media</h3>
                <div className="flex gap-4">
                  <a href="https://www.instagram.com/visionacademy_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-pink-50/80 text-pink-500 rounded-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-sm hover:shadow-md hover:bg-pink-100">
                    <InstagramIcon size={28} />
                  </a>
                  <a href="https://www.facebook.com/visionacademykhed/" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-blue-50/80 text-blue-600 rounded-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-sm hover:shadow-md hover:bg-blue-100">
                    <FacebookIcon size={28} />
                  </a>
                  <a href="https://www.youtube.com/@VISIONACADEMYmayursir" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-red-50/80 text-red-600 rounded-2xl flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all shadow-sm hover:shadow-md hover:bg-red-100">
                    <YoutubeIcon size={28} />
                  </a>
                </div>
              </div>
               
              <div className="w-full mt-8">
                 <button 
                   type="button"
                   disabled
                   className="w-full bg-[#25D366] opacity-80 cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2"
                 >
                   <WhatsappIcon size={20} />
                   <span>Join WhatsApp Group</span>
                 </button>
              </div>
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
