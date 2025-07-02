import { useState } from "react";
import axios from "axios";
import { X, Send } from "lucide-react";

const Chatbot = () => {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user", text: chatInput };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");

    try {
      const response = await axios.post("http://localhost:5000/chatbot", {
        chatInput,
      });
      const botResponse = response?.data?.reply || "No response from AI.";

      const botMessage = { sender: "bot", text: botResponse };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot request failed:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Unable to fetch response." },
      ]);
    }
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 bg-white shadow-2xl border border-gray-300 rounded-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex justify-between items-center bg-purple-600 text-white p-3">
        <h3 className="text-lg font-semibold">AI Chatbot</h3>
        <button
          onClick={() => document.getElementById("chatbot").remove()}
        ></button>
      </div>

      {/* Chat Messages */}
      <div className="h-64 overflow-y-auto p-3 bg-gray-50">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`p-2 my-1 max-w-[80%] rounded-lg ${
              msg.sender === "user"
                ? "bg-purple-500 text-white self-end ml-auto"
                : "bg-gray-300 text-black self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleChatSubmit} className="flex p-2 border-t bg-white">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white p-2 ml-2 rounded-lg hover:bg-purple-700"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
