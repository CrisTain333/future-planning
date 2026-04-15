"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { IMessage, IPresence, ICallLog } from "@/types";

interface SyncData {
  messages: IMessage[];
  presence: IPresence[];
  typing: IPresence[];
  calls: ICallLog[];
  serverTime?: string;
}

interface UsePollingOptions {
  activeConversationId?: string | null;
  onMessages?: (messages: IMessage[]) => void;
  onPresence?: (presence: IPresence[]) => void;
  onTyping?: (typing: IPresence[]) => void;
  onCalls?: (calls: ICallLog[]) => void;
  enabled?: boolean;
}

const ACTIVE_INTERVAL = 2000;
const IDLE_INTERVAL = 30000;

export function usePolling({
  activeConversationId,
  onMessages,
  onPresence,
  onTyping,
  onCalls,
  enabled = true,
}: UsePollingOptions) {
  const lastSyncRef = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const sync = useCallback(async () => {
    try {
      const res = await fetch(`/api/realtime/sync?since=${encodeURIComponent(lastSyncRef.current)}`);
      if (!res.ok) return;

      const json = await res.json();
      if (!json.success) return;

      const data: SyncData = json.data;
      lastSyncRef.current = data.serverTime || new Date().toISOString();

      if (data.messages.length > 0) onMessages?.(data.messages);
      if (data.presence.length > 0) onPresence?.(data.presence);
      onTyping?.(data.typing);
      if (data.calls.length > 0) onCalls?.(data.calls);
    } catch {
      // Silently fail — next poll will retry
    }
  }, [onMessages, onPresence, onTyping, onCalls]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!enabled || !isVisible) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const interval = activeConversationId ? ACTIVE_INTERVAL : IDLE_INTERVAL;
    sync();
    intervalRef.current = setInterval(sync, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, isVisible, activeConversationId, sync]);

  return { sync, isVisible };
}
