// Render entry point: restore all mutable records into RAM, initialize every
// game service once (loading the fixed rules/indexes), then serve WebSocket RPC.
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { install } = require("./ram-fs");

const DATA_ROOT = path.join(__dirname, "du-lieu");
const GAS_URL = String(process.env.GOOGLE_APPS_SCRIPT_URL || "").trim();
const GAS_TOKEN = String(process.env.GOOGLE_APPS_SCRIPT_TOKEN || "");
const FLUSH_MS = 5 * 60 * 1000;
const CHUNK_CHARS = 40000;
const SKILL_PACK = require("./assets/web/skill/skills.json");
const SKILL_9X = new Set((SKILL_PACK.factions || []).flatMap((f) => Object.entries(f.books || {}).filter(([tier]) => +tier >= 90).flatMap(([, ids]) => ids.map(Number))));
let store, game, timer, saving = Promise.resolve(), stopping = false;

function parseSkillCell(value, username, column) {
  if (value == null || value === "") return {};
  let parsed = value;
  if (typeof value === "string") {
    let text = value.trim();
    if (!text) return {};
    // Older Apps Script deployments used getValues(), which serializes a
    // Sheets-coerced date like "8-3" as an ISO timestamp. The spreadsheet is
    // configured for day-month notation, so restore the displayed pair.
    const coercedDate = text.match(/^\d{4}-\d{2}-(\d{2})T/);
    if (coercedDate) {
      const date = new Date(text);
      if (Number.isFinite(date.getTime())) text = `${date.getUTCDate()}-${date.getUTCMonth() + 1}`;
    }
    if (text.startsWith("{")) {
      try { parsed = JSON.parse(text); } catch { throw new Error(`Account ${username}: cột ${column} không phải JSON kỹ năng hợp lệ`); }
    } else {
      parsed = {};
      for (const pair of text.split(",")) {
        const m = pair.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (!m || +m[2] < 1) throw new Error(`Account ${username}: cột ${column} cần dạng id-cấp, id-cấp`);
        parsed[m[1]] = +m[2];
      }
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`Account ${username}: cột ${column} cần là danh sách kỹ năng`);
  const skills = {};
  for (const [id, level] of Object.entries(parsed)) {
    const lv = Number(level);
    if (!/^\d+$/.test(id) || !Number.isInteger(lv) || lv < 1) throw new Error(`Account ${username}: cột ${column} chứa id/cấp kỹ năng không hợp lệ`);
    skills[id] = lv;
  }
  return skills;
}

function skillCells(skills) {
  const normal = [], high = [];
  for (const [id, value] of Object.entries(skills || {})) {
    const level = Number(value), key = Number(id);
    if (!Number.isInteger(key) || key < 0 || !Number.isInteger(level) || level < 1) continue;
    (SKILL_9X.has(key) ? high : normal).push([key, level]);
  }
  const encode = (rows) => rows.sort((a, b) => a[0] - b[0]).map(([id, level]) => `${id}-${level}`).join(", ");
  return { skill: encode(normal), skill9x: encode(high) };
}

async function gas(action, payload) {
  if (!GAS_URL || !GAS_TOKEN) throw new Error("Thiếu GOOGLE_APPS_SCRIPT_URL hoặc GOOGLE_APPS_SCRIPT_TOKEN");
  const url = new URL(GAS_URL);
  if (action === "load") { url.searchParams.set("action", "load"); url.searchParams.set("token", GAS_TOKEN); }
  const res = await fetch(url, {
    method: action === "load" ? "GET" : "POST", redirect: "follow",
    headers: action === "save" ? { "content-type": "application/json" } : undefined,
    body: action === "save" ? JSON.stringify({ action: "save", token: GAS_TOKEN, accounts: payload }) : undefined,
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
  const data = await res.json();
  if (!data || data.ok !== true) throw new Error(data && data.error || "Apps Script trả dữ liệu không hợp lệ");
  return data;
}

function toRows(files) {
  const rows = [];
  for (const [name, text] of Object.entries(files)) {
    if (name.startsWith("sao-luu/")) continue; // backups duplicate the live account dataset
    for (let i = 0; i < text.length; i += CHUNK_CHARS) rows.push([name, i / CHUNK_CHARS, text.slice(i, i + CHUNK_CHARS)]);
    if (!text.length) rows.push([name, 0, ""]);
  }
  return rows;
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asTime(value, fallback = null) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function accountsToFiles(accounts) {
  if (!Array.isArray(accounts)) throw new Error('Apps Script không trả mảng "accounts"');
  const files = {};
  for (const row of accounts) {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("Một hàng Account không hợp lệ");
    const username = String(row.username || "").trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new Error(`Username không hợp lệ trong Account: ${username || "(trống)"}`);
    if (!String(row.password || "").startsWith("scrypt$")) throw new Error(`Account ${username}: cột password phải chứa hash scrypt, không phải mật khẩu thô`);
    if (files[`tai-khoan/${username}.json`]) throw new Error(`Username bị trùng trong Account: ${username}`);
    const skills = { ...parseSkillCell(row.skill, username, "skill"), ...parseSkillCell(row.skill9x, username, "skill9x") };
    const created = asTime(row.time, Date.now());
    const lastLogin = asTime(row.login, null);
    const facSheet = row.phai === "" || row.phai == null ? null : asNumber(row.phai, NaN);
    if (facSheet != null && (!Number.isInteger(facSheet) || facSheet < 0 || facSheet > 10)) throw new Error(`Account ${username}: cột phai phải trống hoặc là số từ 1 đến 10`);
    const hero = row.character ? {
      v: 1, slot: 0, name: String(row.character), server: "1", sex: row.sex || "",
      // Google Sheets dùng phai = 1..10; game nội bộ dùng faction id = 0..9.
      series: row.he === "" ? null : asNumber(row.he, row.he), fac: facSheet == null ? null : (facSheet === 0 ? 0 : facSheet - 1), // 0 cũ = Thiếu Lâm, được nhận để tự chuyển thành 1 ở lần snapshot kế tiếp
      camp: row.bang || "", rank: row.rank || "", lvl: Math.max(1, asNumber(row.lv, 1)),
      exp: asNumber(row.exp), gold: asNumber(row.gold), xu: asNumber(row.xu),
      tiemNangThem: asNumber(row.tiemnang), skills, bag: [], equip: {}, looks: {},
      created, last: lastLogin || created,
    } : null;
    const account = {
      v: 1, id: row.id == null ? "" : String(row.id), ten: username, bam: String(row.password),
      admin: false, phien: null, nv: [hero, null, null], tao: created, vao: lastLogin,
    };
    files[`tai-khoan/${username}.json`] = JSON.stringify(account);
  }
  return files;
}

function accountsFromRam(accounts) {
  return accounts.map((account) => {
    const h = Array.isArray(account.nv) ? account.nv[0] : null;
    const skill = skillCells(h && h.skills);
    return {
      id: account.id || account.ten,
      username: account.ten,
      password: account.bam,
      character: h && h.name || "",
      sex: h && h.sex || "",
      he: h && h.series != null ? h.series : "",
      lv: h && h.lvl || "",
      phai: h && h.fac != null ? (h.fac | 0) + 1 : "",
      bang: h && h.camp || "",
      rank: h && h.rank || "",
      exp: h && h.exp || 0,
      gold: h && h.gold || 0,
      xu: h && h.xu || 0,
      tiemnang: h && h.tiemNangThem || 0,
      skill: skill.skill,
      skill9x: skill.skill9x,
      time: account.tao || "",
      login: account.vao || "",
    };
  });
}

async function flush(reason) {
  saving = saving.catch(() => {}).then(async () => {
    const D = require("./may-chu/du-lieu");
    D.ghiTaiKhoanRaDia(); // serialize account Map to the virtual filesystem
    const accounts = accountsFromRam(D.dsTk());
    await gas("save", accounts);
    console.log(`Đã lưu ${accounts.length} tài khoản lên tab Account · ${reason}`);
  });
  return saving;
}

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  console.log(`Nhận ${signal}, đang dừng nhận kết nối và flush RAM...`);
  if (game && game.WS) game.WS.dongHet();
  if (game && game.server && game.server.listening) await new Promise((resolve) => game.server.close(resolve));
  const watchdog = setTimeout(() => process.exit(1), 150000);
  try { await flush("shutdown"); clearTimeout(watchdog); process.exit(0); }
  catch (e) { clearTimeout(watchdog); console.error("Flush khi tắt thất bại:", e.message); process.exit(1); }
}

async function start() {
  if (!GAS_URL || !GAS_TOKEN) throw new Error("Cần GOOGLE_APPS_SCRIPT_URL và GOOGLE_APPS_SCRIPT_TOKEN");
  console.log('Đang nạp bảng "Account" từ Google Sheets...');
  const loaded = await gas("load");
  const initial = accountsToFiles(loaded.accounts);
  if (!initial || typeof initial !== "object" || Array.isArray(initial)) throw new Error("Snapshot Sheets không hợp lệ");

  process.env.VL_DU_LIEU = DATA_ROOT;
  process.env.VL_MANAGED_SHUTDOWN = "1";
  store = install(DATA_ROOT, initial);
  const D = require("./may-chu/du-lieu");
  globalThis.VLTK_SHEETS_FLUSH = (reason) => flush(reason || "requested");
  if (!D.dsTk().length) console.log('Tab "Account" chưa có tài khoản; RAM khởi tạo trống.');

  // Importing the API initializes all game rules, fixed JSON tables, guild
  // state, character state, and the WebSocket event handlers in this process.
  // These objects remain live in RAM; ram-fs intercepts every mutable du-lieu
  // read/write so the legacy modules do not write game state to Render disk.
  require("./may-chu/api");
  game = require("./game-server");
  timer = setInterval(() => flush("5-minute interval").catch((e) => console.error("Lưu định kỳ lỗi:", e.message)), FLUSH_MS);
  timer.unref();
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((e) => { console.error("Không khởi động được server:", e.stack || e.message); process.exit(1); });
