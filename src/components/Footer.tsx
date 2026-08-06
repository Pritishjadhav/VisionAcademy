import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";

const Instagram = ({ size = 20 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
const Youtube = ({ size = 20 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>;

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
              <a href="https://www.youtube.com/@VISIONACADEMYmayursir" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-colors">
                <Youtube size={20} />
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
