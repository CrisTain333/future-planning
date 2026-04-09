"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useGetMessagesQuery, useSendMessageMutation, useDeleteMessageMutation, useMarkConversationReadMutation, useHeartbeatMutation } from "@/store/chat-api";
import { IConversation, IMessage, IPresence, IUser, ICallLog } from "@/types";
import { ConversationHeader } from "./conversation-header";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import toast from "react-hot-toast";
import { playMessageSent } from "@/lib/sounds";
import { Phone, Video } from "lucide-react";

interface ChatWindowProps {
  conversation: IConversation;
  presenceMap: Map<string, IPresence>;
  typingUsers: IPresence[];
  newMessages: IMessage[];
  onAudioCall: () => void;
  onVideoCall: () => void;
  ongoingCall?: ICallLog | null;
  onJoinCall?: (callLog: ICallLog) => void;
}

export function ChatWindow({ conversation, presenceMap, typingUsers, newMessages, onAudioCall, onVideoCall, ongoingCall, onJoinCall }: ChatWindowProps) {
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
    // Optimistic: show message immediately
    const optimisticMsg: IMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: conversation._id,
      senderId: { _id: currentUserId, fullName: (session?.user as unknown as { fullName: string })?.fullName || "" } as unknown as IUser,
      content,
      type: "text",
      replyTo: null,
      readBy: [],
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAllMessages((prev) => [...prev, optimisticMsg]);
    playMessageSent();

    try {
      await sendMessage({ conversationId: conversation._id, body: { content, type: "text", replyTo: replyToId } }).unwrap();
    } catch {
      // Remove optimistic message on failure
      setAllMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      toast.error("Failed to send message");
    }
  }, [sendMessage, conversation._id, currentUserId, session]);

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

  // Determine whether to show sender info (first in a consecutive group)
  const getSenderId = (msg: IMessage) =>
    typeof msg.senderId === "object" ? (msg.senderId as IUser)._id : msg.senderId;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed header */}
      <ConversationHeader
        conversation={conversation}
        currentUserId={currentUserId}
        presenceMap={presenceMap}
        onAudioCall={onAudioCall}
        onVideoCall={onVideoCall}
      />

      {/* Ongoing call banner */}
      {ongoingCall && onJoinCall && (
        <div className="mx-3 mt-2 flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="absolute h-3 w-3 rounded-full bg-emerald-500 animate-ping opacity-50" />
              <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {ongoingCall.type === "video" ? "Video" : "Audio"} call in progress
              </p>
              <p className="text-xs text-emerald-600">
                {ongoingCall.participants.filter((p) => p.joinedAt).length} participant{ongoingCall.participants.filter((p) => p.joinedAt).length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => onJoinCall(ongoingCall)}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-all duration-200 shadow-sm"
          >
            {ongoingCall.type === "video" ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Join
          </button>
        </div>
      )}

      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto bg-[#f0f2f5] py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(181,87%,31%)]" />
              <p className="text-xs text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {allMessages.map((msg, index) => {
              const prevMsg = index > 0 ? allMessages[index - 1] : null;
              const prevSenderId = prevMsg ? getSenderId(prevMsg) : null;
              const currSenderId = getSenderId(msg);
              // Show sender if first message overall or sender changed
              const showSender = !prevMsg || prevSenderId !== currSenderId;
              // Add extra gap between groups
              const isNewGroup = showSender && index > 0;

              return (
                <div key={msg._id} className={isNewGroup ? "mt-3" : "mt-0.5"}>
                  <MessageBubble
                    message={msg}
                    isOwn={currSenderId === currentUserId}
                    showSender={showSender}
                    onDelete={handleDelete}
                    onReply={setReplyTo}
                  />
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator names={typingNames} />

      {/* Fixed input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
