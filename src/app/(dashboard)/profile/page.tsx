"use client";

import { useGetProfileQuery } from "@/store/profile-api";
import ProfileForm from "@/components/profile/profile-form";
import PasswordForm from "@/components/profile/password-form";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  const { data, isLoading } = useGetProfileQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const user = data?.data;
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-primary" />
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}
