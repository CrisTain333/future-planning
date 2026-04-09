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
  Landmark,
  Video,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/meetings", label: "Meetings", icon: Video },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/notices", label: "Notice Board", icon: Megaphone },
  { href: "/admin/accounting", label: "Accounting", icon: Calculator },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/meetings", label: "Meetings", icon: Video },
  { href: "/admin/investments", label: "Investments", icon: Landmark },
  { href: "/admin/collection-calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/email-logs", label: "Email Logs", icon: Mail },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

function SidebarNav({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const links = role === "admin" ? adminLinks : memberLinks;

  return (
    <div className="flex flex-col gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col h-screen sticky top-0 glass-sidebar">
      <nav className="flex flex-col gap-1 p-4">
        <div className="mb-6 px-2">
          <h2 className="text-lg font-bold text-primary">Future Planning</h2>
        </div>
        <SidebarNav />
      </nav>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent/50 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[70] h-full w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-primary">Future Planning</h2>
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <SidebarNav onClick={() => setOpen(false)} />
        </nav>
      </aside>
    </div>
  );
}
