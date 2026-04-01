import { api } from "./api";
import { IAuditLog, IPayment, PaginatedResponse, ApiResponse } from "@/types";

interface GetPaymentsParams {
  page?: number;
  limit?: number;
  userId?: string;
  month?: number;
  year?: number;
  search?: string;
}

interface CreatePaymentBody {
  userId: string;
  month: number;
  year: number;
  amount: number;
  penalty?: number;
  penaltyReason?: string;
  note?: string;
}

interface UpdatePaymentBody {
  amount?: number;
  penalty?: number;
  penaltyReason?: string;
  note?: string;
}

export const paymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<PaginatedResponse<IPayment>, GetPaymentsParams>({
      query: (params) => ({
        url: "/payments",
        params,
      }),
      providesTags: ["Payments"],
    }),
    getPayment: builder.query<ApiResponse<IPayment>, string>({
      query: (id) => `/payments/${id}`,
      providesTags: ["Payments"],
    }),
    createPayment: builder.mutation<ApiResponse<IPayment>, CreatePaymentBody>({
      query: (body) => ({
        url: "/payments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payments", "Dashboard"],
    }),
    updatePayment: builder.mutation<ApiResponse<IPayment>, { id: string; body: UpdatePaymentBody }>({
      query: ({ id, body }) => ({
        url: `/payments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Payments", "Dashboard"],
    }),
    deletePayment: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/payments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Payments", "Dashboard"],
    }),
    getPaymentHistory: builder.query<ApiResponse<IAuditLog[]>, string>({
      query: (id) => `/payments/${id}/history`,
      providesTags: ["AuditLogs"],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentHistoryQuery,
} = paymentsApi;
