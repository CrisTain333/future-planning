"use client";

import { useState } from "react";
import { Modal, Select, Input, Radio } from "antd";
import { useGetChatMembersQuery, useCreateConversationMutation } from "@/store/chat-api";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { IUser } from "@/types";

interface CreateConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function CreateConversationModal({ open, onClose, onCreated }: CreateConversationModalProps) {
  const [type, setType] = useState<"direct" | "group">("direct");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;
  const userRole = (session?.user as unknown as { role: string })?.role;
  const isAdmin = userRole === "admin";

  const { data: membersData } = useGetChatMembersQuery();
  const members = (membersData?.data || []).filter(
    (u: IUser) => u._id !== currentUserId
  );

  const [createConversation, { isLoading }] = useCreateConversationMutation();

  const handleCreate = async () => {
    if (selectedUsers.length === 0) { toast.error("Select at least one member"); return; }
    if (type === "group" && !groupName.trim()) { toast.error("Enter a group name"); return; }

    try {
      const result = await createConversation({
        type,
        name: type === "group" ? groupName.trim() : undefined,
        participants: selectedUsers,
      }).unwrap();

      if (result.success) {
        toast.success(type === "group" ? "Group created" : "Conversation started");
        onCreated(result.data._id);
        handleClose();
      }
    } catch {
      toast.error("Failed to create conversation");
    }
  };

  const handleClose = () => {
    setType("direct");
    setSelectedUsers([]);
    setGroupName("");
    onClose();
  };

  return (
    <Modal title="New Conversation" open={open} onOk={handleCreate} onCancel={handleClose} confirmLoading={isLoading} okText="Start Chat">
      <div className="space-y-4 mt-4">
        {/* Only admins can create group chats */}
        {isAdmin && (
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Radio.Group value={type} onChange={(e) => setType(e.target.value)}>
              <Radio value="direct">Direct Message</Radio>
              <Radio value="group">Group Chat</Radio>
            </Radio.Group>
          </div>
        )}
        {type === "group" && isAdmin && (
          <div>
            <label className="text-sm font-medium mb-1 block">Group Name</label>
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name" maxLength={100} />
          </div>
        )}
        <div>
          <label className="text-sm font-medium mb-1 block">{type === "direct" ? "Select Member" : "Select Members"}</label>
          <Select
            mode={type === "group" ? "multiple" : undefined}
            value={type === "direct" ? selectedUsers[0] : selectedUsers}
            onChange={(val) => setSelectedUsers(type === "direct" ? [val as string] : (val as string[]))}
            placeholder="Search members..."
            showSearch
            optionFilterProp="label"
            className="w-full"
            options={members.map((u: IUser) => ({ value: u._id, label: u.fullName }))}
          />
        </div>
      </div>
    </Modal>
  );
}
