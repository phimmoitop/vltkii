// RPC bridge over the existing WebSocket transport. The browser sends
// {t:"rpc", id, method, url, body, headers}; API responses return as
// {t:"rpc-result", id, status, body}. Session cookies stay server-side on
// this socket, so login never needs an HTTP cookie round trip.
"use strict";
const { Readable } = require("node:stream");

function gan(WS, api) {
  WS.nhan("rpc", (kn, msg) => {
    void dispatch(kn, msg, api, WS).catch((e) => {
      kn.gui({ t: "rpc-result", id: msg && msg.id, status: 500, body: { loi: "Lỗi máy chủ: " + e.message } });
    });
  });
}

async function dispatch(kn, msg, api, WS) {
  const id = String(msg.id || "").slice(0, 80);
  const method = String(msg.method || "GET").toUpperCase();
  const url = String(msg.url || "");
  if (!id || !["GET", "POST", "PUT", "DELETE"].includes(method) || !/^\/?api\/[a-z0-9_/-]+(?:\?[a-z0-9_=&%-]*)?$/i.test(url)) {
    return kn.gui({ t: "rpc-result", id, status: 400, body: { loi: "Yêu cầu socket không hợp lệ" } });
  }
  const pathname = "/" + url.replace(/^\//, "").split("?", 1)[0];
  const requestBody = msg.body == null ? "" : JSON.stringify(msg.body);
  if (Buffer.byteLength(requestBody) > 512 * 1024) return kn.gui({ t: "rpc-result", id, status: 413, body: { loi: "Dữ liệu gửi lên quá lớn" } });
  const headers = { ...kn.reqHeaders, ...(msg.headers && typeof msg.headers === "object" ? msg.headers : {}) };
  headers.cookie = kn.rpcCookie || "";
  headers["sec-fetch-site"] = "same-origin"; // RPC runs inside the accepted WebSocket; browser cross-site metadata is not an API fetch
  headers["content-length"] = String(Buffer.byteLength(requestBody));
  const req = Readable.from(requestBody ? [Buffer.from(requestBody)] : []);
  req.method = method;
  req.url = url.startsWith("/") ? url : "/" + url;
  req.headers = headers;
  req.socket = { remoteAddress: kn.remoteAddress };
  let status = 200, ended = false, payload = "";
  const responseHeaders = Object.create(null);
  const res = {
    headersSent: false,
    destroyed: false,
    setHeader(name, value) { responseHeaders[String(name).toLowerCase()] = value; },
    getHeader(name) { return responseHeaders[String(name).toLowerCase()]; },
    writeHead(code, h = {}) { status = code; this.headersSent = true; for (const [k, v] of Object.entries(h)) this.setHeader(k, v); return this; },
    end(chunk = "") {
      if (ended) return; ended = true; payload += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      const cookies = responseHeaders["set-cookie"];
      if (cookies) {
        const list = Array.isArray(cookies) ? cookies : [cookies];
        const jar = new Map((kn.rpcCookie || "").split(/;\s*/).filter(Boolean).map((s) => { const i = s.indexOf("="); return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 1)]; }));
        for (const c of list) { const pair = String(c).split(";", 1)[0], i = pair.indexOf("="); if (i >= 0) { const k = pair.slice(0, i); if (pair.slice(i + 1)) jar.set(k, pair.slice(i + 1)); else jar.delete(k); } }
        kn.rpcCookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
      }
      let body = null;
      try { body = payload ? JSON.parse(payload) : null; } catch { body = { loi: "Phản hồi API không hợp lệ" }; }
      if (body && body.ten && (method === "POST" && /api\/(dang-nhap|dang-ky)$/.test(pathname))) WS.ganTaiKhoan(kn, body.ten);
      kn.gui({ t: "rpc-result", id, status, body });
    },
  };
  await api.xuLyApi(req, res, pathname);
}

module.exports = { gan };
