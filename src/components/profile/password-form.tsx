"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useChangePasswordMutation } from "@/store/profile-api";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/validations/user";
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

export default function PasswordForm() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  async function onSubmit(data: ChangePasswordInput) {
    try {
      await changePassword(data).unwrap();
      toast.success("Password changed successfully");
      reset();
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "data" in err &&
        typeof (err as { data?: { message?: string } }).data?.message === "string"
          ? (err as { data: { message: string } }).data.message
          : "Failed to change password";
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="password-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="password-form" disabled={isLoading}>
          {isLoading ? "Changing..." : "Change Password"}
        </Button>
      </CardFooter>
    </Card>
  );
}
