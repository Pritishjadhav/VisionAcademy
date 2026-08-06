import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Vision Academy | Building Future Engineers & Doctors",
    description: "Premium coaching institute for IIT-JEE, NEET, and MHT-CET.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} scroll-smooth antialiased`}>
            <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pt-20">
                <AuthProvider>
                    <Navbar />
                    <div className="overflow-x-hidden w-full flex-grow flex flex-col">
                        <main className="flex-grow">
                            {children}
                        </main>
                        <Footer />
                    </div>
                    <Toaster position="top-center" />
                </AuthProvider>
            </body>
        </html>
    );
}
