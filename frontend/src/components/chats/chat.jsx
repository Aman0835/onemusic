import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { API_BASE, WS_BASE } from "../../api/config";

const WS_URL = WS_BASE;

const Chat = ({ roomName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const user = useSelector((state) => state.user);

  // ------------------ CONNECT WS ------------------
  const connectWS = () => {
    const ws = new WebSocket(`${WS_URL}/ws/chat`);
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
      senderPhotoUrl: user?.photoUrl || null,
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
        credentials: "include",
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
        const res = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(roomName)}`, {
          credentials: "include",
        });
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
        messages.map((msg, i) => {
          const isMe = msg.senderId === (user?.id || "anonymous") || msg.senderName === (user?.firstName || "Guest");
          const photoSrc = msg.senderPhotoUrl || (isMe && user?.photoUrl ? user.photoUrl : `https://ui-avatars.com/api/?name=${msg.senderName || "U"}&background=random`);
          
          return (
            <div key={i} className={`flex items-end gap-2 max-w-[85%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>
              <img src={photoSrc} alt={msg.senderName} className="w-6 h-6 rounded-full shrink-0" />
              <div
                className={`px-3 py-1.5 text-sm rounded-2xl text-white break-words whitespace-pre-wrap ${
                  isMe
                    ? "bg-blue-600 rounded-br-sm"
                    : "bg-zinc-800 rounded-bl-sm"
                }`}
              >
                {!isMe && <div className="font-bold text-xs text-zinc-400 mb-0.5">{msg.senderName}</div>}
                {msg.text}
              </div>
            </div>
          );
        })
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
