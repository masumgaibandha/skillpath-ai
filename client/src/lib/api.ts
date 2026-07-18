// Server Components run in the Next.js server process, not the browser, so
// they can't rely on next.config.ts's /api/* rewrite (that only applies to
// requests that hit Next's own HTTP server). They call Express directly.
const SERVER_API_URL = process.env.API_URL ?? "http://localhost:5000";

/** Thrown by fetchClientApi on a non-2xx response, carrying the server's
 * `{error, details}` body (see contact/course controllers) so callers can
 * show field-level messages instead of a generic failure string. */
export class ApiError extends Error {
  status: number;
  details?: Record<string, string[] | undefined>;

  constructor(message: string, status: number, details?: Record<string, string[] | undefined>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/** For Server Components / Server-side fetches only. */
export async function fetchServerApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SERVER_API_URL}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** For Client Components — goes through the Next.js rewrite proxy. */
export async function fetchClientApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.error ?? `API request to ${path} failed with status ${res.status}`,
      res.status,
      body?.details
    );
  }
  return res.json() as Promise<T>;
}
