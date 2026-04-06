"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Calculator,
  BarChart3,
  FileText,
  CalendarDays,
  Settings2,
  ScrollText,
  Mail,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, Button } from "antd";
import { Menu } from "lucide-react";
import { useState } from "react";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/notices", label: "Notice Board", icon: Megaphone },
  { href: "/admin/accounting", label: "Accounting", icon: Calculator },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/collection-calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/email-logs", label: "Email Logs", icon: Mail },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

function SidebarContent({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const links = role === "admin" ? adminLinks : memberLinks;

  return (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-bold text-primary">Future Planning</h2>
      </div>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={cn(
               "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
               isActive
               ? "bg-primary text-primary-foreground"
               : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col h-screen sticky top-0 glass-sidebar">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="text"
        className="md:hidden inline-flex items-center justify-center h-10 w-10 p-0"
        onClick={() => setOpen(true)}
        icon={<Menu className="h-5 w-5" />}
      />
      <Drawer
        placement="left"
        onClose={() => setOpen(false)}
        open={open}
        size="default"
        styles={{ body: { padding: 0 } }}
        closable={false}
      >
        <SidebarContent onClick={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
