import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/redux-provider";
import SessionProvider from "@/components/providers/session-provider";
import { Toaster } from "react-hot-toast";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { ConfigProvider } from "antd";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Future Planning",
  description: "Foundation Accounting System",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#0a9396",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Future Planning",
  },
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
            <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } }} />
            <ServiceWorkerRegister />
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
