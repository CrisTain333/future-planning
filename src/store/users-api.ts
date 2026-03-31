import { api } from "./api";
import { IUser, PaginatedResponse, ApiResponse } from "@/types";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

interface CreateUserBody {
  fullName: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  role?: string;
}

interface UpdateUserBody {
  fullName?: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  role?: string;
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedResponse<IUser>, GetUsersParams>({
      query: (params) => ({
        url: "/users",
        params,
      }),
      providesTags: ["Users"],
    }),
    getUser: builder.query<ApiResponse<IUser>, string>({
      query: (id) => `/users/${id}`,
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<ApiResponse<IUser>, CreateUserBody>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<ApiResponse<IUser>, { id: string; body: UpdateUserBody }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    toggleUserStatus: builder.mutation<ApiResponse<IUser>, string>({
      query: (id) => ({
        url: `/users/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
} = usersApi;
