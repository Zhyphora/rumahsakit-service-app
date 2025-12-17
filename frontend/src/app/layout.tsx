"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                padding: "12px 16px",
              },
              success: {
                style: {
                  background: "#059669",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#059669",
                },
              },
              error: {
                style: {
                  background: "#dc2626",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#dc2626",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
