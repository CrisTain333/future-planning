import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/redux-provider";
import SessionProvider from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConfigProvider } from "antd";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Future Planning",
  description: "Foundation Accounting System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ReduxProvider>
            <SpeedInsights />
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "hsl(181, 87%, 31%)",
                  borderRadius: 8,
                  fontFamily: "inherit",
                  controlHeight: 36,
                },
                components: {
                  Button: {
                    paddingInline: 16,
                  },
                  Input: {
                    paddingBlock: 6,
                    paddingInline: 12,
                  },
                },
              }}
            >
              {children}
            </ConfigProvider>
            <Toaster />
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
