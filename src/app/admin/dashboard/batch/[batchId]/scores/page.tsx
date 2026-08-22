"use client";

import { useState, useEffect, use, useMemo } from "react";
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ArrowLeft, Loader2, FileText, BookOpen, BarChart, Calendar, X, ListChecks, ChevronRight, Users, Award, Download, Trash2, Edit3, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { downloadOmrResultSheet } from "@/lib/omr/client";
import * as XLSX from "xlsx";

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

interface OmrTest {
  id: string;
  testName: string;
  testDate: string;
  maxMarks: number;
}

type TabType = "all" | "theory" | "online" | "omr";

type CombinedTest = {
  id: string;
  testName: string;
  date: string;
  totalMarks: number;
  type: "theory" | "online" | "omr";
  sortDate: number;
};

export default function BatchScoresPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const batchName = decodeURIComponent(resolvedParams.batchId);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<CombinedTest | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [theoryTests, setTheoryTests] = useState<TheoryTest[]>([]);
  const [onlineTests, setOnlineTests] = useState<OnlineTest[]>([]);
  const [omrTests, setOmrTests] = useState<OmrTest[]>([]);
  
  const [theoryMarksMap, setTheoryMarksMap] = useState<Record<string, Record<string, number>>>({}); 
  const [onlineResultsMap, setOnlineResultsMap] = useState<Record<string, Record<string, number>>>({}); 
  const [omrResultsMap, setOmrResultsMap] = useState<Record<string, Record<string, number>>>({}); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editMarkValue, setEditMarkValue] = useState<string>("");
  const [isSavingMark, setIsSavingMark] = useState(false);

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

        // 6. Fetch OMR Tests
        const omrTestsQ = query(collection(db, "omrTests"), where("batch", "==", batchName));
        const omrTestsSnap = await getDocs(omrTestsQ);
        const fetchedOmrTests = omrTestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OmrTest[];
        fetchedOmrTests.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
        setOmrTests(fetchedOmrTests);

        // 7. Fetch OMR Results
        const omrMap: Record<string, Record<string, number>> = {};
        const omrResultPromises = [];
        for (let i = 0; i < studentIds.length; i += chunkSize) {
          const chunk = studentIds.slice(i, i + chunkSize);
          const q = query(collection(db, "omrResults"), where("studentId", "in", chunk));
          omrResultPromises.push(getDocs(q));
        }
        
        const omrResultsSnaps = await Promise.all(omrResultPromises);
        omrResultsSnaps.forEach(snap => {
          snap.forEach(doc => {
            const data = doc.data();
            if (!omrMap[data.studentId]) omrMap[data.studentId] = {};
            omrMap[data.studentId][data.testId] = data.marksObtained;
          });
        });
        setOmrResultsMap(omrMap);

      } catch (error) {
        console.error("Error fetching scores data:", error);
        toast.error("Failed to load batch scores");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [batchName]);

  const combinedTests: CombinedTest[] = [
    ...theoryTests.map(t => ({ ...t, type: "theory" as const, sortDate: new Date(t.date).getTime() })),
    ...onlineTests.map(t => ({ ...t, date: t.testDate, type: "online" as const, sortDate: new Date(t.testDate).getTime() })),
    ...omrTests.map(t => ({ ...t, date: t.testDate, totalMarks: t.maxMarks, type: "omr" as const, sortDate: new Date(t.testDate).getTime() }))
  ].sort((a, b) => b.sortDate - a.sortDate);

  let displayTests = combinedTests;
  if (activeTab === "theory") displayTests = combinedTests.filter(t => t.type === "theory");
  else if (activeTab === "online") displayTests = combinedTests.filter(t => t.type === "online");
  else if (activeTab === "omr") displayTests = combinedTests.filter(t => t.type === "omr");

  if (selectedDate) {
    displayTests = displayTests.filter(t => t.date === selectedDate);
  }

  // Deselect test if tab or date changes and selected test is no longer in view
  useEffect(() => {
    if (selectedTest && !displayTests.find(t => t.id === selectedTest.id)) {
      setSelectedTest(null);
    }
  }, [displayTests, selectedTest]);

  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete the test "${selectedTest.testName}" and all associated student scores? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const batch = writeBatch(db);

      // 1. Determine collections
      let testCollection = "";
      let scoreCollection = "";
      
      if (selectedTest.type === "theory") {
        testCollection = "theoryTests";
        scoreCollection = "theoryMarks";
      } else if (selectedTest.type === "online") {
        testCollection = "tests";
        scoreCollection = "results";
      } else if (selectedTest.type === "omr") {
        testCollection = "omrTests";
        scoreCollection = "omrResults";
      }

      // 2. Delete the test document itself
      const testDocRef = doc(db, testCollection, selectedTest.id);
      batch.delete(testDocRef);

      // 3. Find and delete all score documents for this test
      const scoresQuery = query(collection(db, scoreCollection), where("testId", "==", selectedTest.id));
      const scoresSnapshot = await getDocs(scoresQuery);
      scoresSnapshot.docs.forEach((scoreDoc) => {
        batch.delete(scoreDoc.ref);
      });

      // 4. Commit the batch
      await batch.commit();

      // 5. Update UI state locally so we don't have to refetch everything
      if (selectedTest.type === "theory") {
        setTheoryTests(prev => prev.filter(t => t.id !== selectedTest.id));
      } else if (selectedTest.type === "online") {
        setOnlineTests(prev => prev.filter(t => t.id !== selectedTest.id));
      } else if (selectedTest.type === "omr") {
        setOmrTests(prev => prev.filter(t => t.id !== selectedTest.id));
      }

      toast.success("Test and all associated scores deleted successfully");
      setSelectedTest(null);
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Failed to delete test");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (studentId: string, currentMark: number | undefined) => {
    setEditingStudentId(studentId);
    setEditMarkValue(currentMark === undefined ? "" : (currentMark === -1 ? "Absent" : currentMark.toString()));
  };

  const handleSaveEdit = async (studentId: string) => {
    if (!selectedTest) return;
    
    setIsSavingMark(true);
    try {
      let collectionName = "";
      if (selectedTest.type === "theory") collectionName = "theoryMarks";
      else if (selectedTest.type === "online") collectionName = "results";
      else if (selectedTest.type === "omr") collectionName = "omrResults";

      const q = query(collection(db, collectionName), where("testId", "==", selectedTest.id), where("studentId", "==", studentId));
      const snap = await getDocs(q);
      
      const parsedMark = (editMarkValue.toLowerCase() === "absent" || editMarkValue === "-1") ? -1 : Number(editMarkValue);
      
      if (snap.empty) {
        toast.error("Record not found. Cannot add new record from here yet.");
        setIsSavingMark(false);
        return;
      } else {
        const docRef = doc(db, collectionName, snap.docs[0].id);
        await updateDoc(docRef, { marksObtained: parsedMark });
      }

      // Update local state
      if (selectedTest.type === "theory") {
        setTheoryMarksMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], [selectedTest.id]: parsedMark } }));
      } else if (selectedTest.type === "online") {
        setOnlineResultsMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], [selectedTest.id]: parsedMark } }));
      } else if (selectedTest.type === "omr") {
        setOmrResultsMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], [selectedTest.id]: parsedMark } }));
      }

      toast.success("Score updated successfully");
      setEditingStudentId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update score");
    } finally {
      setIsSavingMark(false);
    }
  };

  const sortedStudents = useMemo(() => {
    if (!selectedTest) return students;

    return [...students].sort((a, b) => {
      let markA = undefined;
      let markB = undefined;
      
      if (selectedTest.type === "theory") {
        markA = theoryMarksMap[a.id]?.[selectedTest.id];
        markB = theoryMarksMap[b.id]?.[selectedTest.id];
      } else if (selectedTest.type === "omr") {
        markA = omrResultsMap[a.id]?.[selectedTest.id];
        markB = omrResultsMap[b.id]?.[selectedTest.id];
      } else {
        markA = onlineResultsMap[a.id]?.[selectedTest.id];
        markB = onlineResultsMap[b.id]?.[selectedTest.id];
      }

      const getScoreWeight = (mark: number | undefined) => {
        if (mark === undefined) return -Infinity; // Not attempted
        if (mark === -1) return -2; // Absent
        return mark; // Normal mark
      };

      const weightA = getScoreWeight(markA);
      const weightB = getScoreWeight(markB);

      if (weightA !== weightB) {
        return weightB - weightA; // Descending order
      }
      
      // If marks are same, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [students, selectedTest, theoryMarksMap, omrResultsMap, onlineResultsMap]);

  const handleDownloadExcel = () => {
    if (!selectedTest) return;

    const exportData = sortedStudents.map((student, index) => {
      let mark = undefined;
      if (selectedTest.type === "theory") {
        mark = theoryMarksMap[student.id]?.[selectedTest.id];
      } else if (selectedTest.type === "omr") {
        mark = omrResultsMap[student.id]?.[selectedTest.id];
      } else {
        mark = onlineResultsMap[student.id]?.[selectedTest.id];
      }

      const percentage = mark !== undefined && mark >= 0 && selectedTest.totalMarks > 0 
        ? Math.round((mark / selectedTest.totalMarks) * 100) + "%"
        : (mark === -1 ? "N/A" : "");
      
      const markStr = mark !== undefined ? (mark === -1 ? "Absent" : mark) : "Not Attempted";
      
      return {
        "S.No": index + 1,
        "Student Name": student.name,
        "Mobile Number": student.mobile,
        "Marks Obtained": markStr,
        "Percentage": percentage
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size columns based on content
    const colWidths = [
      { wch: 5 }, // S.No
      { wch: 30 }, // Student Name
      { wch: 15 }, // Mobile Number
      { wch: 15 }, // Marks Obtained
      { wch: 15 }  // Percentage
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scores");
    
    const fileName = `${selectedTest.testName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scores.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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
            <button 
              onClick={() => setActiveTab("omr")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === "omr" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <ListChecks size={16} /> OMR
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
      ) : !selectedTest ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayTests.map((test) => (
            <div 
              key={test.id} 
              onClick={() => setSelectedTest(test)}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 cursor-pointer hover:shadow-md hover:border-brand-blue/30 hover:scale-[1.02] transition-all duration-300 group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  test.type === 'theory' ? 'bg-orange-50 text-brand-orange border border-brand-orange/20' : 
                  test.type === 'omr' ? 'bg-purple-50 text-purple-600 border border-purple-500/20' : 
                  'bg-blue-50 text-brand-blue border border-brand-blue/20'
                }`}>
                  {test.type === 'theory' ? 'Theory' : test.type === 'omr' ? 'OMR' : 'Online'}
                </span>
                <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(test.date).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-blue transition-colors line-clamp-2 leading-tight">
                {test.testName}
              </h3>
              
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl">
                  <Award size={16} className="text-slate-400" />
                  Max: {test.totalMarks}
                </div>
                
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-blue group-hover:text-white transition-colors shadow-sm">
                  <ChevronRight size={18} className="translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button 
                onClick={() => setSelectedTest(null)}
                className="flex items-center gap-2 text-brand-blue hover:text-blue-700 font-medium mb-3 transition-colors text-sm"
              >
                <ArrowLeft size={16} /> Back to All Tests
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{selectedTest.testName}</h2>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                  selectedTest.type === 'theory' ? 'bg-orange-100 text-orange-700' : 
                  selectedTest.type === 'omr' ? 'bg-purple-100 text-purple-700' : 
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedTest.type === 'theory' ? 'Theory' : selectedTest.type === 'omr' ? 'OMR' : 'Online'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(selectedTest.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Award size={14} /> Max Marks: {selectedTest.totalMarks}</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {sortedStudents.length} Students</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                title="Download Scores Excel"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Download Excel</span>
              </button>
              {selectedTest.type === "omr" && (
                <button
                  onClick={() => downloadOmrResultSheet(selectedTest.id).catch((error) => toast.error(error.message))}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Download size={16} />
                  Download OMR PDFs
                </button>
              )}
              <button
                onClick={handleDeleteTest}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                title="Delete Test"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span className="hidden sm:inline">Delete Test</span>
              </button>
              <button 
                onClick={() => setSelectedTest(null)}
                className="hidden sm:flex p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow transition-all"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6 font-semibold text-slate-700 sticky left-0 z-10 bg-slate-50 border-r border-slate-100 w-16 text-center">
                    #
                  </th>
                  <th className="py-4 px-6 font-semibold text-slate-700 border-r border-slate-100">
                    Student Details
                  </th>
                  <th className="py-4 px-6 font-semibold text-slate-700 text-center border-r border-slate-100">
                    Marks Obtained
                  </th>
                  <th className="py-4 px-6 font-semibold text-slate-700 text-center bg-blue-50/50">
                    Percentage / Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedStudents.map((student, index) => {
                  let mark = undefined;
                  if (selectedTest.type === "theory") {
                    mark = theoryMarksMap[student.id]?.[selectedTest.id];
                  } else if (selectedTest.type === "omr") {
                    mark = omrResultsMap[student.id]?.[selectedTest.id];
                  } else {
                    mark = onlineResultsMap[student.id]?.[selectedTest.id];
                  }

                  const percentage = mark !== undefined && mark >= 0 && selectedTest.totalMarks > 0 
                    ? Math.round((mark / selectedTest.totalMarks) * 100) 
                    : null;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 text-slate-400 font-mono text-center">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6 border-r border-slate-100">
                        <p className="font-bold text-slate-900">{student.name}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{student.mobile}</p>
                      </td>
                      <td className="py-4 px-6 text-center border-r border-slate-100">
                        {editingStudentId === student.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <input 
                              type="text" 
                              value={editMarkValue} 
                              onChange={(e) => setEditMarkValue(e.target.value)}
                              className="w-20 px-2 py-1 text-center text-sm font-bold border border-slate-300 rounded-md outline-none focus:border-brand-blue"
                              disabled={isSavingMark}
                              placeholder="Score/Absent"
                            />
                            <button onClick={() => handleSaveEdit(student.id)} disabled={isSavingMark} className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded shadow-sm">
                              {isSavingMark ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button onClick={() => setEditingStudentId(null)} disabled={isSavingMark} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded shadow-sm">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 group/edit">
                            {mark !== undefined ? (
                              mark === -1 ? (
                                <span className="font-black text-lg text-red-500">Absent</span>
                              ) : (
                                <span className="font-black text-lg text-slate-900">{mark}</span>
                              )
                            ) : (
                              <span className="text-slate-300 font-medium italic text-sm">Not Attempted</span>
                            )}
                            {mark !== undefined && (
                              <button onClick={() => handleEditClick(student.id, mark)} className="text-slate-400 hover:text-brand-blue opacity-0 group-hover/edit:opacity-100 transition-opacity">
                                <Edit3 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/20">
                        {mark === -1 ? (
                          <span className="font-bold text-sm px-3 py-1.5 rounded-lg border bg-slate-50 text-slate-500 border-slate-200">
                            N/A
                          </span>
                        ) : percentage !== null ? (
                          <span className={`font-bold text-sm px-3 py-1.5 rounded-lg border ${
                            percentage >= 75 ? 'bg-green-50 text-green-700 border-green-200' :
                            percentage >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {percentage}%
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
