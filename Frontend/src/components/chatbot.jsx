import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { X, Send, Bot, User, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../apiConfig";

const Chatbot = ({ context }) => {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Hello! I've analyzed your document. What specific details are you looking for?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user", text: chatInput };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot`, {
        chatInput: userMessage.text,
        context: context || "",
      });

      const botResponse = response?.data?.reply || "I couldn't generate a response.";
      setChatHistory((prev) => [...prev, { sender: "bot", text: botResponse }]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Connection error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col border border-slate-100 animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center gap-3">
        <div className="bg-purple-500 p-1.5 rounded-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">DocBrief Assistant</h3>
          <p className="text-slate-400 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Online & Ready
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-80 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-purple-100" : "bg-slate-200"
              }`}
            >
              {msg.sender === "user" ? (
                <User className="w-4 h-4 text-purple-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-slate-600" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] shadow-sm ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white rounded-tr-none"
                  : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-slate-600" />
             </div>
             <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !chatInput.trim()}
            className="absolute right-2 top-2 p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;