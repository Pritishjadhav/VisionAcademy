"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Plus, FileText, Calendar, Users, BarChart, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { Test } from "@/lib/types/test";
import { format } from "date-fns";
import { Suspense } from "react";

function AdminTestsContent() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const batchFilter = searchParams.get("batch");

  useEffect(() => {
    const q = query(collection(db, "tests"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Test[];

      if (batchFilter) {
        data = data.filter(t => t.batch === batchFilter);
      }

      setTests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test? All questions and student results will be permanently removed. This action cannot be undone.")) return;
    
    try {
      const { deleteTest } = await import("@/actions/tests");
      const result = await deleteTest(testId);
      if (result.success) {
        toast.success("Test completely deleted.");
      } else {
        toast.error(result.error || "Failed to delete test.");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the test.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {batchFilter ? `${batchFilter} - Online Tests` : "Online Tests"}
          </h1>
          <p className="text-slate-500">Manage all online tests and view analytics.</p>
        </div>
        <Link href={batchFilter ? `/admin/dashboard/tests/schedule?batch=${encodeURIComponent(batchFilter)}` : "/admin/dashboard/tests/schedule"}>
          <Button variant="gradient">
            <Plus size={18} />
            Schedule New Test
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
          Loading tests...
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-blue/5 rounded-full flex items-center justify-center text-brand-blue mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No tests scheduled yet</h3>
          <p className="text-slate-500 mb-6 max-w-md">Create your first online test to start evaluating students.</p>
          <Link href={batchFilter ? `/admin/dashboard/tests/schedule?batch=${encodeURIComponent(batchFilter)}` : "/admin/dashboard/tests/schedule"}>
            <Button variant="outline" className="border-brand-blue text-brand-blue">
              Schedule Test
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map(test => (
            <div key={test.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className={`h-2 ${test.status === 'Published' ? 'bg-green-500' : 'bg-slate-300'}`} />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 line-clamp-1" title={test.testName}>{test.testName}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${test.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {test.status}
                      </span>
                      <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded-full border border-slate-100">
                        {test.batch}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteTest(test.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ml-2 shrink-0"
                    title="Delete Test"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <Calendar size={16} className="text-brand-orange" />
                    <span>{format(new Date(test.testDate), 'MMM dd, yyyy')} • {test.startTime} - {test.endTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <FileText size={16} className="text-brand-blue" />
                    <span>{test.totalMarks} Marks • {test.totalDuration} Mins</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-auto">
                  <Link href={`/admin/dashboard/tests/${test.id}/questions`}>
                    <Button variant="outline" className="w-full text-xs py-1.5 h-auto bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 px-1">
                      <FileText size={14} className="mr-1" /> Qs
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/tests/${test.id}/results`}>
                    <Button variant="outline" className="w-full text-xs py-1.5 h-auto bg-brand-blue/5 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/10 px-1">
                      <BarChart size={14} className="mr-1" /> Results
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/tests/${test.id}/monitoring`}>
                    <Button variant="outline" className="w-full text-xs py-1.5 h-auto bg-red-50 border-red-200 text-red-600 hover:bg-red-100 px-1">
                      <ShieldAlert size={14} className="mr-1" /> Monitor
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <AdminTestsContent />
    </Suspense>
  );
}
