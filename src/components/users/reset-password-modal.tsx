"use client";

import { useState } from "react";
import { Modal, Input } from "antd";
import { useUpdateUserMutation } from "@/store/users-api";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: { _id: string; fullName: string } | null;
}

export function ResetPasswordModal({ open, onClose, user }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const handleReset = async () => {
    if (!user) return;

    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await updateUser({ id: user._id, body: { password: newPassword } }).unwrap();
      toast.success(`Password reset for ${user.fullName}`);
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch {
      toast.error("Failed to reset password");
    }
  };

  const handleCancel = () => {
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <span>Reset Password</span>
        </div>
      }
      open={open}
      onOk={handleReset}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText="Reset Password"
      okButtonProps={{ danger: true }}
    >
      {user && (
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Set a new password for <strong>{user.fullName}</strong>
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">New Password</label>
            <Input.Password
              placeholder="Enter new password (min 4 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={4}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm Password</label>
            <Input.Password
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={4}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
