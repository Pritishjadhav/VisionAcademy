"use client";

import { useState, useEffect, use } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, FileText, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { TheoryTestFormModal } from "@/components/admin/TheoryTestFormModal";

interface TheoryTest {
  id: string;
  testName: string;
  batch: string;
  subject: string;
  date: string;
  description: string | null;
  totalMarks: number;
  createdAt: string;
}

export default function BatchTheoryTestsPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const batchName = decodeURIComponent(resolvedParams.batchId);
  const [tests, setTests] = useState<TheoryTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "theoryTests"),
      where("batch", "==", batchName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TheoryTest[];
      
      // Sort by date descending client-side to avoid needing a composite index
      testsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTests(testsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching theory tests:", error);
      toast.error("Failed to load theory tests");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [batchName]);

  const handleTestCreated = (testId: string) => {
    router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}/theory/${testId}`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
      <button 
        onClick={() => router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} /> Back to {batchName}
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Theory Marks</h1>
          <p className="text-slate-500">Manage offline test marks for {batchName}.</p>
        </div>
        
        <Button variant="gradient" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Add Theory Test
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
          Loading theory tests...
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-blue/5 text-brand-blue rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Theory Tests Found</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            There are currently no theory tests recorded for this batch. Click the button below to add one.
          </p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            Add Theory Test
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map(test => (
            <Link 
              key={test.id}
              href={`/admin/dashboard/batch/${encodeURIComponent(batchName)}/theory/${test.id}`}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-blue/30 transition-all group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/5 text-brand-blue flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div className="px-3 py-1 bg-slate-50 rounded-full text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(test.date).toLocaleDateString()}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-blue transition-colors mb-1">
                {test.testName}
              </h3>
              
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                <BookOpen size={14} />
                {test.subject}
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Total Marks: {test.totalMarks}
                </span>
                <span className="text-brand-blue flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Enter Marks <ChevronRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <TheoryTestFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batchName={batchName}
        onSuccess={handleTestCreated}
      />
    </div>
  );
}
