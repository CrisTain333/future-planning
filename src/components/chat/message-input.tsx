"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { IMessage, IUser } from "@/types";

interface MessageInputProps {
  onSend: (content: string, replyTo?: string) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo: IMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, replyTo, onCancelReply, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed, replyTo?._id);
    setContent("");
    onCancelReply();
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
  };

  const replyAuthor = replyTo && typeof replyTo.senderId === "object" ? (replyTo.senderId as IUser).fullName : "";

  return (
    <div className="border-t border-gray-200 p-3">
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-2 py-1 rounded bg-gray-50 border-l-2 border-primary">
          <span className="text-xs text-muted-foreground truncate">
            Replying to <strong>{replyAuthor}</strong>: {replyTo.content}
          </span>
          <button onClick={onCancelReply} className="p-0.5 hover:bg-gray-200 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
