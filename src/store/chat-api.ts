import { api } from "./api";
import {
  IConversation,
  IMessage,
  IUser,
  SyncResponse,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

interface GetConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface SendMessageBody {
  content: string;
  type?: "text" | "image" | "file";
  replyTo?: string;
}

interface CreateConversationBody {
  type: "direct" | "group";
  name?: string;
  participants: string[];
}

interface UpdateConversationBody {
  name?: string;
  addParticipants?: string[];
  removeParticipants?: string[];
}

interface HeartbeatBody {
  typing?: {
    conversationId: string;
    isTyping: boolean;
  };
}

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<PaginatedResponse<IConversation>, GetConversationsParams>({
      query: (params) => ({
        url: "/conversations",
        params,
      }),
      providesTags: ["Conversations"],
    }),
    createConversation: builder.mutation<ApiResponse<IConversation>, CreateConversationBody>({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),
    updateConversation: builder.mutation<
      ApiResponse<IConversation>,
      { id: string; body: UpdateConversationBody }
    >({
      query: ({ id, body }) => ({
        url: `/conversations/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),
    deleteConversation: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/conversations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Conversations", "Messages"],
    }),
    getMessages: builder.query<
      PaginatedResponse<IMessage>,
      { conversationId: string; before?: string; limit?: number }
    >({
      query: ({ conversationId, before, limit }) => ({
        url: `/conversations/${conversationId}/messages`,
        params: { before, limit },
      }),
      providesTags: ["Messages"],
    }),
    sendMessage: builder.mutation<
      ApiResponse<IMessage>,
      { conversationId: string; body: SendMessageBody }
    >({
      query: ({ conversationId, body }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Messages", "Conversations"],
    }),
    deleteMessage: builder.mutation<ApiResponse<null>, { conversationId: string; messageId: string }>({
      query: ({ conversationId, messageId }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Messages"],
    }),
    markConversationRead: builder.mutation<ApiResponse<null>, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Conversations"],
    }),
    sync: builder.query<SyncResponse, { since: string }>({
      query: ({ since }) => ({
        url: "/realtime/sync",
        params: { since },
      }),
    }),
    getChatMembers: builder.query<ApiResponse<IUser[]>, void>({
      query: () => "/conversations/members",
    }),
    heartbeat: builder.mutation<ApiResponse<null>, HeartbeatBody>({
      query: (body) => ({
        url: "/realtime/heartbeat",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useMarkConversationReadMutation,
  useDeleteConversationMutation,
  useGetChatMembersQuery,
  useLazySyncQuery,
  useHeartbeatMutation,
} = chatApi;
