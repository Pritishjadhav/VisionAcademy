"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, query, where, orderBy, onSnapshot, addDoc, deleteDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2, Plus, Save, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Test, Question, QuestionType, Subject, DifficultyLevel } from "@/lib/types/test";

export default function ManageQuestionsPage() {
  const { testId } = useParams() as { testId: string };
  const router = useRouter();
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Question Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qType, setQType] = useState<QuestionType>('MCQ');
  const [qSubject, setQSubject] = useState<Subject>('Physics');
  const [qDifficulty, setQDifficulty] = useState<DifficultyLevel>('Medium');
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState({ A: "", B: "", C: "", D: "" });
  const [correctMCQ, setCorrectMCQ] = useState("A");
  const [correctMSQ, setCorrectMSQ] = useState<string[]>([]);
  const [correctInt, setCorrectInt] = useState<number | ''>('');
  const [marks, setMarks] = useState(4);
  const [negMarks, setNegMarks] = useState(1);
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    async function fetchTest() {
      if (!testId) return;
      const docRef = doc(db, "tests", testId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const testData = { id: docSnap.id, ...docSnap.data() } as Test;
        setTest(testData);
        setMarks(testData.marksPerCorrectAnswer);
        setNegMarks(testData.negativeMarkingEnabled ? testData.marksPerWrongAnswer : 0);
      } else {
        toast.error("Test not found");
        router.push("/admin/dashboard/tests");
      }
    }
    fetchTest();
  }, [testId, router]);

  useEffect(() => {
    if (!testId) return;
    const q = query(
      collection(db, "questions"), 
      where("testId", "==", testId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[];
      data.sort((a, b) => a.questionNumber - b.questionNumber);
      setQuestions(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [testId]);

  const resetForm = () => {
    setEditingId(null);
    setQType('MCQ');
    setQSubject('Physics');
    setQDifficulty('Medium');
    setQText("");
    setQOptions({ A: "", B: "", C: "", D: "" });
    setCorrectMCQ("A");
    setCorrectMSQ([]);
    setCorrectInt('');
    if (test) {
      setMarks(test.marksPerCorrectAnswer);
      setNegMarks(test.negativeMarkingEnabled ? test.marksPerWrongAnswer : 0);
    }
    setExplanation("");
  };

  const openAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (q: Question) => {
    setEditingId(q.id);
    setQType(q.questionType);
    setQSubject(q.subject);
    setQDifficulty(q.difficultyLevel);
    setQText(q.questionText);
    if (q.options) setQOptions({ A: q.options.A || "", B: q.options.B || "", C: q.options.C || "", D: q.options.D || "" });
    if (q.correctOption) setCorrectMCQ(q.correctOption);
    if (q.correctOptions) setCorrectMSQ(q.correctOptions);
    if (q.correctInteger !== undefined) setCorrectInt(q.correctInteger);
    setMarks(q.marks);
    setNegMarks(q.negativeMarks);
    setExplanation(q.explanation || "");
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteDoc(doc(db, "questions", id));
      toast.success("Question deleted");
    } catch (error) {
      toast.error("Failed to delete question");
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent, isAddNext: boolean) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const questionData: any = {
        testId,
        questionText: qText,
        subject: qSubject,
        questionType: qType,
        marks,
        negativeMarks: negMarks,
        explanation,
        difficultyLevel: qDifficulty,
        updatedAt: serverTimestamp()
      };
      
      if (qType === 'MCQ' || qType === 'MSQ') {
        questionData.options = qOptions;
      }
      
      if (qType === 'MCQ') questionData.correctOption = correctMCQ;
      else if (qType === 'MSQ') questionData.correctOptions = correctMSQ;
      else if (qType === 'Integer') questionData.correctInteger = Number(correctInt);

      if (editingId) {
        await updateDoc(doc(db, "questions", editingId), questionData);
        toast.success("Question updated!");
      } else {
        questionData.questionNumber = questions.length + 1;
        questionData.createdAt = serverTimestamp();
        await addDoc(collection(db, "questions"), questionData);
        toast.success("Question added!");
      }
      
      if (isAddNext) {
        resetForm();
      } else {
        setIsFormOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleMSQOption = (opt: string) => {
    setCorrectMSQ(prev => 
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };
  
  const handlePublishTest = async () => {
    if (questions.length === 0) {
      toast.error("Cannot publish a test with 0 questions.");
      return;
    }
    if (!confirm("Publishing the test will make it visible to students. Are you sure?")) return;
    try {
      await updateDoc(doc(db, "tests", testId), { status: "Published" });
      toast.success("Test Published!");
      router.push("/admin/dashboard/tests");
    } catch (e) {
      toast.error("Failed to publish test");
    }
  };

  if (loading || !test) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/tests">
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowLeft size={20} className="text-slate-700" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 line-clamp-1">{test.testName}</h1>
            <p className="text-slate-500">Manage Questions ({questions.length})</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openAddForm}>
            <Plus size={18} className="mr-1" /> Add Question
          </Button>
          {test.status === "Draft" && (
            <Button variant="gradient" onClick={handlePublishTest}>
              Publish Test
            </Button>
          )}
        </div>
      </div>

      {!isFormOpen ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">No questions added yet.</p>
              <Button variant="outline" onClick={openAddForm}>Add First Question</Button>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 hover:border-brand-blue/30 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center font-bold text-brand-blue border border-slate-100">
                  Q{q.questionNumber || idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{q.subject}</span>
                    <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-md font-medium">{q.questionType}</span>
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">+{q.marks} / -{q.negativeMarks}</span>
                  </div>
                  <p className="text-slate-800 font-medium whitespace-pre-wrap">{q.questionText}</p>
                  
                  {q.questionType !== 'Integer' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className={`p-2 rounded-lg border ${
                          (q.questionType === 'MCQ' && q.correctOption === opt) || (q.questionType === 'MSQ' && q.correctOptions?.includes(opt))
                          ? 'bg-green-50 border-green-200 text-green-800 font-medium'
                          : 'bg-slate-50 border-slate-100'
                        }`}>
                          <span className="font-bold mr-2">{opt}.</span> {q.options?.[opt as keyof typeof q.options]}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.questionType === 'Integer' && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 text-green-800 rounded-lg font-medium inline-block">
                      Answer: {q.correctInteger}
                    </div>
                  )}
                </div>
                <div className="flex md:flex-col gap-2 shrink-0">
                  <button onClick={() => openEditForm(q)} className="p-2 text-slate-500 hover:text-brand-blue bg-slate-50 hover:bg-brand-blue/5 rounded-lg transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-2 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <form className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-slate-900">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Subject</label>
              <select value={qSubject} onChange={e => setQSubject(e.target.value as Subject)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Question Type</label>
              <select value={qType} onChange={e => setQType(e.target.value as QuestionType)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                <option value="MCQ">MCQ (Single Correct)</option>
                <option value="MSQ">MSQ (Multiple Correct)</option>
                <option value="Integer">Integer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Difficulty</label>
              <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value as DifficultyLevel)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Question Text *</label>
            <textarea 
              required value={qText} onChange={e => setQText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 min-h-[120px]"
              placeholder="Enter the question here..."
            />
          </div>

          {qType !== 'Integer' && (
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700">Options *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt} className="flex gap-2 items-center">
                    <span className="font-bold text-slate-500 w-6">{opt}.</span>
                    <input 
                      required type="text"
                      value={qOptions[opt as keyof typeof qOptions]}
                      onChange={e => setQOptions(prev => ({ ...prev, [opt]: e.target.value }))}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      placeholder={`Option ${opt}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct Answer Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="text-sm font-bold text-slate-800 block mb-3">Correct Answer *</label>
            {qType === 'MCQ' && (
              <div className="flex gap-4">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="mcqCorrect" value={opt} checked={correctMCQ === opt} onChange={() => setCorrectMCQ(opt)} className="w-5 h-5 text-brand-blue" />
                    <span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {qType === 'MSQ' && (
              <div className="flex gap-4">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={correctMSQ.includes(opt)} onChange={() => toggleMSQOption(opt)} className="w-5 h-5 text-brand-blue rounded" />
                    <span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {qType === 'Integer' && (
              <input 
                type="number" required value={correctInt} onChange={e => setCorrectInt(Number(e.target.value))}
                className="w-full md:w-1/3 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                placeholder="Enter exact integer..."
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Marks for Correct (+)</label>
              <input type="number" required min="1" value={marks} onChange={e => setMarks(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Negative Marks (-)</label>
              <input type="number" required min="0" value={negMarks} onChange={e => setNegMarks(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Explanation (Optional)</label>
              <textarea value={explanation} onChange={e => setExplanation(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none min-h-[80px]" placeholder="Explain the solution..." />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
            {!editingId && (
              <Button type="button" variant="outline" onClick={(e) => handleSaveQuestion(e, true)} disabled={formLoading}>
                {formLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add & Next
              </Button>
            )}
            <Button type="button" variant="gradient" onClick={(e) => handleSaveQuestion(e, false)} disabled={formLoading}>
              {formLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {editingId ? 'Update Question' : 'Save Question'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
