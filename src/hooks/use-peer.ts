"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Peer, { MediaConnection, DataConnection } from "peerjs";

interface UsePeerOptions {
  userId: string;
  enabled?: boolean;
}

export function usePeer({ userId, enabled = true }: UsePeerOptions) {
  const peerRef = useRef<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const mediaConnectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const dataConnectionsRef = useRef<Map<string, DataConnection>>(new Map());

  useEffect(() => {
    if (!enabled || !userId) return;

    const peer = new Peer(`fp-${userId}`, {
      host: process.env.NEXT_PUBLIC_PEERJS_HOST || "0.peerjs.com",
      port: parseInt(process.env.NEXT_PUBLIC_PEERJS_PORT || "443"),
      secure: process.env.NEXT_PUBLIC_PEERJS_SECURE !== "false",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("open", (id) => {
      setPeerId(id);
      setIsConnected(true);
    });

    peer.on("disconnected", () => {
      setIsConnected(false);
      peer.reconnect();
    });

    peer.on("error", () => {
      setIsConnected(false);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
      peerRef.current = null;
      setPeerId(null);
      setIsConnected(false);
    };
  }, [userId, enabled]);

  const callPeer = useCallback(
    (remotePeerId: string, stream: MediaStream): MediaConnection | null => {
      if (!peerRef.current) return null;
      const call = peerRef.current.call(remotePeerId, stream);
      mediaConnectionsRef.current.set(remotePeerId, call);
      return call;
    },
    []
  );

  const connectData = useCallback((remotePeerId: string): DataConnection | null => {
    if (!peerRef.current) return null;
    const conn = peerRef.current.connect(remotePeerId);
    dataConnectionsRef.current.set(remotePeerId, conn);
    return conn;
  }, []);

  const onIncomingCall = useCallback(
    (handler: (call: MediaConnection) => void) => {
      peerRef.current?.on("call", handler);
    },
    []
  );

  const onIncomingData = useCallback(
    (handler: (conn: DataConnection) => void) => {
      peerRef.current?.on("connection", handler);
    },
    []
  );

  const closeAllConnections = useCallback(() => {
    mediaConnectionsRef.current.forEach((conn) => conn.close());
    dataConnectionsRef.current.forEach((conn) => conn.close());
    mediaConnectionsRef.current.clear();
    dataConnectionsRef.current.clear();
  }, []);

  return {
    peer: peerRef.current,
    peerId,
    isConnected,
    callPeer,
    connectData,
    onIncomingCall,
    onIncomingData,
    closeAllConnections,
    mediaConnections: mediaConnectionsRef.current,
    dataConnections: dataConnectionsRef.current,
  };
}
