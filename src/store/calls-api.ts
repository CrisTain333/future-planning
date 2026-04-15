import { api } from "./api";
import { ICallLog, ApiResponse, PaginatedResponse } from "@/types";

interface InitiateCallBody {
  conversationId: string;
  type: "audio" | "video";
}

interface UpdateCallBody {
  status: "active" | "ended" | "missed";
}

export const callsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    initiateCall: builder.mutation<ApiResponse<ICallLog>, InitiateCallBody>({
      query: (body) => ({
        url: "/calls",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Calls"],
    }),
    updateCall: builder.mutation<ApiResponse<ICallLog>, { id: string; body: UpdateCallBody }>({
      query: ({ id, body }) => ({
        url: `/calls/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Calls"],
    }),
    getCallHistory: builder.query<PaginatedResponse<ICallLog>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: "/calls/history",
        params,
      }),
      providesTags: ["Calls"],
    }),
  }),
});

export const {
  useInitiateCallMutation,
  useUpdateCallMutation,
  useGetCallHistoryQuery,
} = callsApi;
