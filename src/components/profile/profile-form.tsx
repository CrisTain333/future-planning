"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
    register,
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
    formData.append("profilePicture", file);

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
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 mb-6">
          <Avatar className="size-20">
            {user.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.fullName} />
            ) : null}
            <AvatarFallback className="text-lg">
              {getInitials(user.fullName)}
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
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePhotoClick}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Change Photo"}
          </Button>
        </div>

        <form
          id="profile-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...register("username")} />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Blood Group</Label>
            <Select
              value={bloodGroupValue ?? ""}
              onValueChange={(val: string | null) =>
                setValue(
                  "bloodGroup",
                  (val || undefined) as UpdateProfileInput["bloodGroup"],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bloodGroup && (
              <p className="text-xs text-destructive">
                {errors.bloodGroup.message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="profile-form" disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
