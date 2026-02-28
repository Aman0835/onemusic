import React, { useEffect, useRef, useState } from "react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5001/ws/chat");
    wsRef.current = ws;

    ws.onopen = () => console.log("WS Connected");

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => console.log("WS Closed");
    ws.onerror = (err) => console.error("Chat WS Error:", err);

    return () => {
      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() === "") return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(input);
    setInput("");
  };

  return (
    <aside className="w-80 border-l border-gray-800 flex flex-col shrink-0 bg-[#0b0b0b]">
      <div className="flex border-b border-gray-800">
        <button className="flex-1 py-4 text-xs font-bold border-b-2 border-white">
          CHAT
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto text-xs text-gray-300 space-y-2">
        {messages.length === 0 ? (
          <p className="text-zinc-700 text-sm text-center mt-20">
            No messages yet
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className="bg-[#131313] p-2 rounded-md border border-gray-800"
            >
              {msg}
            </div>
          ))
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-gray-800">
        <input
          type="text"
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="w-full bg-[#131313] border border-gray-800 rounded-lg py-2 px-4 text-xs focus:outline-none"
        />
      </div>
    </aside>
  );
};

export default Chat;
