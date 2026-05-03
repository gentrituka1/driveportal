const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export { apiBase };

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T = unknown>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let payload: unknown = null;

  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Request failed.";
    throw new ApiError(response.status, message);
  }

  return payload as T;
}
