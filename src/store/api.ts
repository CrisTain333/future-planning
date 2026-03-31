import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),
  tagTypes: ["Users", "Payments", "Notices", "Notifications", "Settings", "Dashboard", "AuditLogs"],
  endpoints: () => ({}),
});
