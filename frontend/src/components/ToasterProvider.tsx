"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
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
  );
}
