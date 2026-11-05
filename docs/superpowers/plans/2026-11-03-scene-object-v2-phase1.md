# Scene Object v2 — Bounded Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit, strictly validated v2 object-scene JSON contract, three object-bound effects (flame, glow, smoke), an object-bound Canvas2D overlay runtime, a local fixture, tests, and integrator documentation without changing v1 behavior.

**Architecture:** Keep v1 validation/compilation untouched behind a version dispatch. Add a separate object-effect registry and object-scene compiler so v1 `compileScene` output stays byte-for-byte compatible. Pure anchor/projection helpers are separated from the DOM overlay so they can be tested in Node; the overlay follows the existing shared-ticker, lifecycle, pixel-budget, and reduced-motion patterns from `core.mjs`.

**Tech Stack:** Node.js ESM, `node:test`, Canvas2D, existing `seededRandom`/`ticker`.

**Spec:** `.test-artifacts/scene-object-phase1-task.txt`

## Global Constraints

- Only edit files under this `EfektAtolyesi` repository. No sibling-repo writes, deploy, push, migration, or commit.
- Preserve v1 JSON validation semantics and old site effect behavior. Never silently migrate v1.
- No new dependencies, no per-effect timers, Canvas2D only, seeded deterministic randomness.
- Keep v1 `compileScene` output stable.
- No editor/Admin UI in this chunk.
- Stop after this bounded chunk and report `bash scripts/check.sh` result.

## File Structure

- Modify `src/model/project.mjs` — v1 validator preserved; explicit v2 dispatch and object-scene validation.
- Modify `src/registry/effects.mjs` — keep `effectRegistry`; add `objectEffectRegistry` and `defaultObjectParams`.
- Create `src/runtime/effects/flame.mjs`, `glow.mjs`, `smoke.mjs`.
- Create `src/runtime/object-scene.mjs` — pure pose/anchor/projection/style helpers.
- Create `src/runtime/object-compile.mjs` — `compileObjectScene`.
- Create `src/runtime/object-overlay.mjs` — `createObjectOverlay`, `bindObjectScene`.
- Modify `src/runtime/index.mjs` — export new runtime surface.
- Create `examples/birdesengor-v2.scene.json`.
- Create `docs/SCENE_OBJECT_V2_CONTRACT.md`.
- Create `tests/scene-object-model.test.mjs`, `tests/scene-object-runtime.test.mjs`.

## Review Focus

- A v1 scene containing a new effect type must still be rejected, and a v2 scene containing an old water effect must be rejected.
- Object pose and anchor values at or just outside 0/1 must be handled consistently (containment, no negative sizes, no NaN).
- A detached/hidden/prefers-reduced-motion object must stop ticker work and leave no timers/listeners.
- Duplicate ids and unknown anchor/object references must fail loudly, not render silently.
- Effect factories must produce identical `inspect()` state for identical seeds and update sequences.

---

### Task 1: Explicit v2 object-scene model contract

**Files:**
- Modify: `src/model/project.mjs`
- Create: `examples/birdesengor-v2.scene.json`
- Test: `tests/scene-object-model.test.mjs`

**Interfaces:**
- Produces: `OBJECT_SCENE_VERSION = 2`, `OBJECT_SCENE_KIND = 'objectScene'`.
- Produces: `validateProject(scene)` dispatches: v1 shape → existing v1 validation; explicit `version:2, kind:'objectScene'` → v2 validation; everything else rejected.
- v2 shape validated exactly as documented in the final contract doc.

- [ ] **Step 1: Write the example fixture** with book, candle, camera, parchment, quill (all with named anchors) and flame/glow/smoke effects on the candle wick.
- [ ] **Step 2: Write failing model tests** for: fixture import/export roundtrip; v1 still strict and rejects `flame`; v2 roundtrip; duplicate object/effect ids; unknown anchor/object; unknown effect type; water effect in v2; pose/anchor out of range; scale 0; malformed version/kind; unknown fields; missing fields.
- [ ] **Step 3: Run the model test** and confirm it fails on missing/incomplete v2 validation.
- [ ] **Step 4: Implement v2 dispatch/validation** while preserving the existing v1 body and messages.
- [ ] **Step 5: Run model + existing tests** and confirm green.
- [ ] **Step 6: Commit** (not performed per task instruction; ledger records instead).

### Task 2: Object effect algorithms and registry

**Files:**
- Create: `src/runtime/effects/flame.mjs`, `glow.mjs`, `smoke.mjs`
- Modify: `src/registry/effects.mjs`
- Test: `tests/scene-object-runtime.test.mjs`

**Interfaces:**
- Each factory: `createX({random, params}) → {update(dt), render(ctx, frame), inspect(), destroy()}`.
- `objectEffectRegistry` entries: `targetKinds:['sceneObject']`, `placement:'bottom'|'center'`, `controls`, `presets`, `create`, `compile(object,target,params)`.
- `defaultObjectParams(type)`.

- [ ] **Step 1: Write failing tests** for registry metadata, control ranges, seeded determinism (`inspect()` equal after same `update` sequence), smoke particle cap, and flame/glow state changes.
- [ ] **Step 2: Run tests** and confirm failure (missing module/registry).
- [ ] **Step 3: Implement the three factories and registry** using only seeded spawn-time randomness and Canvas2D.
- [ ] **Step 4: Run runtime/model tests** and confirm green.

### Task 3: Object scene compiler and pure helpers

**Files:**
- Create: `src/runtime/object-scene.mjs`, `src/runtime/object-compile.mjs`
- Test: `tests/scene-object-model.test.mjs`

**Interfaces:**
- `compileObjectScene(scene) → {seed, sceneId, viewport, performance, objects, effects}` with filtered enabled effects on visible objects.
- `anchorScenePoint(object, anchorId)`, `effectLocalPoint(object, effect)`, `effectScenePoint(object, effect)`, `effectCanvasStyle(...)`, `depthZIndex(depth)`.

- [ ] **Step 1: Write failing tests** for pose/anchor projection, offset application, CSS percentages, depth ordering, enabled/visibility filtering, and deterministic compile output.
- [ ] **Step 2: Run tests** and confirm failure.
- [ ] **Step 3: Implement helpers and compiler.**
- [ ] **Step 4: Run tests** and confirm green.

### Task 4: Object overlay runtime

**Files:**
- Create: `src/runtime/object-overlay.mjs`
- Test: `tests/scene-object-runtime.test.mjs`

**Interfaces:**
- `createObjectOverlay(objectElement, config, {objectId, enabled, ticker, ...})`.
- `bindObjectScene(scene, resolveObject, opts)` → `{overlays, inspect, setEnabled, setPaused, refresh, destroy}`.
- Descendant absolute canvases, `pointer-events:none`, anchor CSS, depth z-index, shared ticker, visibility/reduced-motion/pagehide gates, observers and listener cleanup, pixel budget.

- [ ] **Step 1: Write failing lifecycle tests** with practical DOM/observer/context mocks: canvas creation/style, visible start/stop, document hidden, reduced motion, pagehide, destroy cleanup, deterministic `renderAt`.
- [ ] **Step 2: Run tests** and confirm failure.
- [ ] **Step 3: Implement overlay and binder.**
- [ ] **Step 4: Run tests** and confirm green.

### Task 5: Public exports, documentation, full verification

**Files:**
- Modify: `src/runtime/index.mjs`
- Create: `docs/SCENE_OBJECT_V2_CONTRACT.md`
- Test: full `bash scripts/check.sh`

- [ ] **Step 1: Add exports** for `compileObjectScene`, `createObjectOverlay`, `bindObjectScene`, `objectEffectRegistry`, `defaultObjectParams`.
- [ ] **Step 2: Write the contract document** with exact schema, units/conventions, lifecycle, binding API, performance behavior, and V2 integrator instructions; state that the example is a local fixture, not a live V2 integration.
- [ ] **Step 3: Run `bash scripts/check.sh`** and confirm pass; report any failure honestly.
