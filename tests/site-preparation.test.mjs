import { test } from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,writeFileSync,existsSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {defaultParams} from "../src/registry/effects.mjs";
const here=dirname(fileURLToPath(import.meta.url));
const sample=resolve(here,"../../YardimciAsistan/test-site/landing/assets/showcase/workspace.webp");

test("new fixed design photo stages a scene and manifest without any upload", async()=>{
 const workspace=mkdtempSync(join(tmpdir(),"ya-efekt-prep-"));
 const original={workspace:process.env.EFEKT_STUDIO_WORKSPACE,projects:process.env.EFEKT_STUDIO_PROJECTS_FILE,drafts:process.env.EFEKT_STUDIO_DRAFTS_DIR};
 try {
  const root=join(workspace,"site");mkdirSync(join(root,"public/assets/site/img"),{recursive:true});
  copyFileSync(sample,join(root,"public/assets/site/img/coast.webp"));
  mkdirSync(join(root,"public/assets/site/scenes"),{recursive:true});
  process.env.EFEKT_STUDIO_WORKSPACE=workspace;
  process.env.EFEKT_STUDIO_PROJECTS_FILE=join(workspace,"projects.json");
  process.env.EFEKT_STUDIO_DRAFTS_DIR=join(workspace,"drafts");
  const item={id:"coast",name:"Sabit sahil",photo:"public/assets/site/img/coast.webp",
   photoRef:"assets/coast.webp",width:1116,height:663,scene:"public/assets/site/scenes/coast.scene.json"};
  writeFileSync(process.env.EFEKT_STUDIO_PROJECTS_FILE,JSON.stringify({version:1,projects:[
   {id:"sample",name:"Test",directory:"site",siteUrl:"https://example.test",images:[item]}]}));
  const {dispatch}=await import("../scripts/admin-studio.mjs");
  const id="sample:coast";
  assert.equal((await dispatch("list"))[0].images[0].canPrepare,true);
  await assert.rejects(dispatch("prepare",{id}),/Önce efekt taslağını/i);
  const loaded=await dispatch("load",{id});
  await dispatch("save",{id,scene:loaded.scene});
  await assert.rejects(dispatch("prepare",{id}),/görünür etkin/i);
  loaded.scene.zones=[{id:"z",name:"Bölge",visible:true,points:[[50,50],[350,50],[350,300],[50,300]]}];
  loaded.scene.effects=[{id:"fx",type:"sunlight",zoneId:"z",seed:"demo",enabled:true,params:defaultParams("sunlight")}];
  await dispatch("save",{id,scene:loaded.scene});
  const result=await dispatch("prepare",{id});
  assert.equal(result.ok,true);
  const file=join(root,"public/assets/site/scenes/effects-manifest.json");
  assert.ok(existsSync(file));
  const manifest=JSON.parse(readFileSync(file,"utf8"));
  assert.deepEqual(manifest.bindings,[{source:"site/img/coast.webp",slot:"coast",scene:"coast.scene.json"}]);
  assert.equal(JSON.parse(readFileSync(join(root,"public/assets/site/scenes/coast.scene.json"))).effects.length,1);
  assert.equal((await dispatch("list"))[0].images[0].bindingStatus,"staged");
  assert.equal((await dispatch("list"))[0].images[0].canPublish,false);
  assert.equal((await dispatch("list"))[0].images[0].canPrepare,true,
    "a locally staged scene can be edited and prepared again before deploy");
  // Edit one layer and prepare again; the same manifest entry is retained.
  loaded.scene.effects[0].params.count=8;
  await dispatch("save",{id,scene:loaded.scene});
  const again=await dispatch("prepare",{id});assert.equal(again.ok,true);
  assert.equal(JSON.parse(readFileSync(join(root,"public/assets/site/scenes/coast.scene.json"),"utf8")).effects[0].params.count,8);
  assert.equal(JSON.parse(readFileSync(file,"utf8")).bindings.length,1);
 }finally {for(const [key,val] of Object.entries({EFEKT_STUDIO_WORKSPACE:original.workspace,EFEKT_STUDIO_PROJECTS_FILE:original.projects,EFEKT_STUDIO_DRAFTS_DIR:original.drafts})){if(val===undefined)delete process.env[key];else process.env[key]=val;}rmSync(workspace,{recursive:true,force:true});}
});