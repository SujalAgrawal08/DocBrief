import React, { useMemo } from "react";
import { BarChart3, Clock, FileText, Zap } from "lucide-react";

const AnalyticsWidget = ({ documents }) => {
  const stats = useMemo(() => {
    let totalDocs = documents.length;
    let totalClauses = 0;
    let totalWords = 0;

    documents.forEach((doc) => {
      // Robust check: Ensure text exists before checking length
      const textLength = doc.extracted_text ? doc.extracted_text.length : 0;
      // Rough estimate: 5 characters = 1 word
      const words = textLength / 5;
      totalWords += words;
      
      // Count clauses safely
      if (doc.key_clauses && Array.isArray(doc.key_clauses)) {
        totalClauses += doc.key_clauses.length;
      }
    });

    // Calculation: 250 words per minute reading speed
    const totalMinutes = totalWords / 250;
    
    // Logic: If less than 60 mins, show minutes. Else show hours.
    let timeDisplay = "";
    if (totalMinutes < 60) {
      // Example: "12 mins" (Round up to at least 1 min if > 0)
      const mins = Math.ceil(totalMinutes);
      timeDisplay = `${mins} min${mins !== 1 ? 's' : ''}`; 
    } else {
      // Example: "1.5 hrs"
      timeDisplay = `${(totalMinutes / 60).toFixed(1)} hrs`;
    }

    return { totalDocs, totalClauses, timeDisplay };
  }, [documents]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Metric 1 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center transition hover:shadow-md">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Documents</p>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalDocs}</h3>
        </div>
      </div>

      {/* Metric 2 (Time Saved) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center transition hover:shadow-md">
        <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Time Saved</p>
          <h3 className="text-2xl font-bold text-gray-800">{stats.timeDisplay}</h3>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center transition hover:shadow-md">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Clauses Found</p>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalClauses}</h3>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsWidget;