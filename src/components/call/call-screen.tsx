"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePeer } from "@/hooks/use-peer";
import { useCall } from "@/hooks/use-call";
import { ICallLog, IConversation, IUser } from "@/types";
import { CallControls } from "./call-controls";
import { ParticipantGrid } from "./participant-grid";
import { InCallChat } from "./in-call-chat";
import { MediaConnection, DataConnection } from "peerjs";
import { playCallConnected, playCallEnded } from "@/lib/sounds";

interface CallScreenProps {
  callLog: ICallLog;
  conversation: IConversation;
  isInitiator: boolean;
  onClose: () => void;
}

export function CallScreen({ callLog, conversation, isInitiator, onClose }: CallScreenProps) {
  const { data: session } = useSession();
  const currentUser = session?.user as unknown as { userId: string; fullName: string };
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { callPeer, connectData, onIncomingCall, onIncomingData, closeAllConnections } = usePeer({ userId: currentUser.userId });
  const call = useCall({
    onCallEnded: () => {
      playCallEnded();
      onClose();
    },
  });

  // Poll call status to detect when other side hangs up or declines
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/realtime/sync?since=${encodeURIComponent(new Date(Date.now() - 5000).toISOString())}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;

        const activeCalls = json.data.calls as ICallLog[];
        const thisCall = activeCalls.find((c) => c._id === callLog._id);

        // If the call is no longer in active/ringing list, it was ended/declined/missed
        if (!thisCall && (call.callState === "active" || call.callState === "ringing" || call.callState === "connecting")) {
          call.endCall();
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [callLog._id, call]);

  const isGroupCall = conversation.type === "group";

  // Helper: resolve user info from peerId
  const resolveUser = useCallback((peerId: string) => {
    const userId = peerId.replace("fp-", "");
    const user = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id === userId
    ) as IUser | undefined;
    return { userId, fullName: user?.fullName || "Unknown" };
  }, [conversation.participants]);

  // Helper: wire up a media connection (incoming or outgoing)
  const wireMediaConnection = useCallback((mediaConn: MediaConnection, stream: MediaStream) => {
    const remotePeerId = mediaConn.peer;
    const { userId, fullName } = resolveUser(remotePeerId);

    mediaConn.on("stream", (remoteStream) => {
      call.setParticipants((prev) => [
        ...prev.filter((p) => p.peerId !== remotePeerId),
        { peerId: remotePeerId, userId, fullName, stream: remoteStream, mediaConnection: mediaConn, dataConnection: null },
      ]);
    });

    // When remote peer leaves
    mediaConn.on("close", () => {
      if (isGroupCall) {
        // Group call: just remove the participant
        call.removeParticipant(remotePeerId);
      } else {
        // 1-on-1: end the whole call
        call.endCall();
      }
    });

    // Answer if incoming
    if (mediaConn.open === false || mediaConn.open === undefined) {
      // This is an incoming call we received — answer it
    }
  }, [resolveUser, call, isGroupCall]);

  useEffect(() => {
    const setup = async () => {
      const stream = await call.startLocalStream(callLog.type);

      // Always listen for incoming calls (both initiator and joiner get calls from new peers)
      onIncomingCall((incomingCall: MediaConnection) => {
        playCallConnected();
        incomingCall.answer(stream);
        wireMediaConnection(incomingCall, stream);

        // If initiator was ringing, move to active now that someone answered
        if (call.callState === "ringing") {
          call.acceptCall(callLog);
        }
      });

      if (isInitiator) {
        await call.initiateCall(callLog.type, callLog);
        // Initiator waits for others to call in via onIncomingCall above
      } else {
        await call.acceptCall(callLog);
        playCallConnected();

        // Connect to ALL existing participants who already joined
        // Check the call log participants to find who has already joined
        const otherParticipantIds = callLog.participants
          .filter((p) => {
            const pid = typeof p.userId === "object" ? (p.userId as IUser)._id : p.userId;
            return pid !== currentUser.userId && p.joinedAt !== null;
          })
          .map((p) => typeof p.userId === "object" ? (p.userId as IUser)._id : p.userId);

        // If no one has explicitly joined yet, at least connect to the initiator
        if (otherParticipantIds.length === 0) {
          const initiatorId = typeof callLog.initiatedBy === "object"
            ? (callLog.initiatedBy as IUser)._id
            : callLog.initiatedBy;
          otherParticipantIds.push(initiatorId);
        }

        // Call each existing participant
        for (const userId of otherParticipantIds) {
          const remotePeerId = `fp-${userId}`;
          const mediaConn = callPeer(remotePeerId, stream);
          if (mediaConn) {
            wireMediaConnection(mediaConn, stream);
          }
        }
      }

      // Data channel for in-call chat
      onIncomingData((conn: DataConnection) => {
        conn.on("data", (data) => {
          const msg = data as { senderId: string; senderName: string; content: string };
          call.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
        });
      });
    };

    setup();
    return () => { closeAllConnections(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendChatMessage = useCallback((content: string) => {
    const msg = { senderId: currentUser.userId, senderName: currentUser.fullName, content };
    call.participants.forEach((p) => {
      if (p.dataConnection) { p.dataConnection.send(msg); }
      else { const conn = connectData(p.peerId); if (conn) conn.on("open", () => conn.send(msg)); }
    });
    call.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
  }, [call, connectData, currentUser]);

  const handleToggleScreenShare = useCallback(async () => {
    if (call.isScreenSharing) call.stopScreenShare();
    else await call.startScreenShare();
  }, [call]);

  // Get display name for status overlay
  const getCallDisplayName = () => {
    if (conversation.type === "group") return conversation.name || "Group Call";
    const other = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUser.userId
    ) as IUser | undefined;
    return other?.fullName || "Unknown";
  };

  const showStatusOverlay = call.callState === "ringing" || call.callState === "connecting";

  return (
    <div className="fixed inset-0 z-[90] bg-gray-900 flex flex-col">
      {/* Ringing / Connecting overlay */}
      {showStatusOverlay && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/95">
          <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-primary">{getCallDisplayName().charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{getCallDisplayName()}</h2>
          <div className="flex items-center gap-2 text-gray-400">
            {call.callState === "ringing" && (
              <>
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "200ms" }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "400ms" }} />
                </span>
                <span className="text-sm">Ringing</span>
              </>
            )}
            {call.callState === "connecting" && (
              <>
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "200ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "400ms" }} />
                </span>
                <span className="text-sm">Connecting</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{call.callType === "video" ? "Video" : "Audio"} call</p>
          {/* End call button during ringing */}
          <button
            onClick={call.endCall}
            className="mt-8 h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
          </button>
        </div>
      )}

      <ParticipantGrid
        participants={call.participants.map((p) => ({ peerId: p.peerId, name: p.fullName, stream: p.stream }))}
        localStream={call.localStream} screenStream={call.screenStream} localName={currentUser.fullName}
      />
      <div className="flex items-center justify-center pb-6">
        <CallControls isMuted={call.isMuted} isCameraOff={call.isCameraOff} isScreenSharing={call.isScreenSharing}
          isChatOpen={isChatOpen} callType={call.callType} onToggleMute={call.toggleMute} onToggleCamera={call.toggleCamera}
          onToggleScreenShare={handleToggleScreenShare} onToggleChat={() => setIsChatOpen(!isChatOpen)} onEndCall={call.endCall}
        />
      </div>
      {isChatOpen && (
        <div className="absolute top-0 right-0 h-full">
          <InCallChat messages={call.inCallMessages} onSend={handleSendChatMessage} onClose={() => setIsChatOpen(false)} currentUserId={currentUser.userId} />
        </div>
      )}
    </div>
  );
}
