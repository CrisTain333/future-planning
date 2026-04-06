import { api } from "./api";
import { ApiResponse, PaginatedResponse, IPayment } from "@/types";

interface MemberDashboardData {
  totalPaid: number;
  monthsPaid: number;
  outstanding: number;
  status: string;
  chartData: { month: string; amount: number }[];
  fundGrowthChart: { month: number; year: number; total: number }[];
}

interface GetMyPaymentsParams {
  page?: number;
  limit?: number;
}

export const memberApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMemberDashboard: builder.query<ApiResponse<MemberDashboardData>, void>({
      query: () => "/dashboard/member",
      providesTags: ["Dashboard"],
    }),
    getMyPayments: builder.query<PaginatedResponse<IPayment>, GetMyPaymentsParams>({
      query: (params) => ({ url: "/payments/my", params }),
      providesTags: ["Payments"],
    }),
  }),
});

export const { useGetMemberDashboardQuery, useGetMyPaymentsQuery } = memberApi;
