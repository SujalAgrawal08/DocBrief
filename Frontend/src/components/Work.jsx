import React, { useState } from "react";
import {
  Upload,
  FileText,
  RefreshCw,
  MessageCircle,
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import Chatbot from "./chatbot";

function Work() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  const [keyClauses, setKeyClauses] = useState([]);
  const [legalObligations, setLegalObligations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState(null);

  const [loadingStates, setLoadingStates] = useState({
    text: false,
    summary: false,
    clauses: false,
    obligations: false,
  });

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setExtractedText("");
      setSummary("");
      setKeyClauses([]);
      setLegalObligations([]);
      setError(null);
      setLoadingStates({
        text: false,
        summary: false,
        clauses: false,
        obligations: false,
      });
    }
  };

  const processDocument = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setLoadingStates({
      text: true,
      summary: true,
      clauses: true,
      obligations: true,
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/extract_text", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to extract text");
      const data = await response.json();
      setExtractedText(data.text || "No text extracted");
      setLoadingStates((prev) => ({ ...prev, text: false }));

      if (data.text) {
        await fetchData(
          "summarize",
          setSummary,
          "summary",
          data.text,
          "summary"
        );
        await fetchData(
          "extract_clauses",
          setKeyClauses,
          "key_clauses",
          data.text,
          "clauses"
        );
        await fetchData(
          "analyze_legal_text",
          setLegalObligations,
          "obligations",
          data.text,
          "obligations"
        );
      }
    } catch (error) {
      console.error("Error processing document:", error);
      setError("Failed to process document. Please try again.");
      setLoadingStates({
        text: false,
        summary: false,
        clauses: false,
        obligations: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchData = async (endpoint, setter, key, text, loadingKey) => {
    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
      const data = await response.json();
      setter(data[key] || []);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      setError(`Failed to fetch ${endpoint}. Please try again.`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Document Analyzation & Summarization
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="fileUpload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
            <label
              htmlFor="fileUpload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-12 w-12 text-purple-600 mb-4" />
              <span className="text-lg mb-2">Upload your document</span>
              <span className="text-sm text-gray-500">
                Supported formats: PDF, PNG, JPG
              </span>
            </label>
          </div>
          {file && (
            <div className="mt-4">
              <div className="flex items-center justify-between bg-purple-50 p-3 rounded">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-purple-600 mr-2" />
                  <span>{file.name}</span>
                </div>
                <button
                  onClick={processDocument}
                  disabled={isProcessing}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors disabled:bg-purple-300 flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process Document"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        {file && (
          <div className="space-y-6">
            <ContentBox
              title="Extracted Text"
              content={extractedText}
              loading={loadingStates.text}
            />
            <ContentBox
              title="Summary"
              content={summary}
              loading={loadingStates.summary}
            />
            <ListBox
              title="Key Legal Clauses"
              items={keyClauses}
              icon={<FileSearch />}
              loading={loadingStates.clauses}
            />
            <ListBox
              title="Legal Obligations"
              items={legalObligations}
              icon={<ShieldCheck />}
              loading={loadingStates.obligations}
            />
          </div>
        )}
      </div>

      <button
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isChatOpen && <Chatbot />}
    </div>
  );
}

// Spinner Component
const Spinner = () => (
  <div className="flex justify-center items-center h-20">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

// ContentBox Component
const ContentBox = ({ title, content, loading }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="bg-gray-50 p-4 rounded min-h-[96px]">
      {loading ? <Spinner /> : <p className="text-gray-700">{content}</p>}
    </div>
  </div>
);

// ListBox Component
const ListBox = ({ title, items, icon, loading }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
      {icon} {title}
    </h2>
    <div className="bg-gray-50 p-4 rounded min-h-[96px]">
      {loading ? (
        <Spinner />
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={index} className="text-gray-700 mb-2">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

export default Work;
