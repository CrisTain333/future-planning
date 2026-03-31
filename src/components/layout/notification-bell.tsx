"use client";

import { Bell, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from "@/store/notifications-api";

interface INotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell() {
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { data: notificationsData } = useGetNotificationsQuery({
    page: 1,
    limit: 10,
  });
  const [markRead] = useMarkNotificationsReadMutation();

  const unreadCount = unreadData?.data?.count ?? 0;
  const notifications: INotification[] = notificationsData?.data ?? [];
  const hasUnread = unreadCount > 0;

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.isRead) {
      markRead({ notificationIds: [notification._id] });
    }
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n._id);
    if (unreadIds.length > 0) {
      markRead({ notificationIds: unreadIds });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none">
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 font-semibold text-sm">Notifications</div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`flex flex-col items-start gap-1 px-3 py-2 cursor-pointer ${
                  !notification.isRead ? "bg-accent/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="font-medium text-sm leading-tight">
                    {notification.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {notification.message}
                </p>
              </DropdownMenuItem>
            ))}
            {hasUnread && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center justify-center gap-1.5 py-2 cursor-pointer text-primary"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Mark all as read</span>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
