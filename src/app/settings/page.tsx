"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500">Manage your profile and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {/* Navigation/Sidebar could go here later */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Security</h3>
            <ul className="space-y-2">
              <li className="px-4 py-2 bg-brand-blue/5 text-brand-blue font-medium rounded-lg">
                Password
              </li>
            </ul>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
