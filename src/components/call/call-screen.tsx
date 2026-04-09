"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  const peer = usePeer({ userId: currentUser.userId });
  const call = useCall({
    onCallEnded: () => {
      playCallEnded();
      onClose();
    },
  });

  const isGroupCall = conversation.type === "group";

  // Use refs so PeerJS event handlers always access latest values
  const callRef = useRef(call);
  callRef.current = call;
  const isGroupRef = useRef(isGroupCall);
  isGroupRef.current = isGroupCall;
  const peerRef = useRef(peer);
  peerRef.current = peer;

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
        const state = callRef.current.callState;

        if (!thisCall && (state === "active" || state === "ringing" || state === "connecting")) {
          callRef.current.endCall();
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [callLog._id]);

  // Resolve user info from peerId
  const resolveUser = (peerId: string) => {
    const userId = peerId.replace("fp-", "");
    const user = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id === userId
    ) as IUser | undefined;
    return { userId, fullName: user?.fullName || "Unknown" };
  };

  // Main setup effect — runs once on mount
  useEffect(() => {
    let localStream: MediaStream | null = null;

    const wireMedia = (mediaConn: MediaConnection) => {
      const remotePeerId = mediaConn.peer;
      const { userId, fullName } = resolveUser(remotePeerId);

      mediaConn.on("stream", (remoteStream) => {
        callRef.current.setParticipants((prev) => [
          ...prev.filter((p) => p.peerId !== remotePeerId),
          {
            peerId: remotePeerId,
            userId,
            fullName,
            stream: remoteStream,
            mediaConnection: mediaConn,
            dataConnection: null,
          },
        ]);
      });

      mediaConn.on("close", () => {
        if (isGroupRef.current) {
          callRef.current.removeParticipant(remotePeerId);
        } else {
          callRef.current.endCall();
        }
      });
    };

    const setup = async () => {
      localStream = await callRef.current.startLocalStream(callLog.type);

      // Listen for incoming PeerJS calls (works for both initiator and joiner)
      peerRef.current.onIncomingCall((incomingCall: MediaConnection) => {
        playCallConnected();
        incomingCall.answer(localStream!);
        wireMedia(incomingCall);

        // If this is the initiator and was ringing, mark as active
        callRef.current.markActive();
      });

      // Listen for incoming data connections (in-call chat)
      peerRef.current.onIncomingData((conn: DataConnection) => {
        conn.on("data", (data) => {
          const msg = data as { senderId: string; senderName: string; content: string };
          callRef.current.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
        });
      });

      if (isInitiator) {
        // Initiator: start ringing, wait for callee to connect via onIncomingCall
        await callRef.current.initiateCall(callLog.type, callLog);
      } else {
        // Joiner: accept the call and connect to existing participants
        await callRef.current.acceptCall(callLog);
        playCallConnected();

        // Find who's already in the call
        const otherParticipantIds = callLog.participants
          .filter((p) => {
            const pid = typeof p.userId === "object" ? (p.userId as IUser)._id : p.userId;
            return pid !== currentUser.userId && p.joinedAt !== null;
          })
          .map((p) => (typeof p.userId === "object" ? (p.userId as IUser)._id : p.userId));

        // Fallback: connect to initiator if no one has joinedAt set yet
        if (otherParticipantIds.length === 0) {
          const initiatorId =
            typeof callLog.initiatedBy === "object"
              ? (callLog.initiatedBy as IUser)._id
              : callLog.initiatedBy;
          otherParticipantIds.push(initiatorId);
        }

        // Call each existing participant
        for (const userId of otherParticipantIds) {
          const remotePeerId = `fp-${userId}`;
          const mediaConn = peerRef.current.callPeer(remotePeerId, localStream!);
          if (mediaConn) {
            wireMedia(mediaConn);
          }
        }
      }
    };

    setup();

    return () => {
      peerRef.current.closeAllConnections();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendChatMessage = useCallback(
    (content: string) => {
      const msg = { senderId: currentUser.userId, senderName: currentUser.fullName, content };
      call.participants.forEach((p) => {
        if (p.dataConnection) {
          p.dataConnection.send(msg);
        } else {
          const conn = peer.connectData(p.peerId);
          if (conn) conn.on("open", () => conn.send(msg));
        }
      });
      call.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
    },
    [call, peer, currentUser]
  );

  const handleToggleScreenShare = useCallback(async () => {
    if (call.isScreenSharing) call.stopScreenShare();
    else await call.startScreenShare();
  }, [call]);

  // Display name for status overlay
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
            <span className="text-3xl font-bold text-primary">
              {getCallDisplayName().charAt(0).toUpperCase()}
            </span>
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
          <p className="text-xs text-gray-500 mt-2">
            {call.callType === "video" ? "Video" : "Audio"} call
          </p>
          <button
            onClick={call.endCall}
            className="mt-8 h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 2.59 3.4z" />
              <line x1="23" y1="1" x2="1" y2="23" />
            </svg>
          </button>
        </div>
      )}

      <ParticipantGrid
        participants={call.participants.map((p) => ({
          peerId: p.peerId,
          name: p.fullName,
          stream: p.stream,
        }))}
        localStream={call.localStream}
        screenStream={call.screenStream}
        localName={currentUser.fullName}
      />
      <div className="flex items-center justify-center pb-6">
        <CallControls
          isMuted={call.isMuted}
          isCameraOff={call.isCameraOff}
          isScreenSharing={call.isScreenSharing}
          isChatOpen={isChatOpen}
          callType={call.callType}
          onToggleMute={call.toggleMute}
          onToggleCamera={call.toggleCamera}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onEndCall={call.endCall}
        />
      </div>
      {isChatOpen && (
        <div className="absolute top-0 right-0 h-full">
          <InCallChat
            messages={call.inCallMessages}
            onSend={handleSendChatMessage}
            onClose={() => setIsChatOpen(false)}
            currentUserId={currentUser.userId}
          />
        </div>
      )}
    </div>
  );
}
