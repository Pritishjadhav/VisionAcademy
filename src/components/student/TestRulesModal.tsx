"use client";

import { useState } from "react";
import { X, ShieldAlert, CheckSquare, Square, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface TestRulesModalProps {
  testId: string;
  testName: string;
  studentId: string;
  onClose: () => void;
}

export function TestRulesModal({ testId, testName, studentId, onClose }: TestRulesModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  const handleStartTest = async () => {
    if (!agreed) return;
    setStarting(true);
    
    try {
      // 1. Generate unique session ID and get persistent device ID
      const sessionId = crypto.randomUUID();
      let deviceId = localStorage.getItem('vision_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('vision_device_id', deviceId);
      }
      
      // 2. Parse device info
      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const deviceType = isMobile ? 'Mobile' : 'Desktop';
      const deviceInfo = {
        userAgent: ua,
        deviceType,
        timestamp: new Date().toISOString()
      };

      // 3. Enforce single-device rule (Check activeSessions)
      const sessionDocRef = doc(db, "activeSessions", `${testId}_${studentId}`);
      const sessionSnap = await getDoc(sessionDocRef);
      
      if (sessionSnap.exists()) {
        const activeData = sessionSnap.data();
        // If an active session exists on a DIFFERENT device, block entry
        if (activeData.deviceId && activeData.deviceId !== deviceId) {
          toast.error("This test is already active on another device.");
          setStarting(false);
          return;
        }
      }

      // 4. Bind session to this device
      await setDoc(sessionDocRef, {
        studentId,
        testId,
        sessionId,
        deviceId,
        deviceInfo,
        lastHeartbeat: serverTimestamp()
      });

      // 5. Redirect to live test with session ID
      router.push(`/student/tests/${testId}/live?sessionId=${sessionId}`);

    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Failed to start the test. Please check your connection.");
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Secure Test Mode</h2>
              <p className="text-sm text-slate-500">You are about to start: <span className="font-semibold">{testName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-orange-50 border border-brand-orange/20 rounded-xl p-4 mb-6 flex gap-3">
            <AlertTriangle className="text-brand-orange shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-orange-800 leading-relaxed">
              This is a strictly monitored <strong>JEE/NEET-style Secure Test</strong>. Any violation of the rules below will result in <strong>immediate and automatic submission</strong> of your test. Please read carefully before proceeding.
            </p>
          </div>

          <h3 className="font-bold text-slate-900 mb-4 text-lg">Test Rules & Guidelines</h3>
          <ul className="space-y-3 mb-8">
            {[
              "Do not refresh the page (F5 or browser refresh button).",
              "Do not switch tabs or open new browser windows.",
              "Do not minimize or close the browser.",
              "Do not use Copy, Cut, or Paste functionality.",
              "Do not use Right-Click.",
              "Do not open Developer Tools.",
              "Mobile Users: You must remain inside the browser. Switching to other apps (WhatsApp, Calculator, etc.), pressing the Home button, or locking your phone will auto-submit the test."
            ].map((rule, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-700 items-start">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>

          <div 
            className={`p-4 rounded-xl border-2 transition-colors cursor-pointer flex items-start gap-3 ${agreed ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
            onClick={() => setAgreed(!agreed)}
          >
            <div className={`mt-0.5 ${agreed ? 'text-brand-blue' : 'text-slate-400'}`}>
              {agreed ? <CheckSquare size={20} /> : <Square size={20} />}
            </div>
            <div>
              <p className={`font-semibold ${agreed ? 'text-brand-blue' : 'text-slate-700'}`}>
                I agree to these rules.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                I understand that violating any of the rules will automatically end my test attempt.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={starting}>Cancel</Button>
          <Button 
            onClick={handleStartTest} 
            disabled={!agreed || starting}
            className={agreed ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {starting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            {starting ? 'Starting...' : 'Start Test Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
