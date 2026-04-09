"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MediaConnection, DataConnection } from "peerjs";
import { ICallLog } from "@/types";

type CallState = "idle" | "ringing" | "connecting" | "active" | "ended";

interface CallParticipant {
  peerId: string;
  userId: string;
  fullName: string;
  stream: MediaStream | null;
  mediaConnection: MediaConnection | null;
  dataConnection: DataConnection | null;
  isMuted?: boolean;
  isCameraOff?: boolean;
}

interface InCallMessage {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface UseCallOptions {
  onCallEnded?: () => void;
}

export function useCall({ onCallEnded }: UseCallOptions = {}) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [callLog, setCallLog] = useState<ICallLog | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<InCallMessage[]>([]);
  const missedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLocalStream = useCallback(async (type: "audio" | "video") => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === "video" ? { width: 640, height: 480 } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    return stream;
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setScreenStream(stream);
      setIsScreenSharing(true);

      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsScreenSharing(false);
      };

      return stream;
    } catch {
      return null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }
  }, [screenStream]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, [localStream]);

  const initiateCall = useCallback(
    async (type: "audio" | "video", callLogData: ICallLog) => {
      setCallType(type);
      setCallLog(callLogData);
      setCallState("ringing");

      missedTimeoutRef.current = setTimeout(async () => {
        console.log("[useCall] 30s missed timeout fired");
        await fetch(`/api/calls/${callLogData._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "missed" }),
        });
        setCallState("ended");
        onCallEnded?.();
      }, 30000);
    },
    [onCallEnded]
  );

  const acceptCall = useCallback(
    async (callLogData: ICallLog) => {
      if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);
      setCallLog(callLogData);
      setCallType(callLogData.type);
      setCallState("connecting");

      await fetch(`/api/calls/${callLogData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      setCallState("active");
    },
    []
  );

  // For initiator: transition to active locally when someone answers (no server call needed)
  const markActive = useCallback(() => {
    console.log("[useCall] markActive called, clearing missed timeout");
    if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);
    setCallState("active");
  }, []);

  const endCall = useCallback(async () => {
    console.log("[useCall] endCall triggered, callState:", callState, "stack:", new Error().stack?.split("\n").slice(1, 4).join(" <- "));
    if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);

    // Close all PeerJS media/data connections (triggers "close" on the other side)
    participants.forEach((p) => {
      p.mediaConnection?.close();
      p.dataConnection?.close();
    });

    localStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());

    if (callLog) {
      await fetch(`/api/calls/${callLog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      }).catch(() => {});
    }

    setLocalStream(null);
    setScreenStream(null);
    setParticipants([]);
    setInCallMessages([]);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallState("ended");
    setCallLog(null);
    onCallEnded?.();
    setCallState("idle");
  }, [participants, localStream, screenStream, callLog, onCallEnded]);

  const removeParticipant = useCallback((peerId: string) => {
    setParticipants((prev) => {
      const participant = prev.find((p) => p.peerId === peerId);
      if (participant) {
        participant.mediaConnection?.close();
        participant.dataConnection?.close();
      }
      return prev.filter((p) => p.peerId !== peerId);
    });
  }, []);

  const addInCallMessage = useCallback((msg: InCallMessage) => {
    setInCallMessages((prev) => [...prev, msg]);
  }, []);

  useEffect(() => {
    return () => {
      if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);
      localStream?.getTracks().forEach((track) => track.stop());
      screenStream?.getTracks().forEach((track) => track.stop());
    };
  }, [localStream, screenStream]);

  return {
    callState,
    callType,
    callLog,
    participants,
    setParticipants,
    localStream,
    screenStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    inCallMessages,
    startLocalStream,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    toggleCamera,
    initiateCall,
    acceptCall,
    markActive,
    endCall,
    removeParticipant,
    addInCallMessage,
  };
}
