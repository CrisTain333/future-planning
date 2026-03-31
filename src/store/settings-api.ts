import { api } from "./api";
import { ISettings, ApiResponse } from "@/types";

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<ApiResponse<ISettings>, void>({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<ApiResponse<ISettings>, Partial<ISettings>>({
      query: (body) => ({ url: "/settings", method: "PUT", body }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
