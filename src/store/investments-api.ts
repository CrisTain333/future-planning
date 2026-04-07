import { api } from "./api";
import { ApiResponse, IInvestment, InvestmentAnalytics } from "@/types";

export const investmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInvestments: builder.query<ApiResponse<IInvestment[]>, { status?: string } | void>({
      query: (params) => {
        const status = params && "status" in params ? params.status : undefined;
        return status ? `/investments?status=${status}` : "/investments";
      },
      providesTags: ["Investments"],
    }),
    getInvestmentAnalytics: builder.query<ApiResponse<InvestmentAnalytics>, void>({
      query: () => "/investments/analytics",
      providesTags: ["Investments"],
    }),
    createInvestment: builder.mutation<ApiResponse<IInvestment>, Partial<IInvestment>>({
      query: (body) => ({
        url: "/investments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Investments"],
    }),
    updateInvestment: builder.mutation<ApiResponse<IInvestment>, { id: string; body: Partial<IInvestment> }>({
      query: ({ id, body }) => ({
        url: `/investments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Investments"],
    }),
    deleteInvestment: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({
        url: `/investments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Investments"],
    }),
  }),
});

export const {
  useGetInvestmentsQuery,
  useGetInvestmentAnalyticsQuery,
  useCreateInvestmentMutation,
  useUpdateInvestmentMutation,
  useDeleteInvestmentMutation,
} = investmentsApi;
