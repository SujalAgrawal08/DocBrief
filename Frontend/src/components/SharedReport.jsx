import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FileText, Calendar, CheckCircle, FileSearch, ShieldCheck, Lock } from "lucide-react";

const SharedReport = () => {
  const { id } = useParams(); // Get the ID from the URL
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      // Fetch document. RLS will block this if is_public is false!
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("This report is private or does not exist.");
      } else {
        setDoc(data);
      }
      setLoading(false);
    };

    fetchReport();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading Report...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <Lock className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold">{error}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-purple-700 text-white p-8">
          <div className="flex items-center space-x-2 opacity-80 mb-2">
            <FileText className="w-5 h-5" />
            <span className="uppercase tracking-wider text-sm font-bold">DocBrief Analysis Report</span>
          </div>
          <h1 className="text-3xl font-bold">{doc.file_name}</h1>
          <p className="mt-2 text-purple-200 flex items-center">
            <Calendar className="w-4 h-4 mr-2" /> Generated on {new Date(doc.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Content (Reusing your styles) */}
        <div className="p-8 space-y-8">
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Executive Summary</h3>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg border border-gray-100">
              {doc.summary}
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <section>
               <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-3">
                 <FileSearch className="w-5 h-5" /> Key Clauses
               </h3>
               <ul className="space-y-2">
                 {(doc.key_clauses || []).map((item, i) => (
                   <li key={i} className="bg-blue-50 text-blue-900 p-3 rounded text-sm">{item}</li>
                 ))}
               </ul>
            </section>
            <section>
               <h3 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                 <ShieldCheck className="w-5 h-5" /> Obligations
               </h3>
               <ul className="space-y-2">
                 {(doc.obligations || []).map((item, i) => (
                   <li key={i} className="bg-red-50 text-red-900 p-3 rounded text-sm">{item}</li>
                 ))}
               </ul>
            </section>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
            Powered by <strong>DocBrief AI</strong>
        </div>
      </div>
    </div>
  );
};

export default SharedReport;