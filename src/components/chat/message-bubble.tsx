"use client";

import { IMessage, IUser } from "@/types";
import dayjs from "dayjs";
import { Trash2, Reply } from "lucide-react";

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
  onReply?: (message: IMessage) => void;
}

export function MessageBubble({ message, isOwn, onDelete, onReply }: MessageBubbleProps) {
  const sender = typeof message.senderId === "object" ? (message.senderId as IUser) : null;

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
        <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm italic">
          This message was deleted
        </div>
      </div>
    );
  }

  const replyMessage = message.replyTo && typeof message.replyTo === "object" ? (message.replyTo as IMessage) : null;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 group`}>
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && sender && (
          <span className="text-xs text-muted-foreground mb-1 block">{sender.fullName}</span>
        )}
        {replyMessage && (
          <div className="px-2 py-1 mb-1 rounded bg-gray-100 border-l-2 border-primary text-xs text-muted-foreground truncate">
            {typeof replyMessage.senderId === "object" ? (replyMessage.senderId as IUser).fullName : ""}: {replyMessage.content}
          </div>
        )}
        <div className={`px-3 py-2 rounded-lg text-sm break-words ${
          isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-gray-100 text-foreground rounded-bl-sm"
        }`}>
          {message.content}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{dayjs(message.createdAt).format("h:mm A")}</span>
          {isOwn && message.readBy && message.readBy.length > 1 && (
            <span className="text-[10px] text-blue-500">read</span>
          )}
        </div>
        <div className="hidden group-hover:flex items-center gap-1 mt-0.5">
          <button onClick={() => onReply?.(message)} className="p-1 rounded hover:bg-gray-100 text-muted-foreground">
            <Reply className="h-3 w-3" />
          </button>
          {isOwn && (
            <button onClick={() => onDelete?.(message._id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
