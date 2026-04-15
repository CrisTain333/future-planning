"use client";

import { IConversation, IUser, IPresence } from "@/types";
import { Phone, Video, Users, ArrowLeft } from "lucide-react";
import { message } from "antd";
import { OnlineBadge } from "./online-badge";

interface ConversationHeaderProps {
  conversation: IConversation;
  currentUserId: string;
  presenceMap: Map<string, IPresence>;
  onAudioCall: () => void;
  onVideoCall: () => void;
  onBack?: () => void;
}

export function ConversationHeader({ conversation, currentUserId, presenceMap, onAudioCall, onVideoCall, onBack }: ConversationHeaderProps) {
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
    <div className="h-14 md:h-16 flex items-center justify-between px-2 md:px-4 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm z-10">
      {/* Left: back button (mobile) + avatar + info */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all duration-200 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="relative flex-shrink-0">
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
          <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-[150px] md:max-w-none">{displayName}</h3>
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
          className="h-10 w-10 rounded-full flex items-center justify-center text-[hsl(181,87%,31%)] hover:bg-[hsl(181,87%,31%)]/10 transition-all duration-200"
          title="Audio call"
        >
          <Phone className="h-[22px] w-[22px]" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => message.info("Video call coming soon...")}
          className="h-10 w-10 rounded-full flex items-center justify-center text-[hsl(181,87%,31%)] hover:bg-[hsl(181,87%,31%)]/10 transition-all duration-200"
          title="Video call"
        >
          <Video className="h-[22px] w-[22px]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
