import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  FileText,
  Search,
  Calendar,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";
import DocumentModal from "./DocumentModal";
import AnalyticsWidget from "./AnalyticsWidget";

const History = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDocs(documents);
    } else {
      const filtered = documents.filter((doc) =>
        doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocs(filtered);
    }
  }, [searchQuery, documents]);

  const fetchHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      setFilteredDocs(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document? This action cannot be undone."))
      return;

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      const updated = documents.filter((doc) => doc.id !== id);
      setDocuments(updated);
      setFilteredDocs(updated);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };
  const handleDocUpdate = (updatedDoc) => {
    const updateList = (list) =>
      list.map((d) => (d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d));

    setDocuments((prev) => updateList(prev));
    setFilteredDocs((prev) => updateList(prev));

    setSelectedDoc((prev) => ({ ...prev, ...updatedDoc }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      {selectedDoc && (
        <DocumentModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={handleDocUpdate} 
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate("/work")}
              className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Workspace
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              Document History
            </h1>
          </div>

          {/* Search Bar - Clean & Minimal */}
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-shadow shadow-sm"
            />
          </div>
        </div>

        {/* Analytics Widget Wrapper */}
        {!loading && documents.length > 0 && (
          <div className="mb-10">
            <AnalyticsWidget documents={documents} />
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-purple-600"></div>
            <p className="text-slate-500 mt-4 text-sm">Loading archives...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-lg border border-slate-200 border-dashed">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {searchQuery ? "No matches found" : "No documents yet"}
            </h3>
            <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto">
              {searchQuery
                ? "Try checking for typos or using a different keyword."
                : "Upload and analyze a document to start building your history."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate("/work")}
                className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Start Analysis
              </button>
            )}
          </div>
        ) : (
          /* Professional Card Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="group relative bg-white rounded-lg border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
              >
                {/* Header Row */}
                <div className="p-5 border-b border-slate-50 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="shrink-0 w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                        <FileText className="w-5 h-5 text-slate-500 group-hover:text-purple-600 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="font-semibold text-slate-900 text-base truncate pr-2"
                          title={doc.file_name}
                        >
                          {doc.file_name || "Untitled"}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center mt-0.5">
                          {new Date(doc.created_at).toLocaleDateString()}
                          <span className="mx-1.5">•</span>
                          {new Date(doc.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Excerpt */}
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {doc.summary || "No summary available for this document."}
                  </p>

                  {/* Tags / Metadata */}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {doc.actions?.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Calendar className="w-3 h-3 mr-1" />
                        {doc.actions.length} Action
                        {doc.actions.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {doc.key_clauses?.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <Shield className="w-3 h-3 mr-1" />
                        {doc.key_clauses.length} Clause
                        {doc.key_clauses.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {doc.comparison_data && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                        <Zap className="w-3 h-3 mr-1" /> Comparison
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="px-5 py-3 bg-slate-50 rounded-b-lg border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-purple-600 flex items-center group-hover:underline">
                    View Report <ChevronRight className="w-3 h-3 ml-1" />
                  </span>

                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
