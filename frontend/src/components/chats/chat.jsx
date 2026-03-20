import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const CHAT_WS_BASE = API_BASE.replace(/^http/, "ws");

const Chat = ({ roomName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const user = useSelector((state) => state.user);

  // ------------------ CONNECT WS ------------------
  const connectWS = () => {
    const ws = new WebSocket(`${CHAT_WS_BASE}/ws/chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("CHAT WS Connected");
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.onerror = (err) => console.error("CHAT WS Error:", err);

    ws.onclose = () => {
      console.log("CHAT WS Closed. Reconnecting...");
      reconnectRef.current = setTimeout(connectWS, 1500);
    };
  };

  useEffect(() => {
    connectWS();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  // ------------------ SEND MESSAGE ------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const messagePayload = {
      roomId: roomName,
      senderId: user?.id || "anonymous",
      senderName: user?.firstName || "Unknown",
      text: input,
    };

    // WS send
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messagePayload));
    }

    // Save to DB
    try {
      await fetch(`${API_BASE}/api/chat/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      });
    } catch (e) {
      console.error("Save message error:", e);
    }

    setInput("");
  };

  // ------------------ LOAD HISTORY ------------------
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat/${roomName}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("History load error:", err);
      }
    };
    loadMessages();
  }, [roomName]);


 return (
  <aside className="w-full h-full bg-[#0b0b0b] border-l border-white/5 flex flex-col ">

    {/* Header */}
    <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
      <h2 className="text-lg font-semibold text-white">Room Chat</h2>
      
    </div>

    {/* Messages */}
    <div className="flex-1 p-3 overflow-y-auto flex flex-col space-y-3 scrollbar-hide">

      {messages.length === 0 ? (
        <p className="text-center text-xs text-gray-500 mt-20">No messages yet</p>
      ) : (
        messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3 py-1.5 text-sm rounded-2xl text-white break-words whitespace-pre-wrap ${
              msg.senderName === (user?.firstName || "Guest")
                ? "self-end bg-blue-600 rounded-tr-sm"
                : "self-start bg-zinc-800 rounded-tl-sm"
            }`}
          >
            <span className="font-bold mr-1">{msg.senderName}:</span>
            {msg.text}
          </div>
        ))
      )}

    </div>

    {/* Input */}
    <div className="p-3 border-t border-gray-800">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-lg bg-zinc-900 text-white border border-zinc-700 text-sm focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          Send
        </button>
      </div>
    </div>

  </aside>
);
};

export default Chat;
