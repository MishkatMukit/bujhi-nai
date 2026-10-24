import type {
  ApiEnvelope,
  BoardExplanation,
  Department,
  HelpfulResult,
} from "@/types/board";

const FALLBACK_API_URL = "http://localhost:5000/api";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || FALLBACK_API_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const messageFrom = (payload: unknown, fallback: string): string => {
  if (isRecord(payload) && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  return fallback;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError("সার্ভারের সাথে সংযোগ করা যাচ্ছে না।", 0);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new ApiError(
      messageFrom(payload, `Request failed with status ${response.status}`),
      response.status,
    );
  }

  if (isRecord(payload) && payload.success === true) {
    return (payload as unknown as ApiEnvelope<T>).data;
  }

  if (isRecord(payload) && payload.success === false) {
    throw new ApiError(
      messageFrom(payload, "অনুরোধ ব্যর্থ হয়েছে।"),
      typeof payload.statusCode === "number" ? payload.statusCode : response.status,
    );
  }

  // The catch-all 404 does not use the response envelope.
  throw new ApiError(messageFrom(payload, "API থেকে অপ্রত্যাশিত উত্তর এসেছে।"), response.status);
};

export interface ListBoardsParams {
  department?: Department | "ALL";
  search?: string;
}

/** `POST /boards/explain` — pass FormData and never set Content-Type yourself. */
export const explainBoard = (formData: FormData): Promise<BoardExplanation> =>
  request<BoardExplanation>("/boards/explain", { method: "POST", body: formData });

/** `GET /boards` — newest feed of at most 15 boards. */
export const listBoards = (
  { department, search }: ListBoardsParams = {},
  signal?: AbortSignal,
): Promise<BoardExplanation[]> => {
  const params = new URLSearchParams();

  if (department && department !== "ALL") {
    params.set("department", department);
  }

  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }

  const query = params.toString();

  return request<BoardExplanation[]>(`/boards${query ? `?${query}` : ""}`, { signal });
};

/** `GET /boards/:id` */
export const getBoard = (id: string, signal?: AbortSignal): Promise<BoardExplanation> =>
  request<BoardExplanation>(`/boards/${id}`, { signal });

/** `PATCH /boards/:id/helpful` */
export const upvoteBoard = (id: string): Promise<HelpfulResult> =>
  request<HelpfulResult>(`/boards/${id}/helpful`, { method: "PATCH" });

const STATUS_PREFIX: Record<number, string> = {
  0: "সার্ভারে পৌঁছানো যাচ্ছে না — ব্যাকএন্ড (localhost:5000) চালু আছে কি?",
  400: "অনুরোধটা নেওয়া গেল না।",
  404: "যেটা খুঁজছো সেটা পাওয়া গেল না।",
  413: "ফাইলটা অনেক বড় হয়ে গেছে।",
  429: "একটু পরেই আবার চেষ্টা করো।",
  500: "সার্ভারে সমস্যা হয়েছে।",
};

/** Turn any thrown value into a Bangla-friendly message for the UI. */
export const getBanglaErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করো।";
  }

  const prefix = STATUS_PREFIX[error.status] ?? "অনুরোধটা সম্পন্ন হয়নি।";
  const detail = error.message?.trim();
  const isGenericDetail =
    !detail || detail === "Internal Server Error" || detail === "Failed to fetch";

  if (isGenericDetail) {
    return error.status === 0
      ? prefix
      : `${prefix} আবার চেষ্টা করো।`;
  }

  return `${prefix} (${detail})`;
};
