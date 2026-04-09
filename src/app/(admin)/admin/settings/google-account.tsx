"use client";

import { Button, Tag } from "antd";
import { Globe, CheckCircle, XCircle } from "lucide-react";
import {
  useLazyGetGoogleAuthUrlQuery,
  useDisconnectGoogleMutation,
} from "@/store/meetings-api";
import { useGetProfileQuery } from "@/store/profile-api";
import toast from "react-hot-toast";

export function GoogleAccountSection() {
  const { data: profileData } = useGetProfileQuery();
  const [getGoogleAuthUrl, { isLoading: isConnecting }] =
    useLazyGetGoogleAuthUrlQuery();
  const [disconnectGoogle, { isLoading: isDisconnecting }] =
    useDisconnectGoogleMutation();

  // Check if user has Google tokens from the profile data
  // The API returns googleTokens but the IUser type doesn't include it
  const profile = profileData?.data as
    | (Record<string, unknown> & {
        googleTokens?: { accessToken: string } | null;
      })
    | undefined;
  const isConnected = !!profile?.googleTokens?.accessToken;

  const handleConnect = async () => {
    try {
      const result = await getGoogleAuthUrl().unwrap();
      const url = (result.data as { authUrl?: string; url?: string })?.authUrl ??
        (result.data as { url?: string })?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Failed to get Google auth URL");
      }
    } catch {
      toast.error("Failed to connect Google account");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogle().unwrap();
      toast.success("Google account disconnected successfully");
    } catch {
      toast.error("Failed to disconnect Google account");
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-6 border-b border-white/20">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Google Calendar Integration
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect your Google account to sync meetings with Google Calendar
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Status:</span>
          {isConnected ? (
            <Tag
              color="success"
              icon={<CheckCircle className="h-3 w-3 inline mr-1" />}
            >
              Connected
            </Tag>
          ) : (
            <Tag
              color="default"
              icon={<XCircle className="h-3 w-3 inline mr-1" />}
            >
              Not connected
            </Tag>
          )}
        </div>

        {isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your Google account is connected. New meetings will automatically
              create Google Calendar events and generate Meet links.
            </p>
            <Button
              danger
              onClick={handleDisconnect}
              loading={isDisconnecting}
            >
              Disconnect Google Account
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Google account to automatically create Google Calendar
              events with Meet links for scheduled meetings.
            </p>
            <Button
              type="primary"
              className="glow-primary"
              icon={<Globe className="h-4 w-4" />}
              onClick={handleConnect}
              loading={isConnecting}
            >
              Connect Google Account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
