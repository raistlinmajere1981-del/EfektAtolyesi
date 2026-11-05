# Scene Object v2 Contract

Status: **local contract phase 2**. The example file
`examples/birdesengor-v2.scene.json` is still a local validation fixture, not an
actual v2 site integration. Phase 2 adds a separate local scene editor
(`scene.html`) and one explicit local Admin workspace target; it does not change
the v1 image/zone format or the existing photo editor.

See `docs/SCENE_EDITOR_AND_ADMIN.md` for the local editor and Admin workflow.

## 1. Version dispatch and compatibility

`src/model/project.mjs` exposes:

- `validateProject(value)` — validates and returns the same object.
- `importProject(text)` — parses JSON, validates, and returns a deep clone.
- `exportProject(scene)` — validates, then serializes with 2-space indentation
  and a trailing newline.

Dispatch is explicit:

| Input | Result |
| --- | --- |
| `version: 1` (and no `kind: "objectScene"`) | Existing strict v1 image/zone validator, unchanged |
| `version: 2, kind: "objectScene"` | New strict object-scene validator |
| Any other version, missing `kind`, or another kind | Rejected |

There is **no silent migration** in either direction. A v1 file must not contain
`flame`, `glow`, or `smoke`; a v2 file must not contain `offshore`, `sunlight`,
or `shimmer`. The two registries are separate:

- `effectRegistry` — v1 image effects only (`targetKinds: ["image"]`).
- `objectEffectRegistry` — v2 object effects only
  (`targetKinds: ["sceneObject"]`).

## 2. Exact JSON shape

```json
{
  "format": "efekt-atolyesi",
  "version": 2,
  "kind": "objectScene",
  "name": "Scene name",
  "seed": "scene seed",
  "sceneId": "birdesengor-v2",
  "viewport": { "width": 1600, "height": 900 },
  "objects": [
    {
      "id": "candle",
      "name": "Mum",
      "visible": true,
      "pose": {
        "x": 0.7,
        "y": 0.65,
        "width": 0.12,
        "height": 0.24,
        "rotation": 0,
        "depth": 2
      },
      "anchors": [{ "id": "wick", "x": 0.5, "y": 0.08 }]
    }
  ],
  "effects": [
    {
      "id": "flame-1",
      "type": "flame",
      "target": {
        "kind": "sceneObject",
        "objectId": "candle",
        "anchorId": "wick",
        "offset": { "x": 0, "y": 0 },
        "scale": 1,
        "depth": 0
      },
      "enabled": true,
      "seed": "flame-a",
      "params": {
        "width": 0.12,
        "height": 0.3,
        "opacity": 0.95,
        "speed": 1,
        "sway": 0.35
      }
    }
  ]
}
```

Unknown fields are rejected at every level. Missing required fields are
rejected. `objects` may contain at most 200 entries and `effects` at most 500.

### Root fields

| Field | Rule |
| --- | --- |
| `format` | Exactly `"efekt-atolyesi"` |
| `version` | Exactly `2` |
| `kind` | Exactly `"objectScene"` |
| `name` | Non-empty string, max 160 characters |
| `seed` | Non-empty string, max 120 characters |
| `sceneId` | Non-empty string, max 120 characters |
| `viewport.width`, `viewport.height` | Integers 1–20000; area at most 80,000,000 |
| `objects` | Array, max 200 |
| `effects` | Array, max 500 |

Object ids and effect ids share one global namespace. Duplicate ids are
rejected, including an effect id that equals an object id.

### Object fields

| Field | Rule |
| --- | --- |
| `id` | Non-empty string, max 120 characters, globally unique |
| `name` | Non-empty string, max 160 characters |
| `visible` | Boolean |
| `pose.x`, `pose.y` | Normalized scene coordinate, 0–1, top-left corner |
| `pose.width`, `pose.height` | Normalized scene size, 0.001–1 |
| containment | `pose.x + pose.width ≤ 1` and `pose.y + pose.height ≤ 1` |
| `pose.rotation` | Degrees, −360 to 360 |
| `pose.depth` | Finite number, −100 to 100 |
| `anchors` | Array, max 100, anchor ids unique inside the object |

### Anchor fields

| Field | Rule |
| --- | --- |
| `id` | Non-empty string, max 120 characters, unique in the object |
| `x`, `y` | Normalized **object-local** coordinate, 0–1, top-left origin |

### Effect fields

| Field | Rule |
| --- | --- |
| `id` | Non-empty string, max 120 characters, globally unique |
| `type` | `"flame"`, `"glow"`, or `"smoke"` |
| `target.kind` | Exactly `"sceneObject"` |
| `target.objectId` | Must reference an existing object |
| `target.anchorId` | Must reference an existing anchor on that object |
| `target.offset.x`, `target.offset.y` | Normalized to object width/height, −5 to 5 |
| `target.scale` | Positive finite, 0.01–10 |
| `target.depth` | Finite number, −100 to 100 |
| `enabled` | Boolean |
| `seed` | Non-empty string, max 120 characters |
| `params` | Exact control set for the effect type; unknown/missing keys rejected |

## 3. Pose, anchor, offset and rotation conventions

- Scene coordinates use a normalized top-left origin: `x` grows right, `y`
  grows down. `viewport` is presentation metadata; pose values are normalized
  and do not need to be converted to pixels.
- `pose` is the object's normalized rectangle in the scene. The real DOM
  element is positioned by the site; the overlay never moves the object.
- An anchor is normalized inside the object rectangle:
  `sceneX = pose.x + anchor.x * pose.width`,
  `sceneY = pose.y + anchor.y * pose.height`.
  `(0,0)` is the object's top-left and `(1,1)` its bottom-right.
- `target.offset` is also normalized to object width/height. The local effect
  origin is `anchor + offset`, so an offset of `{x: 0.1, y: 0}` moves right by
  10% of the object width.
- `target.scale` multiplies the effect box.
- `pose.rotation` is in **degrees**, positive clockwise. Rotation is applied by
  the site to the object element; a descendant canvas inherits it automatically.
  The object element should use a predictable `transform-origin` (normally its
  center) and keep `overflow: visible` when an effect extends beyond the object.
- `pose.depth` and `target.depth` are stacking hints, higher is nearer/front.
  Within one object, overlay canvases use
  `z-index = 1000 + round(target.depth)`. Across objects, the runtime does not
  reorder host DOM; the integrator must keep the site's DOM/z-index consistent
  with `pose.depth`.

## 4. Effect parameter ranges

All effects share `width`, `height`, `opacity`, and `speed`. Width/height are
fractions of the object's width/height before `target.scale`.

| Effect | Extra params | Defaults |
| --- | --- | --- |
| `flame` | `sway` 0–1 | `width .12`, `height .3`, `opacity .95`, `speed 1`, `sway .35` |
| `glow` | `pulse` 0–1 | `width .35`, `height .35`, `opacity .55`, `speed .6`, `pulse .2` |
| `smoke` | `count` 0–120 integer, `spread` 0–1 | `width .18`, `height .5`, `opacity .5`, `speed .8`, `count 36`, `spread .35` |

Common ranges: `width` 0.01–0.9, `height` 0.01–1, `opacity` 0–1,
`speed` 0.05–3. `objectEffectRegistry[type].presets` also exposes Sakin /
Doğal / Canlı numeric presets. The local editor exposes the individual registry
controls; presets remain available through the registry API.

## 5. Update cycle

1. Parse and validate the JSON: `importProject(text)` (or `validateProject`).
2. Compile: `compileObjectScene(scene)`.
3. Bind compiled effects to real DOM objects:
   `bindObjectScene(scene, resolveObject)` or per-object
   `createObjectOverlay(element, compiled, {objectId})`.
4. The overlay updates on the shared ticker. It never mutates the JSON.
5. Call `destroy()` when the page/section unmounts.

Pass the expected identity when the page owns one scene:

```js
bindObjectScene(scene, resolveObject, {expectedSceneId: scene.sceneId});
```

`compileObjectScene` returns `{seed, sceneId, viewport, performance, objects,
effects}`. Disabled effects and effects whose object is `visible: false` are
removed from `effects`; the object list remains available as scene metadata.
Each compiled effect contains the resolved anchor, offset, scale, depth,
placement, deterministic seed, factory, and compiled params.

Randomness is seeded from the scene seed, effect id, and effect seed. The same
JSON plus the same update sequence produces the same simulation. There are no
per-effect timers; the existing shared ticker schedules all overlays.

## 6. DOM binding API

Exports from `src/runtime/index.mjs`:

```js
import {importProject} from '../src/model/project.mjs';
import {
  compileObjectScene,
  createObjectOverlay,
  bindObjectScene,
} from '../src/runtime/index.mjs';

const scene = importProject(jsonText);
const compiled = compileObjectScene(scene);

const handle = bindObjectScene(
  scene,
  objectId => document.querySelector(`[data-scene-object="${objectId}"]`),
  { enabled: true, expectedSceneId: scene.sceneId },
);

// Or bind one object explicitly:
const overlay = createObjectOverlay(candleElement, compiled, {
  objectId: 'candle',
  expectedSceneId: scene.sceneId,
});
```

A host may declare its identity with `data-scene-object`, `data-object-id`, or
`data-scene-object-id` (checked in that order), and optionally
`data-scene-id`. If the declared object id or scene id differs from the compiled
scene, binding throws instead of silently attaching a candle effect to a camera
element. `expectedSceneId` additionally checks the compiled scene before any
DOM lookup. Elements without an identity attribute are accepted for backward
compatibility.

`resolveObject` may be `(objectId) => HTMLElement | null`, a `Map` keyed by
object id, or a plain object keyed by object id. It only needs to resolve
objects that own compiled effects. Missing elements are reported by
`handle.inspect().unresolved`; mount the element, then call `bindObjectScene`
again for that scene.

`createObjectOverlay(element, compiled, options)` requirements and behavior:

- `element` must be a connected DOM element with a size. The overlay appends one
  descendant `<canvas>` per effect, with `position: absolute`,
  `pointer-events: none`, `aria-hidden="true"`, percentage `left/top/width/height`
  from the anchor/offset/size, and the depth `z-index`.
- If `getComputedStyle(element).position === "static"`, the element is temporarily
  changed to `position: relative` and restored on destroy.
- CSS percentages mean the overlay follows the object when the site moves,
  scales, rotates, or focuses it. The runtime reads layout only on resize
  events, not every frame.
- Overlay handles expose `refresh()`, `refreshVisibility()`, `setEnabled(value)`,
  `setPaused(value)`, `renderAt(seconds)`, `inspect()`, and `destroy()`.
  `refreshVisibility()` is the explicit fallback when an integrator knows an
  ancestor changed visibility but a MutationObserver is unavailable.
  `renderAt` is for deterministic tests/offline frames: it only seeks forward,
  between the current elapsed time and 60 seconds.
- `bindObjectScene` returns `{overlays, inspect, setEnabled, setPaused, refresh,
  destroy}`. `overlays` is a `Map` keyed by object id.

## 7. Visibility, motion and cleanup

The overlay runs only when all of these are true:

- the document is visible (`document.hidden === false`),
- the page has not received `pagehide` (restored by `pageshow`),
- `prefers-reduced-motion: reduce` is not active,
- the object is intersecting the viewport (when `IntersectionObserver` exists),
- the computed `display` and `visibility` of the object and every ancestor are
  not hidden (`visibility: hidden`/`collapse`, `display: none`, or `[hidden]`),
- the object element remains connected,
- the overlay is enabled and not paused.

CSS visibility is checked on construction, on resize, and by a
`MutationObserver` watching `class`, `style`, and `hidden` on the object and its
ancestors. This is intentional: an element can stay “intersecting” while CSS
hides it. Call `refreshVisibility()` after changing visibility through another
mechanism. When a gate closes, the shared ticker subscription is removed,
canvases are hidden and cleared, and no effect update runs. Detaching the object
element destroys the overlay on its next scheduled frame. `destroy()` disconnects
`IntersectionObserver`/`ResizeObserver`/`MutationObserver`, removes
window/document/media listeners, destroys effect state, removes canvases, and
restores the temporary position style. There are no per-effect timers to clean
up.

If `prefers-reduced-motion` is active, the effects are not animated at all.
The page should show a static fallback (the object without the animated layer).

## 8. Performance behavior

- One shared ticker; one subscription per object overlay.
- Defaults: `fps 24`, `maxDpr 1.25`, `maxPixels 650000`, `lowPowerFps 15`,
  `lowPowerDpr 1`. Low-power/save-data detection uses `navigator.connection.saveData`,
  `navigator.hardwareConcurrency`, and `navigator.deviceMemory`.
- Each canvas gets `maxPixels / effectCount` as a hard backing-store budget.
  Device pixel ratio is reduced to fit before the canvas is allocated.
- Sustained expensive frames reduce the overlay once to 15 fps and DPR 1.
- Per-frame work is Canvas2D drawing only: no layout reads, no DOM writes,
  no image decoding, and no new dependencies.
- `smoke` caps particles at the validated count (and the factory hard-caps at
  300). `flame` and `glow` cache their paint state; `glow` caches its gradient
  per canvas size.

## 9. V2 integrator instructions

1. Treat this document as the contract. Do not edit v1 files or reuse v1 water
   effects in a v2 scene.
2. Ship an explicit `version: 2, kind: "objectScene"` JSON document. Do not send
   a v1 document and expect migration.
3. Provide one real DOM element per object id used by an effect. Give each a
   stable size and a `data-scene-object`, `data-object-id`, or
   `data-scene-object-id` attribute (or pass a resolver that returns only the
   matching element).
4. If the object element can rotate/scale/move, let the site's CSS do it and
   keep the object's transform origin stable; the descendant canvases inherit
   it.
5. Import `compileObjectScene`, `bindObjectScene`, and call `destroy()` on
   unmount/navigation. Pass `expectedSceneId` and use `data-scene-id` so a
   stale scene cannot bind to a different page.
6. Add authored scenes through the local workflow in
   `docs/SCENE_EDITOR_AND_ADMIN.md`; do not point the Admin local target at a
   production path.
7. The local example `examples/birdesengor-v2.scene.json` proves the contract
   only. It is not a real v2 site integration and is not deployed.

Tests: `node --test tests/scene-object-model.test.mjs
tests/scene-object-runtime.test.mjs tests/admin-scene-target.test.mjs`, or the
full `bash scripts/check.sh`.

## 10. Local scene editor (`scene.html`)

The scene editor is deliberately separate from the v1 photo editor:

- `scene.html` + `scene.css` + `src/editor/scene-main.mjs`; `index.html` and
  `src/editor/main.mjs` keep their existing behavior.
- Standalone `/scene.html` loads the local fixture and clearly says
  “Yerel sözleşme önizlemesi — gerçek V2 bağlantısı değil”.
- Embedded mode (`?embedded=1`) supports the same `studio:hello`,
  `studio:load`, `studio:get`, `studio:dirty`, `studio:ready`,
  `studio:loaded` and `studio:error` messages as the photo editor.
- Objects are labelled local placeholders positioned from normalized `pose`.
  Real flame/glow/smoke preview uses the canonical object runtime; the editor
  does not hand-draw duplicate effects.
- The editor exposes object selection, named anchor selection and position,
  per-object effect list, add flame/glow/smoke, anchor chooser, visual marker
  dragging plus numeric offset X/Y, scale, depth, registry parameter controls,
  enable/disable, delete, undo/redo, and strict v2 import/export.
- Object `pose` is edited separately from effect `target.offset`; every change
  passes `validateProject` and emits `studio:dirty`.

## 11. Admin local scene target

`config/scene-targets.json` defines one explicit local target:

| Field | Value |
| --- | --- |
| project / target | `birdesengor` / `scene_v2` |
| name | `BirDeSenGör V2 · çalışma sahnesi` |
| kind | `sceneObject` |
| sceneId | `birdesengor-study-v2` |
| viewport | `1600 × 900` |
| source | `examples/birdesengor-v2.scene.json` |
| draft | `.studio-drafts/birdesengor__scene_v2.scene.json` |

`scripts/admin-studio.mjs` merges this target into `list` with `siteUrl: ""`
and `canPublish: false` / `canPrepare: false`, so Admin never presents it as an
installed site. `load` reads the draft first, then the fixture. `save` validates
the exact v2 `sceneId` and viewport and writes only that draft path; it never
replaces a photo or hashes a site image. `prepare` and `publish` are rejected
for this target. The existing image list/load/save/publish paths and source-hash
semantics are unchanged.

The Admin React screen switches its iframe between
`effect-studio/index.html` and `effect-studio/scene.html` based on target
`kind`, resets in-flight message state when the document changes, hides photo
prepare/publish actions for the local scene, and labels it as local-only.
`scripts/sync-effect-studio.mjs` copies both `scene.html` and `scene.css` into
the Admin build output.

This is a local editing flow, not a V2 site deployment. Wiring a real site
requires the site to provide matching object DOM identities and to call
`bindObjectScene` with the same `sceneId` and `expectedSceneId`; no production
path or URL is assumed by this repository.
