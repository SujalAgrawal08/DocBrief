import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  Upload,
  FileText,
  RefreshCw,
  MessageCircle,
  FileSearch,
  ShieldCheck,
  Calendar,
  PlusCircle,
  Split,
  CheckCircle,
  AlertTriangle,
  Clock,
  LogOut,
  Brain,
  Layout,
  ArrowRight,
  X,
} from "lucide-react";
import Chatbot from "./chatbot";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";
function Work() {
  // --- STATE MANAGEMENT ---
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  const [keyClauses, setKeyClauses] = useState([]);
  const [legalObligations, setLegalObligations] = useState([]);
  const [actions, setActions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState(null);

  // Comparison Mode State
  const [mode, setMode] = useState("single");
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);

  const [user, setUser] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    text: false,
    summary: false,
    clauses: false,
    obligations: false,
  });

  const navigate = useNavigate();

  // --- EFFECTS ---
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        // Optional: Redirect if not logged in
        // navigate("/login");
      }
    };
    getUser();
  }, []);

  // --- HANDLERS ---
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const downloadPDF = () => {
    if (!summary) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(88, 28, 135); // Purple
    doc.text("DocBrief Analysis Report", margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 30);
    doc.text(`File: ${file?.name || "Untitled"}`, margin, 35);

    let yPos = 50;

    // 1. Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Executive Summary", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(50);
    const splitSummary = doc.splitTextToSize(summary, maxLineWidth);
    doc.text(splitSummary, margin, yPos);
    yPos += splitSummary.length * 5 + 10;

    // 2. Actions (If any)
    if (actions.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      } // Page break check
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Action Items", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(50);
      actions.forEach((action) => {
        const line = `• [${action.date}] ${action.title}`;
        doc.text(line, margin, yPos);
        yPos += 7;
      });
      yPos += 10;
    }

    // 3. Clauses
    if (keyClauses.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Key Clauses", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(50);
      keyClauses.forEach((clause) => {
        const cleanClause = clause.replace(/•/g, "").trim();
        const lines = doc.splitTextToSize(`• ${cleanClause}`, maxLineWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 5 + 3;
      });
    }

    doc.save("DocBrief_Report.pdf");
  };
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setExtractedText("");
      setSummary("");
      setKeyClauses([]);
      setLegalObligations([]);
      setActions([]);
      setError(null);
      setLoadingStates({
        text: false,
        summary: false,
        clauses: false,
        obligations: false,
      });
    }
  };

  const saveToDatabase = async (analysisResult, text) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("documents").insert([
        {
          user_id: user.id,
          file_name: file?.name || "Untitled",
          extracted_text: text,
          summary: analysisResult.summary,
          key_clauses: analysisResult.key_clauses,
          obligations: analysisResult.obligations,
          actions: analysisResult.actions,
        },
      ]);
      if (error) console.error("Supabase Save Error:", error);
    } catch (err) {
      console.error("Database error:", err);
    }
  };

  const addToCalendar = (action) => {
    const dateStr = action.date.replace(/-/g, "");
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${
      action.title
    }\nDTSTART;VALUE=DATE:${dateStr}\nDESCRIPTION:${
      action.description || "Generated by DocBrief"
    }\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${action.title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExtract = async (uploadedFile, setTextFn) => {
    const formData = new FormData();
    formData.append("file", uploadedFile);
    try {
      const response = await fetch("http://localhost:5000/extract_text", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setTextFn(data.text || "");
      return data.text;
    } catch (error) {
      console.error("Extraction failed", error);
      alert("Failed to read file.");
    }
  };

  const handleCompare = async () => {
    if (!text1 || !text2) {
      alert("Please upload both documents first.");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch("http://localhost:5000/compare_documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text1, text2 }),
      });
      const data = await response.json();
      setComparisonResult(data);
    } catch (error) {
      console.error("Comparison failed", error);
    } finally {
      setIsProcessing(false);
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
      const textResponse = await fetch("http://localhost:5000/extract_text", {
        method: "POST",
        body: formData,
      });

      if (!textResponse.ok) throw new Error("Failed to extract text");
      const textData = await textResponse.json();
      const extracted = textData.text || "No text extracted";

      setExtractedText(extracted);
      setLoadingStates((prev) => ({ ...prev, text: false }));

      if (extracted && extracted !== "No text extracted") {
        const analyzeResponse = await fetch(
          "http://localhost:5000/analyze_document",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: extracted }),
          }
        );

        if (!analyzeResponse.ok)
          throw new Error(
            analyzeResponse.status === 429
              ? "Server busy. Please wait."
              : "Analysis failed"
          );

        const result = await analyzeResponse.json();
        setSummary(result.summary || "No summary generated.");
        setKeyClauses(result.key_clauses || []);
        setLegalObligations(result.obligations || []);
        setActions(result.actions || []);
        saveToDatabase(result, extracted);
      }
    } catch (error) {
      console.error("Error processing document:", error);
      setError(error.message || "Failed to process document.");
    } finally {
      setLoadingStates({
        text: false,
        summary: false,
        clauses: false,
        obligations: false,
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. WORKSPACE HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Area */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-purple-600 p-1.5 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">
              DocBrief Workspace
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/history")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:text-purple-600 transition-all"
            >
              <Clock className="w-4 h-4" /> History
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-all"
            >
              <LogOut className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 2. MODE SWITCHER */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1 rounded-full flex shadow-sm border border-slate-200">
            <button
              onClick={() => setMode("single")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                mode === "single"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" /> Single Analysis
            </button>
            <button
              onClick={() => setMode("compare")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                mode === "compare"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Split className="w-4 h-4" /> Compare Docs
            </button>
          </div>
        </div>

        {/* ================= SINGLE MODE ================= */}
        {mode === "single" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* File Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center transition-all hover:shadow-md">
              {!file ? (
                <>
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Upload your document
                  </h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    Drag and drop your file here, or click the button below. We
                    support PDF, PNG, JPG, and TXT files.
                  </p>
                  <input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  <label
                    htmlFor="fileUpload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl cursor-pointer transition-all shadow-lg shadow-purple-200"
                  >
                    Select File
                  </label>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-900">
                        {file.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(2)} KB • Ready to process
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setFile(null)}
                      className="flex-1 sm:flex-none px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition"
                    >
                      Remove
                    </button>
                    <button
                      onClick={processDocument}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all disabled:opacity-70 shadow-lg"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Layout className="w-4 h-4" />
                      )}
                      {isProcessing ? "Analyzing..." : "Process Document"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Results Grid */}
            {extractedText && (
              <div className="space-y-6">
                {/* Summary (Full Width) */}
                <ContentBox
                  title="Executive Summary"
                  icon={<FileText className="w-5 h-5 text-purple-600" />}
                  content={summary}
                  loading={loadingStates.summary}
                  fullWidth
                />

                {/* Split Layout */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Actions */}
                  <ActionBox
                    items={actions}
                    loading={loadingStates.obligations}
                    onAdd={addToCalendar}
                  />

                  {/* Clauses */}
                  <ListBox
                    title="Key Legal Clauses"
                    items={keyClauses}
                    icon={<FileSearch className="w-5 h-5 text-blue-600" />}
                    loading={loadingStates.clauses}
                    colorClass="bg-blue-50 text-blue-700 border-blue-100"
                  />

                  {/* Obligations */}
                  <ListBox
                    title="Legal Obligations"
                    items={legalObligations}
                    icon={<ShieldCheck className="w-5 h-5 text-red-600" />}
                    loading={loadingStates.obligations}
                    colorClass="bg-red-50 text-red-700 border-red-100"
                  />

                  {/* Raw Text Preview */}
                  <ContentBox
                    title="Extracted Text Preview"
                    icon={<Layout className="w-5 h-5 text-slate-500" />}
                    content={extractedText.slice(0, 500) + "..."}
                    loading={loadingStates.text}
                    isCode
                  />
                </div>
                {summary && (
                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <button
                      onClick={downloadPDF}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold"
                    >
                      <Download className="w-5 h-5" /> Download PDF Report
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= COMPARE MODE ================= */}
        {mode === "compare" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <UploadDropzone
                label="Document A"
                text={text1}
                onUpload={(e) => handleExtract(e.target.files[0], setText1)}
                color="purple"
              />
              <UploadDropzone
                label="Document B"
                text={text2}
                onUpload={(e) => handleExtract(e.target.files[0], setText2)}
                color="indigo"
              />
            </div>

            <div className="text-center mb-10">
              <button
                onClick={handleCompare}
                disabled={!text1 || !text2 || isProcessing}
                className="bg-slate-900 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl flex items-center gap-3 mx-auto"
              >
                {isProcessing ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <Split />
                )}
                Run Comparison
              </button>
            </div>

            {comparisonResult && <ComparisonBox result={comparisonResult} />}
          </div>
        )}
      </main>

      {/* Floating Chat Button */}
      <button
        className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all z-50 group"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        {isChatOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          Ask AI
        </span>
      </button>

      {isChatOpen && <Chatbot context={extractedText} />}
    </div>
  );
}

/* --- SUB-COMPONENTS (Styled for SaaS Look) --- */

const Spinner = () => (
  <div className="flex justify-center items-center h-20">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

const ContentBox = ({ title, icon, content, loading, fullWidth, isCode }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${
      fullWidth ? "col-span-full" : ""
    }`}
  >
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
      {icon}
      <h2 className="font-bold text-slate-800">{title}</h2>
    </div>
    <div className="p-6">
      {loading ? (
        <Spinner />
      ) : (
        <div
          className={`text-slate-600 leading-relaxed ${
            isCode ? "font-mono text-xs bg-slate-50 p-4 rounded-lg" : ""
          }`}
        >
          {content}
        </div>
      )}
    </div>
  </div>
);

const ListBox = ({ title, items, icon, loading, colorClass }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
      {icon}
      <h2 className="font-bold text-slate-800">{title}</h2>
    </div>
    <div className="p-6">
      {loading ? (
        <Spinner />
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className={`text-sm p-3 rounded-lg border ${colorClass}`}
            >
              {item}
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-slate-400 italic text-sm">No items found.</p>
          )}
        </ul>
      )}
    </div>
  </div>
);

const ActionBox = ({ items, loading, onAdd }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
    <div className="px-6 py-4 border-b border-slate-100 bg-green-50/10 flex items-center gap-3">
      <Calendar className="w-5 h-5 text-green-600" />
      <h2 className="font-bold text-slate-800">Smart Actions</h2>
    </div>
    <div className="p-6">
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 italic text-sm">
            No deadlines detected.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-green-200 hover:shadow-md transition group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 text-sm">
                  {item.title}
                </h3>
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {item.date}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{item.description}</p>
              <button
                onClick={() => onAdd(item)}
                className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 hover:text-white transition-colors"
              >
                <PlusCircle size={14} /> Add to Calendar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const UploadDropzone = ({ label, text, onUpload, color }) => (
  <div
    className={`bg-white p-8 rounded-2xl shadow-sm border-2 border-dashed transition-all text-center ${
      text
        ? `border-${color}-500 bg-${color}-50/30`
        : "border-slate-300 hover:border-slate-400"
    }`}
  >
    <div
      className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}
    >
      <FileText className={`w-6 h-6 text-${color}-600`} />
    </div>
    <h3 className="font-bold text-slate-700 mb-4">{label}</h3>
    <input
      type="file"
      onChange={onUpload}
      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
    />
    {text && (
      <div className="mt-4 inline-flex items-center text-green-600 bg-white px-3 py-1 rounded-full shadow-sm text-sm font-medium">
        <CheckCircle className="h-4 w-4 mr-1.5" /> Text Extracted
      </div>
    )}
  </div>
);

const ComparisonBox = ({ result }) => {
  if (!result) return null;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Split className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Comparison Result</h2>
      </div>

      <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8">
        <h3 className="font-bold text-blue-800 mb-2">AI Verdict</h3>
        <p className="text-blue-900 leading-relaxed">{result.verdict}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-red-600 flex items-center gap-2 mb-4 border-b border-red-100 pb-2">
            <AlertTriangle size={18} /> Key Differences
          </h3>
          <ul className="space-y-3">
            {result.differences.map((diff, i) => (
              <li
                key={i}
                className="text-sm text-slate-700 bg-red-50/50 p-3 rounded-lg border border-red-50"
              >
                {diff}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-green-600 flex items-center gap-2 mb-4 border-b border-green-100 pb-2">
            <CheckCircle size={18} /> Similarities
          </h3>
          <ul className="space-y-3">
            {result.similarities.map((sim, i) => (
              <li
                key={i}
                className="text-sm text-slate-700 bg-green-50/50 p-3 rounded-lg border border-green-50"
              >
                {sim}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Work;
