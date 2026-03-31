import { api } from "./api";
import { ApiResponse } from "@/types";

interface AdminDashboardData {
  totalFund: number;
  totalMembers: number;
  paymentsThisMonth: { count: number; amount: number };
  overdueCount: number;
  fundGrowthChart: { month: number; year: number; total: number }[];
  memberShareChart: { name: string; total: number; percentage: number }[];
  recentPayments: {
    _id: string;
    userId: { _id: string; fullName: string };
    month: number;
    year: number;
    amount: number;
    createdAt: string;
  }[];
  recentNotices: unknown[];
}

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<ApiResponse<AdminDashboardData>, void>({
      query: () => "/dashboard/admin",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetAdminDashboardQuery } = dashboardApi;
