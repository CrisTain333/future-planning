"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ICallLog, IConversation, IUser } from "@/types";
import { IncomingCall } from "@/components/call/incoming-call";
import { CallScreen } from "@/components/call/call-screen";
import { useGetConversationsQuery } from "@/store/chat-api";
import { useInitiateCallMutation } from "@/store/calls-api";
import { playCallRinging } from "@/lib/sounds";
import toast from "react-hot-toast";

interface CallContextValue {
  activeCall: { callLog: ICallLog; conversation: IConversation; isInitiator: boolean } | null;
  startCall: (conversationId: string, type: "audio" | "video") => Promise<void>;
  ongoingCalls: ICallLog[];
  joinCall: (callLog: ICallLog, conversation: IConversation) => void;
}

const CallContext = createContext<CallContextValue>({
  activeCall: null,
  startCall: async () => {},
  ongoingCalls: [],
  joinCall: () => {},
});

export function useCallContext() {
  return useContext(CallContext);
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;

  const [incomingCall, setIncomingCall] = useState<ICallLog | null>(null);
  const [activeCall, setActiveCall] = useState<{
    callLog: ICallLog;
    conversation: IConversation;
    isInitiator: boolean;
  } | null>(null);
  const [ongoingCalls, setOngoingCalls] = useState<ICallLog[]>([]);

  // Track dismissed/ended call IDs to prevent re-popup
  const dismissedCallIds = useRef<Set<string>>(new Set());

  const { data: conversationsData } = useGetConversationsQuery(
    { limit: 50 },
    { skip: !currentUserId }
  );
  const conversations = (conversationsData?.data || []) as IConversation[];

  const [initiateCall] = useInitiateCallMutation();

  // Poll for incoming calls globally
  useEffect(() => {
    if (!currentUserId) return;

    const pollCalls = async () => {
      try {
        const res = await fetch(
          `/api/realtime/sync?since=${encodeURIComponent(new Date(Date.now() - 5000).toISOString())}`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;

        const calls = (json.data.calls || []) as ICallLog[];
        setOngoingCalls(calls);

        // Find ringing call for this user (not initiated by this user, not dismissed)
        const ringing = calls.find((c) => {
          if (c.status !== "ringing") return false;
          if (dismissedCallIds.current.has(c._id)) return false;
          const initiatorId =
            typeof c.initiatedBy === "object"
              ? (c.initiatedBy as IUser)._id
              : c.initiatedBy;
          return initiatorId !== currentUserId;
        });

        if (ringing && !activeCall && !incomingCall) {
          playCallRinging();
          setIncomingCall(ringing);
        }

        // If the incoming call is no longer ringing (ended/missed), clear it
        if (incomingCall) {
          const stillRinging = calls.find((c) => c._id === incomingCall._id && c.status === "ringing");
          if (!stillRinging) {
            setIncomingCall(null);
          }
        }
      } catch {}
    };

    pollCalls();
    const interval = setInterval(pollCalls, 2000);
    return () => clearInterval(interval);
  }, [currentUserId, activeCall, incomingCall]);

  const handleAcceptCall = useCallback(() => {
    if (!incomingCall) return;

    // Find the conversation for this call
    const convId =
      typeof incomingCall.conversationId === "object"
        ? (incomingCall.conversationId as IConversation)._id
        : incomingCall.conversationId;
    const conversation = conversations.find((c) => c._id === convId);

    if (!conversation) {
      toast.error("Conversation not found");
      return;
    }

    dismissedCallIds.current.add(incomingCall._id);
    setActiveCall({ callLog: incomingCall, conversation, isInitiator: false });
    setIncomingCall(null);
  }, [incomingCall, conversations]);

  const handleDeclineCall = useCallback(async () => {
    if (!incomingCall) return;

    dismissedCallIds.current.add(incomingCall._id);

    await fetch(`/api/calls/${incomingCall._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "missed" }),
    }).catch(() => {});

    setIncomingCall(null);
  }, [incomingCall]);

  const startCall = useCallback(
    async (conversationId: string, type: "audio" | "video") => {
      const conversation = conversations.find((c) => c._id === conversationId);
      if (!conversation) {
        toast.error("Conversation not found");
        return;
      }

      try {
        const result = await initiateCall({ conversationId, type }).unwrap();
        if (result.success) {
          dismissedCallIds.current.add(result.data._id);
          setActiveCall({ callLog: result.data, conversation, isInitiator: true });
        }
      } catch {
        toast.error("Failed to start call");
      }
    },
    [conversations, initiateCall]
  );

  const joinCall = useCallback(
    (callLog: ICallLog, conversation: IConversation) => {
      dismissedCallIds.current.add(callLog._id);
      setActiveCall({ callLog, conversation, isInitiator: false });
    },
    []
  );

  const handleCallClose = useCallback(() => {
    if (activeCall) {
      dismissedCallIds.current.add(activeCall.callLog._id);
    }
    setActiveCall(null);
  }, [activeCall]);

  return (
    <CallContext.Provider value={{ activeCall, startCall, ongoingCalls, joinCall }}>
      {children}

      {/* Global incoming call overlay */}
      {incomingCall && !activeCall && (
        <IncomingCall
          callLog={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Global active call screen */}
      {activeCall && (
        <CallScreen
          callLog={activeCall.callLog}
          conversation={activeCall.conversation}
          isInitiator={activeCall.isInitiator}
          onClose={handleCallClose}
        />
      )}
    </CallContext.Provider>
  );
}
