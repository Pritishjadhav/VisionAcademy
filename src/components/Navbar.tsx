"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, User, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/Button";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/config";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Courses", href: "/#courses" },
  { name: "Faculty", href: "/#faculty" },
  { name: "Results", href: "/results" },
  { name: "Contact", href: "/#contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);


  const { user, role, dbUser } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0][0];
      const last = parts[parts.length - 1][0];
      return (first + last).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userName = (dbUser?.name as string) || user?.displayName || "";
  const userInitials = (role === "admin" || role === "super_admin") ? "VA" : role === "parent" ? "PD" : getInitials(userName);
  const pathname = usePathname();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("");

  const handleLogout = async () => {
    await auth.signOut();
    setDropdownOpen(false);
    setMobileDropdownOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Scrollspy logic for home page sections
      if (pathname === "/") {
        const sections = ["about", "courses", "faculty", "results", "contact"];
        let current = "home";

        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            // If the section top crosses the top 300px of viewport, mark it active
            if (rect.top <= 300) {
              current = section;
            }
          }
        }

        // If user scrolled to the absolute bottom, activate contact
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
          current = "contact";
        }

        // If at the very top, activate home
        if (window.scrollY < 100) {
          current = "home";
        }

        setActiveSection(current);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Trigger once on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" && (activeSection === "home" || activeSection === "");
    }
    if (href === "/results") {
      return pathname === "/results" || (pathname === "/" && activeSection === "results");
    }
    if (href.startsWith("/#")) {
      return pathname === "/" && activeSection === href.replace("/#", "");
    }
    return pathname === href;
  };

  const getDashboardLink = () => {
    if (role === "admin" || role === "super_admin") return "/admin/dashboard";
    if (role === "student") return "/student/dashboard";
    if (role === "parent") return "/parent/dashboard";
    if (role === "faculty") return "/faculty/dashboard";
    return "/";
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex items-center ${isScrolled ? "glass shadow-sm h-16" : "bg-transparent h-20"
        }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <Image src="/logo.jpeg" alt="Vision Academy Logo" width={40} height={40} className="object-contain" />
            </div>
            <span
              className="text-2xl font-bold text-brand-blue"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              Vision Academy
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {!user && navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-4 py-2 font-medium transition-colors z-10 rounded-full ${active ? "text-brand-orange" : "text-slate-700 hover:text-brand-orange"
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-brand-orange/10 rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}

            {user ? (
              <div className="relative">
                <div className="relative group flex items-center justify-center w-11 h-11">
                  {/* Indian Flag Gradient Border */}
                  <div className="absolute inset-[2px] bg-[linear-gradient(to_bottom,#FF9933_33%,#FFFFFF_33%,#FFFFFF_66%,#138808_66%)] rounded-full" />

                  {/* Inner Icon Container */}
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                    className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-105 shadow-sm p-[2px]"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200/50">
                        <span className="text-blue-600 text-sm font-extrabold tracking-wider">{userInitials}</span>
                      </div>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 flex flex-col"
                    >
                      <Link href={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <LayoutDashboard size={16} />
                        Dashboard
                      </Link>
                      {role === "student" && (
                        <Link href="/student/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <User size={16} />
                          User Profile
                        </Link>
                      )}
                      {role === "faculty" && (
                        <Link href="/faculty/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <User size={16} />
                          Faculty Profile
                        </Link>
                      )}
                      <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <Settings size={16} />
                        Settings
                      </Link>
                      <div className="h-px bg-slate-100 my-1 mx-2"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="gradient" size="sm">
                  <LogIn size={16} />
                  Login
                </Button>
              </Link>
            )}
          </nav>



          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-3">
            {user ? (
              <div className="relative">
                <div className="relative group flex items-center justify-center w-10 h-10">
                  <div className="absolute inset-[2px] bg-[linear-gradient(to_bottom,#FF9933_33%,#FFFFFF_33%,#FFFFFF_66%,#138808_66%)] rounded-full" />

                  <button
                    onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                    onBlur={() => setTimeout(() => setMobileDropdownOpen(false), 200)}
                    className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-105 shadow-sm p-[2px]"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200/50">
                        <span className="text-blue-600 text-xs font-extrabold tracking-wider">{userInitials}</span>
                      </div>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {mobileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 flex flex-col"
                    >
                      <Link href={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <LayoutDashboard size={16} />
                        Dashboard
                      </Link>
                      {role === "student" && (
                        <Link href="/student/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <User size={16} />
                          User Profile
                        </Link>
                      )}
                      {role === "faculty" && (
                        <Link href="/faculty/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <User size={16} />
                          Faculty Profile
                        </Link>
                      )}
                      <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Settings size={16} />
                        Settings
                      </Link>
                      <div className="h-px bg-slate-100 my-1 mx-2"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {/* Mobile Menu Toggle */}
            {!user && (
              <button
                className="text-slate-900 p-2"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={28} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-[70vw] sm:w-[60vw] bg-white z-[70] md:hidden shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <Image src="/logo.jpeg" alt="Vision Academy Logo" width={32} height={32} className="object-contain" />
                  </div>
                  <span
                    className="text-lg font-bold text-brand-blue"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    Vision Academy
                  </span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col p-4 overflow-y-auto">
                {navLinks.map((link, index) => (
                  <div key={link.name}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block font-medium px-4 py-3 rounded-xl transition-all ${isActive(link.href)
                        ? "text-brand-orange bg-orange-50 font-bold"
                        : "text-slate-700 hover:text-brand-orange hover:bg-slate-50"
                        }`}
                    >
                      {link.name}
                    </Link>
                    {index < navLinks.length - 1 && (
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                    )}
                  </div>
                ))}
                
                {!user && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="gradient" className="w-full justify-center">
                        <LogIn size={18} className="mr-2" />
                        Login
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </header>
  );
}
