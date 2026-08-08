"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Phone, Lock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { checkUserExistsByMobile } from "@/actions/users";

interface Props {
  type: "student" | "parent";
  onBack: () => void;
  onSuccess: () => void;
}

export function PhoneLoginForm({ type, onBack, onSuccess }: Props) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot_send_otp" | "forgot_verify_otp" | "forgot_new_password">("login");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Initialize Recaptcha if we need to send OTP
    if (mode === "forgot_send_otp" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  }, [mode]);

  const getSyntheticEmail = (mobileStr: string) => {
    let cleanMobile = mobileStr.replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith("91") && cleanMobile.length > 10) {
      cleanMobile = cleanMobile.substring(2);
    }
    return `${cleanMobile}@visionacademy.com`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
      const userExistsResult = await checkUserExistsByMobile(formattedMobile, type as 'student' | 'parent');
      
      if (!userExistsResult.exists) {
        toast.error(`This mobile number is not registered as a ${type}.`);
        setLoading(false);
        return;
      }

      const email = userExistsResult.email || getSyntheticEmail(mobile);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login Successful! Redirecting to your dashboard...");
      onSuccess();
    } catch {
      toast.error("Invalid mobile number or password.");
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setLoading(true);
    try {
      const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
      
      const userExistsResult = await checkUserExistsByMobile(formattedMobile, type as 'student' | 'parent');
      
      if (!userExistsResult.exists) {
        toast.error(`This mobile number is not registered as a ${type}.`);
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const appVerifier = window.recaptchaVerifier as any;
      const result = await signInWithPhoneNumber(auth, formattedMobile, appVerifier);
      setConfirmationResult(result);
      setMode("forgot_verify_otp");
      toast.success("OTP sent successfully!");
    } catch (error) {
      toast.error((error as Error).message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || otp.length !== 6) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast.success("OTP Verified. Please create a new password.");
      setMode("forgot_new_password");
    } catch (error) {
      toast.error((error as Error).message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success("Password updated successfully! You are now logged in.");
        onSuccess();
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button 
        onClick={() => {
          if (mode === "login") onBack();
          else setMode("login");
        }}
        className="flex items-center text-sm text-slate-500 hover:text-brand-blue mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        {mode === "login" ? "Back to options" : "Back to login"}
      </button>

      <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center capitalize">
        {mode === "login" ? `${type} Login` : "Reset Password"}
      </h2>

      <div id="recaptcha-container"></div>

      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Mobile Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                placeholder="10-digit mobile number"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <button 
                type="button" 
                onClick={() => setMode("forgot_send_otp")}
                className="text-xs text-brand-blue hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-6" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      )}

      {mode === "forgot_send_otp" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Registered Mobile Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                placeholder="10-digit mobile number"
                required
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full mt-6" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>
      )}

      {mode === "forgot_verify_otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Enter OTP</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck size={18} />
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full mt-6" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>
      )}

      {mode === "forgot_new_password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full mt-6" disabled={loading}>
            {loading ? "Saving..." : "Save Password & Login"}
          </Button>
        </form>
      )}
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: unknown;
  }
}
