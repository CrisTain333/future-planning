import { api } from "./api";
import { ISettings, ApiResponse } from "@/types";

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<ApiResponse<ISettings>, void>({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery } = settingsApi;
