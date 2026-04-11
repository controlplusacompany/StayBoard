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

export const metadata: Metadata = {
  title: "StayBoard",
  description: "Multi-property hotel operations dashboard",
};

import { ToastProvider } from "@/components/ui/Toast";
import { Suspense } from "react";
import RouteProgressBar from "@/components/ui/RouteProgressBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} antialiased font-sans text-ink-primary overflow-x-hidden`}
      >
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
