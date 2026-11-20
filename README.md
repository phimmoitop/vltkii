# Deploy server on Render

Set the Render root directory to `server/` (or deploy this folder as the repo
root). Use Node 20+, build command `npm install`, start command `npm start`,
and health check path `/healthz`.

Required environment variables:

- `GOOGLE_APPS_SCRIPT_URL`: deployed Apps Script `/exec` URL.
- `GOOGLE_APPS_SCRIPT_TOKEN`: secret shared with Apps Script Script Property
  `VLTK_TOKEN`.
- `VL_ADMIN_USER` and `VL_ADMIN_PASSWORD`: used only to create the first admin
  if the loaded snapshot has no accounts.
- `VL_DANG_KY=1`: enable public account registration through socket RPC.
- `VL_WS_ORIGIN_ALLOW`: comma-separated allowed browser origins if the client
  is hosted on a different domain from the Render service.

## Data lifecycle

On boot, the server downloads the snapshot before loading the game modules.
All mutable `du-lieu` reads/writes are redirected to an in-memory filesystem;
account, character, inventory, equipment, guild, event, and auxiliary module
state live in RAM while the process runs. Fixed game rules and tables remain
JSON files in `assets/`. The server snapshots RAM to Apps Script every five
minutes and flushes again after closing WebSocket connections on `SIGTERM` or
`SIGINT`.

Apps Script is a separate Google deployment. Its source is kept outside this
folder at `../apps-script/Code.gs` in the workspace and is intentionally not
copied to the GitHub server repository. It stores chunked rows in the
spreadsheet tab `VLTK_DATA` with columns `path`, `part`, `content`.

## Socket protocol

Connect to `wss://<render-host>/api/ws`. Send API requests over that socket:

```json
{"t":"rpc","id":"request-1","method":"POST","url":"api/dang-nhap","body":{"ten":"user","mk":"password"}}
```

The response is `{ "t":"rpc-result", "id":"request-1", "status":200,
"body":{...} }`. Session cookies stay on the server-side socket. Registration
is `POST api/dang-ky`; after account creation, send the normal login RPC.

Only the files needed by Node rules and indexes are included here. Client HTML,
scripts, images, sounds, maps, and sprites stay in the client deployment.
