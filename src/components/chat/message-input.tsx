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

  // Auto-grow textarea up to 4 lines
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * 4 + 20; // 4 lines + padding
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [content]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed, replyTo?._id);
    setContent("");
    onCancelReply();
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
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
    <div className="bg-white border-t border-gray-200 px-3 md:px-4 py-2 md:py-3 flex-shrink-0">
      {/* Reply preview strip */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-gray-50 border-l-[3px] border-l-[hsl(181,87%,31%)]">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[hsl(181,87%,31%)] block">
              Replying to {replyAuthor}
            </span>
            <span className="text-xs text-gray-500 truncate block">{replyTo.content}</span>
          </div>
          <button
            onClick={onCancelReply}
            className="flex-shrink-0 h-5 w-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-200"
          >
            <X className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-gray-100 rounded-3xl px-4 py-2.5 flex items-end gap-2 min-h-[44px]">
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 leading-5 max-h-[100px]"
            style={{ height: "20px" }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="flex-shrink-0 h-11 w-11 rounded-full bg-[hsl(181,87%,31%)] text-white flex items-center justify-center
            hover:bg-[hsl(181,87%,26%)] disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
