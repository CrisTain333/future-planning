"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";

interface InCallMessage {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface InCallChatProps {
  messages: InCallMessage[];
  onSend: (content: string) => void;
  onClose: () => void;
  currentUserId: string;
}

export function InCallChat({ messages, onSend, onClose, currentUserId }: InCallChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-sm font-medium text-white">In-call Chat</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i}>
            <span className="text-xs font-medium text-blue-400">{msg.senderId === currentUserId ? "You" : msg.senderName}</span>
            <p className="text-sm text-gray-200">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Type a message..." className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-gray-500" />
          <button onClick={handleSend} disabled={!input.trim()} className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
