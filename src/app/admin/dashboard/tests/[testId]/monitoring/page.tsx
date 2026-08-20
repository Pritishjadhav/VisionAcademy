"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, deleteDoc, setDoc, addDoc, serverTimestamp, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ShieldAlert, AlertTriangle, RefreshCw, PlayCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function AdminMonitoringPage() {
  const { testId } = useParams() as { testId: string };
  const { user, dbUser } = useAuth();
  const router = useRouter();

  const [testName, setTestName] = useState("");
  const [attempts, setAttempts] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    if (!testId) return;

    setLoading(true);
    
    // Fetch test name once
    getDoc(doc(db, "tests", testId)).then(testSnap => {
      if (testSnap.exists()) {
        setTestName(testSnap.data().testName);
      }
    });

    const attQ = query(collection(db, "testAttempts"), where("testId", "==", testId));
    const unsubscribeAttempts = onSnapshot(attQ, async (snap) => {
      const attData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Fetch missing students
      setStudents(prevStudents => {
        const fetchMissing = async () => {
          const studentIds = Array.from(new Set(attData.map((a: any) => a.studentId)));
          const missingIds = studentIds.filter(id => !prevStudents[id]);
          
          if (missingIds.length > 0) {
            const stuMap = { ...prevStudents };
            const chunks = [];
            for (let i = 0; i < missingIds.length; i += 10) {
              chunks.push(missingIds.slice(i, i + 10));
            }
            for (const chunk of chunks) {
              const sQ = query(collection(db, "students"), where("__name__", "in", chunk));
              const sSnap = await getDocs(sQ);
              sSnap.forEach(d => {
                stuMap[d.id] = d.data();
              });
            }
            setStudents(stuMap);
          }
        };
        fetchMissing();
        return prevStudents;
      });

      setAttempts(attData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Failed to load monitoring data");
      setLoading(false);
    });

    const violQ = query(collection(db, "violationLogs"), where("testId", "==", testId));
    const unsubscribeViolations = onSnapshot(violQ, (snap) => {
      const violData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setViolations(violData);
    });

    return () => {
      unsubscribeAttempts();
      unsubscribeViolations();
    };
  }, [testId]);

  const handleResumeTest = async (type: 'Continue' | 'Restart') => {
    if (!selectedStudent || !user || !dbUser) return;
    setIsResuming(true);
    const sid = selectedStudent.studentId;

    try {
      // 1. Delete the Result doc if it exists
      const resQ = query(collection(db, "results"), where("testId", "==", testId), where("studentId", "==", sid));
      const resSnap = await getDocs(resQ);
      for (const d of resSnap.docs) {
        await deleteDoc(doc(db, "results", d.id));
      }

      // 2. Delete StudentAnswers doc if it exists
      const ansQ = query(collection(db, "studentAnswers"), where("testId", "==", testId), where("studentId", "==", sid));
      const ansSnap = await getDocs(ansQ);
      for (const d of ansSnap.docs) {
        await deleteDoc(doc(db, "studentAnswers", d.id));
      }

      if (type === 'Continue') {
        // Update testAttempt to active
        await setDoc(doc(db, "testAttempts", `${testId}_${sid}`), {
          status: 'active'
        }, { merge: true });
      } else if (type === 'Restart') {
        // Delete testAttempt and activeSessions completely
        await deleteDoc(doc(db, "testAttempts", `${testId}_${sid}`));
        await deleteDoc(doc(db, "activeSessions", `${testId}_${sid}`));
      }

      // 3. Log Resume Action
      await addDoc(collection(db, "resumeHistory"), {
        studentId: sid,
        studentName: students[sid]?.name || sid,
        testId,
        testName,
        resumeType: type,
        adminId: user.uid,
        adminName: dbUser.name || 'Admin',
        previousStatus: selectedStudent.status,
        timestamp: new Date().toISOString()
      });

      toast.success(`Test access restored (${type}). The student can now re-enter the test.`);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Resume error:", error);
      toast.error("Failed to restore test access.");
    } finally {
      setIsResuming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/tests">
          <Button variant="outline" className="p-2 h-auto text-slate-500 hover:text-slate-700">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-red-600" />
            Security & Monitoring
          </h1>
          <p className="text-slate-500">{testName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active & Submitted Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-900">Student Sessions</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            {loading ? (
              <p className="text-center text-slate-500 my-4">Loading sessions...</p>
            ) : attempts.length === 0 ? (
              <p className="text-center text-slate-500 my-4">No test sessions found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-2">Student Name</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map(att => (
                    <tr key={att.id}>
                      <td className="py-3 font-medium text-slate-900">
                        {students[att.studentId]?.name || att.studentId}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${att.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            att.status === 'auto-submitted' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                          }`}>
                          {att.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        {att.status !== 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5 px-2"
                            onClick={() => setSelectedStudent(att)}
                          >
                            Restore Access
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Violation Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={18} />
            <h3 className="font-bold text-red-900">Recent Violations</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            {loading ? (
              <p className="text-center text-slate-500 my-4">Loading violations...</p>
            ) : violations.length === 0 ? (
              <p className="text-center text-slate-500 my-4">No violations recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-2">Student</th>
                    <th className="pb-2">Violation</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {violations.map(viol => (
                    <tr key={viol.id}>
                      <td className="py-3 font-medium text-slate-900">
                        {viol.studentName || viol.studentId}
                      </td>
                      <td className="py-3 text-red-600 font-medium">
                        {viol.violationReason}
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {new Date(viol.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Resume Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg">Restore Test Access</h3>
              <p className="text-sm text-slate-500 mt-1">
                For {students[selectedStudent.studentId]?.name}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                <strong>Continue Test:</strong> Restores their previously saved answers and remaining time.
              </div>
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                <strong>Restart Test:</strong> Deletes their saved answers and remaining time. They will start from scratch.
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <Button variant="outline" onClick={() => setSelectedStudent(null)} disabled={isResuming}>
                Cancel
              </Button>
              <Button
                onClick={() => handleResumeTest('Restart')}
                disabled={isResuming}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Restart Test
              </Button>
              <Button
                onClick={() => handleResumeTest('Continue')}
                disabled={isResuming}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white"
              >
                {isResuming ? <Loader2 className="animate-spin mr-2" size={16} /> : <PlayCircle className="mr-2" size={16} />}
                Continue Test
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
