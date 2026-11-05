import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

test("a verified first publication becomes scene-only on the next publication", async () => {
  const root = mkdtempSync(join(tmpdir(), "studio-first-publish-"));
  const here = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const sourcePhoto = join(here, "../YardimciAsistan/test-site/landing/assets/showcase/workspace.webp");
  const old = Object.fromEntries(["EFEKT_STUDIO_WORKSPACE", "EFEKT_STUDIO_PROJECTS_FILE", "EFEKT_STUDIO_DRAFTS_DIR",
    "EFEKT_STUDIO_PUBLISHED_DIR", "EFFECT_FIXTURE_SCENE_FILE", "EFFECT_FIXTURE_MANIFEST_FILE", "PATH"]
    .map(key => [key, process.env[key]]));
  try {
    const repo = join(root, "YardimciAsistan");
    const site = join(repo, "test-site/landing/deneme");
    mkdirSync(join(repo, "config"), { recursive: true });
    mkdirSync(join(site, "assets/site/img"), { recursive: true });
    mkdirSync(join(site, "site/views"), { recursive: true });
    copyFileSync(sourcePhoto, join(site, "assets/site/img/mock.webp"));
    writeFileSync(join(site, "site/views/index.php"),
      '<img src="<?= asset($site, \'site/img/mock.webp\') ?>">');
    writeFileSync(join(repo, "config/installations.json"), JSON.stringify({
      installations: {
        landing: { kind: "landing", title: "Demo", siteUrl: "https://fake.example.test",
          deploy: { type: "ssh-rsync", host: "fake@example.test", remoteRoot: "/srv/fake/www" } }
      }
    }));
    const bin = join(root, "bin");
    mkdirSync(bin);
    const rsyncLog = join(root, "rsync.log");
    writeFileSync(join(bin, "rsync"),
      '#!/bin/sh\nprintf \'%s\\n\' "$@" > "' + rsyncLog + '"\n', { mode: 0o755 });
    writeFileSync(join(bin, "curl"), `#!/bin/sh
case " $* " in
  *effects-manifest.json*) cat "$EFFECT_FIXTURE_MANIFEST_FILE" ;;
  *) cat "$EFFECT_FIXTURE_SCENE_FILE" ;;
esac
`, { mode: 0o755 });

    process.env.EFEKT_STUDIO_WORKSPACE = root;
    delete process.env.EFEKT_STUDIO_PROJECTS_FILE;
    process.env.EFEKT_STUDIO_DRAFTS_DIR = join(root, "drafts");
    process.env.EFEKT_STUDIO_PUBLISHED_DIR = join(root, "published");
    process.env.PATH = bin + ":" + old.PATH;
    const { dispatch } = await import("../scripts/admin-studio.mjs");
    const siteProject = (await dispatch("list")).find(project => project.id === "landing");
    assert.equal(siteProject.images.length, 1);
    const image = siteProject.images[0], id = image.id;
    assert.equal(image.canPublish, false);
    assert.equal(image.canPrepare, true);
    const scene = (await dispatch("load", { id })).scene;
    scene.zones = [{
      id: "fixture-zone", name: "Zone", visible: true,
      points: [[100, 100], [340, 100], [340, 320], [100, 320]]
    }];
    scene.effects = [{
      id: "fixture-effect", type: "shimmer", zoneId: "fixture-zone", enabled: true, seed: "1",
      params: { count: 20, speed: 1, opacity: 1, bandOpacity: 0.5, length: 0.5, drift: 0.1 }
    }];
    await dispatch("save", { id, scene });
    assert.equal((await dispatch("inspect", { id })).canPublish, false);
    await dispatch("prepare", { id });
    const sceneFile = join(site, "assets/site/scenes", id.split(":")[1] + ".scene.json");
    const manifestFile = join(site, "assets/site/scenes/effects-manifest.json");
    assert.ok(existsSync(sceneFile));
    assert.ok(existsSync(manifestFile));
    process.env.EFFECT_FIXTURE_SCENE_FILE = sceneFile;
    process.env.EFFECT_FIXTURE_MANIFEST_FILE = manifestFile;

    await dispatch("activate", { id });
    assert.ok(existsSync(join(root, "published", id.replace(":", "__") + ".json")));
    const linked = (await dispatch("list")).find(project => project.id === "landing").images[0];
    assert.equal(linked.canPublish, true);
    assert.equal(linked.bindingStatus, "linked");
    const result = await dispatch("publish", { id });
    assert.equal(result.ok, true);
    assert.match(readFileSync(rsyncLog, "utf8"), /fake@example\.test:\/srv\/fake\/www\/deneme\/assets\/site\/scenes\//);
  } finally {
    for (const [key, value] of Object.entries(old)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    rmSync(root, { recursive: true, force: true });
  }
});
