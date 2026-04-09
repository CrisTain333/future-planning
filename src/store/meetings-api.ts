import { api } from "./api";
import { IMeeting, IActionItem, ApiResponse, PaginatedResponse } from "@/types";

interface GetMeetingsParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface CreateMeetingBody {
  title: string;
  description?: string;
  agenda?: string[];
  date: string;
  duration: number;
  type: "regular" | "special" | "emergency";
  invitees: string[];
}

interface UpdateMeetingBody {
  title?: string;
  description?: string;
  agenda?: string[];
  date?: string;
  duration?: number;
  type?: "regular" | "special" | "emergency";
  invitees?: string[];
  status?: string;
}

interface UpdateAttendanceBody {
  attendance: { userId: string; status: string }[];
}

interface UpdateMinutesBody {
  mode?: "structured" | "freeform";
  freeformContent?: string;
  agendaItems?: { title: string; discussion: string; decision: string }[];
  decisions?: string[];
  actionItems?: { title: string; assignee: string; dueDate: string }[];
  status?: "draft" | "finalized";
}

interface GetActionItemsParams {
  status?: string;
}

export const meetingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMeetings: builder.query<PaginatedResponse<IMeeting>, GetMeetingsParams>({
      query: (params) => ({
        url: "/meetings",
        params,
      }),
      providesTags: ["Meetings"],
    }),
    getMeeting: builder.query<ApiResponse<IMeeting>, string>({
      query: (id) => `/meetings/${id}`,
      providesTags: ["MeetingDetail"],
    }),
    createMeeting: builder.mutation<ApiResponse<IMeeting>, CreateMeetingBody>({
      query: (body) => ({
        url: "/meetings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Meetings"],
    }),
    updateMeeting: builder.mutation<ApiResponse<IMeeting>, { id: string; body: UpdateMeetingBody }>({
      query: ({ id, body }) => ({
        url: `/meetings/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Meetings", "MeetingDetail"],
    }),
    cancelMeeting: builder.mutation<ApiResponse<null>, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/meetings/${id}`,
        method: "DELETE",
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: ["Meetings", "MeetingDetail"],
    }),
    sendReminder: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/meetings/${id}/remind`,
        method: "POST",
      }),
      invalidatesTags: ["MeetingDetail"],
    }),
    updateAttendance: builder.mutation<ApiResponse<IMeeting>, { id: string; body: UpdateAttendanceBody }>({
      query: ({ id, body }) => ({
        url: `/meetings/${id}/attendance`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MeetingDetail"],
    }),
    selfCheckIn: builder.mutation<ApiResponse<IMeeting>, string>({
      query: (id) => ({
        url: `/meetings/${id}/checkin`,
        method: "POST",
      }),
      invalidatesTags: ["MeetingDetail", "Meetings"],
    }),
    getMinutes: builder.query<ApiResponse<IMeeting>, string>({
      query: (id) => `/meetings/${id}/minutes`,
      providesTags: ["MeetingDetail"],
    }),
    updateMinutes: builder.mutation<ApiResponse<IMeeting>, { id: string; body: UpdateMinutesBody }>({
      query: ({ id, body }) => ({
        url: `/meetings/${id}/minutes`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MeetingDetail", "ActionItems"],
    }),
    sendMinutes: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/meetings/${id}/minutes/send`,
        method: "POST",
      }),
    }),
    getActionItems: builder.query<ApiResponse<IActionItem[]>, GetActionItemsParams>({
      query: (params) => ({
        url: "/meetings/action-items",
        params,
      }),
      providesTags: ["ActionItems"],
    }),
    updateActionItem: builder.mutation<ApiResponse<IActionItem>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/meetings/action-items/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["ActionItems", "MeetingDetail"],
    }),
    getGoogleAuthUrl: builder.query<ApiResponse<{ url: string }>, void>({
      query: () => "/auth/google",
    }),
    disconnectGoogle: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: "/auth/google",
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useCancelMeetingMutation,
  useSendReminderMutation,
  useUpdateAttendanceMutation,
  useSelfCheckInMutation,
  useGetMinutesQuery,
  useUpdateMinutesMutation,
  useSendMinutesMutation,
  useGetActionItemsQuery,
  useUpdateActionItemMutation,
  useLazyGetGoogleAuthUrlQuery,
  useDisconnectGoogleMutation,
} = meetingsApi;
