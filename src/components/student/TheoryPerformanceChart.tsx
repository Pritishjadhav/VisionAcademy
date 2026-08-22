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
import { format } from "date-fns";

interface TheoryMark {
  id: string;
  testName: string;
  date: string;
  totalMarks: number;
  marksObtained: number;
}

interface Props {
  marks: TheoryMark[];
}

export function TheoryPerformanceChart({ marks }: Props) {
  const data = useMemo(() => {
    const chartData = [...marks]
      .filter(m => m.marksObtained >= 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => {
        const percentage = m.totalMarks > 0 
          ? Math.round((m.marksObtained / m.totalMarks) * 100) 
          : 0;

        return {
          name: m.testName,
          formattedDate: format(new Date(m.date), 'MMM dd'),
          percentage,
          marksObtained: m.marksObtained,
          totalMarks: m.totalMarks
        };
      });

    return [
      { name: "Start", formattedDate: "", percentage: 0, marksObtained: 0, totalMarks: 0 },
      ...chartData
    ];
  }, [marks]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Theory Marks Progression</h3>
        <p className="text-sm text-slate-500">Track your offline exam scores over time.</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={false} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
            />
            <Legend />
            <Line type="linear" dataKey="percentage" name="Score %" stroke="#0047FF" strokeWidth={2} dot={{ r: 4, fill: '#0047FF', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#0047FF' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
