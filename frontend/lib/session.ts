import { useSyncExternalStore } from "react";
import type { StoredSession } from "./types";

const SESSION_KEY = "driveportal_session";
const SESSION_CHANGE_EVENT = "driveportal:session-changed";

let cachedRaw: string | null | undefined;
let cachedSnapshot: StoredSession | null = null;

function parseSession(raw: string | null): StoredSession | null {
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
      return null;
    }

    return parsed as StoredSession;
  } catch {
    return null;
  }
}

function getClientSnapshot(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  cachedSnapshot = parseSession(raw);
  return cachedSnapshot;
}

function notifySessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  const snapshot = parseSession(raw);
  if (!raw || snapshot) return snapshot;

  // Keep runtime behavior: clean up malformed session values.
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // no-op
  }
  return null;
}

export function saveSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = session;
  notifySessionChanged();
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  cachedRaw = null;
  cachedSnapshot = null;
  notifySessionChanged();
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = () => onStoreChange();
  window.addEventListener("storage", listener);
  window.addEventListener(SESSION_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(SESSION_CHANGE_EVENT, listener);
  };
}

function getServerSnapshot(): StoredSession | null {
  return null;
}

export function useStoredSession() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
