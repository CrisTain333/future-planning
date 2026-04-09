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

  const displayName = getDisplayName() || "";
  const subtext = getSubtext();
  const online = isOtherOnline();

  return (
    <div className="h-16 flex items-center justify-between px-4 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm z-10">
      {/* Left: avatar + info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-[hsl(181,87%,31%)] flex items-center justify-center text-sm font-semibold text-white shadow-sm">
            {conversation.type === "group"
              ? <Users className="h-5 w-5" />
              : displayName.charAt(0).toUpperCase()
            }
          </div>
          {conversation.type === "direct" && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineBadge isOnline={online} />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{displayName}</h3>
          <p className={`text-xs leading-tight mt-0.5 ${
            subtext === "Online" ? "text-[hsl(181,87%,31%)] font-medium" : "text-gray-400"
          }`}>
            {subtext}
          </p>
        </div>
      </div>

      {/* Right: call action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAudioCall}
          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-[hsl(181,87%,31%)]/10 hover:text-[hsl(181,87%,31%)] transition-all duration-200"
          title="Audio call"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          onClick={onVideoCall}
          className="h-9 w-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-[hsl(181,87%,31%)]/10 hover:text-[hsl(181,87%,31%)] transition-all duration-200"
          title="Video call"
        >
          <Video className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
