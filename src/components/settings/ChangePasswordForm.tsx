"use client";

import { useState } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";

export function ChangePasswordForm() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error((error as Error).message || "Failed to update password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0">
          <Lock size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
          <p className="text-sm text-slate-500">Update your account security</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
            required
          />
        </div>

        <Button type="submit" variant="primary" className="mt-6" disabled={loading}>
          {loading ? "Updating..." : "Save Password"}
        </Button>
      </form>
    </div>
  );
}
