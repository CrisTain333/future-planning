"use client";

import { IConversation, IUser, IPresence } from "@/types";
import { Phone, Video, Users } from "lucide-react";
import { OnlineBadge } from "./online-badge";

interface ConversationHeaderProps {
  conversation: IConversation;
  currentUserId: string;
  presenceMap: Map<string, IPresence>;
  onAudioCall: () => void;
  onVideoCall: () => void;
}

export function ConversationHeader({ conversation, currentUserId, presenceMap, onAudioCall, onVideoCall }: ConversationHeaderProps) {
  const getDisplayName = () => {
    if (conversation.type === "group") return conversation.name;
    const other = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    return other?.fullName || "Unknown";
  };

  const getSubtext = () => {
    if (conversation.type === "group") return `${conversation.participants.length} members`;
    const otherUser = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    if (!otherUser) return "";
    const presence = presenceMap.get(otherUser._id);
    return presence?.status === "online" ? "Online" : "Offline";
  };

  const isOtherOnline = () => {
    if (conversation.type !== "direct") return false;
    const other = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    if (!other) return false;
    return presenceMap.get(other._id)?.status === "online";
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {conversation.type === "group" ? <Users className="h-5 w-5" /> : getDisplayName().charAt(0).toUpperCase()}
          </div>
          {conversation.type === "direct" && (
            <div className="absolute -bottom-0.5 -right-0.5"><OnlineBadge isOnline={isOtherOnline()} /></div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{getDisplayName()}</h3>
          <p className="text-xs text-muted-foreground">{getSubtext()}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onAudioCall} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
          <Phone className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={onVideoCall} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
          <Video className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
