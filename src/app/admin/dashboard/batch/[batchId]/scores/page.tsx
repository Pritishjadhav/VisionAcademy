"use client";

import { useState, useEffect, use } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ArrowLeft, Loader2, FileText, BookOpen, BarChart, Calendar, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  mobile: string;
}

interface TheoryTest {
  id: string;
  testName: string;
  date: string;
  totalMarks: number;
}

interface OnlineTest {
  id: string;
  testName: string;
  testDate: string;
  totalMarks: number;
}

type TabType = "all" | "theory" | "online";

export default function BatchScoresPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const batchName = decodeURIComponent(resolvedParams.batchId);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [students, setStudents] = useState<Student[]>([]);
  const [theoryTests, setTheoryTests] = useState<TheoryTest[]>([]);
  const [onlineTests, setOnlineTests] = useState<OnlineTest[]>([]);
  
  const [theoryMarksMap, setTheoryMarksMap] = useState<Record<string, Record<string, number>>>({}); 
  const [onlineResultsMap, setOnlineResultsMap] = useState<Record<string, Record<string, number>>>({}); 

  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        // 1. Fetch Students
        const studentsQ = query(collection(db, "students"), where("batch", "==", batchName));
        const studentsSnap = await getDocs(studentsQ);
        const fetchedStudents = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        fetchedStudents.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(fetchedStudents);

        if (fetchedStudents.length === 0) {
          setLoading(false);
          return;
        }

        const studentIds = fetchedStudents.map(s => s.id);

        // 2. Fetch Theory Tests
        const theoryTestsQ = query(collection(db, "theoryTests"), where("batch", "==", batchName));
        const theoryTestsSnap = await getDocs(theoryTestsQ);
        const fetchedTheoryTests = theoryTestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TheoryTest[];
        fetchedTheoryTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTheoryTests(fetchedTheoryTests);

        // 3. Fetch Online Tests
        const onlineTestsQ = query(collection(db, "tests"), where("batch", "==", batchName));
        const onlineTestsSnap = await getDocs(onlineTestsQ);
        const fetchedOnlineTests = onlineTestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OnlineTest[];
        fetchedOnlineTests.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
        setOnlineTests(fetchedOnlineTests);

        // 4. Fetch Theory Marks
        const theoryMarksQ = query(collection(db, "theoryMarks"), where("batch", "==", batchName));
        const theoryMarksSnap = await getDocs(theoryMarksQ);
        
        const tMap: Record<string, Record<string, number>> = {};
        theoryMarksSnap.forEach(doc => {
          const data = doc.data();
          if (!tMap[data.studentId]) tMap[data.studentId] = {};
          tMap[data.studentId][data.testId] = data.marksObtained;
        });
        setTheoryMarksMap(tMap);

        // 5. Fetch Online Results
        const oMap: Record<string, Record<string, number>> = {};
        const chunkSize = 10;
        const resultPromises = [];
        for (let i = 0; i < studentIds.length; i += chunkSize) {
          const chunk = studentIds.slice(i, i + chunkSize);
          const q = query(collection(db, "results"), where("studentId", "in", chunk));
          resultPromises.push(getDocs(q));
        }

        const resultsSnaps = await Promise.all(resultPromises);
        resultsSnaps.forEach(snap => {
          snap.forEach(doc => {
            const data = doc.data();
            if (!oMap[data.studentId]) oMap[data.studentId] = {};
            oMap[data.studentId][data.testId] = data.marksObtained;
          });
        });
        setOnlineResultsMap(oMap);

      } catch (error) {
        console.error("Error fetching scores data:", error);
        toast.error("Failed to load batch scores");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [batchName]);

  const combinedTests = [
    ...theoryTests.map(t => ({ ...t, type: "theory" as const, sortDate: new Date(t.date).getTime() })),
    ...onlineTests.map(t => ({ ...t, date: t.testDate, type: "online" as const, sortDate: new Date(t.testDate).getTime() }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  let displayTests: typeof combinedTests = [];
  if (activeTab === "all") displayTests = combinedTests;
  else if (activeTab === "theory") displayTests = combinedTests.filter(t => t.type === "theory");
  else if (activeTab === "online") displayTests = combinedTests.filter(t => t.type === "online");

  if (selectedDate) {
    displayTests = displayTests.filter(t => t.date === selectedDate);
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto py-8 px-4">
      <button 
        onClick={() => router.push(`/admin/dashboard/batch/${encodeURIComponent(batchName)}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Batch
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Batch Test Scores</h1>
          <p className="text-slate-500">Gradebook view for {batchName}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 outline-none w-[120px]"
            />
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate("")}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Clear Date Filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              All Tests
            </button>
            <button 
              onClick={() => setActiveTab("theory")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === "theory" ? "bg-white text-brand-orange shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <BookOpen size={16} /> Theory
            </button>
            <button 
              onClick={() => setActiveTab("online")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === "online" ? "bg-white text-brand-blue shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <FileText size={16} /> Online
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center text-slate-500 flex flex-col items-center">
          <Loader2 className="animate-spin text-brand-blue mb-4" size={40} />
          <p>Compiling gradebook data...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center text-slate-500">
          No students found in this batch.
        </div>
      ) : displayTests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <BarChart size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Tests Found</h3>
          <p className="text-slate-500">There are no {activeTab !== "all" ? activeTab : ""} tests recorded for this batch yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6 font-semibold text-slate-700 sticky left-0 z-10 bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Student
                  </th>
                  {displayTests.map(test => (
                    <th key={test.id} className="py-4 px-6 text-center border-l border-slate-100">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${test.type === 'theory' ? 'bg-orange-50 text-brand-orange' : 'bg-blue-50 text-brand-blue'}`}>
                          {test.type === 'theory' ? 'Theory' : 'Online'}
                        </span>
                        <span className="font-semibold text-slate-900 truncate max-w-[150px]" title={test.testName}>
                          {test.testName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(test.date).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-bold text-slate-500 mt-1">
                          Max: {test.totalMarks}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-6 text-center border-l border-slate-100 font-bold text-brand-blue bg-blue-50/50">
                    Overall %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, index) => {
                  let totalObtained = 0;
                  let totalMax = 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 px-6 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono text-xs w-5">{index + 1}.</span>
                          <div>
                            <p className="font-medium text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.mobile}</p>
                          </div>
                        </div>
                      </td>
                      
                      {displayTests.map(test => {
                        let mark = undefined;
                        if (test.type === "theory") {
                          mark = theoryMarksMap[student.id]?.[test.id];
                        } else {
                          mark = onlineResultsMap[student.id]?.[test.id];
                        }

                        if (mark !== undefined) {
                          totalObtained += mark;
                          totalMax += test.totalMarks;
                        }

                        const percentage = mark !== undefined && test.totalMarks > 0 
                          ? Math.round((mark / test.totalMarks) * 100) 
                          : null;

                        return (
                          <td key={test.id} className="py-3 px-6 text-center border-l border-slate-100/50">
                            {mark !== undefined ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-slate-900">{mark}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm mt-1 ${
                                  percentage! >= 75 ? 'bg-green-100 text-green-700' :
                                  percentage! >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {percentage}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="py-3 px-6 text-center border-l border-slate-100 bg-blue-50/20">
                        {totalMax > 0 ? (
                          <span className={`font-bold text-lg ${
                            (totalObtained / totalMax) >= 0.75 ? 'text-green-600' :
                            (totalObtained / totalMax) >= 0.60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {Math.round((totalObtained / totalMax) * 100)}%
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
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
  );
}
