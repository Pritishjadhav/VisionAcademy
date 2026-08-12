"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export function FacultyLoginForm({ onBack, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot_password">("login");
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login Successful! Redirecting to your dashboard...");
      onSuccess();
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message || "Failed to login");
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      setResetSent(true);
    } catch (error) {
      toast.error((error as Error).message || "Failed to send reset email");
    } finally {
      setResetting(false);
    }
  };

  if (mode === "forgot_password") {
    return (
      <div className="w-full">
        <button 
          onClick={() => {
            setMode("login");
            setResetSent(false);
          }}
          className="flex items-center text-sm text-slate-500 hover:text-orange-500 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to login
        </button>

        <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Reset Password</h2>
        
        {resetSent ? (
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-green-800 text-sm">
              Password reset email has been sent to <strong>{email}</strong>. Please check your inbox.
            </p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    placeholder="faculty@visionacademy.com"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
                disabled={resetting}
              >
                {resetting ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <button 
        onClick={onBack}
        className="flex items-center text-sm text-slate-500 hover:text-orange-500 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to options
      </button>

      <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Faculty Login</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
              placeholder="faculty@visionacademy.com"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <button 
              type="button" 
              onClick={() => setMode("forgot_password")}
              className="text-xs text-orange-500 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
