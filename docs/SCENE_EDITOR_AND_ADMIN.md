# Scene Editor and Admin Local Workflow

Status: **local-only phase 2**. This is a contract preview, not a deployed
BirDeSenGör V2 integration. The local editor never edits site sources and the
Admin target never deploys or publishes.

## 1. Local scene editor

Files:

| File | Purpose |
| --- | --- |
| `scene.html` | Standalone / embedded scene editor shell |
| `scene.css` | Responsive editor layout |
| `src/editor/scene-main.mjs` | Editor state, validation, history, overlay preview |
| `examples/birdesengor-v2.scene.json` | Read-only local fixture |

`scene.html` is separate from the existing photo editor `index.html`; the photo
editor, photo discovery, drafts and publish tests keep their original behavior.

Standalone use: serve the repository root over HTTP and open `scene.html`.
The page is explicitly labelled
`Yerel sözleşme önizlemesi — gerçek V2 bağlantısı değil` and loads the fixture.

The editor provides:

- scene object list with visibility toggles;
- selected object pose fields (X, Y, width, height, rotation, depth);
- named anchor selection, anchor X/Y fields and the resolved scene pixel
  location for the current viewport;
- per-object effect list, add `flame` / `glow` / `smoke`, enable/disable,
  duplicate and delete;
- effect target anchor, numeric offset X/Y, scale, depth, seed, and every
  registry control for the selected type;
- visual offset dragging via the orange stage marker; keyboard arrow nudging is
  also supported;
- undo/redo (`Ctrl/⌘ Z`, `Ctrl/⌘ Shift Z`), JSON import/export and fixture reset;
- real canonical `bindObjectScene` preview using the existing model, registry,
  runtime and shared ticker. Object boxes are local labelled placeholders, not
  the real V2 scene artwork.

All edits pass `validateProject`, and `exportProject` is used for downloads.
Object transforms and effect target offsets are separate in both UI and JSON.

### Embedded messages

When loaded as `scene.html?embedded=1`, the editor posts and accepts the same
studio envelope as the photo editor:

| Direction | Message | Meaning |
| --- | --- | --- |
| editor → Admin | `studio:ready` | Editor is listening |
| Admin → editor | `studio:hello` | Ask for readiness |
| Admin → editor | `studio:load` (`scene`) | Replace the edited scene |
| Admin → editor | `studio:get` (`requestId`) | Return `studio:data` with a cloned scene |
| editor → Admin | `studio:loaded` / `studio:error` | Reply to `studio:load` |
| editor → Admin | `studio:dirty` | A validated edit was applied |

Only `version: 2, kind: "objectScene"` documents are accepted. A v1 photo scene,
unknown effect type, unknown field, bad reference or out-of-range value is
rejected without replacing the current scene.

## 2. Admin local target

`config/scene-targets.json` contains exactly one explicit local target:

| Field | Value |
| --- | --- |
| Project / target | `birdesengor` / `scene_v2` |
| UI name | `BirDeSenGör V2 · çalışma sahnesi` |
| Kind | `sceneObject` |
| Scene id | `birdesengor-study-v2` |
| Viewport | `1600 × 900` |
| Source | `examples/birdesengor-v2.scene.json` |
| Draft | `.studio-drafts/birdesengor__scene_v2.scene.json` |

The Admin list merges this target into the normal project list. It is not
discovered from `config/installations.json`, `ChannelFoundry` or a site scan,
and it has no `siteUrl`, production path, upload route or deployment target.
The Admin UI labels it local-only and switches the iframe from `index.html` to
`scene.html` when selected.

Admin behavior for `birdesengor:scene_v2`:

- `load`: existing draft if present, otherwise the fixture;
- `save`: validate exact `sceneId` and viewport, then write only the scene
  draft path above;
- invalid scene id, viewport, v1/photo scene, unknown field or broken reference:
  rejected without replacing the draft;
- `prepare`: rejected; there is no site preparation for this target;
- `publish`: rejected; there is no deploy or publish for this target;
- the fixture is read-only and is never overwritten by the Admin.

When the explicit scene registry environment is absent, the Admin returns the
normal image project list unchanged. Existing image load/save/publish and photo
hash behavior are not modified.

### Iframe readiness and race handling

The Admin iframe is keyed by target kind. Changing between an image and a local
scene replaces the document rather than reusing the old one. On that change the
Admin invalidates the load token, rejects pending replies, clears ready/loaded/
dirty state, and sends `studio:hello` only after the new document's `onLoad`.
Late replies from the previous frame are ignored by source-window comparison.

## 3. Fixture identity

Fixture object ids and candle anchors align with the read-only V2 scene registry:

- scene: `birdesengor-study-v2`
- objects: `research-journal`, `community-journal`, `camera`, `candle`,
  `parchment`, `quill`
- candle effects: `candle.flame-base` (flame, glow) and `candle.smoke` (smoke)

The fixture remains a local contract example. It does not claim the V2 site is
integrated.

## 4. Real V2 integration checklist

1. Treat `docs/SCENE_OBJECT_V2_CONTRACT.md` as the JSON/runtime contract.
2. Author and validate the scene locally with `scene.html`; export v2 JSON.
3. Place the document at the V2 site's own explicit scene path. Do not reuse the
   Admin local draft path as a production path.
4. Give each effect-owned DOM element a stable
   `data-scene-object`, `data-object-id`, or `data-scene-object-id` value equal
   to the JSON object id. Add `data-scene-id` equal to the scene id.
5. Call `bindObjectScene(scene, resolveObject, {expectedSceneId: scene.sceneId})`
   and keep the handle for cleanup.
6. Let V2 own object movement/rotation/z-index; only effect canvases are
   appended by the runtime.
7. Call `destroy()` on unmount/navigation. Keep object and ancestor visibility
   changes as real CSS; the runtime observes them and stops the ticker.
8. Add the Admin local target only when a real, separately reviewed deployment
   path exists. Until then, keep `prepare` and `publish` closed.

## 5. Verification

```bash
# Canonical library, model, runtime and Admin backend
cd ~/YardimciWorkspace/EfektAtolyesi
bash scripts/check.sh

# Admin types and build
cd ~/YardimciWorkspace/YardimciAsistan/apps/admin-control-center
npm run typecheck
npm run build

# Admin local scene target and iframe switching
node --test tests/effect-studio-admin-scene-ui.test.mjs

# Canonical scene editor browser smoke (Brave + Playwright)
node --test tests/effect-studio-scene-editor-smoke.test.mjs
```

The scene editor smoke covers candle anchor selection, marker dragging with
unchanged object pose, intensity change, v2 JSON export/import, visible overlay
pixels, CSS-hidden ticker stop/resume, and a 390px no-horizontal-overflow check.
