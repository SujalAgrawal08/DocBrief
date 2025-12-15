import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { 
  FileText, Calendar, ShieldCheck, FileSearch, 
  Lock, Brain, CheckCircle 
} from "lucide-react";

const SharedReport = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("This report is private or has been removed.");
      } else {
        setDoc(data);
      }
      setLoading(false);
    };

    fetchReport();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
           <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-400" />
           </div>
           <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
           <p className="text-slate-500">{error}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-center gap-2">
         <div className="bg-purple-600 p-1.5 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
         </div>
         <span className="font-bold text-slate-800 text-lg">DocBrief Report</span>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Document Header */}
        <div className="bg-slate-900 text-white p-8 sm:p-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6">
             <FileText className="w-3 h-3" /> Public Analysis
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">{doc.file_name}</h1>
          <p className="text-slate-400 flex items-center justify-center text-sm">
            <Calendar className="w-4 h-4 mr-2" /> 
            Generated on {new Date(doc.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
        </div>

        <div className="p-8 sm:p-12 space-y-12">
          
          {/* Executive Summary */}
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-purple-500 pl-4">
               Executive Summary
            </h3>
            <div className="text-slate-700 leading-loose text-lg font-light">
              {doc.summary}
            </div>
          </section>

          {/* Grid Layout */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Key Clauses */}
            <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
               <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                 <div className="p-1.5 bg-blue-100 rounded text-blue-700">
                    <FileSearch className="w-5 h-5" />
                 </div>
                 Key Clauses
               </h3>
               <ul className="space-y-4">
                 {(doc.key_clauses || []).map((item, i) => (
                   <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="text-blue-400 mt-1">•</span>
                      {item}
                   </li>
                 ))}
               </ul>
            </section>

            {/* Obligations */}
            <section className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
               <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                 <div className="p-1.5 bg-red-100 rounded text-red-700">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 Obligations
               </h3>
               <ul className="space-y-4">
                 {(doc.obligations || []).map((item, i) => (
                   <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="text-red-400 mt-1">•</span>
                      {item}
                   </li>
                 ))}
               </ul>
            </section>
          </div>
          
          {/* Actions Section */}
          {doc.actions && doc.actions.length > 0 && (
            <section>
               <h3 className="text-xl font-bold text-slate-900 mb-6 border-l-4 border-green-500 pl-4">
                  Action Items
               </h3>
               <div className="grid sm:grid-cols-2 gap-4">
                  {doc.actions.map((action, idx) => (
                     <div key={idx} className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                           <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900">{action.title}</span>
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                 {action.date}
                              </span>
                           </div>
                           <p className="text-sm text-slate-500">{action.description}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
          )}

        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
            <p className="text-slate-400 text-sm">
               Analysis performed by DocBrief AI • {new Date().getFullYear()}
            </p>
        </div>
      </div>
    </div>
  );
};

export default SharedReport;