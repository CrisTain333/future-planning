"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Plus, Trash2, LogOut } from "lucide-react";
import { useGetConversationsQuery, useDeleteConversationMutation } from "@/store/chat-api";
import { useSession } from "next-auth/react";
import { IConversation, IUser, IPresence } from "@/types";
import { OnlineBadge } from "./online-badge";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface ChatSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNew: () => void;
  presenceMap: Map<string, IPresence>;
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ChatSidebar({ activeConversationId, onSelectConversation, onCreateNew, presenceMap }: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; convId: string; convType: string } | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;
  const userRole = (session?.user as unknown as { role: string })?.role;
  const [deleteConversation] = useDeleteConversationMutation();

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, convId: string, convType: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, convId, convType });
  };

  const handleDelete = async () => {
    if (!contextMenu) return;
    try {
      await deleteConversation(contextMenu.convId).unwrap();
      toast.success(contextMenu.convType === "group" ? "Left group" : "Conversation deleted");
      if (activeConversationId === contextMenu.convId) {
        onSelectConversation("");
      }
    } catch {
      toast.error("Failed to delete conversation");
    }
    setContextMenu(null);
  };

  const { data, isLoading } = useGetConversationsQuery({ search, limit: 50 });
  const conversations = (data?.data as (IConversation & { unreadCount?: number })[]) || [];

  const getDisplayName = (conv: IConversation) => {
    if (conv.type === "group") return conv.name || "Group";
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Chats</h2>
          {userRole === "admin" && (
            <button
              onClick={onCreateNew}
              className="h-8 w-8 rounded-full bg-[hsl(181,87%,31%)] text-white flex items-center justify-center hover:bg-[hsl(181,87%,26%)] transition-all duration-200 shadow-sm"
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-full border-0 outline-none focus:ring-2 focus:ring-[hsl(181,87%,31%)]/20 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                <div className="h-11 w-11 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <p className="text-sm font-medium text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new one!</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeConversationId;
            const displayName = getDisplayName(conv);
            const otherUserId = getOtherUserId(conv);
            const isOnline = otherUserId ? presenceMap.get(otherUserId)?.status === "online" : false;
            const avatarColor = getAvatarColor(displayName);

            return (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                onContextMenu={(e) => handleContextMenu(e, conv._id, conv.type)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 relative
                  ${isActive
                    ? "bg-[hsl(181,87%,31%)]/8 border-l-[3px] border-l-[hsl(181,87%,31%)]"
                    : "border-l-[3px] border-l-transparent hover:bg-gray-50"
                  }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`h-11 w-11 rounded-full ${avatarColor} flex items-center justify-center text-sm font-semibold text-white shadow-sm`}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  {conv.type === "direct" && (
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <OnlineBadge isOnline={isOnline} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${isActive ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                      {displayName}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-[11px] text-gray-400 flex-shrink-0">
                        {dayjs(conv.lastMessage.createdAt).fromNow(true)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount && conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {conv.unreadCount && conv.unreadCount > 0 ? (
                  <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-[hsl(181,87%,31%)] text-white text-[11px] flex items-center justify-center font-semibold">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextRef}
          className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            {contextMenu.convType === "group" ? (
              <><LogOut className="h-4 w-4" /> Leave Group</>
            ) : (
              <><Trash2 className="h-4 w-4" /> Delete Chat</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
