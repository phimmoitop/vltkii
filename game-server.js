"use strict";
require("./may-chu/luoi-an-toan").cai();
const http = require("node:http");
const { xuLyApi, tkWs } = require("./may-chu/api");
const WS = require("./may-chu/ws");
require("./may-chu/socket-rpc").gan(WS, { xuLyApi });

const PORT = Number(process.env.PORT) || 10000;
const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/healthz" || req.url === "/")) {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    return res.end(JSON.stringify({ ok: true, service: "vltk-idle", transport: "websocket-rpc" }));
  }
  res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ loi: "Game API sử dụng WebSocket /api/ws" }));
});
server.keepAliveTimeout = 100000;
server.headersTimeout = 105000;
WS.gan(server, tkWs, { khach: true });
server.on("error", (e) => { console.error("HTTP/WebSocket server:", e); if (process.env.VL_MANAGED_SHUTDOWN === "1") process.emit("SIGTERM"); else process.exit(1); });
server.listen(PORT, "0.0.0.0", () => console.log(`Game server listening on port ${PORT} (WebSocket RPC /api/ws)`));

module.exports = { server, WS };
