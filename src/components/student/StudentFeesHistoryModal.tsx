"use client";

import { X, DollarSign, Calendar, FileText, FileCheck } from "lucide-react";
import { FeePayment } from "@/components/admin/FeePaymentModal";

interface StudentFeesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  feePayments: FeePayment[];
  totalFees: number;
  totalPaid: number;
  remainingFees: number;
}

export function StudentFeesHistoryModal({ 
  isOpen, 
  onClose, 
  feePayments,
  totalFees,
  totalPaid,
  remainingFees
}: StudentFeesHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="text-brand-blue" />
              Fees History
            </h2>
            <p className="text-sm text-slate-500">Detailed breakdown of payments</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium mb-1">Total</p>
              <p className="text-sm font-bold text-slate-900">₹{totalFees.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
              <p className="text-xs text-green-600/80 font-medium mb-1">Paid</p>
              <p className="text-sm font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
              <p className="text-xs text-orange-600/80 font-medium mb-1">Remaining</p>
              <p className="text-sm font-bold text-brand-orange">₹{remainingFees.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Payment Records</h3>
            {feePayments.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {feePayments.map((payment) => (
                  <div key={payment.id} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">₹{payment.amount.toLocaleString()}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(payment.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {payment.receiptNo && (
                        <div className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-brand-blue/10 text-brand-blue rounded-full">
                          <FileText size={12} />
                          {payment.receiptNo}
                        </div>
                      )}
                    </div>
                    {payment.remarks && (
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                        "{payment.remarks}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileCheck className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500">No payment records found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
