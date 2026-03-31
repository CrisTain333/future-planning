import { api } from "./api";
import { ApiResponse } from "@/types";

interface PaymentGridData {
  months: { month: number; year: number; label: string }[];
  grid: { memberId: string; name: string; cells: string[] }[];
}

interface CollectionRateEntry {
  label: string; month: number; year: number; paid: number; total: number; rate: number;
}

interface AnalyticsSummary {
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  membersWithOutstanding: number;
  totalPenaltyRevenue: number;
  penaltyData: { label: string; amount: number; count: number }[];
  currentFund: number;
  projection: { label: string; projected: number; actual?: number }[];
}

interface MemberScore {
  memberId: string; name: string; username: string;
  paidMonths: number; expectedMonths: number; paymentRate: number;
  penaltyCount: number; totalPenalty: number; score: number; grade: string;
}

interface MonthlyReportData {
  month: number; year: number; monthName: string;
  totalMembers: number; paidCount: number; unpaidCount: number;
  collectionRate: number; totalCollected: number; totalExpected: number;
  expectedAmountPerMember: number;
  paidMembers: { name: string; amount: number; penalty: number; penaltyReason: string; approvedBy: string; date: string }[];
  unpaidMembers: { name: string; username: string }[];
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentGrid: builder.query<ApiResponse<PaymentGridData>, void>({
      query: () => "/analytics/payment-grid",
      providesTags: ["Payments"],
    }),
    getCollectionRate: builder.query<ApiResponse<CollectionRateEntry[]>, void>({
      query: () => "/analytics/collection-rate",
      providesTags: ["Payments"],
    }),
    getAnalyticsSummary: builder.query<ApiResponse<AnalyticsSummary>, void>({
      query: () => "/analytics/summary",
      providesTags: ["Payments"],
    }),
    getMemberScores: builder.query<ApiResponse<MemberScore[]>, void>({
      query: () => "/analytics/member-scores",
      providesTags: ["Payments", "Users"],
    }),
    getMonthlyReport: builder.query<ApiResponse<MonthlyReportData>, { month: number; year: number }>({
      query: ({ month, year }) => `/analytics/monthly-report?month=${month}&year=${year}`,
      providesTags: ["Payments"],
    }),
  }),
});

export const {
  useGetPaymentGridQuery,
  useGetCollectionRateQuery,
  useGetAnalyticsSummaryQuery,
  useGetMemberScoresQuery,
  useGetMonthlyReportQuery,
} = analyticsApi;
