import { api } from "./api";
import { IEmailLog, PaginatedResponse } from "@/types";

interface GetEmailLogsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

interface SendReminderParams {
  userIds: string[];
  month: number;
  year: number;
}

export const emailLogsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmailLogs: builder.query<PaginatedResponse<IEmailLog>, GetEmailLogsParams>({
      query: (params) => ({ url: "/emails/logs", params }),
      providesTags: ["EmailLogs"],
    }),
    sendManualReminder: builder.mutation<
      { success: boolean; message: string; sent: number },
      SendReminderParams
    >({
      query: (body) => ({
        url: "/emails/send-reminder",
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmailLogs"],
    }),
  }),
});

export const { useGetEmailLogsQuery, useSendManualReminderMutation } = emailLogsApi;
