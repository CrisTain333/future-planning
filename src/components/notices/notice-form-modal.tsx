"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Modal, Button, Input } from "antd";

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
    control,
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
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={
        <div>
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Notice" : "New Notice"}</h2>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {isEdit
              ? "Update the notice details below."
              : "Fill in the details to create a new notice."}
          </p>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="title">Title</label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="title"
                placeholder="Notice title"
                status={errors.title ? "error" : undefined}
              />
            )}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="body">Body</label>
          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                id="body"
                placeholder="Notice body"
                rows={5}
                status={errors.body ? "error" : undefined}
              />
            )}
          />
          {errors.body && (
            <p className="text-sm text-destructive">{errors.body.message}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button htmlType="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
