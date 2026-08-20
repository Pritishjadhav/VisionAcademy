"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Test, TestResult } from "@/lib/types/test";
import { format } from "date-fns";

interface Props {
  tests: Test[];
  results: Record<string, TestResult>;
}

export function OnlineTestsPerformanceChart({ tests, results }: Props) {
  const data = useMemo(() => {
    const chartData = tests
      .filter(t => results[t.id])
      .map(t => {
        const result = results[t.id];
        return {
          name: t.testName,
          date: new Date(`${t.testDate}T${t.startTime}`),
          formattedDate: format(new Date(t.testDate), 'MMM dd'),
          percentage: result.percentage || 0,
          accuracy: result.overallAccuracy || 0,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return [
      { name: "Start", formattedDate: "", percentage: 0, accuracy: 0 },
      ...chartData
    ];
  }, [tests, results]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Performance Trend</h3>
        <p className="text-sm text-slate-500">Track your marks percentage and accuracy over time.</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="formattedDate" tick={false} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
            />
            <Legend />
            <Line type="linear" dataKey="percentage" name="Score %" stroke="#0047FF" strokeWidth={2} dot={{ r: 4, fill: '#0047FF', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#0047FF' }} />
            <Line type="linear" dataKey="accuracy" name="Accuracy %" stroke="#FF6B00" strokeWidth={2} dot={{ r: 4, fill: '#FF6B00', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#FF6B00' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
