import { api } from "./api";
import { INotification, PaginatedResponse, ApiResponse } from "@/types";

interface GetNotificationsParams {
  page?: number;
  limit?: number;
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<INotification>, GetNotificationsParams>({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markNotificationsRead: builder.mutation<ApiResponse<null>, { notificationIds: string[] }>({
      query: (body) => ({ url: "/notifications/mark-read", method: "PATCH", body }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationsReadMutation,
} = notificationsApi;
