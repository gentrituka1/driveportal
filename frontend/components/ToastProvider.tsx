"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import { Toaster, toast } from "react-hot-toast";

type ToastContextValue = {
  toastInfo: (message: string) => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ToastContextValue>(
    () => ({
      toastInfo: (message) => toast(message, { icon: "ℹ️" }),
      toastSuccess: (message) => toast.success(message),
      toastError: (message) => toast.error(message),
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
