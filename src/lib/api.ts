import type { SubmissionPayload } from "../types";

// In production this points at the Azure Function app origin (set via
// VITE_API_BASE at build time). Left empty for local dev, where Vite's
// dev-server proxy forwards /api/* to the local mock backend (see
// vite.config.ts and server/index.js).
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function submitAssessment(
  payload: SubmissionPayload,
): Promise<{ ok: true; responseId: string }> {
  return postJson("/api/submit-assessment", payload);
}

export function sendResultsEmail(
  email: string,
  payload: SubmissionPayload,
  resultsHtml: string,
): Promise<{ ok: true }> {
  // resultsHtml is a pre-rendered summary (score table + immediate actions)
  // for the Function App to embed in the email -- it has no access to the
  // question/roadmap data needed to compute that itself, only the frontend
  // does. Transient, not part of the stored payload.
  return postJson("/api/send-results", { email, payload, resultsHtml });
}
