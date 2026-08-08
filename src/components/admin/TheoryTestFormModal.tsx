"use client";

import { useState } from "react";
import { X, FileText, Calendar, BookOpen, Target, AlignLeft } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface TheoryTestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchName: string;
  onSuccess: (testId: string) => void;
}

export function TheoryTestFormModal({ isOpen, onClose, batchName, onSuccess }: TheoryTestFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    testName: "",
    subject: "",
    date: new Date().toISOString().split("T")[0],
    totalMarks: "100",
    description: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.testName || !formData.subject || !formData.date || !formData.totalMarks) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "theoryTests"), {
        testName: formData.testName.trim(),
        batch: batchName,
        subject: formData.subject.trim(),
        date: formData.date,
        totalMarks: Number(formData.totalMarks),
        description: formData.description.trim() || null,
        createdAt: new Date().toISOString()
      });
      
      toast.success("Theory test created successfully!");
      setFormData({
        testName: "",
        subject: "",
        date: new Date().toISOString().split("T")[0],
        totalMarks: "100",
        description: ""
      });
      onSuccess(docRef.id);
      onClose();
    } catch (error) {
      console.error("Error creating theory test:", error);
      toast.error("Failed to create theory test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Theory Test</h2>
            <p className="text-sm text-slate-500">Batch: {batchName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Test Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText size={18} />
              </div>
              <input
                type="text"
                required
                value={formData.testName}
                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                placeholder="e.g. Mid-Term Physics Exam"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Subject *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <BookOpen size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                  placeholder="e.g. Physics"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Total Marks *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Target size={18} />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Date Conducted *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 pointer-events-none text-slate-400">
                <AlignLeft size={18} />
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all min-h-[100px] resize-y"
                placeholder="Any additional details about this test..."
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={loading}>
              {loading ? "Creating..." : "Create & Enter Marks"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
