"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
} from "@/store/notices-api";
import {
  createNoticeSchema,
  type CreateNoticeInput,
} from "@/validations/notice";
import { INotice } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface NoticeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice?: INotice;
}

export function NoticeFormModal({
  open,
  onOpenChange,
  notice,
}: NoticeFormModalProps) {
  const isEdit = !!notice;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateNoticeInput>({
    resolver: zodResolver(createNoticeSchema),
    defaultValues: {
      title: notice?.title ?? "",
      body: notice?.body ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: notice?.title ?? "",
        body: notice?.body ?? "",
      });
    }
  }, [open, notice, reset]);

  const [createNotice, { isLoading: isCreating }] = useCreateNoticeMutation();
  const [updateNotice, { isLoading: isUpdating }] = useUpdateNoticeMutation();
  const isSubmitting = isCreating || isUpdating;

  const onSubmit = async (data: CreateNoticeInput) => {
    try {
      if (isEdit && notice) {
        await updateNotice({ id: notice._id, body: data }).unwrap();
        toast.success("Notice updated successfully");
      } else {
        await createNotice(data).unwrap();
        toast.success("Notice created successfully");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "Failed to update notice" : "Failed to create notice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Notice" : "New Notice"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the notice details below."
              : "Fill in the details to create a new notice."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Notice title"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              placeholder="Notice body"
              rows={5}
              {...register("body")}
              aria-invalid={!!errors.body}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
