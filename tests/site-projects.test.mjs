import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverSiteProjects } from "../scripts/site-projects.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sample = resolve(here, "../../YardimciAsistan/test-site/landing/assets/showcase/workspace.webp");

test("site effects inventory follows canonical installations, referenced images and bounded roots", () => {
  const workspace = mkdtempSync(join(tmpdir(), "site-effect-discovery-"));
  try {
    const repo = join(workspace, "YardimciAsistan");
    const root = join(workspace, "sample-site");
    const landing = join(repo, "test-site/landing/deneme");
    mkdirSync(join(repo, "config"), { recursive: true });
    mkdirSync(join(root,"site/views/pages"), { recursive: true });
    mkdirSync(join(root,"public/assets/site/img"), { recursive: true });
    mkdirSync(join(landing,"assets/showcase"), { recursive: true });
    mkdirSync(join(landing,"assets/site/img"), { recursive: true });
    mkdirSync(join(landing,"site/views/pages"), { recursive: true });
    mkdirSync(join(workspace,"teknikel-site"), { recursive: true });
    copyFileSync(sample,join(root,"public/assets/site/img/coast.webp"));
    copyFileSync(sample,join(root,"public/assets/site/img/coast-duplicate.webp"));
    copyFileSync(sample,join(root,"public/assets/site/img/coast-small.webp"));
    copyFileSync(sample,join(landing,"assets/showcase/workspace.webp"));
    copyFileSync(sample,join(landing,"assets/site/img/static.webp"));
    writeFileSync(join(landing,"site/views/pages/home.php"),
      '<img src="<?= asset($site, \'site/img/static.webp\') ?>">'
      + '<img src="<?= e($product[\'image_url\']) ?>">');
    writeFileSync(join(root,"site/views/pages/home.php"),
      '<img src="<?= asset($site, \'site/img/coast.webp\') ?>" srcset="<?= asset($site, \'site/img/coast-small.webp\') ?> 720w">'
      + '<img src="<?= asset($site, \'site/img/coast-duplicate.webp\') ?>">'
      + '<img src="<?= e($product[\'image_url\']) ?>">'
      + '<img src="<?= e($gallery[\'url\']) ?>">');
    writeFileSync(join(landing,"assets/showcase/sources.json"),
      JSON.stringify({images:[{file:"workspace.webp"}]}));
    writeFileSync(join(repo,"config/installations.json"),JSON.stringify({installations:{
      sea:{id:"sea", title:"Deniz", kind:"customer-site",siteUrl:"https://example.test",
        externalRepo:{defaultSibling:"sample-site"}},
      landing:{id:"landing",title:"Demo",kind:"landing",siteUrl:"https://demo.example.test"},
      teknikel:{id:"teknikel",title:"Teknikel",kind:"customer-site",siteUrl:"https://teknikel.example.test",
        externalRepo:{defaultSibling:"teknikel-site"}},
      support:{id:"support",kind:"support"}
    }}));
    const legacy = join(workspace,"legacy.json");
    writeFileSync(legacy,JSON.stringify({version:1, projects:[{id:"sea",name:"Wrong old title",images:[{
      id:"hero",name:"Hero",photo:"public/assets/site/img/coast.webp",
      photoRef:"assets/coast.webp",scene:"public/assets/site/scenes/hero.scene.json",
      upload:{type:"disabled",note:"First-time setup needed"}
    }]}]}));
    const sites = discoverSiteProjects({workspace, legacyFile:legacy,
      registryFile:join(repo,"config/installations.json")});
    assert.deepEqual(sites.map(site=>site.id),["sea","landing","teknikel"]);
    assert.equal(sites[0].name,"Deniz");
    assert.equal(sites[0].images.length,1);
    assert.equal(sites[0].images[0].id,"sea:hero");
    assert.equal(sites[0].images[0].canPublish,false);
    assert.match(sites[0].images[0].sourceHash,/^[a-f0-9]{64}$/);
    assert.equal(sites[1].images.length,1, "Only the hardcoded design photo is eligible");
    assert.match(sites[1].images[0].sourcePath, /^assets\/site\/img\/static.webp$/);
    assert.equal(sites[1].images[0].canPublish,false);
    assert.equal(sites[2].images.length,0);
    assert.match(sites[2].note,/ürün\/galeri/i,"dynamic hero media stays outside the static-image flow");
  } finally { rmSync(workspace,{recursive:true,force:true}); }
});
