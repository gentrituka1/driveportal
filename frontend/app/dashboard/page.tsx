"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusNotice from "../../components/StatusNotice";
import TopBar from "../../components/TopBar";
import { ApiError, apiBase, apiRequest } from "../../lib/api";
import { clearSession, loadSession } from "../../lib/session";
import type { DashboardData, SessionUser } from "../../lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState("idle");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setToken(session.token);
    setSessionUser(session.user);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    void loadDashboard(token);
  }, [token]);

  function handleApiError(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      setStatus(error.message);
      return;
    }
    setStatus(fallback);
  }

  async function loadDashboard(activeToken: string) {
    setIsBusy(true);
    setStatus("Loading dashboard...");
    try {
      const payload = await apiRequest<DashboardData>("/api/me/dashboard", activeToken);
      setDashboard(payload);
      setStatus("Dashboard loaded.");
    } catch (error) {
      handleApiError(error, "Dashboard load failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function downloadAccessibleFile(fileId: string, fileName: string) {
    if (!token) return;
    if (isBusy) return;

    setIsBusy(true);
    setStatus("Downloading file...");
    try {
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
        setStatus(message);
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = await response.json();
        if (payload.downloadUrl) {
          window.open(payload.downloadUrl, "_blank");
          setStatus("Download URL opened.");
          return;
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
      setStatus("File downloaded.");
    } catch {
      setStatus("Download failed.");
    } finally {
      setIsBusy(false);
    }
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
            onClick={() => token && loadDashboard(token)}
            disabled={isBusy}
            type="button"
          >
            {isBusy ? "Working..." : "Refresh"}
          </button>
        </div>
        <StatusNotice value={status} />

        {!dashboard ? (
          <p className="mt-4 text-sm opacity-75">No data loaded yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="panel-muted">
              <h3 className="font-medium">Folders</h3>
              <ul className="mt-2 list-inside list-disc text-sm leading-7">
                {dashboard.folders.length === 0 ? <li className="list-none subtle">No folders shared yet.</li> : null}
                {dashboard.folders.map((folder) => (
                  <li key={folder.id}>{folder.name}</li>
                ))}
              </ul>
            </div>
            <div className="panel-muted">
              <h3 className="font-medium">Files</h3>
              <ul className="mt-2 grid gap-2 text-sm">
                {dashboard.files.length === 0 ? <li className="list-none subtle">No files shared yet.</li> : null}
                {dashboard.files.map((file) => (
                  <li
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                    key={file.id}
                  >
                    <span>
                      {file.originalName} ({Math.ceil(file.size / 1024)} KB)
                    </span>
                    <button
                      className="btn btn-primary px-3 py-1.5 text-xs"
                      disabled={isBusy}
                      onClick={() => downloadAccessibleFile(file.id, file.originalName)}
                      type="button"
                    >
                      Download
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
