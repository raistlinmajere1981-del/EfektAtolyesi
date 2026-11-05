import { test } from "node:test";
import assert from "node:assert/strict";
import { sitePublishRoute } from "../scripts/admin-studio.mjs";

test("first-publish adapters route only site assets through existing reviewed destinations", () => {
  const landing = sitePublishRoute(
    { id: "landing", siteUrl: "https://yardimciasistan.alwaysdata.net" },
    { scene: "assets/site/scenes/coast.scene.json" });
  assert.equal(landing.upload.type, "ssh-rsync");
  assert.match(landing.upload.remote, /\/www\/deneme\/assets\/site\/scenes\/coast\.scene\.json$/);
  assert.equal(landing.publicSceneUrl,
    "https://yardimciasistan.alwaysdata.net/deneme/assets/site/scenes/coast.scene.json");

  const blacksea = sitePublishRoute(
    { id: "blacksea", siteUrl: "https://blackseapansiyon.com" },
    { scene: "public/assets/site/scenes/coast.scene.json" });
  assert.equal(blacksea.upload.type, "natro-ftp");
  assert.equal(blacksea.upload.remote, "public/assets/site/scenes/coast.scene.json");
  assert.equal(blacksea.publicSceneUrl, "https://blackseapansiyon.com/assets/site/scenes/coast.scene.json");

  const gundogdu = sitePublishRoute(
    { id: "gundogdu", siteUrl: "https://yardimciasistangunduodu.alwaysdata.net" },
    { scene: "assets/site/scenes/coast.scene.json" });
  assert.equal(gundogdu.upload.type, "ssh-rsync");
  assert.match(gundogdu.upload.remote, /\/www\/assets\/site\/scenes\/coast\.scene\.json$/);
  assert.equal(gundogdu.publicSceneUrl,
    "https://yardimciasistangunduodu.alwaysdata.net/assets/site/scenes/coast.scene.json");

  assert.equal(sitePublishRoute({ id: "teknikel", siteUrl: "https://example.test" },
    { scene: "assets/site/scenes/coast.scene.json" }), null,
    "module-only Teknikel destination must never become a site publisher");
  assert.equal(sitePublishRoute({ id: "gundogdu", siteUrl: "https://example.test" },
    { scene: "canonical/public/assets/site/scenes/coast.scene.json" }), null);
  assert.equal(sitePublishRoute({ id: "landing", siteUrl: "http://example.test" },
    { scene: "assets/site/scenes/coast.scene.json" }), null);
  assert.equal(sitePublishRoute({ id: "landing", siteUrl: "https://example.test" },
    { scene: "assets/site/scenes/../sneak.scene.json" }), null);
});
