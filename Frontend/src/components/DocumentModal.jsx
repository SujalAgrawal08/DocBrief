import React, { useState } from "react";
import {
  X,
  Calendar,
  FileText,
  ShieldCheck,
  FileSearch,
  CheckCircle,
  Copy,
  Globe,
  Lock,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const DocumentModal = ({ doc, onClose, onUpdate }) => {
  if (!doc) return null;

  const [isPublic, setIsPublic] = useState(doc.is_public);
  const [copied, setCopied] = useState(false);

  const toggleShare = async () => {
    const newValue = !isPublic;

    const { error } = await supabase
      .from("documents")
      .update({ is_public: newValue })
      .eq("id", doc.id);

    if (!error) {
      setIsPublic(newValue);
      // Tell the parent (History.jsx) to update its data!
      if (onUpdate) {
        onUpdate({ ...doc, is_public: newValue });
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/report/${doc.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider rounded-md">
                Analysis Report
              </span>
              <span className="text-slate-400 text-sm flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                {new Date(doc.created_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {doc.file_name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Actions
          </div>
          <div className="flex items-center gap-3">
            {isPublic && (
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            )}
            <button
              onClick={toggleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition shadow-sm ${
                isPublic
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {isPublic ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              {isPublic ? "Public Access On" : "Private Document"}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto bg-white space-y-10">
          {/* Executive Summary */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              Executive Summary
            </h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed text-sm sm:text-base">
              {doc.summary || "No summary available."}
            </div>
          </section>

          {/* Action Items */}
          {doc.actions && doc.actions.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                Action Items & Deadlines
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {doc.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-green-200 hover:bg-green-50/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-800 text-sm">
                        {action.title}
                      </span>
                      <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
                        {action.date}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Clauses */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <FileSearch className="w-5 h-5 text-blue-600" />
                </div>
                Key Clauses
              </h3>
              <ul className="space-y-3">
                {(doc.key_clauses || []).map((clause, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50"
                  >
                    {clause}
                  </li>
                ))}
              </ul>
            </section>

            {/* Obligations */}
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                </div>
                Legal Obligations
              </h3>
              <ul className="space-y-3">
                {(doc.obligations || []).map((obl, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-slate-600 bg-red-50/50 p-3 rounded-lg border border-red-100/50"
                  >
                    {obl}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white p-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
