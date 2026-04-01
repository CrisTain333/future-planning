"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

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

import { Modal, Button, Input, Select } from "antd";

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
    control,
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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={
        <div>
          <h2 className="text-lg font-semibold">{isEditMode ? "Edit User" : "Add User"}</h2>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {isEditMode
              ? "Update the user details below."
              : "Fill in the details to create a new user."}
          </p>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="fullName">Full Name</label>
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="fullName"
                  placeholder="John Doe"
                  status={errors.fullName ? "error" : undefined}
                />
              )}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">Username</label>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="username"
                  placeholder="johndoe"
                  status={errors.username ? "error" : undefined}
                />
              )}
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
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">Password</label>
              <Controller
                name="password"
                control={control as any}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    id="password"
                    placeholder="Min 4 characters"
                    status={(errors as { password?: { message?: string } }).password ? "error" : undefined}
                  />
                )}
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
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">Email</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  status={errors.email ? "error" : undefined}
                />
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="phone">Phone</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="phone"
                  placeholder="+1234567890"
                />
              )}
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="address">Address</label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="address"
                  placeholder="123 Main St"
                />
              )}
            />
          </div>

          {/* Blood Group */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Blood Group</label>
            <Select
              className="w-full"
              value={bloodGroupValue || undefined}
              onChange={(val: string) =>
                setValue(
                  "bloodGroup",
                  val as CreateUserInput["bloodGroup"],
                  { shouldValidate: true }
                )
              }
              placeholder="Select blood group"
              options={BLOOD_GROUPS.map((bg) => ({ label: bg, value: bg }))}
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
            <Select
              className="w-full"
              value={roleValue || "user"}
              onChange={(val: string) =>
                setValue("role", val as "admin" | "user", {
                  shouldValidate: true,
                })
              }
              placeholder="Select role"
              options={[
                { label: "User", value: "user" },
                { label: "Admin", value: "admin" },
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button htmlType="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {isEditMode ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
