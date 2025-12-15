import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Brain,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Github,
  Twitter,
  Mail,
  Users,
  LogIn // Imported Icon
} from "lucide-react";
import LS from "./components/LS";
import Work from "./components/Work";
import History from "./components/History";
import SharedReport from "./components/SharedReport";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* 1. Navbar with Login Button */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/20 bg-white/80 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-6 py-4">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="bg-purple-600 p-2 rounded-lg group-hover:bg-purple-700 transition-colors">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="self-center text-2xl font-bold whitespace-nowrap text-slate-800 tracking-tight">
              DocBrief
            </span>
          </div>

          <div className="flex md:order-2 space-x-3 md:space-x-4 rtl:space-x-reverse items-center">
            {/* NEW LOGIN BUTTON */}
            <button
              onClick={() => navigate("/login")}
              className="hidden md:flex items-center gap-2 text-slate-600 hover:text-purple-600 font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
            
            <button
              onClick={() => navigate("/login")} // Changed to /login for 'Get Started' too, to ensure auth
              className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 rounded-full text-center transition-all shadow-lg shadow-purple-200 hover:shadow-purple-400 hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
          </div>

          <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1">
            <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
              {["Features", "Mission", "About"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="block py-2 px-3 text-slate-600 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-purple-600 md:p-0 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 opacity-30 translate-x-1/3 -translate-y-1/4">
          <div className="w-[600px] h-[600px] bg-purple-300 rounded-full blur-3xl filter mix-blend-multiply"></div>
        </div>
        <div className="absolute bottom-0 left-0 -z-10 opacity-30 -translate-x-1/3 translate-y-1/4">
          <div className="w-[500px] h-[500px] bg-indigo-300 rounded-full blur-3xl filter mix-blend-multiply"></div>
        </div>

        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
            </span>
            v2.0 Now Live: Smart Action Extraction
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
            Turn Lengthy Docs into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Actionable Insights
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop drowning in PDFs. DocBrief uses advanced AI to summarize,
            extract deadlines, and answer questions about your documents in
            seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-slate-900 rounded-full hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              Try DocBrief Now <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all"
            >
              How it Works
            </button>
          </div>

          <div className="mt-16 relative mx-auto max-w-5xl">
            <div className="rounded-2xl bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-900/10">
              <img
                src="https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?auto=format&fit=crop&q=80&w=2000"
                alt="App Dashboard"
                className="rounded-xl shadow-inner opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to digest content faster
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our powerful AI pipeline handles the heavy lifting so you can focus
              on decision making.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Instant Summaries
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Paste text or upload a PDF. Get a concise, bulleted executive
                summary that captures the core message without the fluff.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Legal & Technical Analysis
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Specifically tuned to identify key clauses, obligations, and
                technical specifications that generic tools often miss.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Collaborative History
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Keep a secure archive of all your analyses. Share reports with
                teammates via secure, generated links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <span className="font-bold text-slate-800 text-lg">DocBrief</span>
          </div>
          <div className="text-slate-500 text-sm">
            © 2025 DocBrief. Built for productivity.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-purple-600 transition">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-purple-600 transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-purple-600 transition">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LS />} />
      <Route path="/work" element={<Work />} />
      <Route path="/history" element={<History />} />
      <Route path="/report/:id" element={<SharedReport />} />
    </Routes>
  );
}

export default App;