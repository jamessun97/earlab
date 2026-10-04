// public/mixing.js
(function(root) {
  const modes = ["eq", "gain", "compression", "pan"];
  const meta = { eq: { name: "EQ \u983B\u6BB5", q: "B \u7684\u54EA\u500B\u983B\u6BB5\u88AB\u6539\u8B8A\u4E86\uFF1F", instruction: "A \u662F\u539F\u97F3\uFF0CB \u7D93\u904E EQ\u3002\u6BD4\u8F03\u97F3\u8272\uFF0C\u9078\u51FA\u63D0\u5347\u6216\u8870\u6E1B\u7684\u4E2D\u5FC3\u983B\u7387\u3002", tip: "\u4F4E\u983B\u5F71\u97FF\u539A\u5EA6\uFF0C\u4F4E\u4E2D\u983B\u5F71\u97FF\u6DF7\u6FC1\uFF0C\u4E2D\u9AD8\u983B\u5F71\u97FF\u5B58\u5728\u611F\uFF0C\u9AD8\u983B\u5F71\u97FF\u660E\u4EAE\u5EA6\u3002" }, gain: { name: "\u97F3\u91CF\u5DEE", q: "B \u6BD4 A \u7684\u97F3\u91CF\u6539\u8B8A\u4E86\u591A\u5C11\uFF1F", instruction: "\u6BD4\u8F03\u540C\u4E00\u6BB5\u7D20\u6750\u7684\u97F3\u91CF\u3002\u6B63\u503C\u4EE3\u8868 B \u66F4\u5927\u8072\uFF0C\u8CA0\u503C\u4EE3\u8868 B \u66F4\u5C0F\u8072\u3002", tip: "\u4FDD\u6301\u88DD\u7F6E\u97F3\u91CF\u56FA\u5B9A\uFF0C\u5C08\u6CE8\u6574\u9AD4\u97F3\u91CF\uFF0C\u4E0D\u8981\u8ABF\u6574 A\uFF0FB \u7684\u64AD\u653E\u97F3\u91CF\u3002" }, compression: { name: "\u58D3\u7E2E\u52D5\u614B", q: "\u54EA\u4E00\u6BB5\u7684\u52D5\u614B\u88AB\u58D3\u7E2E\u4E86\uFF1F", instruction: "A\uFF0FB \u5DF2\u5339\u914D\u5E73\u5747\u97F3\u91CF\u3002\u807D\u9F13\u9EDE\u77AC\u614B\u8207\u5F37\u5F31\u5DEE\uFF0C\u627E\u51FA\u88AB\u58D3\u7E2E\u7684\u4E00\u6BB5\u3002", tip: "\u5E73\u5747\u97F3\u91CF\u76F8\u540C\u6642\uFF0C\u6CE8\u610F\u9F13\u9EDE\u7684\u885D\u64CA\u3001\u5F37\u5F31\u8B8A\u5316\u8207\u5C3E\u97F3\u5BC6\u5EA6\u3002" }, pan: { name: "\u7ACB\u9AD4\u8072\u5B9A\u4F4D", q: "B \u7684\u8072\u97F3\u4F4D\u65BC\u54EA\u88E1\uFF1F", instruction: "A \u4F4D\u65BC\u4E2D\u592E\u3002\u6234\u4E0A\u7ACB\u9AD4\u8072\u8033\u6A5F\uFF0C\u8FA8\u8A8D B \u7684\u5DE6\u53F3\u4F4D\u7F6E\u3002", tip: "\u8ACB\u95DC\u9589\u88C5\u7F6E\u7684\u55AE\u8072\u9053\u97F3\u8A0A\u529F\u80FD\u3002\u8072\u50CF\u4F4D\u7F6E\u7531\u5DE6\u53F3\u8072\u9053\u7684\u76F8\u5C0D\u80FD\u91CF\u6C7A\u5B9A\u3002" } };
  const pools = {};
  for (const level of ["beginner", "intermediate", "advanced"]) {
    const frequencies = level === "beginner" ? [125, 500, 2e3, 8e3] : level === "intermediate" ? [80, 160, 315, 630, 1250, 2500, 5e3, 1e4] : [63, 100, 160, 250, 400, 630, 1e3, 1600, 2500, 4e3, 6300, 1e4];
    const changes = level === "beginner" ? [-6, -3, 3, 6] : level === "intermediate" ? [-4, -2, -1, 1, 2, 4] : [-2, -1, -0.5, 0.5, 1, 2];
    const positions = level === "beginner" ? [-1, -0.5, 0.5, 1] : level === "intermediate" ? [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75] : [-0.6, -0.4, -0.2, -0.1, 0.1, 0.2, 0.4, 0.6];
    const settings = { beginner: { threshold: -28, ratio: 10, attack: 3e-3, release: 0.08 }, intermediate: { threshold: -23, ratio: 5, attack: 0.01, release: 0.12 }, advanced: { threshold: -18, ratio: 3, attack: 0.025, release: 0.18 } }[level];
    const pool = pools[level] = Object.fromEntries(modes.map((m) => [m, []]));
    const add = (mode, mix, answer, detail) => pool[mode].push({ mode, level, mix, notes: [mix.seed], answer, detail });
    for (let seed = 1; seed <= 16; seed++) {
      const amount = level === "beginner" ? 9 : level === "intermediate" ? 6 : 3;
      for (const frequency of frequencies) for (const db2 of [amount, -amount]) add("eq", { seed, frequency, db: db2, q: level === "advanced" ? 2 : 1 }, frequency + " Hz", `B \u5728 ${frequency} Hz ${db2 > 0 ? "\u63D0\u5347" : "\u8870\u6E1B"} ${Math.abs(db2)} dB\u3002\u5DF2\u5339\u914D\u5E73\u5747\u97F3\u91CF\uFF0C\u907F\u514D\u9760\u97F3\u91CF\u731C\u7B54\u6848\u3002`);
      for (const db2 of changes) add("gain", { seed, db: db2 }, (db2 > 0 ? "+" : "") + db2 + " dB", `B \u7684\u589E\u76CA\u70BA ${db2 > 0 ? "+" : ""}${db2} dB\uFF0C\u632F\u5E45\u662F A \u7684 ${(10 ** (db2 / 20)).toFixed(2)} \u500D\u3002`);
      for (const side of ["A", "B"]) add("compression", { seed, ...settings, side }, side, `${side} \u7D93\u904E\u58D3\u7E2E\uFF1A\u6BD4\u7387 ${settings.ratio}:1\uFF0C\u555F\u52D5 ${Math.round(settings.attack * 1e3)} ms\uFF0C\u91CB\u653E ${Math.round(settings.release * 1e3)} ms\u3002\u5DF2\u5339\u914D\u5E73\u5747\u97F3\u91CF\u3002`);
      for (const pan of positions) add("pan", { seed, pan }, `${pan < 0 ? "\u5DE6" : "\u53F3"} ${Math.round(Math.abs(pan) * 100)}%`, `B \u7684\u8072\u50CF\u70BA${pan < 0 ? "\u5DE6" : "\u53F3"} ${Math.round(Math.abs(pan) * 100)}%\u3002A \u4F4D\u65BC\u4E2D\u592E\u3002`);
    }
  }
  function key(q) {
    return q.mode + "|" + JSON.stringify(q.mix);
  }
  function shuffle(a, r) {
    const c = a.slice();
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  }
  function sample(mode, level, count, r = Math.random, recent = []) {
    const used = new Set(recent), pool = pools[level][mode], order = [...shuffle(pool.filter((q) => !used.has(key(q))), r), ...shuffle(pool.filter((q) => used.has(key(q))), r)];
    const labels = [...new Set(pool.map((q) => q.answer))];
    return order.slice(0, count).map((q) => ({ ...q, notes: q.notes.slice(), mix: { ...q.mix }, opts: shuffle([q.answer, ...shuffle(labels.filter((s) => s !== q.answer), r).slice(0, 3)], r) }));
  }
  function measure(a) {
    let sum = 0, peak = 0;
    for (const v of a) {
      sum += v * v;
      peak = Math.max(peak, Math.abs(v));
    }
    return { rms: Math.sqrt(sum / a.length), peak };
  }
  function source(seed, rate = 24e3) {
    const out = new Float32Array(rate * 3);
    let state = seed * 99991, pink = 0;
    const rand = () => {
      state = Math.imul(state, 1664525) + 1013904223 >>> 0;
      return state / 4294967296 * 2 - 1;
    };
    for (let i = 0; i < out.length; i++) {
      const t = i / rate, beat = t % (0.375 + seed % 3 * 0.02), noise = rand();
      pink = 0.97 * pink + 0.03 * noise;
      const kick = Math.sin(2 * Math.PI * (55 + seed % 4 * 7) * t) * Math.exp(-beat * 25), snare = noise * Math.exp(-((t + 0.19) % 0.4) * 38), chord = [110, 138.59, 164.81].reduce((s, f) => s + Math.sin(2 * Math.PI * f * (1 + seed % 4 * 0.03) * t), 0) / 3;
      const dynamics = [1, 0.25, 0.6, 0.18, 0.9, 0.3, 0.5, 0.22][Math.floor(t / 0.375) % 8];
      out[i] = dynamics * (0.36 * kick + 0.24 * snare + 0.18 * noise + 0.25 * pink + 0.16 * chord);
    }
    const scale = 0.12 / measure(out).rms;
    for (let i = 0; i < out.length; i++) out[i] *= scale;
    return out;
  }
  function rmsStereo(b) {
    let sum = 0;
    for (let c = 0; c < b.numberOfChannels; c++) for (const v of b.getChannelData(c)) sum += v * v;
    return Math.sqrt(sum / (b.length * b.numberOfChannels));
  }
  async function render(q) {
    const rate = 24e3, samples = source(q.mix.seed, rate);
    async function variant(processed) {
      const ctx = new OfflineAudioContext(2, samples.length, rate), buffer = ctx.createBuffer(1, samples.length, rate);
      buffer.copyToChannel(samples, 0);
      const input = ctx.createBufferSource();
      input.buffer = buffer;
      let tail = input;
      if (processed && q.mode === "eq") {
        const eq = ctx.createBiquadFilter();
        eq.type = "peaking";
        eq.frequency.value = q.mix.frequency;
        eq.gain.value = q.mix.db;
        eq.Q.value = q.mix.q;
        tail.connect(eq);
        tail = eq;
      }
      if (processed && q.mode === "compression") {
        const c = ctx.createDynamicsCompressor();
        for (const p of ["threshold", "ratio", "attack", "release"]) c[p].value = q.mix[p];
        c.knee.value = 6;
        tail.connect(c);
        tail = c;
      }
      const gain = ctx.createGain();
      gain.gain.value = processed && q.mode === "gain" ? 10 ** (q.mix.db / 20) : 1;
      tail.connect(gain);
      const pan = ctx.createStereoPanner();
      pan.pan.value = processed && q.mode === "pan" ? q.mix.pan : 0;
      gain.connect(pan);
      pan.connect(ctx.destination);
      input.start();
      return ctx.startRendering();
    }
    const [dry, wet] = await Promise.all([variant(false), variant(true)]);
    if (q.mode === "eq" || q.mode === "compression") {
      const ratio = rmsStereo(dry) / rmsStereo(wet);
      for (let c = 0; c < 2; c++) {
        const a = wet.getChannelData(c);
        for (let i = 0; i < a.length; i++) a[i] *= ratio;
      }
    }
    let peak = 0;
    for (const b of [dry, wet]) for (let c = 0; c < 2; c++) peak = Math.max(peak, measure(b.getChannelData(c)).peak);
    if (peak > 0.8) for (const b of [dry, wet]) for (let c = 0; c < 2; c++) {
      const a = b.getChannelData(c);
      for (let i = 0; i < a.length; i++) a[i] *= 0.8 / peak;
    }
    return q.mode === "compression" && q.mix.side === "A" ? { A: wet, B: dry } : { A: dry, B: wet };
  }
  function valid(q) {
    const m = q.mix;
    if (!m || !Number.isInteger(m.seed) || m.seed < 1 || m.seed > 16) return false;
    if (q.mode === "eq") return Number.isFinite(m.frequency) && m.frequency >= 63 && m.frequency <= 1e4 && [3, 6, 9, -3, -6, -9].includes(m.db) && [1, 2].includes(m.q) && q.answer === m.frequency + " Hz";
    if (q.mode === "gain") return [-6, -4, -3, -2, -1, -0.5, 0.5, 1, 2, 3, 4, 6].includes(m.db) && q.answer === (m.db > 0 ? "+" : "") + m.db + " dB";
    if (q.mode === "compression") return ["A", "B"].includes(m.side) && q.answer === m.side && [-28, -23, -18].includes(m.threshold) && [10, 5, 3].includes(m.ratio) && [3e-3, 0.01, 0.025].includes(m.attack) && [0.08, 0.12, 0.18].includes(m.release);
    if (q.mode === "pan") return Number.isFinite(m.pan) && Math.abs(m.pan) > 0 && Math.abs(m.pan) <= 1 && q.answer === `${m.pan < 0 ? "\u5DE6" : "\u53F3"} ${Math.round(Math.abs(m.pan) * 100)}%`;
    return false;
  }
  root.MixingTraining = { modes, meta, pools, key, sample, source, measure, render, valid };
})(globalThis);

// public/sync-core.js
(function(root) {
  const musicalModes = ["interval", "pitch", "chord", "rhythm"];
  const modes = [...musicalModes, ...MixingTraining.modes];
  const copy = (x) => JSON.parse(JSON.stringify(x));
  const empty = () => ({ schema: 1, imports: {}, events: {} });
  const key = (q) => q.mix ? MixingTraining.key(q) : [q.mode, q.answer, q.notes.join(",")].join("|");
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
    return q && modes.includes(q.mode) && (!MixingTraining.modes.includes(q.mode) || MixingTraining.valid(q)) && ["beginner", "intermediate", "advanced"].includes(q.level || "intermediate") && Array.isArray(q.notes) && q.notes.length >= 1 && q.notes.length <= 16 && q.notes.every((n) => Number.isFinite(n) && n >= 0 && n <= 127) && Array.isArray(q.opts) && q.opts.length >= 2 && q.opts.length <= 4 && q.opts.every((s) => typeof s === "string" && s.length <= 120 && !/[<>]/.test(s)) && q.opts.includes(q.answer) && typeof q.detail === "string" && q.detail.length <= 500;
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
        if (!s && !musicalModes.includes(m)) continue;
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
