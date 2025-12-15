import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  Brain,
  Code,
  Zap,
  ChevronRight,
  Github,
  Twitter,
  MapPin,
  Phone,
  Mail,
  ScrollText,
  Blocks,
  Instagram,
  Facebook,
} from "lucide-react";
import LS from "./components/LS";
import Work from "./components/Work";
import History from "./components/History";
import SharedReport from "./components/SharedReport"

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-purple-600" />
            <span
              className="text-xl font-bold cursor-pointer"
              onClick={() => navigate("/")}
            >
              DocBrief
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Contact
            </a>
            <button
              onClick={() => navigate("/work")}
              className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              AI-Powered Summarization for Smarter Insights
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transforming lengthy documents into concise, meaningful summaries
              with cutting-edge AI for faster and more efficient information
              processing.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate("/work")}
                className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition-colors flex items-center"
              >
                Get Started <ChevronRight className="ml-2 h-5 w-5" />
              </button>
              <button
                id="about"
                className="border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-full hover:bg-purple-50 transition-colors cursor-pointer"
                onClick={() =>
                  document
                    .getElementById("about")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
              alt="AI Technology"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* About us */}
      <section id="about" className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1674027444485-cec3da58eef4?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="AI Technology"
              className="rounded-lg shadow-2xl"
            />
          </div>
          <div className="ml-4 md:w-1/2 mb-12 md:mb-0">
            <h2 className="text-3xl font-bold text-center mb-1.5">About Us</h2>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Transforming Documents into Meaningful Summaries
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              At DocBrief, we revolutionize the way you interact with
              information. Our AI-powered platform extracts key insights from
              lengthy documents, providing concise and accurate summaries in
              seconds. DocBrief is designed to provide a futuristic, efficient,
              and intuitive summarization experience. Stay ahead with smart
              document insights—because every word matters.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission */}

      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h2 className="text-4xl font-bold text-center mb-1.5">
              Our Mission
            </h2>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Simplifying Information, Enhancing Productivity
            </h1>
            <p className="text-xl text-gray-600 mb-8 mr-2">
              We are committed to making information processing seamless and
              efficient. Lengthy, non-machine-readable documents often slow down
              productivity, making it difficult to extract key insights. Our
              AI-powered platform transforms these documents into concise,
              structured summaries, ensuring faster access to essential
              information. By leveraging advanced NLP, we help professionals,
              students, and researchers save time and focus on what truly
              matters—understanding and utilizing knowledge effectively.
            </p>
          </div>
          <div className="md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&h=420&w=800"
              alt="AI Technology"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <Zap className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Time-Saving Efficiency{" "}
              </h3>
              <p className="text-gray-600">
                Quickly grasp essential points without sifting through pages.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <ScrollText className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                AI-Driven Analysis & Summarization
              </h3>
              <p className="text-gray-600">
                Leverage advanced natural language processing for precise
                results.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <Code className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Intelligent AI Chatbot
              </h3>
              <p className="text-gray-600">
                Instant answers and document insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}

      <footer id="contact" className="bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Branding Section */}
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="text-lg font-semibold text-gray-800">
                DocBrief
              </span>
            </div>

            {/* Contact Information */}
            <div className="flex flex-col items-center md:items-start space-y-2 text-gray-600 mt-5">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span>123 AI Street, Tech City, 45678</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-purple-600" />
                <span>+1 (123) 456-7890</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <span>contact@docbrief.com</span>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="flex space-x-6 mt-6 md:mt-0">
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="mt-10 text-center text-gray-500">
            © 2025 DocBrief. All rights reserved.
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
