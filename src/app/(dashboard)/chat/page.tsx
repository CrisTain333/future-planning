"use client";

import { Suspense } from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { usePolling } from "@/hooks/use-polling";
import { usePush } from "@/hooks/use-push";
import { useHeartbeatMutation, useGetConversationsQuery } from "@/store/chat-api";
import { IMessage, IPresence, ICallLog, IConversation, IUser } from "@/types";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { CreateConversationModal } from "@/components/chat/create-conversation-modal";
import { MessageCircle } from "lucide-react";
import { playMessageReceived } from "@/lib/sounds";
import { useCallContext } from "@/components/providers/call-provider";

function ChatPageContent() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;
  const searchParams = useSearchParams();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get("id")
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMessages, setNewMessages] = useState<IMessage[]>([]);
  const [presenceList, setPresenceList] = useState<IPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<IPresence[]>([]);

  const { data: conversationsData } = useGetConversationsQuery({ limit: 50 });
  const conversations = (conversationsData?.data || []) as IConversation[];
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

  const [heartbeat] = useHeartbeatMutation();
  const { startCall, ongoingCalls, activeCall, joinCall } = useCallContext();

  usePush();

  // Hide parent scroll and footer for full-height chat layout
  useEffect(() => {
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    if (main) {
      main.style.overflow = "hidden";
      main.style.padding = "0";
    }
    if (footer) (footer as HTMLElement).style.display = "none";

    return () => {
      if (main) {
        main.style.overflow = "";
        main.style.padding = "";
      }
      if (footer) (footer as HTMLElement).style.display = "";
    };
  }, []);

  // Heartbeat every 30 seconds
  useEffect(() => {
    heartbeat({});
    const interval = setInterval(() => heartbeat({}), 30000);
    return () => clearInterval(interval);
  }, [heartbeat]);

  const presenceMap = useMemo(() => {
    const map = new Map<string, IPresence>();
    presenceList.forEach((p) => map.set(p.userId, p));
    return map;
  }, [presenceList]);

  const handleMessages = useCallback((msgs: IMessage[]) => {
    const hasNewFromOthers = msgs.some((m) => {
      const senderId = typeof m.senderId === "object" ? (m.senderId as IUser)._id : m.senderId;
      return senderId !== currentUserId;
    });
    if (hasNewFromOthers) playMessageReceived();
    setNewMessages((prev) => [...prev, ...msgs]);
  }, [currentUserId]);

  const handlePresence = useCallback((presence: IPresence[]) => {
    setPresenceList(presence);
  }, []);

  const handleTyping = useCallback((typing: IPresence[]) => {
    setTypingUsers(typing);
  }, []);

  usePolling({
    activeConversationId,
    onMessages: handleMessages,
    onPresence: handlePresence,
    onTyping: handleTyping,
    enabled: !!currentUserId,
  });

  const handleStartCall = useCallback(
    async (type: "audio" | "video") => {
      if (!activeConversationId) return;
      await startCall(activeConversationId, type);
    },
    [activeConversationId, startCall]
  );

  const handleJoinCall = useCallback(
    (callLog: ICallLog) => {
      if (!activeConversation) return;
      joinCall(callLog, activeConversation);
    },
    [joinCall, activeConversation]
  );

  // Find ongoing call for the active group conversation
  const ongoingCallForActiveConversation = useMemo(() => {
    if (!activeConversationId || activeCall) return null;
    return ongoingCalls.find((c) => {
      const convId = typeof c.conversationId === "object"
        ? (c.conversationId as IConversation)._id
        : c.conversationId;
      return convId === activeConversationId && c.status === "active";
    }) || null;
  }, [activeConversationId, ongoingCalls, activeCall]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const handleBack = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
      <div className={`
        w-full md:w-80 flex-shrink-0 md:flex md:flex-col border-r border-gray-200 bg-white
        ${activeConversationId ? "hidden md:flex" : "flex flex-col"}
      `}>
        <ChatSidebar
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateNew={() => setShowCreateModal(true)}
          presenceMap={presenceMap}
        />
      </div>

      <div className={`
        flex-1 flex flex-col overflow-hidden
        ${activeConversationId ? "flex" : "hidden md:flex"}
      `}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            presenceMap={presenceMap}
            typingUsers={typingUsers}
            newMessages={newMessages}
            onAudioCall={() => handleStartCall("audio")}
            onVideoCall={() => handleStartCall("video")}
            ongoingCall={ongoingCallForActiveConversation}
            onJoinCall={handleJoinCall}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-muted-foreground">
            <div className="flex flex-col items-center gap-4 max-w-xs text-center">
              <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center">
                <MessageCircle className="h-10 w-10 text-[hsl(181,87%,31%)] opacity-60" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-700">Your Messages</p>
                <p className="text-sm text-gray-400 mt-1">Select a conversation to start chatting</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <CreateConversationModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={(id) => setActiveConversationId(id)} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#f0f2f5]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(181,87%,31%)]" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
