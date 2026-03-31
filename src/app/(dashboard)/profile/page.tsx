"use client";

import { useGetProfileQuery } from "@/store/profile-api";
import ProfileForm from "@/components/profile/profile-form";
import PasswordForm from "@/components/profile/password-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <ProfileForm user={user} />
      <Separator />
      <PasswordForm />
    </div>
  );
}
