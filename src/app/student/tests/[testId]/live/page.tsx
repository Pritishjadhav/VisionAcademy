"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, addDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Test, Question, StudentAnswer, TestResult } from "@/lib/types/test";
import { Loader2, AlertTriangle, Clock, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";

type QuestionStatus = 'Answered' | 'Marked for Review' | 'Answered & Marked for Review' | 'Not Answered' | 'Not Visited';

interface AnswerState {
  status: QuestionStatus;
  selectedOption?: string | null;
  selectedOptions?: string[];
  enteredInteger?: number | null;
  timeSpent: number;
}

export default function LiveTestPage() {
  const { testId } = useParams() as { testId: string };
  const router = useRouter();
  const { user, dbUser } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const isPractice = searchParams.get('practice') === 'true';
  const violationTriggered = useRef(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const submitTestRef = useRef<any>(null);
  const answersRef = useRef<Record<string, AnswerState>>({});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    async function initTest() {
      if (!testId || !user) return;
      try {
        // Run all queries in parallel for maximum speed
        const sessionKey = isPractice ? `${testId}_${user.uid}_practice` : `${testId}_${user.uid}`;
        const attemptCollection = "testAttempts";
        const sessionKeyAttempt = `${testId}_${user.uid}`;
        const attemptRef = doc(db, attemptCollection, sessionKeyAttempt);

        const [tSnap, qSnap, resSnap, sessionDoc, attemptSnap] = await Promise.all([
          getDoc(doc(db, "tests", testId)),
          getDocs(query(collection(db, "questions"), where("testId", "==", testId))),
          !isPractice ? getDocs(query(collection(db, "results"), where("testId", "==", testId), where("studentId", "==", user.uid))) : Promise.resolve(null),
          getDoc(doc(db, "activeSessions", sessionKey)),
          !isPractice ? getDoc(doc(db, "testAttempts", sessionKeyAttempt)) : Promise.resolve(null)
        ]);

        if (!tSnap.exists()) throw new Error("Test not found");
        const tData = { id: tSnap.id, ...tSnap.data() } as Test;
        setTest(tData);

        // Check if already submitted
        if (!isPractice && resSnap && !resSnap.empty) {
          toast.error("You have already submitted this test.");
          router.replace(`/student/tests/${testId}/result`);
          return;
        }

        // Setup questions
        const qs = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[];
        qs.sort((a, b) => a.questionNumber - b.questionNumber);
        setQuestions(qs);

        // Init answers
        const initialAnswers: Record<string, AnswerState> = {};
        qs.forEach((q, idx) => {
          initialAnswers[q.id] = { status: idx === 0 ? 'Not Answered' : 'Not Visited', timeSpent: 0 };
        });
        setAnswers(initialAnswers);

        // Calculate max duration limit
        const durationLimit = tData.totalDuration * 60;

        // Timer
        const end = new Date(`${tData.testDate}T${tData.endTime}`).getTime();
        const now = Date.now();
        const remaining = Math.floor((end - now) / 1000);
        
        if (!isPractice && remaining <= 0) {
          toast.error("Test is closed");
          router.replace(`/student/tests`);
          return;
        }

        // --- Secure Test Mode Initialization ---
        // 1. Session Binding Check
        if (!sessionId) {
          toast.error("Invalid test session. Please start the test properly.");
          router.replace(`/student/tests`);
          return;
        }

        if (!sessionDoc.exists() || sessionDoc.data().sessionId !== sessionId) {
          toast.error("Test is active on another device or session expired.");
          router.replace(`/student/tests`);
          return;
        }

        const initialTimeLeft = isPractice ? durationLimit : Math.min(remaining, durationLimit);

        if (isPractice) {
          setTimeLeft(initialTimeLeft);
          setAnswers(initialAnswers);
        } else {
          if (attemptSnap && attemptSnap.exists()) {
            const aData = attemptSnap.data();
            if (aData.status !== 'active') {
              toast.error("You cannot resume a submitted test.");
              router.replace(`/student/tests/${testId}/result`);
              return;
            }
            // Restore active state
            if (aData.answers) {
              setAnswers(aData.answers);
            }
            if (aData.remainingTime) {
              setTimeLeft(aData.remainingTime);
            } else {
              setTimeLeft(initialTimeLeft);
            }
          } else {
            // New Attempt
            await setDoc(attemptRef, {
              studentId: user.uid,
              testId: testId,
              batch: tData.batch,
              status: 'active',
              sessionId: sessionId,
              startTime: serverTimestamp(),
              remainingTime: initialTimeLeft,
              isPractice: false
            });
            setTimeLeft(initialTimeLeft);
          }
        }

      } catch (error) {
        console.error(error);
        toast.error("Error loading test");
      } finally {
        setLoading(false);
      }
    }
    initTest();
  }, [testId, user, router]);

  useEffect(() => {
    if (loading || timeLeft <= 0 || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          autoSubmit("Time's up");
          return 0;
        }

        // Auto-save every 10 seconds
        if (!isPractice && prev % 10 === 0 && testId && user) {
          const attemptCollection = "testAttempts";
          const sessionKeyAttempt = `${testId}_${user.uid}`;
          const attemptRef = doc(db, attemptCollection, sessionKeyAttempt);
          setDoc(attemptRef, { remainingTime: prev - 1, answers: answersRef.current, lastSaveTime: new Date().toISOString() }, { merge: true }).catch(() => { });
        }

        return prev - 1;
      });
      // Also update timeSpent for current question
      if (questions.length > 0) {
        setAnswers(prev => {
          const qId = questions[currentQIdx].id;
          return {
            ...prev,
            [qId]: { ...prev[qId], timeSpent: (prev[qId]?.timeSpent || 0) + 1 }
          };
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, currentQIdx, isSubmitting, questions]);

  // --- Secure Test Mode Anti-Cheating Listeners ---
  useEffect(() => {
    if (loading || isSubmitting || !testId || !user) return;

    const handleViolation = (reason: string) => {
      if (violationTriggered.current || isSubmitting) return;
      violationTriggered.current = true;
      toast.error(`Violation Detected: ${reason}. Auto-submitting test.`);
      if (submitTestRef.current) submitTestRef.current('Auto Submitted', reason);
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        handleViolation("Browser or Tab Hidden (Switched App or Tab)");
      }
    };

    const handleBlur = () => {
      handleViolation("Window Lost Focus");
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires this
      handleViolation("Attempted to Reload or Close Page");
    };

    const handlePageHide = () => {
      handleViolation("Page Hidden or Closed");
    };

    const preventDefaultAndLog = (reason: string) => (e: Event) => {
      e.preventDefault();
      handleViolation(reason);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, F5, Ctrl+R, Ctrl+Shift+I, Ctrl+U
      if (
        e.key === 'F12' ||
        e.key === 'F5' ||
        (e.ctrlKey && e.key === 'r') ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        handleViolation("Developer Tools / Refresh Shortcut Used");
      }
    };

    // Fallback 1: Frame throttling detection (defeats "Always Active Window" extensions)
    // Browsers heavily throttle requestAnimationFrame (often to < 1Hz) when a tab is inactive.
    let lastFrameTime = performance.now();
    let rAFId: number;
    const checkThrottling = (time: number) => {
      if (time - lastFrameTime > 2000) {
        handleViolation("Browser Tab Backgrounded (Extension Bypass Detected)");
      }
      lastFrameTime = time;
      if (!violationTriggered.current && !isSubmitting) {
        rAFId = requestAnimationFrame(checkThrottling);
      }
    };
    rAFId = requestAnimationFrame(checkThrottling);

    // Fallback 2: Polling focus (defeats some extensions blocking blur events)
    const focusInterval = setInterval(() => {
      if (document.hasFocus && !document.hasFocus()) {
        handleViolation("Window Lost Focus (Background Check)");
      }
    }, 2000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("contextmenu", preventDefaultAndLog("Right Click Attempted"));
    window.addEventListener("copy", preventDefaultAndLog("Copy Attempted"));
    window.addEventListener("cut", preventDefaultAndLog("Cut Attempted"));
    window.addEventListener("paste", preventDefaultAndLog("Paste Attempted"));
    window.addEventListener("beforeprint", preventDefaultAndLog("Print Attempted"));
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(rAFId);
      clearInterval(focusInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("contextmenu", preventDefaultAndLog("Right Click Attempted"));
      window.removeEventListener("copy", preventDefaultAndLog("Copy Attempted"));
      window.removeEventListener("cut", preventDefaultAndLog("Cut Attempted"));
      window.removeEventListener("paste", preventDefaultAndLog("Paste Attempted"));
      window.removeEventListener("beforeprint", preventDefaultAndLog("Print Attempted"));
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, isSubmitting, testId, user]);

  // Fullscreen Handlers
  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case 'Answered': return 'bg-green-500 text-white';
      case 'Marked for Review': return 'bg-purple-500 text-white';
      case 'Answered & Marked for Review': return 'bg-blue-600 text-white';
      case 'Not Answered': return 'bg-red-500 text-white';
      case 'Not Visited': return 'bg-slate-200 text-slate-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  const navigateToQuestion = (idx: number) => {
    const qId = questions[currentQIdx].id;
    // If navigating away, mark current as Not Answered if it was Not Visited
    if (answers[qId].status === 'Not Visited') {
      setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], status: 'Not Answered' } }));
    }

    // Target question
    const nextQId = questions[idx].id;
    if (answers[nextQId].status === 'Not Visited') {
      setAnswers(prev => ({ ...prev, [nextQId]: { ...prev[nextQId], status: 'Not Answered' } }));
    }

    setCurrentQIdx(idx);
  };

  const handleSaveAndNext = () => {
    const q = questions[currentQIdx];
    const ans = answers[q.id];

    const isAnswered =
      (q.questionType === 'MCQ' && ans.selectedOption) ||
      (q.questionType === 'MSQ' && ans.selectedOptions && ans.selectedOptions.length > 0) ||
      (q.questionType === 'Integer' && ans.enteredInteger !== undefined && ans.enteredInteger !== null);

    setAnswers(prev => ({
      ...prev,
      [q.id]: {
        ...prev[q.id],
        status: isAnswered ? 'Answered' : 'Not Answered'
      }
    }));

    if (currentQIdx < questions.length - 1) {
      navigateToQuestion(currentQIdx + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    const q = questions[currentQIdx];
    const ans = answers[q.id];

    const isAnswered =
      (q.questionType === 'MCQ' && ans.selectedOption) ||
      (q.questionType === 'MSQ' && ans.selectedOptions && ans.selectedOptions.length > 0) ||
      (q.questionType === 'Integer' && ans.enteredInteger !== undefined && ans.enteredInteger !== null);

    setAnswers(prev => ({
      ...prev,
      [q.id]: {
        ...prev[q.id],
        status: isAnswered ? 'Answered & Marked for Review' : 'Marked for Review'
      }
    }));

    if (currentQIdx < questions.length - 1) {
      navigateToQuestion(currentQIdx + 1);
    }
  };

  const handleClearResponse = () => {
    const qId = questions[currentQIdx].id;
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selectedOption: null,
        selectedOptions: [],
        enteredInteger: null,
        status: 'Not Answered'
      }
    }));
  };

  const autoSubmit = async (reason = "Time limit reached") => {
    if (reason === "Time's up") {
      toast.error("Time's up! Auto-submitting...");
      await submitTestRef.current('Normal');
    } else {
      await submitTestRef.current('Auto Submitted', reason);
    }
  };

  const submitTest = async (submissionType: 'Normal' | 'Auto Submitted' = 'Normal', violationReason?: string) => {
    if (!user || !test || isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      let correctCount = 0;
      let wrongCount = 0;
      let unattemptedCount = 0;
      let positiveMarks = 0;
      let negativeMarks = 0;

      const subjectWiseMarks: Record<string, number> = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 };
      const subjectWiseCorrect: Record<string, number> = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 };
      const subjectWiseTotal: Record<string, number> = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 };

      // Evaluation
      questions.forEach(q => {
        const ans = answers[q.id];
        let isAttempted = false;
        let isCorrect = false;

        subjectWiseTotal[q.subject] = (subjectWiseTotal[q.subject] || 0) + 1;

        if (q.questionType === 'MCQ') {
          isAttempted = !!ans.selectedOption;
          if (isAttempted) isCorrect = ans.selectedOption === q.correctOption;
        } else if (q.questionType === 'MSQ') {
          isAttempted = !!ans.selectedOptions && ans.selectedOptions.length > 0;
          if (isAttempted) {
            const sortedAns = [...ans.selectedOptions!].sort();
            const sortedCorr = [...(q.correctOptions || [])].sort();
            isCorrect = JSON.stringify(sortedAns) === JSON.stringify(sortedCorr);
          }
        } else if (q.questionType === 'Integer') {
          isAttempted = ans.enteredInteger !== undefined && ans.enteredInteger !== null;
          if (isAttempted) isCorrect = ans.enteredInteger === q.correctInteger;
        }

        if (isAttempted) {
          if (isCorrect) {
            correctCount++;
            positiveMarks += q.marks;
            subjectWiseMarks[q.subject] += q.marks;
            subjectWiseCorrect[q.subject]++;
          } else {
            wrongCount++;
            negativeMarks += q.negativeMarks;
            subjectWiseMarks[q.subject] -= q.negativeMarks;
          }
        } else {
          unattemptedCount++;
        }
      });

      const marksObtained = positiveMarks - negativeMarks;
      const percentage = test.totalMarks > 0 ? (marksObtained / test.totalMarks) * 100 : 0;
      const totalAttempted = correctCount + wrongCount;
      const overallAccuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;

      const subjectWiseAccuracy = {
        Physics: subjectWiseTotal['Physics'] > 0 ? (subjectWiseCorrect['Physics'] / subjectWiseTotal['Physics']) * 100 : 0,
        Chemistry: subjectWiseTotal['Chemistry'] > 0 ? (subjectWiseCorrect['Chemistry'] / subjectWiseTotal['Chemistry']) * 100 : 0,
        Mathematics: subjectWiseTotal['Mathematics'] > 0 ? (subjectWiseCorrect['Mathematics'] / subjectWiseTotal['Mathematics']) * 100 : 0,
        Biology: subjectWiseTotal['Biology'] > 0 ? (subjectWiseCorrect['Biology'] / subjectWiseTotal['Biology']) * 100 : 0,
      };

      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const resultData: Omit<TestResult, 'id'> = {
        testId: test.id,
        studentId: user.uid,
        totalMarks: test.totalMarks,
        marksObtained,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        unattempted: unattemptedCount,
        positiveMarks,
        negativeMarks,
        percentage: Number(percentage.toFixed(2)),
        timeTaken,
        subjectWiseMarks: subjectWiseMarks as any,
        subjectWiseAccuracy: subjectWiseAccuracy as any,
        overallAccuracy: Number(overallAccuracy.toFixed(2)),
        createdAt: new Date().toISOString(),
        submissionType,
        violationReason: violationReason || ""
      };

      // Save Answers
      const studentAnswerData: Omit<StudentAnswer, 'id'> = {
        testId: test.id,
        studentId: user.uid,
        answers: JSON.parse(JSON.stringify(answers)),
        submitted: true,
        startedAt: new Date(startTimeRef.current).toISOString(),
        submittedAt: new Date().toISOString(),
        submissionType,
        violationReason: violationReason || ""
      };


      if (isPractice) {
        sessionStorage.setItem(`practiceResult_${test.id}`, JSON.stringify(resultData));
        sessionStorage.setItem(`practiceAnswers_${test.id}`, JSON.stringify(studentAnswerData));
      } else {
        await addDoc(collection(db, "results"), resultData);
        await addDoc(collection(db, "studentAnswers"), studentAnswerData);
      }

      // Secure Test Mode cleanup & logging
      if (!isPractice && submissionType === 'Auto Submitted') {
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        const violationCollection = "violationLogs";
        await addDoc(collection(db, violationCollection), {
          studentId: user.uid,
          studentName: (dbUser?.name as string) || 'Unknown',
          testId: test.id,
          testName: test.testName,
          batch: test.batch,
          violationReason,
          remainingTime: timeLeft,
          sessionId: sessionId || 'unknown',
          deviceInfo: { userAgent: ua, deviceType: isMobile ? 'Mobile' : 'Desktop' },
          timestamp: new Date().toISOString()
        });
      }

      // Update Attempt Status
      if (!isPractice) {
        const attemptCollection = "testAttempts";
        const sessionKeyAttempt = `${test.id}_${user.uid}`;
        await setDoc(doc(db, attemptCollection, sessionKeyAttempt), {
          status: submissionType === 'Auto Submitted' ? 'auto-submitted' : 'submitted',
          answers: JSON.parse(JSON.stringify(answers)),
          remainingTime: timeLeft,
        }, { merge: true });
      }

      // Clear Active Session
      const activeSessionKey = isPractice ? `${test.id}_${user.uid}_practice` : `${test.id}_${user.uid}`;
      await deleteDoc(doc(db, "activeSessions", activeSessionKey));

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }

      if (submissionType === 'Auto Submitted') {
        toast.error("Test was auto-submitted due to rule violation.");
      } else {
        toast.success("Test submitted successfully!");
      }

      router.replace(`/student/tests/${test.id}/result${isPractice ? '?practice=true' : ''}`);

    } catch (error) {
      console.error(error);
      toast.error("Failed to submit test. Please check connection.");
      setIsSubmitting(false);
    }
  };

  submitTestRef.current = submitTest;

  if (loading || !test) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-blue" size={50} /></div>;

  const currentQ = questions[currentQIdx];
  if (!currentQ) return null;

  const curAns = answers[currentQ.id];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-slate-100 dark:bg-slate-900 flex flex-col font-sans selection:bg-brand-blue/20`}>
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shrink-0 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{test.testName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Candidate: <span className="text-brand-blue dark:text-brand-orange">{(dbUser?.name as string) || "Unknown"}</span></p>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {!isFullscreen && (
            <Button variant="outline" size="sm" onClick={requestFullscreen} className="hidden sm:flex border-brand-orange text-brand-orange">
              Enter Fullscreen
            </Button>
          )}
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl font-bold border border-red-100 dark:border-red-800 shadow-sm transition-colors">
            <Clock size={20} />
            <span className="text-xl tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Question Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 overflow-hidden m-2 md:m-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0 transition-colors">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Question {currentQIdx + 1}</h2>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md font-bold">{currentQ.subject}</span>
              <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold">Marks: +{currentQ.marks} / -{currentQ.negativeMarks}</span>
              <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-brand-orange/20 text-orange-700 dark:text-brand-orange rounded-md font-bold">{currentQ.questionType}</span>
              <span className="text-xs px-2 py-1 flex items-center gap-1 bg-brand-blue/10 text-brand-blue dark:bg-brand-orange/20 dark:text-brand-orange rounded-md font-bold">
                <Clock size={12} />
                {formatTime(curAns?.timeSpent || 0)}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <p className="text-lg text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap mb-8 leading-relaxed">{currentQ.questionText}</p>

            {/* Options Input */}
            <div className="space-y-4 max-w-3xl">
              {currentQ.questionType === 'MCQ' && currentQ.options && ['A', 'B', 'C', 'D'].map(opt => (
                <label key={opt} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${curAns.selectedOption === opt ? 'border-brand-blue dark:border-brand-orange bg-blue-50/50 dark:bg-brand-orange/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name={`q-${currentQ.id}`}
                    className="mt-1 w-5 h-5 text-brand-blue dark:text-brand-orange border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-brand-blue dark:focus:ring-brand-orange"
                    checked={curAns.selectedOption === opt}
                    onChange={() => setAnswers(prev => ({ ...prev, [currentQ.id]: { ...prev[currentQ.id], selectedOption: opt, status: 'Answered' } }))}
                  />
                  <div>
                    <span className="font-bold mr-2 text-slate-500 dark:text-slate-400">{opt}.</span>
                    <span className="text-slate-700 dark:text-slate-200">{currentQ.options![opt as keyof typeof currentQ.options]}</span>
                  </div>
                </label>
              ))}

              {currentQ.questionType === 'MSQ' && currentQ.options && ['A', 'B', 'C', 'D'].map(opt => (
                <label key={opt} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${(curAns.selectedOptions || []).includes(opt) ? 'border-brand-blue dark:border-brand-orange bg-blue-50/50 dark:bg-brand-orange/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'}`}>
                  <input
                    type="checkbox"
                    className="mt-1 w-5 h-5 text-brand-blue dark:text-brand-orange border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-brand-blue dark:focus:ring-brand-orange rounded"
                    checked={(curAns.selectedOptions || []).includes(opt)}
                    onChange={() => {
                      setAnswers(prev => {
                        const curOpts = prev[currentQ.id].selectedOptions || [];
                        const newOpts = curOpts.includes(opt) ? curOpts.filter(o => o !== opt) : [...curOpts, opt];
                        return { ...prev, [currentQ.id]: { ...prev[currentQ.id], selectedOptions: newOpts, status: newOpts.length > 0 ? 'Answered' : 'Not Answered' } };
                      });
                    }}
                  />
                  <div>
                    <span className="font-bold mr-2 text-slate-500 dark:text-slate-400">{opt}.</span>
                    <span className="text-slate-700 dark:text-slate-200">{currentQ.options![opt as keyof typeof currentQ.options]}</span>
                  </div>
                </label>
              ))}

              {currentQ.questionType === 'Integer' && (
                <div>
                  <input
                    type="number"
                    placeholder="Type your integer answer..."
                    className="w-full max-w-xs px-4 py-3 text-lg border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:border-brand-blue dark:focus:border-brand-orange focus:ring-4 focus:ring-brand-blue/10 dark:focus:ring-brand-orange/10 transition-all"
                    value={curAns.enteredInteger ?? ''}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      [currentQ.id]: { ...prev[currentQ.id], enteredInteger: e.target.value ? Number(e.target.value) : null, status: e.target.value ? 'Answered' : 'Not Answered' }
                    }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap justify-between items-center gap-3 shrink-0 transition-colors">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleMarkForReviewAndNext} className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 transition-colors">
                Mark for Review & Next
              </Button>
              <Button variant="outline" onClick={handleClearResponse} className="bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-600 hover:border-red-200 dark:hover:border-red-500 transition-colors">
                Clear Response
              </Button>
            </div>
            <Button variant="gradient" onClick={handleSaveAndNext} className="px-8">
              Save & Next
            </Button>
          </div>
        </div>

        {/* Right Side: Palette & Submission */}
        <div className="w-full md:w-80 flex flex-col shrink-0 bg-white dark:bg-slate-800 m-2 md:ml-0 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Question Palette</h3>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => navigateToQuestion(idx)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-transform hover:scale-105 ${getStatusColor(answers[q.id]?.status || 'Not Visited')} ${currentQIdx === idx ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="space-y-3 text-sm dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 pt-4 transition-colors">
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-green-500 inline-block shrink-0 shadow-sm"></span> Answered</div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-red-500 inline-block shrink-0 shadow-sm"></span> Not Answered</div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 inline-block shrink-0 shadow-sm border border-slate-300 dark:border-slate-600"></span> Not Visited</div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-purple-500 inline-block shrink-0 shadow-sm"></span> Marked for Review</div>
              <div className="flex items-center gap-3"><span className="w-6 h-6 rounded bg-blue-600 inline-block shrink-0 shadow-sm"></span> Answered & Marked for Review (will be evaluated)</div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shrink-0 transition-colors">
            <Button onClick={() => setShowSubmitModal(true)} className="w-full bg-slate-900 dark:bg-brand-orange hover:bg-slate-800 dark:hover:bg-brand-orange/90 text-white shadow-md text-lg h-12 transition-colors">
              Submit Test
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-center transition-colors">
            <div className="w-16 h-16 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Submit Test?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to submit the test? Once submitted, you cannot modify your answers.</p>

            <div className="flex justify-between gap-4">
              <Button variant="outline" className="flex-1 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="gradient" className="flex-1" onClick={() => submitTest('Normal')} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Yes, Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
