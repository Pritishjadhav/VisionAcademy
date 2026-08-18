import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
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
    // Check if Firebase env vars are missing (which happens often on Vercel deployments)
    const isMissingEnvVars = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.FIREBASE_PRIVATE_KEY;

    if (isMissingEnvVars) {
        return (
            <html lang="en">
                <body className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl border-2 border-red-200">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Missing Environment Variables</h1>
                        <p className="text-slate-700 mb-4">
                            The website is failing to load because the Firebase Environment Variables are missing in your Vercel deployment.
                        </p>
                        <h2 className="font-bold text-slate-900 mb-2">How to fix this:</h2>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-700 mb-6">
                            <li>Go to your <strong>Vercel Dashboard</strong>.</li>
                            <li>Select this project, then go to <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.</li>
                            <li>Open your local <code>.env.local</code> file and copy ALL the variables.</li>
                            <li>Paste them into Vercel and click Save.</li>
                            <li>Go to the <strong>Deployments</strong> tab and click <strong>Redeploy</strong>.</li>
                        </ol>
                        <p className="text-sm text-slate-500">
                            (This error is shown deliberately to help you fix the deployment instead of just showing a blank screen or a 500 Server Error).
                        </p>
                    </div>
                </body>
            </html>
        );
    }

    return (
        <html lang="en" className={`${inter.variable} scroll-smooth antialiased`}>
            <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
                <AuthProvider>
                    <ClientLayoutWrapper>
                        {children}
                    </ClientLayoutWrapper>
                </AuthProvider>
            </body>
        </html>
    );
}
