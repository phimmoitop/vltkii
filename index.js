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
let store, game, timer, saving = Promise.resolve(), stopping = false;

async function gas(action, files) {
  if (!GAS_URL || !GAS_TOKEN) throw new Error("Thiếu GOOGLE_APPS_SCRIPT_URL hoặc GOOGLE_APPS_SCRIPT_TOKEN");
  const url = new URL(GAS_URL);
  if (action === "load") { url.searchParams.set("action", "load"); url.searchParams.set("token", GAS_TOKEN); }
  const res = await fetch(url, {
    method: action === "load" ? "GET" : "POST", redirect: "follow",
    headers: action === "save" ? { "content-type": "application/json" } : undefined,
    body: action === "save" ? JSON.stringify({ action: "save", token: GAS_TOKEN, files }) : undefined,
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

async function flush(reason) {
  saving = saving.catch(() => {}).then(async () => {
    const D = require("./may-chu/du-lieu");
    D.ghiTaiKhoanRaDia(); // serialize account Map to the virtual filesystem
    const rows = toRows(store.dump());
    await gas("save", rows);
    console.log(`Đã lưu ${store.count()} mục trạng thái (${rows.length} đoạn) lên Google Sheets · ${reason}`);
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
  console.log("Đang nạp snapshot Google Sheets...");
  const loaded = await gas("load");
  const initial = loaded.files || {};
  if (!initial || typeof initial !== "object" || Array.isArray(initial)) throw new Error("Snapshot Sheets không hợp lệ");

  process.env.VL_DU_LIEU = DATA_ROOT;
  process.env.VL_MANAGED_SHUTDOWN = "1";
  store = install(DATA_ROOT, initial);
  const D = require("./may-chu/du-lieu");
  if (!D.dsTk().length) {
    const name = String(process.env.VL_ADMIN_USER || "").trim();
    const password = String(process.env.VL_ADMIN_PASSWORD || "");
    if (!name || !password) throw new Error("Chưa có tài khoản trong Sheets; cần VL_ADMIN_USER và VL_ADMIN_PASSWORD để tạo admin đầu tiên");
    D.taoTk(name, password, true);
    console.log(`Đã tạo tài khoản admin đầu tiên: ${name}`);
  }

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
