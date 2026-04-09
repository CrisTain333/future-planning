"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const peer = usePeer({ userId: currentUser.userId });
  const call = useCall({
    onCallEnded: () => {
      playCallEnded();
      onClose();
    },
  });

  const isGroupCall = conversation.type === "group";

  // Refs for stable access in PeerJS callbacks
  const callRef = useRef(call);
  callRef.current = call;
  const isGroupRef = useRef(isGroupCall);

  // Track peers we've already connected to (persists across strict mode reruns)
  const connectedPeersRef = useRef<Set<string>>(new Set());
  const setupRanRef = useRef(false);
  isGroupRef.current = isGroupCall;

  // Call end detection relies on PeerJS media connection "close" event
  // (set up in wireMedia). No polling needed — it was causing false auto-cuts.

  // Resolve user info from a PeerJS peer ID or userId
  const resolveUserByUserId = (userId: string) => {
    const user = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id === userId
    ) as IUser | undefined;
    return user?.fullName || "Unknown";
  };

  // Main setup effect — skip if already ran (React strict mode protection)
  useEffect(() => {
    if (setupRanRef.current) return;
    setupRanRef.current = true;

    let localStream: MediaStream | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const wireMedia = (mediaConn: MediaConnection, remoteName: string) => {
      const remotePeerId = mediaConn.peer;

      mediaConn.on("stream", (remoteStream) => {
        console.log("[CallScreen] Got remote stream from:", remotePeerId);
        callRef.current.setParticipants((prev) => [
          ...prev.filter((p) => p.peerId !== remotePeerId),
          {
            peerId: remotePeerId,
            userId: remotePeerId,
            fullName: remoteName,
            stream: remoteStream,
            mediaConnection: mediaConn,
            dataConnection: null,
          },
        ]);
      });

      // Don't auto-end on media close — PeerJS cloud drops signaling after ~30s
      // which tears down media connections even though WebRTC is peer-to-peer.
      // Users end calls manually via the hang-up button.
      mediaConn.on("close", () => {
        console.log("[wireMedia] Media connection closed for:", remotePeerId);
        // Just remove from participant grid in group calls
        if (isGroupRef.current) {
          callRef.current.removeParticipant(remotePeerId);
        }
      });
    };

    const setup = async () => {
      console.log("[CallScreen] Setup: isInitiator:", isInitiator, "userId:", currentUser.userId);

      // 1. Get local media stream
      localStream = await callRef.current.startLocalStream(callLog.type);
      console.log("[CallScreen] Local stream ready");

      // 2. Wait for PeerJS to connect and get our peer ID
      const peerInstance = await peer.waitForPeer();
      const myPeerId = peerInstance.id;
      console.log("[CallScreen] PeerJS connected with ID:", myPeerId);

      // 3. Register our peer ID on the call record
      await fetch(`/api/calls/${callLog._id}/peer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: myPeerId }),
      });
      console.log("[CallScreen] Registered peer ID on call record");

      // 4. Listen for incoming PeerJS calls from other participants
      peer.onIncomingCall((incomingCall: MediaConnection) => {
        const remotePeerId = incomingCall.peer;
        if (connectedPeersRef.current.has(remotePeerId)) {
          console.log("[CallScreen] Ignoring duplicate incoming call from:", remotePeerId);
          return;
        }
        connectedPeersRef.current.add(remotePeerId);
        console.log("[CallScreen] Incoming PeerJS call from:", remotePeerId);
        playCallConnected();
        incomingCall.answer(localStream!);
        wireMedia(incomingCall, "Participant");
        callRef.current.markActive();
      });

      // Listen for data connections (chat messages + media state updates)
      peer.onIncomingData((conn: DataConnection) => {
        // Store for reuse when broadcasting media state
        dataConnsRef.current.set(conn.peer, conn);
        conn.on("close", () => dataConnsRef.current.delete(conn.peer));

        conn.on("data", (data) => {
          const parsed = data as Record<string, unknown>;
          if (parsed.type === "media_state") {
            const peerId = parsed.peerId as string;
            callRef.current.setParticipants((prev) =>
              prev.map((p) =>
                p.peerId === peerId
                  ? { ...p, isMuted: parsed.isMuted as boolean, isCameraOff: parsed.isCameraOff as boolean }
                  : p
              )
            );
          } else {
            const msg = parsed as { senderId: string; senderName: string; content: string };
            callRef.current.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
          }
        });
      });

      if (isInitiator) {
        // Initiator: start ringing and wait for others to connect
        await callRef.current.initiateCall(callLog.type, callLog);
        console.log("[CallScreen] Initiator: ringing, waiting for peers...");
      } else {
        // Joiner: accept call, then poll for other participants' peer IDs and call them
        await callRef.current.acceptCall(callLog);
        playCallConnected();
        console.log("[CallScreen] Joiner: accepted, polling for other peer IDs...");

        // Poll for other participants' peer IDs
        const connectToPeers = async () => {
          try {
            const res = await fetch(`/api/calls/${callLog._id}/peer`);
            if (!res.ok) return;
            const json = await res.json();
            if (!json.success) return;

            const participants = json.data.participants as Array<{
              userId: { _id: string; fullName: string } | string;
              peerId: string | null;
              joinedAt: string | null;
            }>;

            for (const p of participants) {
              const pUserId = typeof p.userId === "object" ? p.userId._id : p.userId;
              const pName = typeof p.userId === "object" ? p.userId.fullName : "Unknown";

              if (pUserId === currentUser.userId || !p.peerId) continue;
              if (connectedPeersRef.current.has(p.peerId)) continue;

              connectedPeersRef.current.add(p.peerId);
              console.log("[CallScreen] Calling peer:", p.peerId, "for user:", pName);
              const mediaConn = await peer.callPeer(p.peerId, localStream!);
              if (mediaConn) {
                wireMedia(mediaConn, pName);
              }
            }
          } catch (e) {
            console.error("[CallScreen] Error polling peers:", e);
          }
        };

        // Poll every 2s until we connect to someone, stop after 30s
        connectToPeers();
        pollInterval = setInterval(connectToPeers, 2000);
        setTimeout(() => {
          if (pollInterval) clearInterval(pollInterval);
        }, 30000);
      }
    };

    setup();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      peer.closeAllConnections();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Broadcast mute/camera state via existing data connections only (no new connections)
  const dataConnsRef = useRef<Map<string, DataConnection>>(new Map());

  useEffect(() => {
    if (call.callState !== "active" || call.participants.length === 0) return;

    const state = {
      type: "media_state",
      peerId: peer.peerId,
      isMuted: call.isMuted,
      isCameraOff: call.isCameraOff,
    };

    // Send via existing open data connections only
    dataConnsRef.current.forEach((conn) => {
      if (conn.open) {
        try { conn.send(state); } catch {}
      }
    });
  }, [call.isMuted, call.isCameraOff, call.callState, call.participants.length, peer.peerId]);

  const handleSendChatMessage = useCallback(
    (content: string) => {
      const msg = { senderId: currentUser.userId, senderName: currentUser.fullName, content };
      // Send via stored data connections
      dataConnsRef.current.forEach((conn) => {
        if (conn.open) {
          try { conn.send(msg); } catch {}
        }
      });
      call.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
    },
    [call, currentUser]
  );

  const handleToggleScreenShare = useCallback(async () => {
    if (call.isScreenSharing) call.stopScreenShare();
    else await call.startScreenShare();
  }, [call]);

  const getCallDisplayName = () => {
    if (conversation.type === "group") return conversation.name || "Group Call";
    const other = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUser.userId
    ) as IUser | undefined;
    return other?.fullName || "Unknown";
  };

  const showStatusOverlay = call.callState === "ringing" || call.callState === "connecting";

  if (!mounted) return null;

  return createPortal(
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh", zIndex: 9999, background: "#111827", display: "flex", flexDirection: "column" }}>
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
          isMuted: p.isMuted,
          isCameraOff: p.isCameraOff,
        }))}
        localStream={call.localStream}
        screenStream={call.screenStream}
        localName={currentUser.fullName}
        localIsMuted={call.isMuted}
        localIsCameraOff={call.isCameraOff}
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
    </div>,
    document.body
  );
}
