import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,writeFileSync,existsSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {defaultParams} from "../src/registry/effects.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../YardimciAsistan/test-site/landing/deneme/assets/site/img");
test("flat demo installation stages exactly one static photo and never uploads",async()=>{
  const workspace=mkdtempSync(join(tmpdir(),"ya-demo-static-scene-"));
  const prev={workspace:process.env.EFEKT_STUDIO_WORKSPACE,registry:process.env.EFEKT_STUDIO_PROJECTS_FILE,drafts:process.env.EFEKT_STUDIO_DRAFTS_DIR};
  try{
    const site=join(workspace,"demo");
    mkdirSync(join(site,"assets/site/img"),{recursive:true});
    copyFileSync(join(root,"gol-yansima.jpg"),join(site,"assets/site/img/gol-yansima.jpg"));
    process.env.EFEKT_STUDIO_WORKSPACE=workspace;
    process.env.EFEKT_STUDIO_PROJECTS_FILE=join(workspace,"projects.json");
    process.env.EFEKT_STUDIO_DRAFTS_DIR=join(workspace,"drafts");
    writeFileSync(process.env.EFEKT_STUDIO_PROJECTS_FILE,JSON.stringify({version:1,projects:[{
      id:"landing",name:"Demo lab",directory:"demo",siteUrl:"https://demo.example.test/deneme/",
      images:[{id:"lake",name:"Göl",photo:"assets/site/img/gol-yansima.jpg",photoRef:"assets/site/img/gol-yansima.jpg",
        width:1280,height:853,scene:"assets/site/scenes/lake.scene.json"}]
    }]}));
    const {dispatch}=await import("../scripts/admin-studio.mjs");
    const id="landing:lake",first=(await dispatch("list"))[0].images[0];
    assert.equal(first.canPrepare,true);
    assert.equal(first.canPublish,false);
    const scene=(await dispatch("load",{id})).scene;
    scene.zones=[{id:"lake",name:"Göl",visible:true,points:[[100,100],[700,100],[700,450],[100,450]]}];
    scene.effects=[{id:"effect",zoneId:"lake",type:"sunlight",seed:"test",enabled:true,params:defaultParams("sunlight")}];
    await dispatch("save",{id,scene});
    assert.equal((await dispatch("prepare",{id})).ok,true);
    const manifest=JSON.parse(readFileSync(join(site,"assets/site/scenes/effects-manifest.json"),"utf8"));
    assert.deepEqual(manifest,{version:1,bindings:[{source:"site/img/gol-yansima.jpg",slot:"lake",scene:"lake.scene.json"}]});
    assert.ok(existsSync(join(site,"assets/site/scenes/lake.scene.json")));
    assert.equal((await dispatch("list"))[0].images[0].bindingStatus,"staged");
  }finally{
    for(const [key,value] of Object.entries({EFEKT_STUDIO_WORKSPACE:prev.workspace,EFEKT_STUDIO_PROJECTS_FILE:prev.registry,EFEKT_STUDIO_DRAFTS_DIR:prev.drafts})){
      if(value===undefined) delete process.env[key];else process.env[key]=value;
    }
    rmSync(workspace,{force:true,recursive:true});
  }
});
