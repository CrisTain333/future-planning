"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { IUser } from "@/types";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserInput,
  UpdateUserInput,
} from "@/validations/user";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "@/store/users-api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon } from "lucide-react";

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IUser | null;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

export function UserFormModal({
  open,
  onOpenChange,
  user,
}: UserFormModalProps) {
  const isEditMode = !!user;

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      phone: "",
      address: "",
      bloodGroup: undefined,
      role: "user",
      ...(isEditMode ? {} : { password: "" }),
    },
  });

  useEffect(() => {
    if (open && user) {
      reset({
        fullName: user.fullName,
        username: user.username,
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        bloodGroup: user.bloodGroup,
        role: user.role,
      });
    } else if (open && !user) {
      reset({
        fullName: "",
        username: "",
        password: "",
        email: "",
        phone: "",
        address: "",
        bloodGroup: undefined,
        role: "user",
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    try {
      if (isEditMode && user) {
        await updateUser({ id: user._id, body: data }).unwrap();
        toast.success("User updated successfully");
      } else {
        await createUser(data as CreateUserInput).unwrap();
        toast.success("User created successfully");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(message || `Failed to ${isEditMode ? "update" : "create"} user`);
    }
  };

  const bloodGroupValue = watch("bloodGroup");
  const roleValue = watch("role");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the user details below."
              : "Fill in the details to create a new user."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                aria-invalid={!!errors.username}
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password (create only) */}
            {!isEditMode && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 4 characters"
                  aria-invalid={!!(errors as { password?: { message?: string } }).password}
                  {...register("password" as "fullName")}
                />
                {(errors as { password?: { message?: string } }).password && (
                  <p className="text-xs text-destructive">
                    {(errors as { password?: { message?: string } }).password?.message}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                {...register("phone")}
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St"
                {...register("address")}
              />
            </div>

            {/* Blood Group */}
            <div className="space-y-1.5">
              <Label>Blood Group</Label>
              <Select
                value={bloodGroupValue || ""}
                onValueChange={(val: string | null) =>
                  setValue(
                    "bloodGroup",
                    (val || undefined) as CreateUserInput["bloodGroup"],
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
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={roleValue || "user"}
                onValueChange={(val: string | null) =>
                  setValue("role", (val ?? "user") as "admin" | "user", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
              )}
              {isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
