// public/sync-core.js
(function(root) {
  const modes = ["interval", "pitch", "chord", "rhythm"];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const empty = () => ({ schema: 1, imports: {}, events: {} });
  const key = (q) => [q.mode, q.answer, q.notes.join(",")].join("|");
  function merge(a, b) {
    return { schema: 1, imports: { ...a.imports, ...b.imports }, events: { ...a.events, ...b.events } };
  }
  function project(journal) {
    const data = { days: {}, stats: Object.fromEntries(modes.map((m) => [m, { total: 0, correct: 0 }])), mistakes: [], preferences: { level: "intermediate" } };
    const bank = /* @__PURE__ */ new Map();
    const imports = Object.values(journal.imports).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
    for (const item of imports) {
      const old = item.data;
      for (const m of modes) {
        data.stats[m].total += old.stats[m]?.total || 0;
        data.stats[m].correct += old.stats[m]?.correct || 0;
      }
      for (const [date2, day] of Object.entries(old.days)) {
        const current2 = data.days[date2];
        if (!current2 || (day.answers?.length || 0) > (current2.answers?.length || 0)) data.days[date2] = copy(day);
      }
      for (const entry of old.mistakes || []) {
        const previous = bank.get(entry.id);
        if (!previous) bank.set(entry.id, copy(entry));
        else {
          previous.misses += entry.misses;
          previous.streak = Math.max(previous.streak, entry.streak);
        }
      }
      if (old.preferences?.level) data.preferences.level = old.preferences.level;
    }
    for (const e of Object.values(journal.events).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))) {
      if (e.kind === "difficulty") {
        data.preferences.level = e.level;
        continue;
      }
      if (e.kind === "daily") {
        if (!data.days[e.date]?.answers.length) data.days[e.date] = { answers: [], questions: copy(e.questions), level: e.level };
        else if (!data.days[e.date].questions) {
          data.days[e.date].questions = copy(e.questions);
          data.days[e.date].level = e.level;
        }
        continue;
      }
      const q = e.question, id = key(q);
      data.stats[q.mode].total++;
      if (e.correct) data.stats[q.mode].correct++;
      if (e.practice === "daily") {
        const day = data.days[e.date];
        if (day?.questions?.[e.slot] && key(day.questions[e.slot]) === id && !day.answers[e.slot]) day.answers[e.slot] = { mode: q.mode, correct: e.correct };
      }
      if (e.practice === "review" && e.correct) {
        const entry = bank.get(id);
        if (entry) {
          entry.streak++;
          if (entry.streak >= 2) bank.delete(id);
        }
      }
      if (!e.correct) {
        const entry = bank.get(id);
        if (entry) {
          entry.streak = 0;
          entry.misses++;
          entry.lastWrong = e.date;
        } else bank.set(id, { id, question: copy(q), streak: 0, misses: 1, lastWrong: e.date });
      }
    }
    for (const day of Object.values(data.days)) {
      const contiguous = [];
      for (let i = 0; i < 12 && day.answers[i]; i++) contiguous.push(day.answers[i]);
      day.answers = contiguous;
    }
    data.mistakes = [...bank.values()];
    return data;
  }
  function validQuestion(q) {
    return q && modes.includes(q.mode) && ["beginner", "intermediate", "advanced"].includes(q.level || "intermediate") && Array.isArray(q.notes) && q.notes.length >= 1 && q.notes.length <= 16 && q.notes.every((n) => Number.isFinite(n) && n >= 0 && n <= 127) && Array.isArray(q.opts) && q.opts.length >= 2 && q.opts.length <= 4 && q.opts.every((s) => typeof s === "string" && s.length <= 120 && !/[<>]/.test(s)) && q.opts.includes(q.answer) && typeof q.detail === "string" && q.detail.length <= 500;
  }
  const date = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const count = (n) => Number.isSafeInteger(n) && n >= 0 && n <= 1e8;
  function validate(j) {
    if (!j || j.schema !== 1 || !j.imports || !j.events || Array.isArray(j.imports) || Array.isArray(j.events)) return false;
    const items = Object.entries(j.imports), events = Object.entries(j.events);
    if (items.length > 100 || events.length > 1e4) return false;
    const record = (id, x) => /^[a-zA-Z0-9_-]{8,80}$/.test(id) && x && x.id === id && Number.isSafeInteger(x.at) && x.at >= 0;
    for (const [id, x] of items) {
      if (!record(id, x) || !x.data?.stats || !x.data?.days) return false;
      for (const m of modes) {
        const s = x.data.stats[m];
        if (!s || !count(s.total) || !count(s.correct) || s.correct > s.total) return false;
      }
      if (!["beginner", "intermediate", "advanced"].includes(x.data.preferences?.level || "intermediate")) return false;
      for (const [d, day] of Object.entries(x.data.days)) {
        if (!date(d) || !Array.isArray(day.answers) || day.answers.length > 12 || !day.answers.every((a) => a && modes.includes(a.mode) && typeof a.correct === "boolean") || day.questions && (!Array.isArray(day.questions) || day.questions.length !== 12 || !day.questions.every(validQuestion))) return false;
      }
      if (!Array.isArray(x.data.mistakes || []) || (x.data.mistakes || []).some((e) => !validQuestion(e.question) || e.id !== key(e.question) || !count(e.misses) || ![0, 1].includes(e.streak) || !date(e.lastWrong))) return false;
    }
    for (const [id, e] of events) {
      if (!record(id, e)) return false;
      if (e.kind === "difficulty") {
        if (!["beginner", "intermediate", "advanced"].includes(e.level)) return false;
      } else if (e.kind === "daily") {
        if (!date(e.date) || !["beginner", "intermediate", "advanced"].includes(e.level) || !Array.isArray(e.questions) || e.questions.length !== 12 || !e.questions.every(validQuestion)) return false;
      } else if (e.kind === "answer") {
        if (!date(e.date) || !validQuestion(e.question) || typeof e.correct !== "boolean" || !["daily", "review", ...modes].includes(e.practice) || e.practice === "daily" && (!Number.isInteger(e.slot) || e.slot < 0 || e.slot >= 12)) return false;
      } else return false;
    }
    return true;
  }
  root.EarSyncCore = { empty, merge, project, validate, key, copy };
})(globalThis);

// server/worker.js
var core = globalThis.EarSyncCore;
var SITE_ORIGIN = "https://earlab-daily-listening.dkoeo.chatgpt.site";
var json = (value, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } });
function identity(request) {
  const id = request.headers.get("oai-authenticated-user-id");
  if (!id) return null;
  return { id, email: request.headers.get("oai-authenticated-user-email") || "" };
}
function db(env) {
  if (!env.DB) throw new Error("Missing progress database");
  return env.DB;
}
async function current(env, userId) {
  const row = await db(env).prepare("SELECT state, revision FROM listening_progress WHERE user_id = ?").bind(userId).first();
  return { revision: row?.revision || 0, journal: row ? JSON.parse(row.state) : core.empty() };
}
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/sync") {
      const user = identity(request);
      if (!user) return json({ error: "sign_in_required" }, 401);
      try {
        if (request.method === "GET") return json({ user, ...await current(env, user.id) });
        if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
        const origin = request.headers.get("Origin");
        if (origin !== SITE_ORIGIN && origin !== url.origin) return json({ error: "invalid_origin" }, 403);
        if (!request.headers.get("Content-Type")?.startsWith("application/json")) return json({ error: "invalid_content_type" }, 415);
        const text = await request.text();
        if (text.length > 2 * 1024 * 1024) return json({ error: "payload_too_large" }, 413);
        let payload;
        try {
          payload = JSON.parse(text);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }
        if (!Number.isSafeInteger(payload.revision) || payload.revision < 0 || !core.validate(payload.journal)) return json({ error: "invalid_progress" }, 400);
        const serialized = JSON.stringify(payload.journal), now = Date.now();
        let saved;
        if (payload.revision === 0) {
          saved = await db(env).prepare("INSERT OR IGNORE INTO listening_progress (user_id, state, revision, updated_at) VALUES (?, ?, 1, ?) RETURNING revision").bind(user.id, serialized, now).first();
        } else {
          saved = await db(env).prepare("UPDATE listening_progress SET state = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ? RETURNING revision").bind(serialized, now, user.id, payload.revision).first();
        }
        if (!saved) return json({ user, ...await current(env, user.id), error: "revision_conflict" }, 409);
        return json({ user, revision: saved.revision, journal: payload.journal, savedAt: now });
      } catch (error) {
        console.error("Progress persistence unavailable:", error.message);
        return json({ error: "storage_unavailable" }, 503);
      }
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    if (url.pathname === "/" || url.pathname === "/index.html" || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) headers.set("Cache-Control", "no-cache");
    return new Response(response.body, { status: response.status, headers });
  }
};
export {
  worker_default as default
};
