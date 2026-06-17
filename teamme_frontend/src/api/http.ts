const API_BASE = import.meta?.env?.VITE_API_URL ?? "http://localhost:8080";

export interface ApiValidationError {
  field?: string | null;
  message: string;
  rejectedValue?: unknown;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  status: number;
  error: string;
  path: string;
  timestamp: string;
  fieldErrors: ApiValidationError[];
  details: Record<string, unknown>;
}

export class ApiHttpError extends Error {
  code: string;
  status: number;
  error: string;
  path?: string;
  timestamp?: string;
  fieldErrors: ApiValidationError[];
  details: Record<string, unknown>;

  constructor(payload: Partial<ApiErrorResponse> & { message: string }) {
    super(payload.message);
    this.name = "ApiHttpError";
    this.code = payload.code ?? "HTTP_ERROR";
    this.status = payload.status ?? 500;
    this.error = payload.error ?? "Error";
    this.path = payload.path;
    this.timestamp = payload.timestamp;
    this.fieldErrors = payload.fieldErrors ?? [];
    this.details = payload.details ?? {};
  }
}

async function tryReadJson(res: Response): Promise<unknown | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeApiError(
  raw: unknown,
  res: Response
): ApiHttpError {
  if (raw && typeof raw === "object") {
    const obj = raw as Partial<ApiErrorResponse>;

    if (typeof obj.message === "string") {
      return new ApiHttpError({
        code: typeof obj.code === "string" ? obj.code : "HTTP_ERROR",
        message: obj.message,
        status: typeof obj.status === "number" ? obj.status : res.status,
        error: typeof obj.error === "string" ? obj.error : res.statusText,
        path: typeof obj.path === "string" ? obj.path : undefined,
        timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
        fieldErrors: Array.isArray(obj.fieldErrors) ? obj.fieldErrors : [],
        details:
          obj.details && typeof obj.details === "object"
            ? (obj.details as Record<string, unknown>)
            : {},
      });
    }
  }

  if (typeof raw === "string" && raw.trim()) {
    return new ApiHttpError({
      code: "HTTP_ERROR",
      message: raw,
      status: res.status,
      error: res.statusText,
      fieldErrors: [],
      details: {},
    });
  }

  return new ApiHttpError({
    code: "HTTP_ERROR",
    message: `HTTP ${res.status} ${res.statusText}`,
    status: res.status,
    error: res.statusText,
    fieldErrors: [],
    details: {},
  });
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const raw = await tryReadJson(res);
    throw normalizeApiError(raw, res);
  }

  const raw = await tryReadJson(res);

  if (raw == null) {
    throw new ApiHttpError({
      code: "EMPTY_RESPONSE",
      message: "Serwer zwrócił pustą odpowiedź.",
      status: 500,
      error: "Internal Server Error",
      fieldErrors: [],
      details: {},
    });
  }

  return raw as T;
}

export function extractApiMessage(error: unknown): string {
  if (error instanceof ApiHttpError) return error.message;
  if (error instanceof Error) return error.message;
  return "Wystąpił nieoczekiwany błąd.";
}

export function extractApiFieldErrors(error: unknown): Record<string, string[]> {
  if (!(error instanceof ApiHttpError)) return {};

  const grouped: Record<string, string[]> = {};

  for (const fieldError of error.fieldErrors ?? []) {
    const field = fieldError.field || "_global";
    if (!grouped[field]) grouped[field] = [];
    grouped[field].push(fieldError.message);
  }

  return grouped;
}

export function pickFieldErrors(
  fieldErrors: Record<string, string[]>,
  ...fieldNames: string[]
): string[] {
  const result: string[] = [];

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const matches = fieldNames.some(
      (name) => field === name || field.startsWith(`${name}.`) || field.startsWith(`${name}[`)
    );
    if (matches) result.push(...messages);
  }

  return [...new Set(result)];
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return readJson<T>(res);
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return readJson<T>(res);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return readJson<T>(res);
}

export async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return readJson<T>(res);
}