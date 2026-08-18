"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Toaster } from "react-hot-toast";
import { ScrollToTop } from "./ui/ScrollToTop";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLiveTest = pathname?.includes("/live");

  return (
    <div className={`min-h-screen flex flex-col ${!isLiveTest ? "pt-20" : ""}`}>
      {!isLiveTest && <Navbar />}
      <div className="overflow-x-hidden w-full flex-grow flex flex-col">
        <main className="flex-grow">{children}</main>
        {!isLiveTest && <Footer />}
      </div>
      <Toaster position="top-center" />
      {!isLiveTest && <ScrollToTop />}
    </div>
  );
}
