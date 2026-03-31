"use client";

import { useSession } from "next-auth/react";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as unknown as { role?: string })?.role;

  if (role === "admin") {
    return <AdminDashboard />;
  }

  // Member dashboard placeholder (Phase 3)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Member dashboard coming in Phase 3.</p>
    </div>
  );
}
