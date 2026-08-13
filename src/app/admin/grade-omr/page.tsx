"use client";

import React, { useState, useRef } from "react";
import { Upload, FileImage, CheckCircle, AlertCircle, RefreshCw, FileText, Download, ListChecks, Settings, ChevronRight, ChevronLeft, Save } from "lucide-react";

type Step = 'setup' | 'set-answers' | 'grade';

export default function GradeOMRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; image: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow state
  const [step, setStep] = useState<Step>('setup');

  // Settings for grading
  const [numQuestions, setNumQuestions] = useState<number>(20);
  const [numChoices, setNumChoices] = useState<number>(4);
  
  // Array of answers (1-indexed). 0 means unset.
  const [answers, setAnswers] = useState<number[]>([]);
  
  // Settings for generating PDF
  const [genNumQuestions, setGenNumQuestions] = useState<number>(20);
  const [genNumChoices, setGenNumChoices] = useState<number>(4);
  const [genTitle, setGenTitle] = useState<string>("Vision Academy - OMR Sheet");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf")) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleGeneratePdf = () => {
    window.open(`http://localhost:8000/generate-omr?questions=${genNumQuestions}&choices=${genNumChoices}&title=${encodeURIComponent(genTitle)}`, "_blank");
  };

  const startAnswerKeySetup = () => {
    if (answers.length !== numQuestions) {
      setAnswers(new Array(numQuestions).fill(0));
    }
    setStep('set-answers');
    setError(null);
  };

  const saveAnswerKey = () => {
    if (answers.includes(0)) {
      setError("Please select an answer for all questions before proceeding.");
      return;
    }
    setStep('grade');
    setError(null);
  };

  const handleAnswerSelect = (qIndex: number, choiceIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = choiceIndex;
    setAnswers(newAnswers);
    setError(null);
  };

  const handleGrade = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("num_questions", numQuestions.toString());
    formData.append("num_choices", numChoices.toString());
    formData.append("answer_key", answers.join(","));

    try {
      // Calling the Python FastAPI backend
      const response = await fetch("http://localhost:8000/grade", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to grade OMR sheet");
      }

      setResult({
        score: data.data.score,
        image: data.data.graded_image_base64,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
              <h2 className="text-xl font-bold text-gray-800">Generate Custom OMR Sheet</h2>
              <p className="text-sm text-gray-500">Create a blank PDF sheet for your students.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
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
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold text-gray-600 mb-1">Questions</label>
              <input 
                type="number"
                min="1"
                max="200"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-20"
                value={genNumQuestions}
                onChange={(e) => setGenNumQuestions(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label className="text-xs font-semibold text-gray-600 mb-1">Options</label>
              <input 
                type="number"
                min="2"
                max="7"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-20"
                value={genNumChoices}
                onChange={(e) => setGenNumChoices(Number(e.target.value))}
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

                    <div className="space-y-6 max-w-sm mx-auto w-full">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Total Questions</label>
                        <input 
                          type="number"
                          min="1"
                          max="200"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                          value={numQuestions}
                          onChange={(e) => setNumQuestions(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Options per Question</label>
                        <input 
                          type="number"
                          min="2"
                          max="7"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                          value={numChoices}
                          onChange={(e) => setNumChoices(Number(e.target.value))}
                        />
                      </div>

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
                        {Array.from({ length: numQuestions }).map((_, qIndex) => (
                          <div key={qIndex} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className="w-8 font-bold text-gray-700">{qIndex + 1}.</span>
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
                        ))}
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
                      <button onClick={() => setStep('set-answers')} className="text-sm text-gray-500 hover:text-gray-800 flex items-center transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Edit Key
                      </button>
                    </div>
                    
                    {!file ? (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group flex-1 flex flex-col items-center justify-center"
                      >
                        <FileImage className="w-16 h-16 mx-auto text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" />
                        <p className="text-gray-600 font-medium">Click or drag student's filled sheet</p>
                        <p className="text-sm text-gray-400 mt-2">Supports any image file or PDF</p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="relative rounded-xl overflow-hidden shadow-md bg-gray-100 flex items-center justify-center p-2 mb-6 flex-1">
                          {previewUrl && (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="object-contain h-full w-full rounded"
                            />
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
            <div className="p-8 bg-white h-[700px] flex flex-col">
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
                          <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Final Score</p>
                          <div className="flex items-baseline mt-1">
                            <span className={`text-5xl font-black ${result.score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.score.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.score >= 50 ? 'bg-green-100' : 'bg-red-100'}`}>
                           <span className={`text-2xl font-bold ${result.score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                             {result.score >= 50 ? 'Pass' : 'Fail'}
                           </span>
                        </div>
                      </div>

                      <div className="flex-grow flex flex-col min-h-0">
                        <p className="font-semibold text-gray-700 mb-2">Graded Output Image</p>
                        <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 flex-grow bg-black flex items-center justify-center">
                          <img
                            src={result.image}
                            alt="Graded OMR Sheet"
                            className="object-contain max-h-full max-w-full"
                          />
                        </div>
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
