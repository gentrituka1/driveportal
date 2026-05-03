import type { StoredSession } from "./types";

const SESSION_KEY = "driveportal_session";

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.token !== "string" ||
      !parsed.user ||
      typeof parsed.user.id !== "string" ||
      typeof parsed.user.email !== "string" ||
      (parsed.user.role !== "ADMIN" && parsed.user.role !== "USER")
    ) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed as StoredSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
