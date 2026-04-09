"use client";

import { useState } from "react";
import { Input, Button } from "antd";
import { Plus, Search } from "lucide-react";
import { useGetConversationsQuery } from "@/store/chat-api";
import { useSession } from "next-auth/react";
import { IConversation, IUser, IPresence } from "@/types";
import { OnlineBadge } from "./online-badge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface ChatSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNew: () => void;
  presenceMap: Map<string, IPresence>;
}

export function ChatSidebar({ activeConversationId, onSelectConversation, onCreateNew, presenceMap }: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;

  const { data, isLoading } = useGetConversationsQuery({ search, limit: 50 });
  const conversations = (data?.data as (IConversation & { unreadCount?: number })[]) || [];

  const getDisplayName = (conv: IConversation) => {
    if (conv.type === "group") return conv.name;
    const otherParticipant = conv.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    return otherParticipant?.fullName || "Unknown";
  };

  const getOtherUserId = (conv: IConversation) => {
    if (conv.type !== "direct") return null;
    const other = conv.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    return other?._id || null;
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Chats</h2>
          <Button type="primary" size="small" icon={<Plus className="h-4 w-4" />} onClick={onCreateNew} />
        </div>
        <Input prefix={<Search className="h-4 w-4 text-gray-400" />} placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear size="small" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet. Start a new one!</div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeConversationId;
            const displayName = getDisplayName(conv);
            const otherUserId = getOtherUserId(conv);
            const isOnline = otherUserId ? presenceMap.get(otherUserId)?.status === "online" : false;

            return (
              <button key={conv._id} onClick={() => onSelectConversation(conv._id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${isActive ? "bg-accent" : ""}`}>
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  {conv.type === "direct" && (
                    <div className="absolute -bottom-0.5 -right-0.5"><OnlineBadge isOnline={isOnline} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{displayName}</span>
                    {conv.lastMessage && <span className="text-xs text-muted-foreground">{dayjs(conv.lastMessage.createdAt).fromNow(true)}</span>}
                  </div>
                  {conv.lastMessage && <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage.content}</p>}
                </div>
                {conv.unreadCount && conv.unreadCount > 0 ? (
                  <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
