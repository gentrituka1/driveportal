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

async function parseJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown) {
  return typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string"
    ? payload.message
    : "Request failed.";
}

export async function publicApiRequest<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, init);
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(payload));
  }

  return payload as T;
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
  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(payload));
  }

  return payload as T;
}
