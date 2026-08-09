"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Test, TestResult } from "@/lib/types/test";
import { 
  Loader2, ArrowLeft, Trophy, BarChart, CheckCircle2, Clock, 
  Calendar, FileText, User, XCircle, Calendar as CalendarIcon, DollarSign
} from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from "date-fns";

interface ExtendedTestResult extends TestResult {
  testDetails: Test;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late";
}

interface TheoryMark {
  id: string;
  testId: string;
  testName: string;
  subject: string;
  date: string;
  totalMarks: number;
  marksObtained: number;
  createdAt: string;
}

interface FeePayment {
  id?: string;
  studentId: string;
  amount: number;
  date: string;
  receiptNo: string;
  remarks: string;
  createdAt?: string;
}

export default function StudentDetailsPage() {
  const { studentId } = useParams() as { studentId: string };
  const router = useRouter();
  const { user, dbUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"attendance" | "tests" | "theory" | "fees">("attendance");
  const [studentName, setStudentName] = useState("");
  const [studentBatch, setStudentBatch] = useState("");
  const [totalFees, setTotalFees] = useState(0);
  const [results, setResults] = useState<ExtendedTestResult[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [theoryMarks, setTheoryMarks] = useState<TheoryMark[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !dbUser || !studentId) {
      if (!studentId) router.replace("/parent/dashboard");
      return;
    }
    
    // Verify authorization
    if (!(dbUser.studentIds as string[])?.includes(studentId)) {
      router.replace("/parent/dashboard");
      return;
    }

    // Get student info once
    getDoc(doc(db, "students", studentId)).then(stuSnap => {
      if (stuSnap.exists()) {
        const data = stuSnap.data();
        setStudentName(data.name);
        setStudentBatch(data.batch);
        setTotalFees(data.totalFees || 0);
      }
    });

    // Real-time listener for results
    const resQ = query(
      collection(db, "results"), 
      where("studentId", "==", studentId)
    );
    
    const unsubscribeResults = onSnapshot(resQ, async (resSnap) => {
      try {
        const sortedDocs = [...resSnap.docs].sort((a, b) => {
          const aData = a.data() as TestResult;
          const bData = b.data() as TestResult;
          return new Date(aData.createdAt).getTime() - new Date(bData.createdAt).getTime();
        });
        
        // Deduplicate by testId (keep the latest one)
        const latestResults = new Map<string, any>();
        for (const rDoc of sortedDocs) {
          latestResults.set(rDoc.data().testId, { id: rDoc.id, ...rDoc.data() });
        }
        
        const extResults: ExtendedTestResult[] = [];
        
        for (const rData of Array.from(latestResults.values())) {
          // Fetch test info
          const tSnap = await getDoc(doc(db, "tests", rData.testId));
          if (tSnap.exists()) {
            extResults.push({ ...rData, testDetails: { id: tSnap.id, ...tSnap.data() } as Test } as ExtendedTestResult);
          }
        }
        
        setResults(extResults);
      } catch (error) {
        console.error("Error processing results:", error);
      }
    });

    // Real-time listener for attendance
    const attQ = query(
      collection(db, "attendance"),
      where("studentId", "==", studentId)
    );
    
    const unsubscribeAttendance = onSnapshot(attQ, (attSnap) => {
      const fetchedRecords: AttendanceRecord[] = [];
      attSnap.forEach((doc) => {
        fetchedRecords.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      // Sort by date descending
      fetchedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAttendance(fetchedRecords);
      setLoading(false); // set loading false once attendance loads (or both load)
    });

    // Real-time listener for theory marks
    const theoryQ = query(
      collection(db, "theoryMarks"),
      where("studentId", "==", studentId)
    );
    
    const unsubscribeTheory = onSnapshot(theoryQ, (theorySnap) => {
      const fetchedMarks: TheoryMark[] = [];
      theorySnap.forEach((doc) => {
        fetchedMarks.push({ id: doc.id, ...doc.data() } as TheoryMark);
      });
      // Sort by date descending
      fetchedMarks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTheoryMarks(fetchedMarks);
    });
    
    // Real-time listener for fee payments
    const feesQ = query(
      collection(db, "feePayments"),
      where("studentId", "==", studentId)
    );

    const unsubscribeFees = onSnapshot(feesQ, (feesSnap) => {
      const fetchedFees: FeePayment[] = [];
      feesSnap.forEach((doc) => {
        fetchedFees.push({ id: doc.id, ...doc.data() } as FeePayment);
      });
      // Sort by date descending
      fetchedFees.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFeePayments(fetchedFees);
    });

    return () => {
      unsubscribeResults();
      unsubscribeAttendance();
      unsubscribeTheory();
      unsubscribeFees();
    };
  }, [studentId, user, dbUser, router]);

  if (loading) {
    return <div className="flex justify-center min-h-[70vh] items-center"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  // Derived Attendance Stats
  const totalClasses = attendance.length;
  const presentCount = attendance.filter(r => r.status === "present" || r.status === "late").length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  // Derived Test Stats
  const chartData = results.map(r => ({
    name: r.testDetails.testName,
    percentage: r.percentage,
    accuracy: r.overallAccuracy
  }));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const totalPaid = feePayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingFees = Math.max(0, totalFees - totalPaid);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/parent/dashboard">
          <button className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{studentName || 'Student Details'}</h1>
          <p className="text-slate-500">Batch: {studentBatch || 'N/A'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
            activeTab === "attendance" ? "text-brand-blue" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Attendance
          {activeTab === "attendance" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("tests")}
          className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
            activeTab === "tests" ? "text-brand-blue" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Online Tests & Results
          {activeTab === "tests" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("theory")}
          className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
            activeTab === "theory" ? "text-brand-blue" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Theory Marks
          {activeTab === "theory" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("fees")}
          className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
            activeTab === "fees" ? "text-brand-blue" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Fees
          {activeTab === "fees" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Classes</p>
              <p className="text-4xl font-bold text-slate-900">{totalClasses}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">Present/Late</p>
              <p className="text-4xl font-bold text-green-700">{presentCount}</p>
            </div>
            <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10 flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-brand-blue uppercase tracking-wider mb-2">Attendance</p>
              <p className="text-4xl font-bold text-brand-blue">{attendancePercentage}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Attendance History</h2>
            {attendance.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                No attendance records found for this student.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="text-slate-400" size={18} />
                      <span className="font-medium text-slate-700">
                        {new Date(record.date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    
                    {record.status === "present" && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        <CheckCircle2 size={14} /> Present
                      </span>
                    )}
                    {record.status === "absent" && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                        <XCircle size={14} /> Absent
                      </span>
                    )}
                    {record.status === "late" && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                        <Clock size={14} /> Late
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "tests" && (
        <div className="space-y-8">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Recent Test Results</h2>
                <div className="grid grid-cols-1 gap-4">
                  {results.map((result) => (
                    <div key={result.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">{result.testDetails.testName}</h3>
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {format(new Date(result.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {formatTime(result.timeTaken)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 md:border-l md:border-slate-100 md:pl-6 shrink-0">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand-blue">{result.marksObtained}</div>
                          <div className="text-xs font-medium text-slate-500">Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{Math.round(result.percentage)}%</div>
                          <div className="text-xs font-medium text-slate-500">Percentage</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Performance Trend</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="percentage" name="Score %" stroke="#0047FF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">No Tests Completed</h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                {studentName} hasn&apos;t completed any online tests yet. When they do, their results and performance analytics will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "theory" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Theory Marks</h2>
          {theoryMarks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
              No theory marks found for this student.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm font-medium border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-6">Test Name</th>
                      <th className="py-4 px-6">Subject</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6 text-right">Marks Obtained</th>
                      <th className="py-4 px-6 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {theoryMarks.map(mark => {
                      const percentage = Math.round((mark.marksObtained / mark.totalMarks) * 100);
                      return (
                        <tr key={mark.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-900">{mark.testName}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                              {mark.subject}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {new Date(mark.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-right font-medium">
                            <span className="text-slate-900">{mark.marksObtained}</span>
                            <span className="text-slate-400"> / {mark.totalMarks}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold ${
                              percentage >= 75 ? 'bg-green-50 text-green-700' :
                              percentage >= 60 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "fees" && (
        <div className="space-y-6">
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
              <DollarSign className="text-brand-blue" />
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
                          <DollarSign size={20} />
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
      )}
    </div>
  );
}
