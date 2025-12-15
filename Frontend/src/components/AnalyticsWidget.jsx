import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Clock, FileText, Zap, TrendingUp, Activity } from "lucide-react";

const AnalyticsWidget = ({ documents }) => {
  const stats = useMemo(() => {
    let totalDocs = documents.length;
    let totalClauses = 0;
    let totalWords = 0;

    // Prepare data for the chart (Last 7 documents to keep it clean)
    const chartData = documents
      .slice(0, 7)
      .reverse() // Show oldest to newest
      .map((doc) => ({
        name: doc.file_name?.substring(0, 10) + (doc.file_name?.length > 10 ? "..." : ""),
        clauses: doc.key_clauses?.length || 0,
        actions: doc.actions?.length || 0,
      }));

    documents.forEach((doc) => {
      const textLength = doc.extracted_text ? doc.extracted_text.length : 0;
      totalWords += textLength / 5;
      if (doc.key_clauses && Array.isArray(doc.key_clauses)) {
        totalClauses += doc.key_clauses.length;
      }
    });

    const totalMinutes = totalWords / 250;
    let timeDisplay =
      totalMinutes < 60
        ? `${Math.ceil(totalMinutes)} min`
        : `${(totalMinutes / 60).toFixed(1)} hrs`;

    return { totalDocs, totalClauses, timeDisplay, chartData };
  }, [documents]);

  const StatCard = ({ label, value, subtext, icon: Icon, trend }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 hover:border-purple-300 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 mr-1" /> {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mb-10">
      {/* 1. KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Documents Processed"
          value={stats.totalDocs}
          icon={FileText}
          trend="+12%"
        />
        <StatCard
          label="Hours Saved"
          value={stats.timeDisplay}
          icon={Clock}
          trend="High Efficiency"
        />
        <StatCard
          label="Clauses Extracted"
          value={stats.totalClauses}
          icon={Zap}
          trend="AI Accuracy"
        />
      </div>

      {/* 2. Analysis Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Document Complexity Analysis
            </h3>
            <p className="text-sm text-slate-500">
              Visualizing the density of legal clauses per document.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748B", fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748B", fontSize: 12 }} 
              />
              <Tooltip 
                cursor={{ fill: "#F1F5F9" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Bar dataKey="clauses" name="Clauses" radius={[4, 4, 0, 0]} barSize={40}>
                {stats.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="url(#colorGradient)" />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;