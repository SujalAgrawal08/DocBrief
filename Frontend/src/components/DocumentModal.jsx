import React, { useState } from "react";
import {
  X,
  Calendar,
  FileText,
  ShieldCheck,
  FileSearch,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
const DocumentModal = ({ doc, onClose }) => {
  if (!doc) return null;

  const [isPublic, setIsPublic] = useState(doc.is_public);
  const [copied, setCopied] = useState(false);

  const toggleShare = async () => {
    const newValue = !isPublic;
    const { error } = await supabase
      .from("documents")
      .update({ is_public: newValue })
      .eq("id", doc.id);

    if (!error) setIsPublic(newValue);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/report/${doc.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-purple-600 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{doc.file_name}</h2>
            <p className="text-purple-200 text-sm mt-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Analyzed on {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 mr-4">
            {isPublic && (
              <button
                onClick={copyLink}
                className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            )}
            <button
              onClick={toggleShare}
              className={`text-xs px-3 py-1 rounded border transition ${
                isPublic
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-gray-700 text-gray-300 border-gray-600"
              }`}
            >
              {isPublic
                ? "Public (Click to Unshare)"
                : "Private (Click to Share)"}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Summary Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" /> Executive
              Summary
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed border border-gray-100">
              {doc.summary || "No summary available."}
            </div>
          </section>

          {/* Smart Actions Grid */}
          {doc.actions && doc.actions.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Action
                Items
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {doc.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-100 p-3 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-green-900 text-sm">
                        {action.title}
                      </span>
                      <span className="text-xs bg-white text-green-700 px-2 py-0.5 rounded border border-green-200">
                        {action.date}
                      </span>
                    </div>
                    <p className="text-xs text-green-800 mt-1">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Two Column Layout for Clauses & Obligations */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Clauses */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <FileSearch className="w-5 h-5 mr-2 text-blue-600" /> Key
                Clauses
              </h3>
              <ul className="space-y-2">
                {(doc.key_clauses || []).map((clause, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100"
                  >
                    {clause}
                  </li>
                ))}
                {(!doc.key_clauses || doc.key_clauses.length === 0) && (
                  <p className="text-gray-400 italic text-sm">
                    No clauses found.
                  </p>
                )}
              </ul>
            </section>

            {/* Obligations */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-red-600" /> Legal
                Obligations
              </h3>
              <ul className="space-y-2">
                {(doc.obligations || []).map((obl, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-100"
                  >
                    {obl}
                  </li>
                ))}
                {(!doc.obligations || doc.obligations.length === 0) && (
                  <p className="text-gray-400 italic text-sm">
                    No obligations found.
                  </p>
                )}
              </ul>
            </section>
          </div>

          {/* Comparison Result (If applicable) */}
          {doc.comparison_data && (
            <section className="mt-4 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Comparison Notes
              </h3>
              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-100">
                {doc.comparison_data.verdict || "Comparison data available."}
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
