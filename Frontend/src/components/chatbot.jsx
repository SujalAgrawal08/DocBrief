import { useState } from "react";
import axios from "axios";
import { X, Send } from "lucide-react";

// 1. Accept 'context' as a prop
const Chatbot = ({ context }) => {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    // Optional: Add an initial greeting
    { sender: "bot", text: "Hi! Ask me anything about your document." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user", text: chatInput };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    try {
      // 2. Send both 'chatInput' AND 'context' to the backend
      const response = await axios.post("http://localhost:5000/chatbot", {
        chatInput: userMessage.text,
        context: context || "" // Send empty string if no file uploaded
      });

      const botResponse = response?.data?.reply || "No response from AI.";
      
      setChatHistory((prev) => [...prev, { sender: "bot", text: botResponse }]);
    } catch (error) {
      console.error("Chatbot request failed:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Unable to fetch response. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 bg-white shadow-2xl border border-gray-300 rounded-2xl overflow-hidden z-50">
      {/* Chat Header */}
      <div className="flex justify-between items-center bg-purple-600 text-white p-3">
        <h3 className="text-lg font-semibold">DocBrief Assistant</h3>
        {/* We generally want the close button to be handled by the parent, but for now this is fine */}
      </div>

      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto p-3 bg-gray-50 flex flex-col gap-2">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`p-2 max-w-[80%] rounded-lg text-sm ${
              msg.sender === "user"
                ? "bg-purple-500 text-white self-end ml-auto rounded-br-none"
                : "bg-gray-200 text-black self-start rounded-bl-none"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {/* Loading Indicator */}
        {isLoading && (
          <div className="self-start bg-gray-200 text-black p-2 rounded-lg rounded-bl-none text-sm animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleChatSubmit} className="flex p-2 border-t bg-white">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about the document..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`text-white p-2 ml-2 rounded-lg transition-colors ${
            isLoading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;