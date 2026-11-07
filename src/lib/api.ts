import type { SubmissionPayload } from "../types";

// Production: VITE_API_BASE is https://mellocosta.com/interop and responses go
// to save.php there. Local dev: left empty, and Vite's dev-server proxy
// forwards /api/* to the local mock backend (see vite.config.ts and
// server/index.js).
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const SUBMIT_PATH = API_BASE ? "/save.php" : "/api/submit-assessment";

export class ApiError extends Error {
  status: number;
  constructor(path: string, status: number) {
    super(`Request to ${path} failed with status ${status}`);
    this.status = status;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(path, res.status);
  }
  return res.json() as Promise<T>;
}

export function submitAssessment(
  payload: SubmissionPayload,
): Promise<{ ok: true; responseId: string }> {
  return postJson(SUBMIT_PATH, payload);
}

// ---- Company codes (org.php) ----
// Only available once the backend is configured: the local mock server has
// no equivalent, so the company-code step is skipped when VITE_API_BASE is unset.
export const ORG_ENABLED = Boolean(API_BASE);
const ORG_PATH = "/org.php";

export interface OrgInfo {
  ok: true;
  code: string;
  round: number;
  responses: number;
}

export interface OrgRound {
  round: number;
  n: number;
  averages: Record<string, number>; // dimension id (and "overall") -> average score
}

export interface OrgResults {
  ok: true;
  code: string;
  currentRound: number;
  rounds: OrgRound[];
}

export function orgCreate(name: string): Promise<OrgInfo> {
  return postJson(ORG_PATH, { action: "create", name });
}

export function orgJoin(code: string): Promise<OrgInfo> {
  return postJson(ORG_PATH, { action: "join", code });
}

export function orgNewRound(code: string): Promise<OrgInfo> {
  return postJson(ORG_PATH, { action: "new-round", code });
}

export async function orgResults(code: string): Promise<OrgResults> {
  const res = await fetch(`${API_BASE}${ORG_PATH}?code=${encodeURIComponent(code)}`);
  if (!res.ok) {
    throw new ApiError(ORG_PATH, res.status);
  }
  return res.json() as Promise<OrgResults>;
}
