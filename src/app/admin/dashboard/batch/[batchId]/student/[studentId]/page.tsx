"use client";

import { useState, useEffect, use } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, User, Phone, Mail, Calendar, BookOpen, FileText, CheckCircle, XCircle, Loader2, BarChart, DollarSign, Plus, Edit3, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { EditTotalFeesModal } from "@/components/admin/EditTotalFeesModal";
import { FeePaymentModal, FeePayment } from "@/components/admin/FeePaymentModal";

interface Student {
  id: string;
  name: string;
  mobile: string;
  parentMobile?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  batch?: string;
  totalFees?: number;
  photoURL?: string;
}

interface TestScore {
  id: string;
  testId: string;
  testName: string;
  date: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  type: "theory" | "online";
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late";
}

export default function StudentProfilePage({ params }: { params: Promise<{ batchId: string, studentId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const batchName = decodeURIComponent(resolvedParams.batchId);
  const studentId = resolvedParams.studentId;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "theory" | "online">("all");

  const [isEditFeesOpen, setIsEditFeesOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);

        // 1. Fetch Student Profile
        const studentDoc = await getDoc(doc(db, "students", studentId));
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
        } else {
          toast.error("Student not found");
          setLoading(false);
          return;
        }

        // 2. Fetch Attendance
        const attQ = query(collection(db, "attendance"), where("studentId", "==", studentId));
        const attSnap = await getDocs(attQ);
        const attData = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
        attData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendance(attData);

        // 3. Fetch Theory Marks
        const theoryQ = query(collection(db, "theoryMarks"), where("studentId", "==", studentId));
        const theorySnap = await getDocs(theoryQ);
        const theoryScores: TestScore[] = theorySnap.docs.map(d => {
          const data = d.data();
          const pct = data.totalMarks > 0 ? (data.marksObtained / data.totalMarks) * 100 : 0;
          return {
            id: d.id,
            testId: data.testId,
            testName: data.testName,
            date: data.date,
            marksObtained: data.marksObtained,
            totalMarks: data.totalMarks,
            percentage: Math.round(pct),
            type: "theory"
          };
        });

        // 4. Fetch Online Results
        const resultsQ = query(collection(db, "results"), where("studentId", "==", studentId));
        const resultsSnap = await getDocs(resultsQ);

        // For online results, we need the test names. We can fetch all tests in batch to map them.
        const testsQ = query(collection(db, "tests"), where("batch", "==", batchName));
        const testsSnap = await getDocs(testsQ);
        const testsMap: Record<string, { name: string, date: string }> = {};
        testsSnap.forEach(d => {
          const td = d.data();
          testsMap[d.id] = { name: td.testName, date: td.testDate };
        });

        const onlineScores: TestScore[] = resultsSnap.docs.map(d => {
          const data = d.data();
          const tInfo = testsMap[data.testId];
          const pct = data.totalMarks > 0 ? (data.marksObtained / data.totalMarks) * 100 : 0;
          return {
            id: d.id,
            testId: data.testId,
            testName: tInfo ? tInfo.name : "Unknown Online Test",
            date: tInfo ? tInfo.date : new Date(data.createdAt).toISOString(),
            marksObtained: data.marksObtained,
            totalMarks: data.totalMarks,
            percentage: Math.round(pct),
            type: "online"
          };
        });

        const combinedScores = [...theoryScores, ...onlineScores];
        const uniqueScoresMap = new Map<string, TestScore>();
        combinedScores.forEach(score => {
          const key = score.testName.toLowerCase().trim();
          if (!uniqueScoresMap.has(key) || uniqueScoresMap.get(key)!.percentage < score.percentage) {
            uniqueScoresMap.set(key, score);
          }
        });
        const finalScores = Array.from(uniqueScoresMap.values());
        finalScores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setScores(finalScores);

        // 5. Fetch Fee Payments
        const feesQ = query(collection(db, "feePayments"), where("studentId", "==", studentId));
        const feesSnap = await getDocs(feesQ);
        const feesData = feesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeePayment));
        feesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setFeePayments(feesData);

      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [studentId, batchName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-blue mb-4" />
          <p className="text-slate-500">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">Student Not Found</h2>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // Calculate stats
  const totalAttendance = attendance.length;
  const presentDays = attendance.filter(a => a.status === "present" || a.status === "late").length;
  const attendancePercentage = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0;

  const totalTests = scores.length;
  const avgPercentage = totalTests > 0
    ? Math.round(scores.reduce((acc, s) => acc + s.percentage, 0) / totalTests)
    : 0;

  // Filter scores based on active tab
  let displayScores = scores;
  if (activeTab === "theory") {
    displayScores = scores.filter(s => s.type === "theory");
  } else if (activeTab === "online") {
    displayScores = scores.filter(s => s.type === "online");
  }

  const totalFeesPaid = feePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalFees = student.totalFees || 0;
  const remainingFees = Math.max(0, totalFees - totalFeesPaid);

  // Prepare chart data (format date for display)
  const chartData = [...displayScores]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => ({
      name: s.testName,
      date: new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      percentage: s.percentage,
      type: s.type
    }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
      <button
        onClick={() => router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Batch
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="w-24 h-24 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center text-4xl font-bold overflow-hidden shadow-sm">
            {student.photoURL ? (
              <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              student.name.charAt(0).toUpperCase()
            )}
          </div>
          {student.photoURL && (
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = student.photoURL || "";
                link.download = `${student.name.replace(/\s+/g, "_")}_Profile_Photo.jpg`;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-xs font-semibold text-brand-blue hover:text-blue-700 bg-brand-blue/5 hover:bg-brand-blue/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
            >
              <Download size={14} /> Download Photo
            </button>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{student.name}</h1>
          <div className="flex flex-wrap gap-4 text-slate-600">
            <span className="flex items-center gap-2">
              <Phone size={16} className="text-slate-400" />
              <a href={`tel:${student.mobile}`} className="hover:text-brand-orange transition-colors">{student.mobile}</a>
            </span>
            {student.parentMobile && (
              <span className="flex items-center gap-2">
                <User size={16} className="text-slate-400" /> Parent:
                <a href={`tel:${student.parentMobile}`} className="hover:text-brand-orange transition-colors">{student.parentMobile}</a>
              </span>
            )}
            {student.email && (
              <span className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${student.email}`} className="hover:text-brand-orange transition-colors">{student.email}</a>
              </span>
            )}
            <span className="flex items-center gap-2"><BookOpen size={16} className="text-slate-400" /> {student.batch || batchName}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
          <div>
            <p className="text-sm text-slate-500 mb-1">Attendance</p>
            <p className={`text-2xl font-bold ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {totalAttendance > 0 ? `${attendancePercentage}%` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Avg Score</p>
            <p className={`text-2xl font-bold ${avgPercentage >= 75 ? 'text-brand-blue' : avgPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {totalTests > 0 ? `${avgPercentage}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Graphs & Tests */}
        <div className="lg:col-span-2 space-y-8">

          {/* Filters */}
          <div className="flex bg-white shadow-sm border border-slate-100 p-1.5 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "all" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              All Tests
            </button>
            <button
              onClick={() => setActiveTab("theory")}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === "theory" ? "bg-brand-orange text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <BookOpen size={16} /> Theory
            </button>
            <button
              onClick={() => setActiveTab("online")}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === "online" ? "bg-brand-blue text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <FileText size={16} /> Online
            </button>
          </div>

          {/* Performance Graph */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart className="text-brand-blue" />
              Performance Over Time {activeTab !== "all" && <span className="text-slate-400 text-sm font-normal">({activeTab === 'theory' ? 'Theory Only' : 'Online Only'})</span>}
            </h2>
            {displayScores.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                    />
                    <Legend iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      name="Score %"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#4f46e5", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">
                No test data available for graph
              </div>
            )}
          </div>

          {/* Test History List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="text-brand-orange" />
              Test History
            </h2>

            {displayScores.length > 0 ? (
              <div className="space-y-4">
                {[...displayScores].reverse().map(score => (
                  <div key={score.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-blue/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${score.type === 'theory' ? 'bg-orange-100 text-brand-orange' : 'bg-blue-100 text-brand-blue'
                          }`}>
                          {score.type}
                        </span>
                        <span className="text-sm text-slate-500 font-medium">
                          {new Date(score.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900">{score.testName}</h3>
                    </div>

                    <div className="flex items-center gap-6 mt-4 sm:mt-0 bg-white px-4 py-2 rounded-lg border border-slate-200">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">Marks</p>
                        <p className="font-bold text-slate-900">{score.marksObtained} <span className="text-slate-400 font-normal">/ {score.totalMarks}</span></p>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">Score</p>
                        <p className={`font-bold ${score.percentage >= 75 ? 'text-green-600' : score.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {score.percentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No tests taken yet.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Attendance */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="text-green-600" />
              Recent Attendance
            </h2>

            {attendance.length > 0 ? (
              <div className="space-y-3">
                {attendance.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">
                      {new Date(record.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    {record.status === 'present' ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium text-sm bg-green-50 px-2 py-1 rounded">
                        <CheckCircle size={14} /> Present
                      </span>
                    ) : record.status === 'late' ? (
                      <span className="flex items-center gap-1 text-yellow-600 font-medium text-sm bg-yellow-50 px-2 py-1 rounded">
                        <CheckCircle size={14} /> Late
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 font-medium text-sm bg-red-50 px-2 py-1 rounded">
                        <XCircle size={14} /> Absent
                      </span>
                    )}
                  </div>
                ))}
                {attendance.length > 10 && (
                  <p className="text-center text-xs text-slate-400 pt-2">Showing last 10 records</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No attendance records found.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="text-brand-blue" />
                Fees Management
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group">
                  <p className="text-xs text-slate-500 font-medium mb-1">Total Fees</p>
                  <p className="text-lg font-bold text-slate-900">₹{totalFees.toLocaleString()}</p>
                  <button
                    onClick={() => setIsEditFeesOpen(true)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-brand-blue bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                    title="Edit Total Fees"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Paid</p>
                  <p className="text-lg font-bold text-green-600">₹{totalFeesPaid.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-orange-600/80 font-medium mb-1">Remaining</p>
                  <p className="text-lg font-bold text-brand-orange">₹{remainingFees.toLocaleString()}</p>
                </div>
                <Button variant="gradient" size="sm" onClick={() => setIsAddPaymentOpen(true)}>
                  <Plus size={16} /> Pay
                </Button>
              </div>

              {feePayments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Payments</h3>
                  <div className="space-y-3">
                    {feePayments.slice(0, 5).map(payment => (
                      <div key={payment.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">₹{payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{new Date(payment.date).toLocaleDateString()}</p>
                        </div>
                        {payment.receiptNo && (
                          <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
                            {payment.receiptNo}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <EditTotalFeesModal
        isOpen={isEditFeesOpen}
        onClose={() => setIsEditFeesOpen(false)}
        studentId={student.id}
        studentName={student.name}
        currentTotalFees={student.totalFees}
        onSuccess={(newTotal) => setStudent({ ...student, totalFees: newTotal })}
      />

      <FeePaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        studentId={student.id}
        studentName={student.name}
        onSuccess={(payment) => setFeePayments([payment, ...feePayments])}
      />
    </div>
  );
}
