"use client";

import { useState, useEffect, use } from "react";
import { collection, query, where, getDocs, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save, FileText, CheckCircle, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface TheoryTest {
  id: string;
  testName: string;
  batch: string;
  subject: string;
  date: string;
  description: string | null;
  totalMarks: number;
}

interface Student {
  id: string;
  name: string;
  mobile: string;
}

export default function TheoryTestMarksPage({ params }: { params: Promise<{ batchId: string, testId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const batchName = decodeURIComponent(resolvedParams.batchId);
  const testId = resolvedParams.testId;

  const [test, setTest] = useState<TheoryTest | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch test details
        const testDoc = await getDoc(doc(db, "theoryTests", testId));
        if (!testDoc.exists()) {
          toast.error("Test not found");
          router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}/theory`);
          return;
        }
        setTest({ id: testDoc.id, ...testDoc.data() } as TheoryTest);

        // Fetch students in this batch
        const studentsQuery = query(
          collection(db, "students"),
          where("batch", "==", batchName)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          mobile: doc.data().mobile
        })) as Student[];
        
        // Sort students alphabetically
        studentsData.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(studentsData);

        // Fetch existing marks
        const marksQuery = query(
          collection(db, "theoryMarks"),
          where("testId", "==", testId)
        );
        const marksSnapshot = await getDocs(marksQuery);
        const existingMarks: Record<string, string> = {};
        marksSnapshot.forEach(doc => {
          const data = doc.data();
          existingMarks[data.studentId] = data.marksObtained.toString();
        });
        setMarks(existingMarks);
        
        if (Object.keys(existingMarks).length > 0) {
          setIsEditing(false);
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load test data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [batchName, testId, router]);

  const handleMarkChange = (studentId: string, value: string) => {
    // Basic validation to prevent entering more than total marks
    if (value !== "" && test && Number(value) > test.totalMarks) {
      toast.error(`Marks cannot exceed ${test.totalMarks}`);
      return;
    }
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveAll = async () => {
    if (!test) return;
    setSaving(true);
    
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      students.forEach(student => {
        const markValue = marks[student.id];
        
        // Only save if a mark is entered
        if (markValue !== undefined && markValue !== "") {
          const docId = `${testId}_${student.id}`;
          const docRef = doc(collection(db, "theoryMarks"), docId);
          
          batch.set(docRef, {
            testId: testId,
            studentId: student.id,
            batch: batchName,
            marksObtained: Number(markValue),
            testName: test.testName,
            subject: test.subject,
            date: test.date,
            totalMarks: test.totalMarks,
            createdAt: timestamp
          });
        }
      });

      await batch.commit();
      toast.success("Marks saved successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving marks:", error);
      toast.error("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      <button 
        onClick={() => router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}/theory`)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Theory Tests
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-brand-blue/5 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{test.testName}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">{test.subject}</span>
              <span>•</span>
              <span>{new Date(test.date).toLocaleDateString()}</span>
              <span>•</span>
              <span className="font-bold text-brand-orange">Total Marks: {test.totalMarks}</span>
            </div>
            {test.description && (
              <p className="mt-2 text-sm text-slate-600">{test.description}</p>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <Button variant="gradient" onClick={handleSaveAll} disabled={saving}>
            {saving ? "Saving..." : (
              <>
                <Save size={18} className="mr-2" />
                Save All Marks
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit size={18} className="mr-2" />
            Edit Marks
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Enter Student Marks</h2>
          <span className="text-sm text-slate-500">{students.length} Students in batch</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {students.map((student, index) => {
            const currentMark = marks[student.id] || "";
            const isSaved = currentMark !== "";
            
            return (
              <div key={student.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 font-mono text-sm w-6">{index + 1}.</span>
                  <div>
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.mobile}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {isSaved && (
                    <span className="text-green-500 flex items-center text-xs font-medium">
                      <CheckCircle size={14} className="mr-1" /> Entered
                    </span>
                  )}
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={test.totalMarks}
                      value={currentMark}
                      onChange={(e) => handleMarkChange(student.id, e.target.value)}
                      placeholder="--"
                      disabled={!isEditing}
                      className={`w-24 px-3 py-2 text-center text-lg font-bold bg-white border border-slate-200 rounded-lg outline-none transition-all ${isEditing ? "focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue" : "opacity-70 bg-slate-50 cursor-not-allowed"}`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-sm">
                      / {test.totalMarks}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {students.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No students found in this batch.
            </div>
          )}
        </div>
      </div>
      
      {students.length > 0 && (
        <div className="flex justify-end sticky bottom-6">
          <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200">
            {isEditing ? (
              <Button variant="gradient" onClick={handleSaveAll} disabled={saving} className="px-8 shadow-lg shadow-brand-blue/20">
                {saving ? "Saving..." : "Save All Marks"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="px-8 shadow-lg">
                Edit Marks
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
