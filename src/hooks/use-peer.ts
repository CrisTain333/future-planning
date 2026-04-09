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

  // Queue handlers until peer is ready
  const callHandlerRef = useRef<((call: MediaConnection) => void) | null>(null);
  const dataHandlerRef = useRef<((conn: DataConnection) => void) | null>(null);
  const readyResolversRef = useRef<Array<(peer: Peer) => void>>([]);

  // Returns a promise that resolves when peer is open
  const waitForPeer = useCallback((): Promise<Peer> => {
    if (peerRef.current?.open) return Promise.resolve(peerRef.current);
    return new Promise((resolve) => {
      readyResolversRef.current.push(resolve);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Destroy existing peer if userId changed
    if (peerRef.current) {
      peerRef.current.destroy();
    }

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

    peerRef.current = peer;

    // Route PeerJS events through refs so handlers can be set at any time
    peer.on("call", (call) => {
      console.log("[PeerJS] Incoming call from:", call.peer);
      callHandlerRef.current?.(call);
    });

    peer.on("connection", (conn) => {
      console.log("[PeerJS] Incoming data connection from:", conn.peer);
      dataHandlerRef.current?.(conn);
    });

    peer.on("open", (id) => {
      console.log("[PeerJS] Connected with ID:", id);
      setPeerId(id);
      setIsConnected(true);

      // Resolve any waitForPeer promises
      readyResolversRef.current.forEach((resolve) => resolve(peer));
      readyResolversRef.current = [];
    });

    peer.on("disconnected", () => {
      console.log("[PeerJS] Disconnected, reconnecting...");
      setIsConnected(false);
      peer.reconnect();
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
      console.log("[PeerJS] Waiting for peer to be ready...");
      const peer = await waitForPeer();
      console.log("[PeerJS] Calling peer:", remotePeerId, "with stream tracks:", stream.getTracks().length);
      const call = peer.call(remotePeerId, stream);
      console.log("[PeerJS] Call object created:", !!call);
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

  // Set handlers — events are routed through refs, so these work regardless of peer state
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
