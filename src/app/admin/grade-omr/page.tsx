"use client";

import React, { use, useEffect, useState, useRef } from "react";
import { Upload, FileImage, CheckCircle, AlertCircle, RefreshCw, FileText, Download, ListChecks, Settings, ChevronRight, ChevronLeft, Save } from "lucide-react";
import { downloadOmrResultSheet, downloadOmrSheet, gradeOmrSheet, OmrGradeResult } from "@/lib/omr/client";
import { createOmrTest, getOmrSetupData, saveOmrResult } from "@/actions/omr";
import { getRequiredIdToken } from "@/lib/auth-token";
import { JEE_NUMERICAL_QUESTIONS, OmrExamType, OmrNumericalStatus, OmrTest, omrQuestionNumbers } from "@/lib/types/omr";
import toast from "react-hot-toast";

const BATCHES = [
  "11th IIT-JEE Integrated",
  "12th IIT-JEE Integrated",
  "11th NEET Integrated",
  "12th NEET Integrated",
];

type Step = 'setup' | 'set-answers' | 'grade';

export default function GradeOMRPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const requestedBatch = use(searchParams).batch;
  const initialBatch = requestedBatch && BATCHES.includes(requestedBatch) ? requestedBatch : BATCHES[0];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(OmrGradeResult & { image: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow state
  const [step, setStep] = useState<Step>('setup');

  // Settings for grading
  const [examType, setExamType] = useState<OmrExamType>(initialBatch.includes("NEET") ? "NEET" : "JEE");
  const [customQuestions, setCustomQuestions] = useState(20);
  const [customChoices, setCustomChoices] = useState(4);
  const numQuestions = examType === "JEE" ? 60 : examType === "NEET" ? 180 : customQuestions;
  const numChoices = examType === "CUSTOM" ? customChoices : 4;
  const [batch, setBatch] = useState(initialBatch);
  const [testName, setTestName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [marksCorrect, setMarksCorrect] = useState(4);
  const [marksWrong, setMarksWrong] = useState(1);
  const [omrTests, setOmrTests] = useState<OmrTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const [numericalAnswers, setNumericalAnswers] = useState<OmrNumericalStatus[]>(
    () => new Array(15).fill("blank"),
  );
  
  // Array of answers (1-indexed). 0 means unset.
  const [answers, setAnswers] = useState<number[]>([]);
  
  // Settings for generating PDF
  const [genTitle, setGenTitle] = useState<string>("Vision Academy - OMR Sheet");

  useEffect(() => {
    let active = true;
    async function loadSetupData() {
      try {
        const data = await getOmrSetupData(await getRequiredIdToken(), batch);
        if (active) {
          setOmrTests(data.tests);
          setStudents(data.students);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load OMR tests and students.");
        }
      }
    }
    void loadSetupData();
    return () => {
      active = false;
    };
  }, [batch]);

  const selectFile = (selectedFile: File) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/tiff",
      "image/bmp",
    ];
    const allowedExtensions = /\.(pdf|jpe?g|png|webp|tiff?|bmp)$/i;
    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.test(selectedFile.name)) {
      setError("Upload a PDF, JPEG, PNG, WebP, TIFF, or BMP file.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const isPdf = selectedFile.type === "application/pdf" || /\.pdf$/i.test(selectedFile.name);
    setFile(selectedFile);
    setPreviewUrl(isPdf ? null : URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) selectFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) selectFile(droppedFile);
  };

  const handleGeneratePdf = async () => {
    setError(null);
    try {
      await downloadOmrSheet(numQuestions, numChoices, genTitle, examType);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate the OMR sheet.");
    }
  };

  const startAnswerKeySetup = () => {
    if (answers.length !== numQuestions) {
      setAnswers(new Array(numQuestions).fill(0));
    }
    setStep('set-answers');
    setError(null);
  };

  const saveAnswerKey = async () => {
    if (answers.includes(0)) {
      setError("Please select an answer for all questions before proceeding.");
      return;
    }
    if (!testName.trim() || !testDate) {
      setError("Enter the test name and date before saving the answer key.");
      return;
    }
    try {
      const response = await createOmrTest(await getRequiredIdToken(), {
        testName,
        testDate,
        batch,
        examType,
        totalQuestions: numQuestions,
        choices: numChoices,
        marksPerCorrectAnswer: marksCorrect,
        marksPerWrongAnswer: marksWrong,
        answerKey: answers,
      });
      setOmrTests((currentTests) => [
        response.test,
        ...currentTests.filter((test) => test.id !== response.test.id),
      ]);
      setSelectedTestId(response.test.id);
      setStep('grade');
      setError(null);
      toast.success("OMR test created.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create the OMR test.");
    }
  };

  const handleAnswerSelect = (qIndex: number, choiceIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = choiceIndex;
    setAnswers(newAnswers);
    setError(null);
  };

  const handleGrade = async () => {
    if (!file) return;
    if (!selectedStudentId || !selectedTestId) {
      setError("Select an OMR test and student before grading.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await gradeOmrSheet(file, numQuestions, numChoices, answers, examType);
      setNumericalAnswers(new Array(15).fill("blank"));
      setResult({
        ...data,
        image: data.graded_image_base64,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const selectExistingTest = (testId: string) => {
    setSelectedTestId(testId);
    const test = omrTests.find((item) => item.id === testId);
    if (!test?.answerKey) return;
    setExamType(test.examType);
    setCustomQuestions(test.omrQuestions ?? test.totalQuestions);
    setCustomChoices(test.choices || 4);
    setAnswers(test.answerKey);
    setTestName(test.testName);
    setTestDate(test.testDate);
    setMarksCorrect(test.marksPerCorrectAnswer);
    setMarksWrong(test.marksPerWrongAnswer);
    setStep("grade");
    setResult(null);
  };

  const handleSaveResult = async () => {
    if (!result || !selectedStudentId || !selectedTestId) return;
    setSavingResult(true);
    try {
      await saveOmrResult(await getRequiredIdToken(), {
        testId: selectedTestId,
        studentId: selectedStudentId,
        selectedAnswers: result.selected_answers,
        numericalAnswers: examType === "JEE" ? numericalAnswers : undefined,
      });
      setError(null);
      toast.success("Student OMR result saved.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save the OMR result.");
    } finally {
      setSavingResult(false);
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setNumericalAnswers(new Array(15).fill("blank"));
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const scannedWrong = result
    ? result.selected_answers.filter((answer) => answer !== null).length - result.correct_count
    : 0;
  const numericalCorrect = numericalAnswers.filter((status) => status === "correct").length;
  const numericalWrong = numericalAnswers.filter((status) => status === "wrong").length;
  const finalCorrect = (result?.correct_count ?? 0) + (examType === "JEE" ? numericalCorrect : 0);
  const finalWrong = scannedWrong + (examType === "JEE" ? numericalWrong : 0);
  const finalMarks = finalCorrect * marksCorrect - finalWrong * marksWrong;
  const totalScoredQuestions = examType === "JEE" ? 75 : numQuestions;
  const maxMarks = totalScoredQuestions * marksCorrect;
  const finalPercentage = maxMarks > 0 ? (finalMarks / maxMarks) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            OMR Grading System
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Generate printable OMR sheets or upload a scanned sheet to instantly grade it.
          </p>
        </div>

        {/* Generate PDF Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Generate Exam OMR Sheet</h2>
              <p className="text-sm text-gray-500">
                {examType === "JEE"
                  ? "JEE: 60 MCQs with 15 numerical questions"
                  : examType === "NEET"
                    ? "NEET: 180 MCQs"
                    : `Custom: ${numQuestions} questions with ${numChoices} choices`}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold text-gray-600 mb-1">Exam</label>
              <select
                value={examType}
                onChange={(event) => {
                  setExamType(event.target.value as OmrExamType);
                  setAnswers([]);
                  setSelectedTestId("");
                  setResult(null);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            {examType === "CUSTOM" && (
              <>
                <label className="flex flex-col w-full sm:w-24 text-xs font-semibold text-gray-600">
                  Questions
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customQuestions}
                    onChange={(event) => {
                      setCustomQuestions(Math.min(60, Math.max(1, Number(event.target.value))));
                      setAnswers([]);
                    }}
                    className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col w-full sm:w-20 text-xs font-semibold text-gray-600">
                  Choices
                  <select
                    value={customChoices}
                    onChange={(event) => {
                      setCustomChoices(Number(event.target.value));
                      setAnswers([]);
                    }}
                    className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {[2, 3, 4, 5].map((count) => <option key={count}>{count}</option>)}
                  </select>
                </label>
              </>
            )}
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold text-gray-600 mb-1">Custom Title</label>
              <input 
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
                value={genTitle}
                onChange={(e) => setGenTitle(e.target.value)}
                placeholder="Institution Name..."
              />
            </div>
            <button 
              onClick={handleGeneratePdf}
              className="mt-0 sm:mt-5 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium shadow-sm hover:bg-slate-800 transition-colors flex items-center justify-center w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>

        {omrTests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-3">OMR Test Result Sheets</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {omrTests.map((test) => (
                <div key={test.id} className="min-w-64 border border-gray-200 rounded-xl p-3">
                  <p className="font-semibold text-gray-800 truncate">{test.testName}</p>
                  <p className="text-xs text-gray-500 mt-1">{test.examType} · {test.testDate}</p>
                  <button
                    onClick={() => downloadOmrResultSheet(test.id).catch((error) => setError(error.message))}
                    className="mt-3 w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                  >
                    Download Batch Results
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: Flow */}
            <div className="border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50 flex flex-col h-[700px]">
              {/* Stepper Header */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className={`flex flex-col items-center flex-1 ${step === 'setup' ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'setup' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                    <span className="text-xs font-semibold mt-2 text-gray-700">Setup</span>
                  </div>
                  <div className="w-8 h-px bg-gray-300"></div>
                  <div className={`flex flex-col items-center flex-1 ${step === 'set-answers' ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'set-answers' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                    <span className="text-xs font-semibold mt-2 text-gray-700">Answer Key</span>
                  </div>
                  <div className="w-8 h-px bg-gray-300"></div>
                  <div className={`flex flex-col items-center flex-1 ${step === 'grade' ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'grade' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
                    <span className="text-xs font-semibold mt-2 text-gray-700">Upload</span>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 overflow-y-auto p-8 relative">
                
                {/* STEP 1: SETUP */}
                {step === 'setup' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col justify-center">
                    <div className="mb-8 text-center">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Test Configuration</h2>
                      <p className="text-gray-500 mt-2">Specify the parameters of the test you are about to grade.</p>
                    </div>

                    <div className="space-y-4 max-w-sm mx-auto w-full">
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => { setExamType("JEE"); setAnswers([]); }}
                          className={`rounded-xl border p-3 font-bold ${examType === "JEE" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200"}`}
                        >
                          JEE
                          <span className="block text-xs font-normal mt-1">60 graded MCQs</span>
                        </button>
                        <button
                          onClick={() => { setExamType("NEET"); setAnswers([]); }}
                          className={`rounded-xl border p-3 font-bold ${examType === "NEET" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200"}`}
                        >
                          NEET
                          <span className="block text-xs font-normal mt-1">180 MCQs</span>
                        </button>
                        <button
                          onClick={() => { setExamType("CUSTOM"); setAnswers([]); }}
                          className={`rounded-xl border p-3 font-bold ${examType === "CUSTOM" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200"}`}
                        >
                          Custom
                          <span className="block text-xs font-normal mt-1">1–60 questions</span>
                        </button>
                      </div>
                      {examType === "CUSTOM" && (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="text-xs font-semibold text-gray-600">
                            Questions
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={customQuestions}
                              onChange={(event) => {
                                setCustomQuestions(Math.min(60, Math.max(1, Number(event.target.value))));
                                setAnswers([]);
                              }}
                              className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-base"
                            />
                          </label>
                          <label className="text-xs font-semibold text-gray-600">
                            Choices
                            <select value={customChoices} onChange={(event) => { setCustomChoices(Number(event.target.value)); setAnswers([]); }} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-base">
                              {[2, 3, 4, 5].map((count) => <option key={count}>{count}</option>)}
                            </select>
                          </label>
                        </div>
                      )}
                      <select
                        value={batch}
                        onChange={(event) => {
                          const nextBatch = event.target.value;
                          setBatch(nextBatch);
                          if (examType !== "CUSTOM") {
                            setExamType(nextBatch.includes("NEET") ? "NEET" : "JEE");
                          }
                          setAnswers([]);
                        }}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3"
                      >
                        {BATCHES.map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <input value={testName} onChange={(event) => setTestName(event.target.value)} placeholder="Test name" className="w-full border border-gray-300 rounded-xl px-4 py-3" />
                      <input type="date" value={testDate} onChange={(event) => setTestDate(event.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3" />
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-gray-600">
                          Correct marks
                          <input type="number" min="0.1" step="0.1" value={marksCorrect} onChange={(event) => setMarksCorrect(Number(event.target.value))} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-base" />
                        </label>
                        <label className="text-xs font-semibold text-gray-600">
                          Wrong penalty
                          <input type="number" min="0" step="0.1" value={marksWrong} onChange={(event) => setMarksWrong(Number(event.target.value))} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-base" />
                        </label>
                      </div>
                      {omrTests.length > 0 && (
                        <label className="block text-xs font-semibold text-gray-600">
                          Or check an existing test
                          <select value={selectedTestId} onChange={(event) => selectExistingTest(event.target.value)} className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-base">
                            <option value="">Select test</option>
                            {omrTests.map((test) => <option key={test.id} value={test.id}>{test.testName} ({test.testDate})</option>)}
                          </select>
                        </label>
                      )}

                      <button 
                        onClick={startAnswerKeySetup}
                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center justify-center group"
                      >
                        Set Answer Key
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: SET ANSWERS */}
                {step === 'set-answers' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <ListChecks className="w-6 h-6 mr-2 text-blue-600" />
                        Master Answer Key
                      </h2>
                      <button onClick={() => setStep('setup')} className="text-sm text-gray-500 hover:text-gray-800 flex items-center transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                      </button>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                      Click the bubbles to set the correct answer for each question.
                    </p>

                    <div className="flex-1 overflow-y-auto pr-2 rounded-xl border border-gray-200 bg-white shadow-inner p-4 custom-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {omrQuestionNumbers(examType, numQuestions).map((questionNumber, qIndex) => (
                          <React.Fragment key={questionNumber}>
                          {examType === "JEE" && (qIndex === 20 || qIndex === 40) && (
                            <div className="sm:col-span-2 py-2 text-center text-xs font-bold text-amber-700 bg-amber-50 rounded-lg">
                              Skip numerical questions {qIndex === 20 ? "21–25" : "46–50"}
                            </div>
                          )}
                          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className="w-8 font-bold text-gray-700">{questionNumber}.</span>
                            <div className="flex gap-2">
                              {Array.from({ length: numChoices }).map((_, cIndex) => {
                                const isSelected = answers[qIndex] === cIndex + 1;
                                const label = String.fromCharCode(65 + cIndex);
                                return (
                                  <button
                                    key={cIndex}
                                    onClick={() => handleAnswerSelect(qIndex, cIndex + 1)}
                                    className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition-all duration-200 ${
                                      isSelected 
                                        ? 'bg-blue-500 border-blue-500 text-white shadow-md transform scale-110' 
                                        : 'bg-white border-gray-300 text-gray-500 hover:border-blue-400'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          </React.Fragment>
                        ))}
                        {examType === "JEE" && (
                          <div className="sm:col-span-2 py-2 text-center text-xs font-bold text-amber-700 bg-amber-50 rounded-lg">
                            Skip numerical questions 71–75
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      {error && (
                        <p className="text-red-500 text-sm font-medium mb-3 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" /> {error}
                        </p>
                      )}
                      <button 
                        onClick={saveAnswerKey}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-colors flex items-center justify-center"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Save All Correct Answers
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: GRADE */}
                {step === 'grade' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Upload className="w-6 h-6 mr-2 text-blue-600" />
                        Upload Student Sheet
                      </h2>
                      <button
                        onClick={() => {
                          setStep("setup");
                          setSelectedTestId("");
                          setAnswers([]);
                          setResult(null);
                          setNumericalAnswers(new Array(15).fill("blank"));
                        }}
                        className="text-sm text-gray-500 hover:text-gray-800 flex items-center transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> New Test
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <label className="text-xs font-semibold text-gray-600">
                        OMR Test
                        <select value={selectedTestId} onChange={(event) => selectExistingTest(event.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="">Select test</option>
                          {omrTests.map((test) => <option key={test.id} value={test.id}>{test.testName}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-gray-600">
                        Student
                        <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="">Select student</option>
                          {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                        </select>
                      </label>
                    </div>
                    
                    {!file ? (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group flex-1 flex flex-col items-center justify-center"
                      >
                        <FileImage className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" />
                        <p className="text-gray-600 font-medium">Click or drag the student&apos;s filled sheet</p>
                        <p className="text-sm text-gray-400 mt-2">Supports PDF, JPEG, PNG, WebP, TIFF, and BMP</p>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.bmp,application/pdf,image/jpeg,image/png,image/webp,image/tiff,image/bmp"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="relative rounded-xl overflow-hidden shadow-md bg-gray-100 flex items-center justify-center p-2 mb-6 flex-1">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="object-contain h-full w-full rounded"
                            />
                          ) : (
                            <div className="text-center text-gray-600">
                              <FileText className="w-16 h-16 mx-auto mb-3 text-red-500" />
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-400 mt-1">The first PDF page will be graded.</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between gap-4 mt-auto">
                          <button
                            onClick={reset}
                            className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors flex-1"
                            disabled={loading}
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleGrade}
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-[2]"
                          >
                            {loading ? (
                              <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Grading...
                              </>
                            ) : (
                              "Grade Now"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Result */}
            <div className="p-8 bg-white h-[700px] flex flex-col overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                Results
              </h2>

              {step !== 'grade' && !error ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-lg text-center px-4 opacity-50">Complete the setup steps first.</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 shrink-0">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-red-700 font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {!result && !error ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg text-center px-4">Upload a filled sheet and click Grade to see results.</p>
                    </div>
                  ) : result ? (
                    <div className="flex flex-col h-full animate-in fade-in zoom-in duration-300">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100 shadow-inner flex items-center justify-between shrink-0">
                        <div>
                          <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Final Marks</p>
                          <div className="flex items-baseline mt-1">
                            <span className={`text-4xl font-black ${finalPercentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {finalMarks}
                              <span className="text-base text-gray-500"> / {maxMarks}</span>
                            </span>
                          </div>
                        </div>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${finalPercentage >= 50 ? 'bg-green-100' : 'bg-red-100'}`}>
                           <span className={`text-2xl font-bold ${finalPercentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                             {finalPercentage >= 50 ? 'Pass' : 'Fail'}
                           </span>
                        </div>
                      </div>

                      <div className="flex-grow flex flex-col min-h-0">
                        {examType === "JEE" && (
                          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-bold text-amber-900">Manual numerical scoring</p>
                                <p className="text-xs text-amber-700">Set each integer question as correct, wrong, or blank.</p>
                              </div>
                              <p className="text-xs font-bold text-amber-800">
                                {numericalCorrect} correct · {numericalWrong} wrong
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {JEE_NUMERICAL_QUESTIONS.map((questionNumber, index) => (
                                <label key={questionNumber} className="text-[11px] font-bold text-gray-700">
                                  Q{questionNumber}
                                  <select
                                    value={numericalAnswers[index]}
                                    onChange={(event) => {
                                      const next = [...numericalAnswers];
                                      next[index] = event.target.value as OmrNumericalStatus;
                                      setNumericalAnswers(next);
                                    }}
                                    className="mt-0.5 w-full rounded-md border border-amber-200 bg-white px-1 py-1 text-xs font-normal"
                                  >
                                    <option value="blank">Blank</option>
                                    <option value="correct">Correct</option>
                                    <option value="wrong">Wrong</option>
                                  </select>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="font-semibold text-gray-700 mb-2">Graded Output Image</p>
                        <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 flex-grow bg-black flex items-center justify-center">
                          <img
                            src={result.image}
                            alt="Graded OMR Sheet"
                            className="object-contain max-h-full max-w-full"
                          />
                        </div>
                        <button
                          onClick={handleSaveResult}
                          disabled={savingResult}
                          className="mt-3 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold disabled:opacity-50"
                        >
                          {savingResult ? "Saving..." : "Save Result for Student"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Custom styles for hidden scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8; 
        }
      `}} />
    </div>
  );
}
