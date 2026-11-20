# Deploy server on Render

Set the Render root directory to `server/` (or deploy this folder as the repo
root). Use Node 20+, build command `npm install`, start command `npm start`,
and health check path `/healthz`.

Required environment variables:

- `GOOGLE_APPS_SCRIPT_URL`: deployed Apps Script `/exec` URL.
- `GOOGLE_APPS_SCRIPT_TOKEN`: secret shared with Apps Script Script Property
  `VLTK_TOKEN`.
- `VL_DANG_KY=0`: disable public account registration; registration is open by default.
- `VL_WS_ORIGIN_ALLOW`: comma-separated allowed browser origins if the client
  is hosted on a different domain from the Render service.

## Data lifecycle

On boot, the server requests `action=load`, receives rows from the `Account`
tab, and converts each row into the existing in-memory account and character
shape before loading the game modules. Mutable `du-lieu` reads and writes are
redirected to an in-memory filesystem. The current Account columns do not yet
represent inventory, equipment, or all activity state; those tables must be
implemented before the complete game state can be safely round-tripped.
Fixed game rules and tables remain JSON files in `assets/`.

Apps Script is a separate Google deployment. Its source is at
`../apps-script/Code.gs` in the workspace and is intentionally not copied to
the GitHub server repository. Apps Script reads and writes the `Account` tab;
deploy its changes separately from Node.
New registrations are regular accounts; the first account is not promoted to
admin. Signup works with an empty `Account` sheet when the header row is
present; set `VL_DANG_KY=0` only to close registration.

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
