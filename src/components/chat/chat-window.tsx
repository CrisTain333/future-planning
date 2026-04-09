"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useGetMessagesQuery, useSendMessageMutation, useDeleteMessageMutation, useMarkConversationReadMutation, useHeartbeatMutation } from "@/store/chat-api";
import { IConversation, IMessage, IPresence, IUser } from "@/types";
import { ConversationHeader } from "./conversation-header";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import toast from "react-hot-toast";

interface ChatWindowProps {
  conversation: IConversation;
  presenceMap: Map<string, IPresence>;
  typingUsers: IPresence[];
  newMessages: IMessage[];
  onAudioCall: () => void;
  onVideoCall: () => void;
}

export function ChatWindow({ conversation, presenceMap, typingUsers, newMessages, onAudioCall, onVideoCall }: ChatWindowProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<IMessage | null>(null);
  const [allMessages, setAllMessages] = useState<IMessage[]>([]);

  const { data: messagesData, isLoading } = useGetMessagesQuery({ conversationId: conversation._id, limit: 30 });
  const [sendMessage] = useSendMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [markRead] = useMarkConversationReadMutation();
  const [heartbeat] = useHeartbeatMutation();

  useEffect(() => {
    const fetched = messagesData?.data || [];
    const existingIds = new Set(fetched.map((m: IMessage) => m._id));
    const newUnique = newMessages.filter((m) => m.conversationId === conversation._id && !existingIds.has(m._id));
    setAllMessages([...fetched, ...newUnique]);
  }, [messagesData, newMessages, conversation._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  useEffect(() => {
    markRead(conversation._id);
  }, [conversation._id, markRead]);

  const handleSend = useCallback(async (content: string, replyToId?: string) => {
    try {
      await sendMessage({ conversationId: conversation._id, body: { content, type: "text", replyTo: replyToId } }).unwrap();
    } catch { toast.error("Failed to send message"); }
  }, [sendMessage, conversation._id]);

  const handleDelete = useCallback(async (messageId: string) => {
    try {
      await deleteMessage({ conversationId: conversation._id, messageId }).unwrap();
    } catch { toast.error("Failed to delete message"); }
  }, [deleteMessage, conversation._id]);

  const handleTyping = useCallback((isTyping: boolean) => {
    heartbeat({ typing: { conversationId: conversation._id, isTyping } });
  }, [heartbeat, conversation._id]);

  const typingNames = typingUsers
    .filter((t) => t.isTyping?.conversationId === conversation._id && t.userId !== currentUserId)
    .map((t) => {
      const participant = conversation.participants.find(
        (p) => typeof p === "object" && (p as IUser)._id === t.userId
      ) as IUser | undefined;
      return participant?.fullName || "Someone";
    });

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader conversation={conversation} currentUserId={currentUserId} presenceMap={presenceMap} onAudioCall={onAudioCall} onVideoCall={onVideoCall} />
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">Loading messages...</div>
        ) : allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</div>
        ) : (
          allMessages.map((msg) => (
            <MessageBubble key={msg._id} message={msg}
              isOwn={(typeof msg.senderId === "object" ? (msg.senderId as IUser)._id : msg.senderId) === currentUserId}
              onDelete={handleDelete} onReply={setReplyTo} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <TypingIndicator names={typingNames} />
      <MessageInput onSend={handleSend} onTyping={handleTyping} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </div>
  );
}
