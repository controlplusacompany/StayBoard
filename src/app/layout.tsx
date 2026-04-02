import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
        className={`${dmSerif.variable} ${jakarta.variable} ${jetbrainsMono.variable} antialiased font-sans text-ink-primary overflow-x-hidden`}
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
