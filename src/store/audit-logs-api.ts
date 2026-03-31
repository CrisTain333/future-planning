import { api } from "./api";
import { IAuditLog, PaginatedResponse } from "@/types";

interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  performedBy?: string;
}

export const auditLogsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<PaginatedResponse<IAuditLog>, GetAuditLogsParams>({
      query: (params) => ({ url: "/audit-logs", params }),
      providesTags: ["AuditLogs"],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogsApi;
