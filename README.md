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

On boot, the server requests `action=load`, receives account rows and the
`TrangBi` table, then converts them into the in-memory game state. The account
ID is a unique integer beginning at 1000000001 and also serves as the item
owner `uid`. New accounts receive the next ID. Item IDs start after the largest
item still present in `TrangBi`; dropped items live only in RAM, so their IDs
can be reused after a restart if those drops were lost. Every five minutes and
on shutdown, it snapshots `Account` and persistent `TrangBi` rows to Sheets.
Mutable `du-lieu` reads and writes are redirected to an in-memory filesystem.
Fixed game rules and tables remain JSON files in `assets/`.

The `Account` columns `s`, `gold`, and `goldz` store character series (1–5),
carried silver, and vault silver. The runtime converts `s` to its internal
series id (0–4), maps `goldz` to `tienRuong`, and calculates total silver as
`gold + tienRuong` where a total is needed.

`skill9x` stores learned book skills as `id-level-masteryPercent` entries; the
server restores the learned book list and training progress from those values.
Equipment rows are written by item ID, and an equipped horse restores its
appearance so the character enters the game riding it.

Create the `TrangBi` tab with headers `id, uid, item, s, option, stt, gia, time` and
deploy the matching `../apps-script/Code.gs`. It stores equipment options as
attribute-id/value pairs and syncs items in the bag, equipped slots, vaults,
and market stalls. Market rows retain their price and listing timestamp. Ground
drops remain in RAM and are omitted from Sheets. See `../apps-script/README.md`
for the status values and item details that are not in these eight columns.

Apps Script is a separate Google deployment. Its source is at
`../apps-script/Code.gs` in the workspace and is intentionally not copied to
the GitHub server repository. Deploy its changes separately from Node.
New registrations are regular accounts; the first account is not promoted to
admin. Signup works with an empty `Account` sheet when the header row is
present; set `VL_DANG_KY=0` only to close registration.

## Recent server fixes

- `Account.bang` and `Account.rank` are reserved for guild name and guild role.
  They remain blank in the current Sheets snapshot because guild state is
  stored separately; `phai` continues to hold the character's faction.
- Skill upgrades use each skill's configured maximum. Skills configured with
  a maximum of 30, including faction passives, can now be upgraded beyond 20
  when the character level and remaining skill points allow it.

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
