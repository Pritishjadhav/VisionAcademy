import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";

const Instagram = ({ size = 20 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const Youtube = ({ size = 20 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const Facebook = ({ size = 20 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;

export function Footer() {
  return (
    <footer className="bg-brand-blue text-slate-300 py-12 md:py-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 flex items-center justify-center shrink-0 bg-white rounded-xl overflow-hidden p-1 shadow-md">
                <Image src="/logo.jpeg" alt="Vision Academy Logo" width={48} height={48} className="object-contain" />
              </div>
              <span
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Vision Academy
              </span>
            </Link>
            <p className="mb-6 text-slate-400">
              Building Future Engineers & Doctors. Premium coaching for IIT-JEE, NEET, and MHT-CET.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/visionacademy_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://www.facebook.com/visionacademykhed/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://www.youtube.com/@VISIONACADEMYmayursir" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
              <a href="mailto:visionacademy7979@gmail.com" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-brand-orange transition-colors">Home</Link></li>
              <li><Link href="/#about" className="hover:text-brand-orange transition-colors">About</Link></li>
              <li><Link href="/#courses" className="hover:text-brand-orange transition-colors">Courses</Link></li>
              <li><Link href="/#faculty" className="hover:text-brand-orange transition-colors">Faculty</Link></li>
              <li><Link href="/results" className="hover:text-brand-orange transition-colors">Results</Link></li>
              <li><Link href="/#contact" className="hover:text-brand-orange transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Phone className="text-brand-orange shrink-0" size={20} />
                <div>
                  <a href="tel:+917755999944" className="hover:text-brand-orange transition-colors block">+91 7755999944</a>
                  <p className="text-sm text-slate-400">(Mayur Sir)</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="text-brand-orange shrink-0" size={20} />
                <a href="mailto:visionacademy7979@gmail.com" className="hover:text-brand-orange transition-colors block">visionacademy7979@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6">Our Branches</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="text-brand-orange shrink-0" size={24} />
                <div>
                  <p className="font-medium text-white">Branch 1</p>
                  <a href="https://maps.app.goo.gl/ZuiMsSWMFpGZfysp6?g_st=aw" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-brand-orange transition-colors block mt-1">Karmare Complex, Above Hotel Saikrupa, Pabal Road, Rajgurunagar.</a>
                </div>
              </li>
              <li className="flex gap-3">
                <MapPin className="text-brand-orange shrink-0" size={24} />
                <div>
                  <p className="font-medium text-white">Branch 2</p>
                  <p className="text-sm text-slate-400">Opposite K.T.E.S. School, Post Office Road, Wada Road, Rajgurunagar.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Vision Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
