"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { MobileSidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();
  const fullName = (session?.user as { fullName?: string })?.fullName || "User";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const items: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div className="px-1 py-0.5">
          <p className="text-sm font-medium m-0">{fullName}</p>
          <p className="text-xs text-muted-foreground capitalize m-0">
            {(session?.user as { role?: string })?.role}
          </p>
        </div>
      ),
      disabled: true,
      className: "!cursor-default",
    },
    { type: 'divider' },
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserCircle className="h-4 w-4" />,
      onClick: () => (window.location.href = "/profile"),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Log out',
      icon: <LogOut className="h-4 w-4" />,
      danger: true,
      onClick: async () => {
        await signOut({ redirect: false });
        window.location.href = "/login";
      },
    },
  ];

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 glass-header px-4 md:px-6">
      <MobileSidebar />

      <div className="flex-1">
        <h1 className="text-lg font-semibold md:hidden text-primary">FP</h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" overlayClassName="w-56">
          <div className="relative h-8 w-8 rounded-full cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
