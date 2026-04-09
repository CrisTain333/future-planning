"use client";

import { IMessage, IUser } from "@/types";
import dayjs from "dayjs";
import { Trash2, Reply, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  showSender?: boolean;
  onDelete?: (messageId: string) => void;
  onReply?: (message: IMessage) => void;
}

export function MessageBubble({ message, isOwn, showSender = true, onDelete, onReply }: MessageBubbleProps) {
  const sender = typeof message.senderId === "object" ? (message.senderId as IUser) : null;

  // Deleted message state
  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 mb-1`}>
        <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-400 text-sm italic border border-gray-200">
          This message was deleted
        </div>
      </div>
    );
  }

  const replyMessage = message.replyTo && typeof message.replyTo === "object" ? (message.replyTo as IMessage) : null;
  const isRead = message.readBy && message.readBy.length > 1;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 mb-1 group`}>
      {/* Avatar placeholder for non-own messages — keeps alignment consistent */}
      {!isOwn && (
        <div className="flex-shrink-0 w-8 mr-2 flex items-end">
          {showSender && sender ? (
            <div className="h-7 w-7 rounded-full bg-[hsl(181,87%,31%)] flex items-center justify-center text-[11px] font-semibold text-white">
              {sender.fullName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="h-7 w-7" />
          )}
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] md:max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name — only show on first in group */}
        {!isOwn && showSender && sender && (
          <span className="text-xs font-medium text-[hsl(181,87%,31%)] mb-1 px-1">
            {sender.fullName}
          </span>
        )}

        {/* Reply preview */}
        {replyMessage && (
          <div className={`mb-1 px-3 py-1.5 rounded-xl text-xs max-w-full border-l-[3px] border-l-[hsl(181,87%,31%)]
            ${isOwn ? "bg-white/20 text-white/80" : "bg-white text-gray-500 shadow-sm"}`}>
            <span className="font-medium block truncate">
              {typeof replyMessage.senderId === "object" ? (replyMessage.senderId as IUser).fullName : ""}
            </span>
            <span className="truncate block">{replyMessage.content}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 text-sm break-words leading-relaxed
            ${isOwn
              ? "bg-[hsl(181,87%,31%)] text-white rounded-2xl rounded-br-sm shadow-sm"
              : "bg-white text-gray-900 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100"
            }`}
        >
          {message.content}

          {/* Hover actions */}
          <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5
            ${isOwn ? "-left-[72px]" : "-right-[72px]"}`}>
            <button
              onClick={() => onReply?.(message)}
              className="h-7 w-7 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[hsl(181,87%,31%)] hover:border-[hsl(181,87%,31%)]/30 transition-all duration-200"
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
            {isOwn && (
              <button
                onClick={() => onDelete?.(message._id)}
                className="h-7 w-7 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 transition-all duration-200"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Time + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] text-gray-400">
            {dayjs(message.createdAt).format("h:mm A")}
          </span>
          {isOwn && (
            <CheckCheck className={`h-3.5 w-3.5 ${isRead ? "text-[hsl(181,87%,31%)]" : "text-gray-300"}`} />
          )}
        </div>
      </div>
    </div>
  );
}
