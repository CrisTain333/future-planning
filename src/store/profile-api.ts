import { api } from "./api";
import { IUser, ApiResponse } from "@/types";

interface UpdateProfileBody {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ApiResponse<IUser>, void>({
      query: () => "/profile",
      providesTags: ["Users"],
    }),
    updateProfile: builder.mutation<ApiResponse<IUser>, UpdateProfileBody>({
      query: (body) => ({ url: "/profile", method: "PUT", body }),
      invalidatesTags: ["Users"],
    }),
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordBody>({
      query: (body) => ({ url: "/profile/password", method: "PUT", body }),
    }),
    uploadProfilePicture: builder.mutation<ApiResponse<IUser>, FormData>({
      query: (formData) => ({ url: "/profile/picture", method: "POST", body: formData }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useUploadProfilePictureMutation,
} = profileApi;
