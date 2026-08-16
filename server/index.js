// Local mock of the two Azure Function endpoints described in the build brief:
//   POST /api/submit-assessment  -> saves the response row to Table Storage
//   POST /api/send-results       -> emails results via SendGrid, discards the address
//
// This stands in for the real Azure Function app during local prototyping.
// It stores submissions as flat JSON in server/data/responses.json (upsert by
// responseId, mirroring Table Storage's insert-or-replace semantics) and only
// logs what an email send would contain — it never writes the address to disk.

import express from "express";
import cors from "cors";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const RESPONSES_FILE = path.join(DATA_DIR, "responses.json");
const PORT = process.env.PORT || 8787;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

async function readResponses() {
  try {
    const raw = await readFile(RESPONSES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeResponses(all) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(RESPONSES_FILE, JSON.stringify(all, null, 2), "utf-8");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/submit-assessment", async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload.responseId !== "string") {
    return res.status(400).json({ ok: false, error: "Missing responseId" });
  }
  if ("email" in payload) {
    // Defensive: this table must never receive an email address.
    delete payload.email;
  }

  const all = await readResponses();
  all[payload.responseId] = { ...payload, savedAt: new Date().toISOString() };
  await writeResponses(all);

  console.log(
    `[submit-assessment] saved response ${payload.responseId} (overall score: ${payload.scores?.overall?.toFixed?.(2) ?? "n/a"})`,
  );

  res.json({ ok: true, responseId: payload.responseId });
});

app.post("/api/send-results", async (req, res) => {
  const { email, payload, resultsHtml } = req.body ?? {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ ok: false, error: "Missing email address" });
  }

  // The real Function App just wraps resultsHtml (pre-rendered by the
  // frontend -- see src/lib/emailSummary.ts) in its email shell. Mirror
  // that here when present so the local preview matches production; fall
  // back to the old simple table if an older client doesn't send it.
  const html = resultsHtml ?? renderResultsEmailHtml(payload);

  // In production this calls the SendGrid API. Locally we just log what would
  // have been sent, then let `email` fall out of scope — it is never persisted.
  console.log(`[send-results] would email results to ${email} via SendGrid`);
  console.log(`[send-results] HTML preview (first 200 chars): ${html.slice(0, 200)}...`);

  res.json({ ok: true });
});

function renderResultsEmailHtml(payload) {
  if (!payload) return "<p>No results available.</p>";
  const rows = Object.entries(payload.scores ?? {})
    .filter(([key]) => key !== "overall")
    .map(([dim, score]) => {
      const short = payload.goals?.[`${dim}_shortTerm`];
      const long = payload.goals?.[`${dim}_longTerm`];
      return `<tr><td>${dim}</td><td>${Number(score).toFixed(2)}</td><td>${short ?? ""}</td><td>${long ?? ""}</td></tr>`;
    })
    .join("");

  return `
    <h1>Your Interoperability Maturity Results</h1>
    <p>Overall score: <strong>${Number(payload.scores?.overall ?? 0).toFixed(2)}</strong></p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Dimension</th><th>Current</th><th>Short-term target</th><th>Long-term target</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

app.listen(PORT, () => {
  console.log(`Mock Azure Function backend listening on http://localhost:${PORT}`);
});
