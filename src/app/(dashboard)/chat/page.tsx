"use client";

import { Suspense } from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { usePolling } from "@/hooks/use-polling";
import { usePush } from "@/hooks/use-push";
import { useHeartbeatMutation, useGetConversationsQuery } from "@/store/chat-api";
import { useInitiateCallMutation } from "@/store/calls-api";
import { IMessage, IPresence, ICallLog, IConversation, IUser } from "@/types";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { CreateConversationModal } from "@/components/chat/create-conversation-modal";
import { IncomingCall } from "@/components/call/incoming-call";
import { CallScreen } from "@/components/call/call-screen";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { playMessageReceived, playCallRinging } from "@/lib/sounds";

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
  const [incomingCall, setIncomingCall] = useState<ICallLog | null>(null);
  const [activeCall, setActiveCall] = useState<{ callLog: ICallLog; isInitiator: boolean } | null>(null);
  const [ongoingCalls, setOngoingCalls] = useState<ICallLog[]>([]);

  const { data: conversationsData } = useGetConversationsQuery({ limit: 50 });
  const conversations = (conversationsData?.data || []) as IConversation[];
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

  const [initiateCall] = useInitiateCallMutation();
  const [heartbeat] = useHeartbeatMutation();

  usePush();

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
    // Play sound for messages from others
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

  const handleCalls = useCallback(
    (calls: ICallLog[]) => {
      // Track all ongoing calls for "Join" banner
      setOngoingCalls(calls);

      const ringingCall = calls.find(
        (c) =>
          c.status === "ringing" &&
          (typeof c.initiatedBy === "object"
            ? (c.initiatedBy as IUser)._id
            : c.initiatedBy) !== currentUserId
      );
      if (ringingCall && !activeCall) {
        playCallRinging();
        setIncomingCall(ringingCall);
      }
    },
    [currentUserId, activeCall]
  );

  usePolling({
    activeConversationId,
    onMessages: handleMessages,
    onPresence: handlePresence,
    onTyping: handleTyping,
    onCalls: handleCalls,
    enabled: !!currentUserId,
  });

  const handleStartCall = useCallback(
    async (type: "audio" | "video") => {
      if (!activeConversationId) return;
      try {
        const result = await initiateCall({ conversationId: activeConversationId, type }).unwrap();
        if (result.success) {
          setActiveCall({ callLog: result.data, isInitiator: true });
        }
      } catch {
        toast.error("Failed to start call");
      }
    },
    [activeConversationId, initiateCall]
  );

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      setActiveCall({ callLog: incomingCall, isInitiator: false });
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const handleDeclineCall = useCallback(async () => {
    if (incomingCall) {
      await fetch(`/api/calls/${incomingCall._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "missed" }),
      });
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const handleJoinCall = useCallback((callLog: ICallLog) => {
    setActiveCall({ callLog, isInitiator: false });
  }, []);

  // Find ongoing call for the active conversation (that the user is NOT already in)
  const ongoingCallForActiveConversation = useMemo(() => {
    if (!activeConversationId || activeCall) return null;
    return ongoingCalls.find((c) =>
      c.conversationId === activeConversationId && c.status === "active"
    ) || null;
  }, [activeConversationId, ongoingCalls, activeCall]);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="w-80 flex-shrink-0 hidden md:block">
        <ChatSidebar
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onCreateNew={() => setShowCreateModal(true)}
          presenceMap={presenceMap}
        />
      </div>
      <div className="flex-1">
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
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
      <CreateConversationModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={(id) => setActiveConversationId(id)} />
      {incomingCall && !activeCall && (
        <IncomingCall callLog={incomingCall} onAccept={handleAcceptCall} onDecline={handleDeclineCall} />
      )}
      {activeCall && activeConversation && (
        <CallScreen callLog={activeCall.callLog} conversation={activeConversation} isInitiator={activeCall.isInitiator} onClose={() => setActiveCall(null)} />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-4rem)] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <ChatPageContent />
    </Suspense>
  );
}
