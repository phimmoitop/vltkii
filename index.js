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
const ACCOUNT_ID_MIN = 1000000001;
let nextAccountId = ACCOUNT_ID_MIN - 1;
const usedAccountIds = new Set();
const ITEM_PACK = require("./assets/web/item/items.json");
const ITEM_TYPE = new Map((ITEM_PACK.items || []).map((item) => [item.k, item.t]));
const ITEM_LEVEL = new Map((ITEM_PACK.items || []).map((item) => [item.k, item.lv || 1]));
const ITEM_SIZE = new Map((ITEM_PACK.items || []).map((item) => [item.k, item.c || [1, 1]]));
const ITEM_SLOT = { 0: "Weapon", 1: "Weapon", 2: "Cloth", 3: "Ring1", 4: "Necklace", 5: "Shoes", 6: "Sash", 7: "Cap", 8: "Bangle", 9: "Pendant", 10: "Horse" };
const ATTRS = require("./assets/data/attr.json").attrs || [];
const ATTR_ID = new Map(ATTRS.map((a) => [a.key, a.id]));
const ATTR_KEY = new Map(ATTRS.map((a) => [String(a.id), a.key]));

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
      try {
        parsed = JSON.parse(text);
      } catch {
        // Also accept a brace-wrapped pair list, e.g. {8-3,11-1}; this is
        // useful in Sheets because the leading brace prevents date coercion.
        if (text.endsWith("}")) text = text.slice(1, -1).trim();
        else throw new Error(`Account ${username}: cột ${column} không phải JSON kỹ năng hợp lệ`);
      }
    } else if (text.startsWith("(") && text.endsWith(")")) {
      text = text.slice(1, -1).trim();
    }
    if (typeof parsed === "string") {
      if (!text) return {};
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
  const encode = (rows) => {
    const pairs = rows.sort((a, b) => a[0] - b[0]).map(([id, level]) => `${id}-${level}`).join(",");
    return pairs ? `(${pairs})` : "";
  };
  return { skill: encode(normal), skill9x: encode(high) };
}

function parsePotentialCell(value, username) {
  const empty = { attr: { str: 0, vit: 0, dex: 0, eng: 0 }, legacyBonus: 0 };
  if (value == null || value === "") return empty;
  // The old Account format stored the unspent bonus pool as a single number.
  if (typeof value === "number" || /^\d+$/.test(String(value).trim())) return { ...empty, legacyBonus: asNumber(value) };
  let text = String(value).trim().replace(/^\(|\)$/g, ""), legacyBonus = 0;
  const bonus = text.match(/;bonus=(\d+)$/i);
  if (bonus) { legacyBonus = Number(bonus[1]); text = text.slice(0, bonus.index); }
  const match = text.match(/^(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
  if (!match) throw new Error(`Account ${username}: cột tiemnang cần dạng (sức mạnh-sinh khí-thân pháp-nội công)`);
  const [str, vit, dex, eng] = match.slice(1).map(Number);
  return { attr: { str, vit, dex, eng }, legacyBonus };
}

function potentialCell(attr, legacyBonus = 0) {
  if (!attr || typeof attr !== "object") return "";
  return `(${attr.str | 0}-${attr.vit | 0}-${attr.dex | 0}-${attr.eng | 0}${legacyBonus > 0 ? `;bonus=${legacyBonus | 0}` : ""})`;
}

async function gas(action, payload) {
  if (!GAS_URL || !GAS_TOKEN) throw new Error("Thiếu GOOGLE_APPS_SCRIPT_URL hoặc GOOGLE_APPS_SCRIPT_TOKEN");
  const url = new URL(GAS_URL);
  if (action !== "save") { url.searchParams.set("action", action); url.searchParams.set("token", GAS_TOKEN); }
  const res = await fetch(url, {
    method: action === "save" ? "POST" : "GET", redirect: "follow",
    headers: action === "save" ? { "content-type": "application/json" } : undefined,
    body: action === "save" ? JSON.stringify({ action: "save", token: GAS_TOKEN, accounts: payload.accounts, trangBi: payload.trangBi, nextAccountId: payload.nextAccountId }) : undefined,
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

function parseMapCell(value, username) {
  if (value == null || String(value).trim() === "") return null;
  const m = String(value).trim().match(/^(\d+)-(-?\d+)-(-?\d+)$/);
  if (!m) throw new Error(`Account ${username}: cột map cần dạng mapid-x-y, ví dụ 53-7432-4034`);
  const [z, x, y] = m.slice(1).map(Number);
  if (![z, x, y].every(Number.isSafeInteger) || z > 1e6 || Math.abs(x) > 1e6 || Math.abs(y) > 1e6)
    throw new Error(`Account ${username}: tọa độ trong cột map không hợp lệ`);
  return { z, x, y };
}

function mapCell(position) {
  if (!position || typeof position !== "object") return "";
  const z = Number(position.z), x = Number(position.x), y = Number(position.y);
  if (![z, x, y].every(Number.isSafeInteger) || z < 0 || z > 1e6 || Math.abs(x) > 1e6 || Math.abs(y) > 1e6) return "";
  return `${z}-${x}-${y}`;
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
    const potential = parsePotentialCell(row.tiemnang, username);
    const viTri = parseMapCell(row.map, username);
    const potentialBonus = potential.legacyBonus;
    const created = asTime(row.time, Date.now());
    const lastLogin = asTime(row.login, null);
    const facSheet = row.phai === "" || row.phai == null ? null : asNumber(row.phai, NaN);
    if (facSheet != null && (!Number.isInteger(facSheet) || facSheet < 0 || facSheet > 10)) throw new Error(`Account ${username}: cột phai phải trống hoặc là số từ 1 đến 10`);
    const hero = row.character ? {
      v: 1, slot: 0, name: String(row.character), server: "1", sex: row.sex || "",
      // Google Sheets dùng phai = 1..10; game nội bộ dùng faction id = 0..9.
      series: row.he === "" ? null : asNumber(row.he, row.he), fac: facSheet == null ? null : (facSheet === 0 ? 0 : facSheet - 1), // 0 cũ = Thiếu Lâm, được nhận để tự chuyển thành 1 ở lần snapshot kế tiếp
      // Bang hội và chức vụ bang chưa được lưu trong tab Account. Môn phái
      // được khôi phục riêng từ cột phai phía trên.
      lvl: Math.max(1, asNumber(row.lv, 1)),
      exp: asNumber(row.exp), gold: asNumber(row.gold), xu: asNumber(row.xu),
      attr: potential.attr, tiemNangThem: potentialBonus, skills, bag: [], equip: {}, looks: {},
      ...(viTri ? { viTri } : {}),
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

function normalizeAccountIds(accounts, items = [], highWater = 0) {
  nextAccountId = Math.max(nextAccountId, ACCOUNT_ID_MIN - 1, Number(highWater) || 0);
  for (const account of accounts || []) {
    const id = Number(account.id);
    if (Number.isSafeInteger(id) && id >= ACCOUNT_ID_MIN) nextAccountId = Math.max(nextAccountId, id);
  }
  const uidMap = new Map();
  for (const account of accounts || []) {
    const username = String(account.username || "").trim().toLowerCase();
    const oldUid = String(account.id || username);
    let id = Number(account.id);
    if (!Number.isSafeInteger(id) || id < ACCOUNT_ID_MIN || usedAccountIds.has(id)) id = ++nextAccountId;
    else nextAccountId = Math.max(nextAccountId, id);
    usedAccountIds.add(id);
    account.id = String(id);
    uidMap.set(oldUid, account.id);
    uidMap.set(username, account.id);
  }
  for (const item of items || []) {
    const replacement = uidMap.get(String(item.uid || ""));
    if (replacement) item.uid = replacement;
  }
}

function ensureLiveAccountIds(accounts, D) {
  const current = new Set();
  for (const account of accounts) {
    let id = Number(account.id);
    if (!Number.isSafeInteger(id) || id < ACCOUNT_ID_MIN || current.has(id)) {
      id = ++nextAccountId;
      account.id = String(id);
      D.ghiTk(account);
    }
    current.add(id);
    usedAccountIds.add(id);
    nextAccountId = Math.max(nextAccountId, id);
  }
}

function itemRowsFromAccounts(accounts) {
  const rows = [];
  const add = (account, h, it, stt) => {
    if (!it || !it.k || !Array.isArray(it.d)) return;
    rows.push({ id: Number(it.u) || 0, uid: String(account.id), item: String(it.k), s: Number(it.s) + 1,
      option: `(${it.d.map(([key, value]) => `${ATTR_ID.get(key) ?? key}-${value}`).join(",")})`, stt,
      gia: stt === 4 ? Number(it.gia) || "" : "", time: stt === 4 ? Number(it.time) || "" : "" });
  };
  for (const account of accounts) for (const h of account.nv || []) {
    if (!h) continue;
    for (const it of h.bag || []) add(account, h, it, 10);
    for (const [slot, it] of Object.entries(h.equip || {})) add(account, h, it, slot === "Ring1" ? 1 : slot === "Ring2" ? 2 : 3);
    for (const it of h.ruong || []) add(account, h, it, 11);
    for (const box of h.ruongPhu || []) for (const it of (Array.isArray(box) ? box : [])) add(account, h, it, 12);
    for (const it of h.tuiTM || []) add(account, h, it, 13);
    for (const offer of (h.sap && h.sap.ds) || []) add(account, h, offer, 4);
  }
  return rows;
}

function restoreTrangBi(accounts, rows) {
  const byUid = new Map(accounts.map((a) => [String(a.id || a.ten), a]));
  const seen = new Set();
  for (const row of rows || []) {
    const id = Number(row.id), uid = String(row.uid || ""), stt = Number(row.stt), account = byUid.get(uid), h = account && account.nv && account.nv[0];
    if (!h || !Number.isSafeInteger(id) || id < 1 || seen.has(id)) continue;
    const k = String(row.item || ""), type = ITEM_TYPE.get(k);
    if (type == null) continue;
    const text = String(row.option || "").trim().replace(/^\(|\)$/g, "");
    const d = text ? text.split(",").map((part) => {
      const i = part.lastIndexOf("-"); if (i < 1) return null;
      const code = part.slice(0, i), key = ATTR_KEY.get(code) || code;
      return [key, Number(part.slice(i + 1))];
    }).filter((x) => x && Number.isFinite(x[1])) : [];
    const it = { u: id, k, s: Math.max(0, Math.min(4, Number(row.s) - 1)), d, m: ITEM_LEVEL.get(k) || 1 };
    seen.add(id);
    if (stt === 10) h.bag.push(it);
    else if (stt === 11) (h.ruong ||= []).push(it);
    else if (stt === 12) { h.ruongMo = Math.max(h.ruongMo | 0, 1); (h.ruongPhu ||= [[]])[0].push(it); }
    else if (stt === 13) (h.tuiTM ||= []).push(it);
    else if (stt === 4) {
      const gia = Number(row.gia) || 0, time = Number(row.time) || 0;
      if (gia > 0 && time > 0) {
        const p = h.viTri || {};
        h.sap ||= { qc: "Sạp hàng", mo: 1, ds: [], bai: Number(p.z) || 0, x: Number(p.x) || 0, y: Number(p.y) || 0, hinh: 1 };
        h.sap.mo = 1; h.sap.ds ||= [];
        const offer = { ...it, gia, time };
        const [w, height] = ITEM_SIZE.get(k) || [1, 1];
        let at = null;
        for (let y = 0; y <= 10 - height && !at; y++) for (let x = 0; x <= 6 - w && !at; x++) {
          const overlap = h.sap.ds.some((old) => {
            const [ow, oh] = ITEM_SIZE.get(old.k) || [1, 1];
            return x < old.x + ow && x + w > old.x && y < old.y + oh && y + height > old.y;
          });
          if (!overlap) at = [x, y];
        }
        if (at) { offer.x = at[0]; offer.y = at[1]; h.sap.ds.push(offer); }
        else h.bag.push(it);
      } else h.bag.push(it);
    }
    else if (stt === 1 || stt === 2 || stt === 3) {
      const slot = stt === 1 ? "Ring1" : stt === 2 ? "Ring2" : ITEM_SLOT[type];
      if (slot && !h.equip[slot]) h.equip[slot] = it;
      else h.bag.push(it);
    }
  }
  return accounts;
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
      // Hai cột này dành cho bang hội / chức vụ bang; dữ liệu bang hiện nằm
      // trong trạng thái riêng của máy chủ, không thuộc snapshot nhân vật.
      bang: "",
      rank: "",
      exp: h && h.exp || 0,
      gold: h && h.gold || 0,
      xu: h && h.xu || 0,
      tiemnang: potentialCell(h && h.attr),
      map: mapCell(h && h.viTri),
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
    const live = D.dsTk();
    ensureLiveAccountIds(live, D);
    D.ghiTaiKhoanRaDia();
    const accounts = accountsFromRam(live), trangBi = itemRowsFromAccounts(live);
    await gas("save", { accounts, trangBi, nextAccountId });
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
  const trangBi = Array.isArray(loaded.trangBi) ? loaded.trangBi : [];
  normalizeAccountIds(loaded.accounts || [], trangBi, loaded.nextAccountId);
  const itemId = require("./may-chu/item-id");
  itemId.floor(trangBi.filter((x) => Number(x.stt) !== 0).reduce((m, x) => Math.max(m, Number(x.id) || 0), Number(loaded.nextItemId) || 0));
  const ids = new Set();
  for (const row of trangBi) {
    if (Number(row.stt) === 0) continue;
    let id = Number(row.id) || 0;
    if (id < 1 || ids.has(id)) { id = itemId.next(); row.id = id; }
    ids.add(id);
  }
  restoreTrangBi(loaded.accounts || [], trangBi);
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
