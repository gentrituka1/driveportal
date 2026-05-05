"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusNotice from "../../components/StatusNotice";
import { useToast } from "../../components/ToastProvider";
import { ApiError, apiBase, publicApiRequest } from "../../lib/api";
import { saveSession, useStoredSession } from "../../lib/session";
import type { SessionUser } from "../../lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { toastError, toastSuccess } = useToast();
  const session = useStoredSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerStatus, setRegisterStatus] = useState("idle");
  const [status, setStatus] = useState("idle");
  const [apiHealth, setApiHealth] = useState("Checking API health...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!session) return;
    router.replace(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }, [router, session]);

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const response = await fetch(`${apiBase}/health`);
        if (!response.ok) {
          if (isMounted) {
            setApiHealth(`Health check failed (${response.status}).`);
          }
          return;
        }
        const payload = (await response.json()) as { status?: string };
        if (isMounted) {
          if (payload.status === "ok") {
            setApiHealth("API healthy");
          } else {
            setApiHealth("Health endpoint responded.");
          }
        }
      } catch {
        if (isMounted) {
          setApiHealth("API unreachable.");
        }
      }
    }

    void checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

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
      const payload = await publicApiRequest<{ user: SessionUser; token: string }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      saveSession({ token: payload.token, user: payload.user });
      setStatus("Login successful.");
      toastSuccess("Login successful.");
      router.replace(payload.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setStatus(error.message);
        toastError(error.message);
        return;
      }
      setStatus("Unable to reach backend API.");
      toastError("Unable to reach backend API.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function register(event: FormEvent) {
    event.preventDefault();
    if (isRegistering) return;
    if (!registerEmail || !registerPassword) {
      setRegisterStatus("Email and password are required.");
      return;
    }

    setIsRegistering(true);
    setRegisterStatus("Creating account...");

    try {
      const payload = await publicApiRequest<{ token: string; user: SessionUser }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
      });

      saveSession({ token: payload.token, user: payload.user });
      setRegisterStatus("Registration successful. Redirecting...");
      toastSuccess("Registration successful.");
      router.replace(payload.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setRegisterStatus(error.message);
        toastError(error.message);
        return;
      }
      setRegisterStatus("Unable to reach backend API.");
      toastError("Unable to reach backend API.");
    } finally {
      setIsRegistering(false);
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
        <p className="mt-1 text-xs opacity-70">
          Health: <code>{apiHealth}</code>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.3fr_.9fr]">
        <div className="grid gap-4">
          <div className="form-card">
            <h2 className="section-title mb-3">Sign in</h2>
            <form className="form-fields" onSubmit={login}>
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
              <div className="form-actions">
              <button className="btn btn-primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
              </div>
            </form>
          </div>

          <div className="form-card">
            <h2 className="section-title mb-3">Self-register</h2>
            <p className="subtle mb-3">
              Uses <code>/api/auth/register</code>. Works only when backend <code>ALLOW_SELF_REGISTRATION=true</code>.
            </p>
            <form className="form-fields" onSubmit={register}>
              <input
                className="input"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="New user email"
                type="email"
                required
              />
              <input
                className="input"
                value={registerPassword}
                type="password"
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="Password (min 8)"
                required
              />
              <div className="form-actions">
              <button className="btn btn-secondary" disabled={isRegistering} type="submit">
                {isRegistering ? "Registering..." : "Create account"}
              </button>
              </div>
            </form>
            <div className="mt-3">
              <StatusNotice value={registerStatus} />
            </div>
          </div>
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
