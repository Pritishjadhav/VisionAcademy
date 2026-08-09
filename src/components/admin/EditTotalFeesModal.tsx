"use client";

import { useState, useEffect } from "react";
import { X, DollarSign } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface EditTotalFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  currentTotalFees?: number;
  onSuccess: (newTotal: number) => void;
}

export function EditTotalFeesModal({ isOpen, onClose, studentId, studentName, currentTotalFees, onSuccess }: EditTotalFeesModalProps) {
  const [loading, setLoading] = useState(false);
  const [totalFees, setTotalFees] = useState(currentTotalFees?.toString() || "");

  useEffect(() => {
    if (isOpen) {
      setTotalFees(currentTotalFees?.toString() || "");
    }
  }, [isOpen, currentTotalFees]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(totalFees);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, "students", studentId);
      await updateDoc(docRef, {
        totalFees: amount
      });
      
      toast.success("Total fees updated successfully");
      onSuccess(amount);
      onClose();
    } catch (error) {
      console.error("Error updating total fees:", error);
      toast.error("Failed to update total fees");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Set Total Fees</h2>
            <p className="text-sm text-slate-500">For {studentName}</p>
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
            <label className="text-sm font-medium text-slate-700">Total Fees Amount (₹) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign size={18} />
              </div>
              <input
                type="number"
                required
                min="0"
                value={totalFees}
                onChange={(e) => setTotalFees(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                placeholder="e.g. 50000"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Saving..." : "Save Total Fees"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
