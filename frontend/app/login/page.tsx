"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusNotice from "../../components/StatusNotice";
import { apiBase } from "../../lib/api";
import { loadSession, saveSession } from "../../lib/session";
import type { SessionUser } from "../../lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    router.replace(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }, [router]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!email || !password) {
      setStatus("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Logging in...");

    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.message || "Login failed.");
        return;
      }

      const user = payload.user as SessionUser;
      saveSession({ token: payload.token, user });
      setStatus("Login successful.");
      router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch {
      setStatus("Unable to reach backend API.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell max-w-3xl justify-center">
      <section className="hero">
        <p className="inline-flex rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium dark:bg-black/20">
          Document Distribution Platform
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">DrivePortal</h1>
        <p className="mt-2 max-w-xl text-sm opacity-85">
          A secure, role-based hub where admins distribute files and users only see what they are allowed to access.
        </p>
        <p className="mt-4 text-xs opacity-70">
          Backend API: <code>{apiBase}</code>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.3fr_.9fr]">
        <div className="panel">
        <h2 className="section-title mb-3">Sign in</h2>
        <form className="grid gap-3 sm:max-w-md" onSubmit={login}>
          <input
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <input
            className="input"
            value={password}
            type="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />
          <button className="btn btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
        </div>

        <div className="panel-muted text-sm">
          <p className="font-semibold">Quick credentials</p>
          <p className="mt-2 opacity-80">Admin: admin@driveportal.local / Admin123!</p>
          <p className="mt-1 opacity-80">User: create from Admin panel.</p>
          <div className="mt-4">
            <StatusNotice value={status} />
          </div>
        </div>
      </section>
    </main>
  );
}
