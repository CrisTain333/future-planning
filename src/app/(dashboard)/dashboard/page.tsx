"use client";

import { useSession } from "next-auth/react";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import MemberDashboard from "@/components/dashboard/member-dashboard";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as unknown as { role?: string })?.role;

  if (role === "admin") {
    return <AdminDashboard />;
  }

  return <MemberDashboard />;
}
