"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const BATCHES = [
  "11th IIT-JEE Integrated",
  "12th IIT-JEE Integrated",
  "11th NEET Integrated",
  "12th NEET Integrated"
];

export default function ScheduleTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    testName: "",
    description: "",
    batch: BATCHES[0],
    testDate: "",
    startTime: "",
    endTime: "",
    totalMarks: 0,
    passingMarks: 0,
    negativeMarkingEnabled: true,
    marksPerCorrectAnswer: 4,
    marksPerWrongAnswer: 1,
    instructions: "Please read all instructions carefully before starting the test."
  });

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    
    return endMins > startMins ? endMins - startMins : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const duration = calculateDuration();
    if (duration <= 0) {
      toast.error("End time must be after start time");
      return;
    }

    setLoading(true);
    try {
      const testRef = await addDoc(collection(db, "tests"), {
        ...formData,
        totalDuration: duration,
        status: "Draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      toast.success("Test scheduled successfully!");
      router.push(`/admin/dashboard/tests/${testRef.id}/questions`);
    } catch (error) {
      console.error("Error scheduling test:", error);
      toast.error("Failed to schedule test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/tests">
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Schedule New Test</h1>
          <p className="text-slate-500">Fill in the details to create a new online test.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        {/* Basic Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Test Name *</label>
              <input 
                type="text" 
                required 
                value={formData.testName}
                onChange={e => setFormData(prev => ({ ...prev, testName: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                placeholder="e.g., Weekly Mock Test - 1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Batch *</label>
              <select 
                value={formData.batch}
                onChange={e => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              >
                {BATCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all min-h-[80px]"
                placeholder="Brief description of the test content..."
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">Schedule & Timing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Test Date *</label>
              <input 
                type="date" 
                required 
                value={formData.testDate}
                onChange={e => setFormData(prev => ({ ...prev, testDate: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Start Time *</label>
              <input 
                type="time" 
                required 
                value={formData.startTime}
                onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">End Time *</label>
              <input 
                type="time" 
                required 
                value={formData.endTime}
                onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
            <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-sm text-slate-600">Calculated Duration: </span>
              <span className="font-bold text-brand-blue">{calculateDuration()} Minutes</span>
            </div>
          </div>
        </div>

        {/* Marking Scheme */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">Marking Scheme</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Total Marks *</label>
              <input 
                type="number" 
                required 
                min="1"
                value={formData.totalMarks}
                onChange={e => setFormData(prev => ({ ...prev, totalMarks: Number(e.target.value) }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Passing Marks *</label>
              <input 
                type="number" 
                required 
                min="0"
                value={formData.passingMarks}
                onChange={e => setFormData(prev => ({ ...prev, passingMarks: Number(e.target.value) }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
            
            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.negativeMarkingEnabled}
                  onChange={e => setFormData(prev => ({ ...prev, negativeMarkingEnabled: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-sm font-medium text-slate-700">Enable Negative Marking</span>
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Marks for Correct Answer</label>
              <input 
                type="number" 
                min="1"
                value={formData.marksPerCorrectAnswer}
                onChange={e => setFormData(prev => ({ ...prev, marksPerCorrectAnswer: Number(e.target.value) }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Negative Marks for Wrong Answer</label>
              <input 
                type="number" 
                min="0"
                disabled={!formData.negativeMarkingEnabled}
                value={formData.marksPerWrongAnswer}
                onChange={e => setFormData(prev => ({ ...prev, marksPerWrongAnswer: Number(e.target.value) }))}
                className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all ${!formData.negativeMarkingEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">Instructions</h2>
          <div className="space-y-2">
            <textarea 
              required
              value={formData.instructions}
              onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all min-h-[120px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button 
            type="submit" 
            variant="gradient" 
            disabled={loading}
            className="px-8"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {loading ? 'Saving...' : 'Save & Add Questions'}
          </Button>
        </div>
      </form>
    </div>
  );
}
