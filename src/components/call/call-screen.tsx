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
  const call = useCall({ onCallEnded: onClose });

  useEffect(() => {
    const setup = async () => {
      const stream = await call.startLocalStream(callLog.type);

      if (isInitiator) {
        await call.initiateCall(callLog.type, callLog);
        onIncomingCall((incomingCall: MediaConnection) => {
          incomingCall.answer(stream);
          incomingCall.on("stream", (remoteStream) => {
            const remotePeerId = incomingCall.peer;
            const remoteUserId = remotePeerId.replace("fp-", "");
            const remoteUser = conversation.participants.find(
              (p) => typeof p === "object" && (p as IUser)._id === remoteUserId
            ) as IUser | undefined;
            call.setParticipants((prev) => [
              ...prev.filter((p) => p.peerId !== remotePeerId),
              { peerId: remotePeerId, userId: remoteUserId, fullName: remoteUser?.fullName || "Unknown", stream: remoteStream, mediaConnection: incomingCall, dataConnection: null },
            ]);
          });
        });
      } else {
        await call.acceptCall(callLog);
        const initiatorId = typeof callLog.initiatedBy === "object" ? (callLog.initiatedBy as IUser)._id : callLog.initiatedBy;
        const remotePeerId = `fp-${initiatorId}`;
        const mediaConn = callPeer(remotePeerId, stream);
        if (mediaConn) {
          mediaConn.on("stream", (remoteStream) => {
            const initiatorUser = conversation.participants.find(
              (p) => typeof p === "object" && (p as IUser)._id === initiatorId
            ) as IUser | undefined;
            call.setParticipants((prev) => [
              ...prev.filter((p) => p.peerId !== remotePeerId),
              { peerId: remotePeerId, userId: initiatorId, fullName: initiatorUser?.fullName || "Unknown", stream: remoteStream, mediaConnection: mediaConn, dataConnection: null },
            ]);
          });
        }
      }

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

  return (
    <div className="fixed inset-0 z-[90] bg-gray-900 flex flex-col">
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
