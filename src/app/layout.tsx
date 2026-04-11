import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Create alias variables for display and mono that use the same font variable
const displayFontVariable = jakarta.variable;
const monoFontVariable = jakarta.variable;

import { ToastProvider } from "@/components/ui/Toast";
import { Suspense } from "react";
import RouteProgressBar from "@/components/ui/RouteProgressBar";
import PWAScripts from "@/components/pwa/PWAScripts";

export const metadata: Metadata = {
  title: "StayBoard",
  description: "Multi-property hotel operations dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StayBoard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#6366f1" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body
        className={`${jakarta.variable} antialiased font-sans text-ink-primary overflow-x-hidden`}
      >
        <PWAScripts />
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
