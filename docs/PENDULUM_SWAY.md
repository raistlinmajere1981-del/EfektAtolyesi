# V2 pendulum motion

`pendulum-sway` / **Sarkaç Salınımı** is a finite pulse effect in the canonical object registry. It shares the object overlay's ticker and all visibility, reduced-motion, pause, completion and disposal gates. No Canvas is allocated for a motion effect.

The factory returns `update(dt)`, `motion(): {angle}`, `isComplete()`, `inspect()` and `destroy()`. The overlay applies `motion().angle` to the declared child using CSS `rotate`, preserving the consumer's `transform`. It restores the original rotation on every stop, and restores the original origin on disposal. A layer is owned by at most one active overlay; a failed multi-object bind releases earlier bindings.

## Parameters

| Parameter | Default | Range | Meaning |
| --- | --- | --- | --- |
| amplitude | 3 | .1–15 | Angular amplitude, degrees |
| frequency | 2 | .2–5 | Cycles per model second |
| damping | 2.7 | .5–8 | Exponential decay, inverse model seconds |
| duration | 1.8 | .5–5 | Model seconds until exact rest |
| speed | 1 | .25–3 | Multiplier of elapsed model time |

`target.scale` multiplies angular amplitude, without scaling consumer imagery. The existing Sakin / Doğal / Canlı registry presets appear as Hafif / Doğal / Belirgin in the editor. Every preset specifies angle, frequency, damping, duration and speed.

The angle follows the damped sine. A smoothstep envelope over the last `min(.3, duration/3)` seconds brings arbitrary frequency/damping combinations to zero position and velocity. Completion resets rotation and unsubscribes the shared ticker. Pulse lifetime on BirDeSenGör is derived from `duration/speed`, using its existing 180ms cooldown and accepted-click restart policy.

## Target identity and pivot

V2 objects may add `motionLayers: ["pendant"]`. A motion effect must declare `target.layerId: "pendant"`; it must belong to that object. Canvas effects reject `layerId`. Duplicate declared layers and two enabled motion effects targeting the same layer fail validation. Existing V1 and V2 Canvas documents keep their format.

The consumer mounts exactly one direct child with `data-effect-layer="pendant"`. That child spans the complete object's coordinate box. The actual image can occupy an inner rectangle. The pivot is the object's existing normalized anchor plus effect offset. Parent movement, perspective, scale and rotation apply to both fixed and moving artwork together. An absent, duplicated, already bound or detached target is never resolved to another DOM element.

```html
<div data-scene-object-id="ornament">
  <img class="fixed-full-frame" src="fixed.webp" alt="">
  <span data-effect-layer="pendant" class="full-object-frame">
    <img class="consumer-owned-inner-placement" src="pendant.webp" alt="">
  </span>
</div>
```

Assets, filters, image boxes, shadows and interaction targets remain site-owned. BirDeSenGör declares them in its scene manifest. `previewObjects` is a separate, validated load packet containing WebP data URLs and layer boxes; it is never persisted into the effect project. The Admin shell forwards that packet to the synced editor. Site preview uses the room image's actual 2:1 ratio, while the existing 1600×900 logical effect viewport remains compatible.

Standalone editing can declare motion-layer identifiers and change anchor coordinates. A site-linked editor retains the source-defined object/layer/anchor structure; users can edit effect parameters and offsets. Its preview button instantiates the same motion factory used on the site.

## Local evidence

- `tests/scene-object-runtime.test.mjs`: formula, profiles/model validity, finite/range checks, both angular directions, exact rest, speed, layer identity, ticker and teardown gates.
- `tests/scene-editor-ux.test.mjs`: profiles and persisted JSON roundtrip.
- `tests/birdesengor-site.test.mjs`: current inventory, isolated draft saves and source staging restrictions.
- Yardımcı Asistan `apps/admin-control-center/tests/effect-studio-pendulum.test.mjs`: synced editor, actual built Admin shell, asset forwarding, parameter save/reopen and preview.
- BirDeSenGör `tests/scene-pendulum-e2e.mjs`: desktop/mobile scene, independent hit targets, books, language, pulse and lifecycle gates, four deterministic motion frames.

No commit, push or deployment is part of this change.
