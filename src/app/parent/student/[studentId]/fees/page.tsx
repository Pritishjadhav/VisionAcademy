"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, IndianRupee, Calendar as CalendarIcon, FileText } from "lucide-react";
import Link from "next/link";

interface FeePayment {
  id?: string;
  studentId: string;
  amount: number;
  date: string;
  receiptNo: string;
  remarks: string;
  createdAt?: string;
}

export default function StudentFeesPage() {
  const { studentId } = useParams() as { studentId: string };
  const router = useRouter();
  const { user, dbUser } = useAuth();

  const [studentName, setStudentName] = useState("");
  const [totalFees, setTotalFees] = useState(0);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !dbUser || !studentId) return;

    if (!(dbUser.studentIds as string[])?.includes(studentId)) {
      router.replace("/parent/dashboard");
      return;
    }

    getDoc(doc(db, "students", studentId)).then(stuSnap => {
      if (stuSnap.exists()) {
        const data = stuSnap.data();
        setStudentName(data.name);
        setTotalFees(data.totalFees || 0);
      }
    });

    const feesQ = query(
      collection(db, "feePayments"),
      where("studentId", "==", studentId)
    );

    const unsubscribe = onSnapshot(feesQ, (feesSnap) => {
      const fetchedFees: FeePayment[] = [];
      feesSnap.forEach((doc) => {
        fetchedFees.push({ id: doc.id, ...doc.data() } as FeePayment);
      });
      fetchedFees.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFeePayments(fetchedFees);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId, user, dbUser, router]);

  if (loading) {
    return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  const totalPaid = feePayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingFees = Math.max(0, totalFees - totalPaid);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href={`/parent/student/${studentId}`}>
          <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fees Summary</h1>
          <p className="text-slate-500">{studentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Fees</p>
          <p className="text-3xl font-bold text-slate-900">₹{totalFees.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">Paid</p>
          <p className="text-3xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">Remaining</p>
          <p className="text-3xl font-bold text-brand-orange">₹{remainingFees.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <IndianRupee className="text-brand-blue" strokeWidth={3} />
          Payment History
        </h2>
        {feePayments.length === 0 ? (
          <div className="text-center text-slate-500 py-12 border border-dashed border-slate-200 rounded-xl">
            No payment records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feePayments.map((payment) => (
              <div key={payment.id} className="p-5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-xl">
                      <IndianRupee size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xl">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <CalendarIcon size={14} />
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {payment.receiptNo && (
                    <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-xs font-semibold rounded-lg flex items-center gap-1">
                      <FileText size={12} />
                      {payment.receiptNo}
                    </span>
                  )}
                </div>
                {payment.remarks && (
                  <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                    {payment.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
