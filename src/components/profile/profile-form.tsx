"use client";

import { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
} from "@/store/profile-api";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/validations/user";
import { IUser } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button, Input, Select } from "antd";
import { Camera } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ProfileFormProps {
  user: IUser;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadPicture, { isLoading: isUploading }] =
    useUploadProfilePictureMutation();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user.fullName ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      bloodGroup: user.bloodGroup,
    },
  });

  const bloodGroupValue = watch("bloodGroup");
  const initials = getInitials(user.fullName);

  async function onSubmit(data: UpdateProfileInput) {
    try {
      await updateProfile(data).unwrap();
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "data" in err &&
        typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data: { message: string } }).data.message
          : "Failed to update profile";
      toast.error(message);
    }
  }

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG and PNG files are allowed");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadPicture(formData).unwrap();
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to upload profile picture");
    }

    // Reset file input so same file can be selected again
    e.target.value = "";
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-white/20">
        <h2 className="text-lg font-semibold">Profile Information</h2>
        <p className="text-sm text-muted-foreground">Update your personal details</p>
      </div>

      {/* Avatar Section */}
      <div className="p-6 flex flex-col items-center gap-3 border-b border-white/10">
        <Avatar className="h-24 w-24 ring-4 ring-white/50">
          {user.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={user.fullName} />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          htmlType="button"
          onClick={handlePhotoClick}
          loading={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          Change Photo
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="fullName">Full Name</label>
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input 
                  {...field}
                  id="fullName" 
                  status={errors.fullName ? "error" : undefined}
                />
              )}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">Username</label>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input 
                  {...field}
                  id="username" 
                  status={errors.username ? "error" : undefined}
                />
              )}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">Email</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input 
                  {...field}
                  id="email" 
                  type="email" 
                  status={errors.email ? "error" : undefined}
                />
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="phone">Phone</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input 
                  {...field}
                  id="phone" 
                  status={errors.phone ? "error" : undefined}
                />
              )}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="address">Address</label>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Input 
                {...field}
                id="address" 
                status={errors.address ? "error" : undefined}
              />
            )}
          />
          {errors.address && (
            <p className="text-xs text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Blood Group</label>
          <Select
            className="w-full"
            value={bloodGroupValue || undefined}
            onChange={(val: string) =>
              setValue(
                "bloodGroup",
                val as UpdateProfileInput["bloodGroup"],
                { shouldValidate: true }
              )
            }
            placeholder="Select blood group"
            options={BLOOD_GROUPS.map((bg) => ({ label: bg, value: bg }))}
          />
          {errors.bloodGroup && (
            <p className="text-xs text-destructive">
              {errors.bloodGroup.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button type="primary" htmlType="submit" className="glow-primary" loading={isUpdating}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
