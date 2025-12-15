import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Trash2,
  FileText,
  Search,
  Clock,
  Eye,
} from "lucide-react";
import DocumentModal from "./DocumentModal"; // <--- 1. Import Modal
import AnalyticsWidget from "./AnalyticsWidget";
const History = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null); // <--- 2. Add State for Modal
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

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
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent clicking the card from opening the modal
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete item.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* 3. Render Modal if selectedDoc exists */}
      {selectedDoc && (
        <DocumentModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/work")}
            className="flex items-center text-gray-600 hover:text-purple-600 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Workspace
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Analysis History</h1>
        </div>
        {!loading && documents.length > 0 && (
          <AnalyticsWidget documents={documents} />
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading your archives...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No documents found
            </h3>
            <p className="text-gray-500 mb-6">
              You haven't analyzed any documents yet.
            </p>
            <button
              onClick={() => navigate("/work")}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Analyze Your First Document
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition flex flex-col h-full cursor-pointer group"
                onClick={() => setSelectedDoc(doc)} // Make whole card clickable
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-500 flex items-center bg-gray-100 px-2 py-1 rounded">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3
                    className="font-bold text-gray-800 mb-2 truncate"
                    title={doc.file_name}
                  >
                    {doc.file_name || "Untitled Document"}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {doc.summary || "No summary available."}
                  </p>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {doc.actions?.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />{" "}
                        {doc.actions.length} Actions
                      </span>
                    )}
                    {doc.key_clauses?.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
                        <Search className="w-3 h-3 mr-1" />{" "}
                        {doc.key_clauses.length} Clauses
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl group-hover:bg-purple-50/30 transition">
                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    className="text-red-400 hover:text-red-600 text-sm flex items-center transition px-2 py-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>

                  {/* View Details Button logic connects here */}
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="text-purple-600 font-semibold text-sm flex items-center hover:underline"
                  >
                    <Eye className="w-4 h-4 mr-1" /> View Details
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
