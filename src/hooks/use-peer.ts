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

  const callHandlerRef = useRef<((call: MediaConnection) => void) | null>(null);
  const dataHandlerRef = useRef<((conn: DataConnection) => void) | null>(null);
  const readyResolversRef = useRef<Array<(peer: Peer) => void>>([]);

  const waitForPeer = useCallback((): Promise<Peer> => {
    if (peerRef.current?.open) return Promise.resolve(peerRef.current);
    return new Promise((resolve) => {
      readyResolversRef.current.push(resolve);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return;

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Let PeerJS auto-generate ID to avoid conflicts from React strict mode / stale sessions
    const peer = new Peer({
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

    peerRef.current = peer;

    peer.on("call", (call) => {
      console.log("[PeerJS] Incoming call from:", call.peer);
      callHandlerRef.current?.(call);
    });

    peer.on("connection", (conn) => {
      console.log("[PeerJS] Incoming data from:", conn.peer);
      dataHandlerRef.current?.(conn);
    });

    peer.on("open", (id) => {
      console.log("[PeerJS] Connected with ID:", id);
      setPeerId(id);
      setIsConnected(true);

      readyResolversRef.current.forEach((resolve) => resolve(peer));
      readyResolversRef.current = [];
    });

    peer.on("disconnected", () => {
      console.log("[PeerJS] Disconnected from signaling server (WebRTC connections stay alive)");
      setIsConnected(false);
      // Don't reconnect — WebRTC peer-to-peer connections survive signaling server disconnect
      // Reconnecting causes a loop with the free PeerJS cloud server
    });

    peer.on("error", (err) => {
      console.error("[PeerJS] Error:", err.type, err.message);
      setIsConnected(false);
    });

    return () => {
      peer.destroy();
      peerRef.current = null;
      setPeerId(null);
      setIsConnected(false);
      readyResolversRef.current = [];
    };
  }, [userId, enabled]);

  const callPeer = useCallback(
    async (remotePeerId: string, stream: MediaStream): Promise<MediaConnection | null> => {
      console.log("[PeerJS] Waiting for peer ready to call:", remotePeerId);
      const peer = await waitForPeer();
      console.log("[PeerJS] Calling:", remotePeerId);
      const call = peer.call(remotePeerId, stream);
      mediaConnectionsRef.current.set(remotePeerId, call);
      return call;
    },
    [waitForPeer]
  );

  const connectData = useCallback(
    async (remotePeerId: string): Promise<DataConnection | null> => {
      const peer = await waitForPeer();
      const conn = peer.connect(remotePeerId);
      dataConnectionsRef.current.set(remotePeerId, conn);
      return conn;
    },
    [waitForPeer]
  );

  const onIncomingCall = useCallback(
    (handler: (call: MediaConnection) => void) => {
      callHandlerRef.current = handler;
    },
    []
  );

  const onIncomingData = useCallback(
    (handler: (conn: DataConnection) => void) => {
      dataHandlerRef.current = handler;
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
    waitForPeer,
  };
}
