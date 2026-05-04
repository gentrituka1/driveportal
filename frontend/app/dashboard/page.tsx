"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import StatusNotice from "../../components/StatusNotice";
import TopBar from "../../components/TopBar";
import { useToast } from "../../components/ToastProvider";
import { ApiError, apiBase, apiRequest } from "../../lib/api";
import { clearSession, useStoredSession } from "../../lib/session";
import type { DashboardData, SessionUser } from "../../lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { toastError, toastSuccess } = useToast();
  const session = useStoredSession();
  const token = session?.token ?? "";
  const sessionUser: SessionUser | null = session?.user ?? null;
  const [status, setStatus] = useState("idle");
  const lastDashboardErrorRef = useRef<unknown>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", token],
    queryFn: () => apiRequest<DashboardData>("/api/me/dashboard", token),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (dashboardQuery.isError && lastDashboardErrorRef.current !== dashboardQuery.error) {
      lastDashboardErrorRef.current = dashboardQuery.error;
      if (dashboardQuery.error instanceof ApiError && dashboardQuery.error.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      const message = dashboardQuery.error instanceof ApiError ? dashboardQuery.error.message : "Dashboard load failed.";
      toastError(message);
    }
  }, [
    dashboardQuery.error,
    dashboardQuery.isError,
    router,
    toastError,
  ]);

  const displayStatus =
    dashboardQuery.isLoading || dashboardQuery.isFetching
      ? "Loading dashboard..."
      : dashboardQuery.isSuccess
        ? "Dashboard loaded."
        : dashboardQuery.isError
          ? dashboardQuery.error instanceof ApiError
            ? dashboardQuery.error.message
            : "Dashboard load failed."
          : status;

  const downloadMutation = useMutation({
    mutationFn: async ({ fileId, fileName }: { fileId: string; fileName: string }) => {
      if (!token) return;

      setStatus("Downloading file...");
      const response = await fetch(`${apiBase}/api/me/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let message = "Download failed.";
        try {
          const payload = await response.json();
          message = payload.message || message;
        } catch {
          // no-op
        }
        if (response.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        throw new Error(message);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = await response.json();
        if (payload.downloadUrl) {
          window.open(payload.downloadUrl, "_blank");
          return "Download URL opened.";
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return "File downloaded.";
    },
    onSuccess: (message) => {
      if (!message) return;
      setStatus(message);
      toastSuccess(message);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Download failed.";
      setStatus(message);
      toastError(message);
    },
  });

  function downloadAccessibleFile(fileId: string, fileName: string) {
    if (!token) return;
    if (downloadMutation.isPending) return;
    downloadMutation.mutate({ fileId, fileName });
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="app-shell max-w-5xl">
      <TopBar
        title="DrivePortal Dashboard"
        subtitle={sessionUser ? `${sessionUser.email} (${sessionUser.role})` : "Loading session..."}
        navItems={sessionUser?.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []}
        onLogout={logout}
      />

      <section className="hero">
        <h2 className="text-2xl font-semibold tracking-tight">Your secure file space</h2>
        <p className="mt-2 max-w-2xl subtle">
          This dashboard shows only folders and files explicitly shared with you or your groups. Everything else remains hidden.
        </p>
      </section>

      <section className="panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">My files</h2>
          <button
            className="btn btn-primary"
            onClick={() => dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
            type="button"
          >
            {dashboardQuery.isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <StatusNotice value={displayStatus} />

        {dashboardQuery.isLoading ? (
          <p className="mt-4 text-sm opacity-75">Loading your shared content...</p>
        ) : !dashboardQuery.data ? (
          <p className="mt-4 text-sm opacity-75">No data loaded yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="panel-muted">
              <h3 className="font-medium">Folders</h3>
              <ul className="mt-2 list-inside list-disc text-sm leading-7">
                {dashboardQuery.data.folders.length === 0 ? <li className="list-none subtle">No folders shared yet.</li> : null}
                {dashboardQuery.data.folders.map((folder) => (
                  <li key={folder.id}>{folder.name}</li>
                ))}
              </ul>
            </div>
            <div className="panel-muted">
              <h3 className="font-medium">Files</h3>
              <ul className="mt-2 grid gap-2 text-sm">
                {dashboardQuery.data.files.length === 0 ? <li className="list-none subtle">No files shared yet.</li> : null}
                {dashboardQuery.data.files.map((file) => (
                  <li
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                    key={file.id}
                  >
                    <span>
                      {file.originalName} ({Math.ceil(file.size / 1024)} KB)
                    </span>
                    <button
                      className="btn btn-primary px-3 py-1.5 text-xs"
                      disabled={downloadMutation.isPending}
                      onClick={() => downloadAccessibleFile(file.id, file.originalName)}
                      type="button"
                    >
                      {downloadMutation.isPending ? "Downloading..." : "Download"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
