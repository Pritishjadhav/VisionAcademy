"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, FileText, CheckCircle2, PlayCircle, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Test, TestResult } from "@/lib/types/test";
import { format } from "date-fns";
import { TestRulesModal } from "@/components/student/TestRulesModal";

export default function StudentTestsPage() {
  const { user, dbUser } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState(true);
  
  // Categorized Tests
  const [upcoming, setUpcoming] = useState<Test[]>([]);
  const [live, setLive] = useState<Test[]>([]);
  const [completed, setCompleted] = useState<Test[]>([]);
  
  const [selectedTestForRules, setSelectedTestForRules] = useState<Test | null>(null);

  const [attempts, setAttempts] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user || !dbUser?.batch) return;

    const q = query(collection(db, "tests"), where("batch", "==", dbUser.batch));
    const resQ = query(collection(db, "results"), where("studentId", "==", user.uid));
    const attQ = query(collection(db, "testAttempts"), where("studentId", "==", user.uid));

    const unsubscribeTests = onSnapshot(q, (snapshot) => {
      const allTests = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as Test)
        .filter(t => t.status === "Published");
      setTests(allTests);
    });

    const unsubscribeResults = onSnapshot(resQ, (snapshot) => {
      const resMap: Record<string, TestResult> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as TestResult;
        resMap[data.testId] = data;
      });
      setResults(resMap);
    });

    const unsubscribeAttempts = onSnapshot(attQ, (snapshot) => {
      const attMap: Record<string, any> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        attMap[data.testId] = data;
      });
      setAttempts(attMap);
    });

    return () => {
      unsubscribeTests();
      unsubscribeResults();
      unsubscribeAttempts();
    };
  }, [user, dbUser]);

  useEffect(() => {
    if (!tests || !results || !attempts) return;

    const now = new Date();
    const currentUpcoming: Test[] = [];
    const currentLive: Test[] = [];
    const currentCompleted: Test[] = [];

    tests.forEach(test => {
      const hasResult = !!results[test.id];
      const attempt = attempts[test.id];
      const isActiveAttempt = attempt && attempt.status === 'active';

      const testStart = new Date(`${test.testDate}T${test.startTime}`);
      const testEnd = new Date(`${test.testDate}T${test.endTime}`);

      // If test has ended for EVERYONE, it's completed no matter what
      if (now > testEnd) {
        currentCompleted.push(test);
        return;
      }

      // If they already submitted and have a result, it's completed
      if (hasResult && !isActiveAttempt) {
        currentCompleted.push(test);
        return;
      }

      // If they have an active attempt and test hasn't ended, force it to be live so they can resume
      if (isActiveAttempt) {
        currentLive.push(test);
        return;
      }

      if (now < testStart) {
        currentUpcoming.push(test);
      } else if (now >= testStart && now <= testEnd) {
        currentLive.push(test);
      } else {
        currentCompleted.push(test);
      }
    });

    currentUpcoming.sort((a, b) => new Date(`${a.testDate}T${a.startTime}`).getTime() - new Date(`${b.testDate}T${b.startTime}`).getTime());
    currentLive.sort((a, b) => new Date(`${a.testDate}T${a.startTime}`).getTime() - new Date(`${b.testDate}T${b.startTime}`).getTime());
    currentCompleted.sort((a, b) => new Date(`${b.testDate}T${b.startTime}`).getTime() - new Date(`${a.testDate}T${a.startTime}`).getTime());

    setUpcoming(currentUpcoming);
    setLive(currentLive);
    setCompleted(currentCompleted);
    if (tests.length > 0) setLoading(false);
  }, [tests, results, attempts]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" size={40} /></div>;
  }

  const renderTestCard = (test: Test, type: 'live' | 'upcoming' | 'completed') => {
    const hasResult = !!results[test.id];
    
    return (
      <div key={test.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
        <div className={`h-2 ${type === 'live' ? 'bg-green-500' : type === 'completed' ? 'bg-slate-300' : 'bg-brand-orange'}`} />
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{test.testName}</h3>
          
          <div className="space-y-3 mb-6 flex-1">
            <div className="flex items-center gap-3 text-slate-600 text-sm">
              <Calendar size={16} className="text-brand-orange" />
              <span>{format(new Date(test.testDate), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 text-sm">
              <Clock size={16} className="text-brand-blue" />
              <span>{test.startTime} - {test.endTime} ({test.totalDuration} Mins)</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 text-sm">
              <FileText size={16} className="text-slate-400" />
              <span>{test.totalMarks} Marks</span>
            </div>
          </div>

          <div className="mt-auto">
            {type === 'live' && (
              <Button 
                onClick={() => setSelectedTestForRules(test)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <PlayCircle size={18} className="mr-2" /> {attempts[test.id]?.status === 'active' ? 'Resume Test' : 'Start Test'}
              </Button>
            )}
            
            {type === 'upcoming' && (
              <Button variant="outline" disabled className="w-full bg-slate-50 text-slate-500 border-slate-200">
                <Lock size={18} className="mr-2" /> Upcoming
              </Button>
            )}

            {type === 'completed' && (
              hasResult ? (
                <div className={`grid ${results[test.id].submissionType !== 'Auto Submitted' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <Link href={`/student/tests/${test.id}/result`}>
                    <Button variant="outline" className="w-full text-xs bg-slate-50">View Result</Button>
                  </Link>
                  {results[test.id].submissionType !== 'Auto Submitted' && (
                    <Link href={`/student/tests/${test.id}/review`}>
                      <Button variant="outline" className="w-full text-xs text-brand-blue border-brand-blue/30 hover:bg-brand-blue/5">Review</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled className="w-full text-xs bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed">
                    <CheckCircle2 size={16} className="mr-1" /> Missed
                  </Button>
                  <Link href={`/student/tests/${test.id}/review`}>
                    <Button variant="outline" className="w-full text-xs text-brand-blue border-brand-blue/30 hover:bg-brand-blue/5 transition-colors">
                      View Q&A
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Online Tests</h1>
        <p className="text-slate-500">View and manage your tests for {dbUser?.batch}</p>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-blue/5 rounded-full flex items-center justify-center text-brand-blue mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No tests available</h3>
          <p className="text-slate-500 max-w-md">There are no online tests assigned to your batch yet.</p>
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" /> Live Now
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {live.map(t => renderTestCard(t, 'live'))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">Upcoming Tests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map(t => renderTestCard(t, 'upcoming'))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-800">Completed Tests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map(t => renderTestCard(t, 'completed'))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedTestForRules && user && (
        <TestRulesModal 
          testId={selectedTestForRules.id}
          testName={selectedTestForRules.testName}
          studentId={user.uid}
          onClose={() => setSelectedTestForRules(null)}
        />
      )}
    </div>
  );
}
