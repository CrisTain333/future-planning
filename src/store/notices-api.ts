import { api } from "./api";
import { INotice, PaginatedResponse, ApiResponse } from "@/types";

interface GetNoticesParams {
  page?: number;
  limit?: number;
}

interface CreateNoticeBody {
  title: string;
  body: string;
}

interface UpdateNoticeBody {
  title?: string;
  body?: string;
}

export const noticesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotices: builder.query<PaginatedResponse<INotice>, GetNoticesParams>({
      query: (params) => ({ url: "/notices", params }),
      providesTags: ["Notices"],
    }),
    getNotice: builder.query<ApiResponse<INotice>, string>({
      query: (id) => `/notices/${id}`,
      providesTags: ["Notices"],
    }),
    createNotice: builder.mutation<ApiResponse<INotice>, CreateNoticeBody>({
      query: (body) => ({ url: "/notices", method: "POST", body }),
      invalidatesTags: ["Notices"],
    }),
    updateNotice: builder.mutation<ApiResponse<INotice>, { id: string; body: UpdateNoticeBody }>({
      query: ({ id, body }) => ({ url: `/notices/${id}`, method: "PUT", body }),
      invalidatesTags: ["Notices"],
    }),
    deleteNotice: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/notices/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notices"],
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useGetNoticeQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} = noticesApi;
