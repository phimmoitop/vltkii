// Small in-memory filesystem for mutable game data. Game modules already use
// Node's synchronous fs API; virtualizing only VL_DU_LIEU keeps their existing
// rules intact while ensuring accounts, characters, guilds, logs, and event
// state live in process memory and are snapshotted to Sheets explicitly.
"use strict";
const path = require("node:path");
const fs = require("node:fs");

function install(root, initial = {}) {
  const base = path.resolve(root), files = new Map(), dirs = new Set([base]);
  const real = {};
  for (const name of ["readFileSync", "writeFileSync", "appendFileSync", "existsSync", "readdirSync", "mkdirSync", "renameSync", "unlinkSync", "rmSync", "copyFileSync", "statSync", "lstatSync"]) real[name] = fs[name].bind(fs);
  const toPath = (p) => path.resolve(Buffer.isBuffer(p) ? p.toString() : p instanceof URL ? require("node:url").fileURLToPath(p) : String(p));
  const virtual = (p) => { const abs = toPath(p); return abs === base || abs.startsWith(base + path.sep) ? abs : null; };
  const parent = (p) => { let d = path.dirname(p); while (d.startsWith(base)) { dirs.add(d); if (d === base) break; d = path.dirname(d); } };
  for (const [rel, value] of Object.entries(initial)) {
    if (typeof rel !== "string" || rel.includes("\\") || rel.startsWith("/") || rel.split("/").some((x) => !x || x === "." || x === "..")) throw new Error(`Invalid snapshot path: ${rel}`);
    const abs = path.resolve(base, rel);
    if (!abs.startsWith(base + path.sep)) throw new Error(`Invalid snapshot path: ${rel}`);
    files.set(abs, Buffer.from(String(value), "utf8")); parent(abs);
  }
  function exists(p) { return files.has(p) || dirs.has(p); }
  function dirents(dir) {
    if (!dirs.has(dir)) { const e = new Error(`ENOENT: no such file or directory, scandir '${dir}'`); e.code = "ENOENT"; throw e; }
    const names = new Set();
    for (const f of files.keys()) if (path.dirname(f) === dir) names.add(path.basename(f));
    for (const d of dirs) if (d !== dir && path.dirname(d) === dir) names.add(path.basename(d));
    return [...names].sort().map((name) => {
      const full = path.join(dir, name), isDir = dirs.has(full);
      return { name, isFile: () => !isDir, isDirectory: () => isDir, isBlockDevice: () => false, isCharacterDevice: () => false, isSymbolicLink: () => false, isFIFO: () => false, isSocket: () => false };
    });
  }
  fs.readFileSync = (p, opt) => { const v = virtual(p); if (!v) return real.readFileSync(p, opt); const b = files.get(v); if (!b) { const e = new Error(`ENOENT: no such file or directory, open '${v}'`); e.code = "ENOENT"; throw e; } const enc = typeof opt === "string" ? opt : opt && opt.encoding; return enc ? b.toString(enc) : Buffer.from(b); };
  fs.writeFileSync = (p, data, opt) => { const v = virtual(p); if (!v) return real.writeFileSync(p, data, opt); if (!dirs.has(path.dirname(v))) { const e = new Error(`ENOENT: no such file or directory, open '${v}'`); e.code = "ENOENT"; throw e; } files.set(v, Buffer.isBuffer(data) ? Buffer.from(data) : Buffer.from(String(data), opt && opt.encoding || "utf8")); };
  fs.appendFileSync = (p, data, opt) => { const v = virtual(p); if (!v) return real.appendFileSync(p, data, opt); if (!dirs.has(path.dirname(v))) { const e = new Error(`ENOENT: no such file or directory, open '${v}'`); e.code = "ENOENT"; throw e; } files.set(v, Buffer.concat([files.get(v) || Buffer.alloc(0), Buffer.isBuffer(data) ? data : Buffer.from(String(data), opt && opt.encoding || "utf8")])); };
  fs.existsSync = (p) => { const v = virtual(p); return v ? exists(v) : real.existsSync(p); };
  fs.readdirSync = (p, opt) => { const v = virtual(p); if (!v) return real.readdirSync(p, opt); const entries = dirents(v); return opt && opt.withFileTypes ? entries : entries.map((x) => x.name); };
  fs.mkdirSync = (p, opt = {}) => { const v = virtual(p); if (!v) return real.mkdirSync(p, opt); if (exists(v)) { if (dirs.has(v) && opt.recursive) return undefined; const e = new Error(`EEXIST: file already exists, mkdir '${v}'`); e.code = "EEXIST"; throw e; } if (opt.recursive) { parent(path.join(v, "_")); dirs.add(v); return v; } if (!dirs.has(path.dirname(v))) { const e = new Error(`ENOENT: no such file or directory, mkdir '${v}'`); e.code = "ENOENT"; throw e; } dirs.add(v); };
  fs.renameSync = (a, b) => { const x = virtual(a), y = virtual(b); if (!x && !y) return real.renameSync(a, b); if (!x || !y || !files.has(x)) { const e = new Error("ENOENT: rename source does not exist"); e.code = "ENOENT"; throw e; } if (!dirs.has(path.dirname(y))) { const e = new Error("ENOENT: rename target directory does not exist"); e.code = "ENOENT"; throw e; } files.set(y, files.get(x)); files.delete(x); };
  fs.unlinkSync = (p) => { const v = virtual(p); if (!v) return real.unlinkSync(p); if (!files.delete(v)) { const e = new Error(`ENOENT: no such file, unlink '${v}'`); e.code = "ENOENT"; throw e; } };
  fs.rmSync = (p, opt = {}) => { const v = virtual(p); if (!v) return real.rmSync(p, opt); if (files.has(v)) { files.delete(v); return; } if (!dirs.has(v)) { if (opt.force) return; const e = new Error(`ENOENT: no such file or directory, rm '${v}'`); e.code = "ENOENT"; throw e; } const kids = [...files.keys(), ...dirs].filter((x) => x !== v && x.startsWith(v + path.sep)); if (kids.length && !opt.recursive) { const e = new Error(`ERR_FS_EISDIR: directory not empty, rm '${v}'`); e.code = "ERR_FS_EISDIR"; throw e; } for (const x of kids) { files.delete(x); dirs.delete(x); } dirs.delete(v); };
  fs.copyFileSync = (a, b) => { const x = virtual(a), y = virtual(b); if (!x && !y) return real.copyFileSync(a, b); if (!x || !y || !files.has(x) || !dirs.has(path.dirname(y))) { const e = new Error("ENOENT: copy source or target does not exist"); e.code = "ENOENT"; throw e; } files.set(y, Buffer.from(files.get(x))); };
  const stat = (v) => {
    if (files.has(v)) { const size = files.get(v).length; return { size, mtimeMs: 0, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false }; }
    if (dirs.has(v)) return { size: 0, mtimeMs: 0, isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false };
    const e = new Error(`ENOENT: no such file or directory, stat '${v}'`); e.code = "ENOENT"; throw e;
  };
  fs.statSync = (p) => { const v = virtual(p); return v ? stat(v) : real.statSync(p); };
  fs.lstatSync = (p) => { const v = virtual(p); return v ? stat(v) : real.lstatSync(p); };
  return {
    root: base,
    dump() { const out = {}; for (const [abs, b] of files) out[path.relative(base, abs).split(path.sep).join("/")] = b.toString("utf8"); return out; },
    count() { return files.size; },
  };
}

module.exports = { install };
