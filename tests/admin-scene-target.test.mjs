import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const imageProject={
  id:"demo-site",name:"Demo site",directory:"demo",siteUrl:"https://demo.example.test",images:[
    {id:"hero",name:"Hero",photo:"media/hero.png",photoRef:"assets/hero.png",width:1600,height:900,
     scene:"media/hero.scene.json"}
  ]
};

test("local V2 scene target saves/loads narrowly and rejects invalid/deploy input",async()=>{
  const root=mkdtempSync(join(tmpdir(),"effect-studio-scene-"));
  const old={workspace:process.env.EFEKT_STUDIO_WORKSPACE,projects:process.env.EFEKT_STUDIO_PROJECTS_FILE,
    drafts:process.env.EFEKT_STUDIO_DRAFTS_DIR,scenes:process.env.EFEKT_STUDIO_SCENE_TARGETS_FILE};
  try{
    mkdirSync(join(root,"demo","media"),{recursive:true});
    writeFileSync(join(root,"demo","media","hero.png"),"not read for the scene target");
    process.env.EFEKT_STUDIO_WORKSPACE=root;
    process.env.EFEKT_STUDIO_PROJECTS_FILE=join(root,"projects.json");
    process.env.EFEKT_STUDIO_DRAFTS_DIR=join(root,"drafts");
    process.env.EFEKT_STUDIO_SCENE_TARGETS_FILE=join(root,"scene-targets.json");
    writeFileSync(process.env.EFEKT_STUDIO_PROJECTS_FILE,JSON.stringify({version:1,projects:[imageProject]}));
    writeFileSync(process.env.EFEKT_STUDIO_SCENE_TARGETS_FILE,JSON.stringify({version:1,targets:[{
      project:"birdesengor",projectName:"BirDeSenGör (yerel çalışma)",target:"scene_v2",
      name:"BirDeSenGör V2 · çalışma sahnesi",kind:"sceneObject",sceneId:"birdesengor-study-v2",
      seed:"birdesengor-study-v2-local",sourcePath:"examples/birdesengor-v2.scene.json",
      viewport:{width:1600,height:900},
      note:"Yalnız yerel V2 sözleşme fikstürüdür. Gerçek site kurulumu veya canlı yayın hedefi değildir."
    }]}));

    const {dispatch}=await import("../scripts/admin-studio.mjs");

    const list=await dispatch("list");
    const sceneProject=list.find(project=>project.id==="birdesengor");
    assert.ok(sceneProject,"the explicit local scene project is merged");
    assert.equal(sceneProject.siteUrl,"","a local scene is not an installed site");
    assert.equal(sceneProject.images.length,1);
    const sceneTarget=sceneProject.images[0];
    assert.equal(sceneTarget.id,"birdesengor:scene_v2");
    assert.equal(sceneTarget.kind,"sceneObject");
    assert.equal(sceneTarget.name,"BirDeSenGör V2 · çalışma sahnesi");
    assert.equal(sceneTarget.available,true);
    assert.equal(sceneTarget.canPublish,false);
    assert.equal(sceneTarget.canPrepare,false);
    assert.equal(sceneTarget.hasScene,true);
    assert.equal(sceneTarget.width,1600);
    assert.equal(sceneTarget.height,900);
    assert.match(sceneTarget.note,/Gerçek site kurulumu/);

    // The existing image project list is untouched by the scene registry.
    const imageProjectList=list.find(project=>project.id==="demo-site");
    assert.deepEqual(imageProjectList.images.map(image=>({id:image.id,name:image.name,available:image.available,canPublish:image.canPublish})),
      [{id:"demo-site:hero",name:"Hero",available:true,canPublish:false}]);
    assert.equal(imageProjectList.siteUrl,"https://demo.example.test");

    const opened=await dispatch("load",{id:"birdesengor:scene_v2"});
    assert.equal(opened.source,"installed");
    assert.equal(opened.scene.version,2);
    assert.equal(opened.scene.kind,"objectScene");
    assert.equal(opened.scene.sceneId,"birdesengor-study-v2");
    assert.deepEqual(opened.scene.viewport,{width:1600,height:900});
    assert.deepEqual(opened.scene.objects.map(item=>item.id).sort(),
      ["camera","candle","community-journal","parchment","research-journal"]);
    assert.deepEqual(opened.scene.effects.map(item=>item.id).sort(),["flame-1","glow-1","smoke-1"]);
    assert.equal(opened.scene.photo,undefined,"the scene target has no photo replacement");

    const edited=structuredClone(opened.scene);
    edited.name="Yerel sahne taslağı";
    edited.effects[0].target.offset={x:.12,y:-.04};
    const saved=await dispatch("save",{id:"birdesengor:scene_v2",scene:edited});
    assert.equal(saved.ok,true);
    assert.equal(saved.effectCount,3);
    const draftFile=join(root,"drafts","birdesengor__scene_v2.scene.json");
    assert.ok(existsSync(draftFile),"the only scene draft path is project__target.scene.json");
    assert.deepEqual(readdirSync(join(root,"drafts")),[ "birdesengor__scene_v2.scene.json" ]);
    const disk=JSON.parse(readFileSync(draftFile,"utf8"));
    assert.equal(disk.sceneId,"birdesengor-study-v2");
    assert.deepEqual(disk.effects[0].target.offset,{x:.12,y:-.04});
    assert.equal(disk.photo,undefined);

    const reloaded=await dispatch("load",{id:"birdesengor:scene_v2"});
    assert.equal(reloaded.source,"draft");
    assert.equal(reloaded.scene.name,"Yerel sahne taslağı");
    assert.deepEqual(reloaded.scene.effects[0].target.offset,{x:.12,y:-.04});

    const before=readFileSync(draftFile,"utf8");
    const wrongId=structuredClone(edited);wrongId.sceneId="other-scene";
    await assert.rejects(dispatch("save",{id:"birdesengor:scene_v2",scene:wrongId}),/Sahne kimliği uyuşmuyor/);
    const wrongViewport=structuredClone(edited);wrongViewport.viewport={width:1601,height:900};
    await assert.rejects(dispatch("save",{id:"birdesengor:scene_v2",scene:wrongViewport}),/Sahne görünümü uyuşmuyor/);
    const photoScene=structuredClone(edited);
    photoScene.version=1;delete photoScene.kind;delete photoScene.sceneId;delete photoScene.viewport;
    delete photoScene.objects;delete photoScene.effects;
    Object.assign(photoScene,{photo:{src:"assets/hero.png",width:1600,height:900,name:"Hero"},zones:[],effects:[]});
    await assert.rejects(dispatch("save",{id:"birdesengor:scene_v2",scene:photoScene}),/version 2 objectScene/);
    assert.equal(readFileSync(draftFile,"utf8"),before,"rejected saves never replace the draft");

    await assert.rejects(dispatch("prepare",{id:"birdesengor:scene_v2"}),/site hazırlığı yoktur/);
    await assert.rejects(dispatch("publish",{id:"birdesengor:scene_v2"}),/yayınlanamaz/);
    assert.deepEqual(readdirSync(join(root,"drafts")),[ "birdesengor__scene_v2.scene.json" ]);

    // Even a custom registry copying the installed target cannot inherit its
    // absolute site path or staging privileges.
    const installed=JSON.parse(readFileSync(new URL('../config/scene-targets.json',import.meta.url),'utf8'));
    writeFileSync(process.env.EFEKT_STUDIO_SCENE_TARGETS_FILE,JSON.stringify(installed));
    await assert.rejects(dispatch("load",{id:"birdesengor:scene_v2"}),/examples\//);
    await assert.rejects(dispatch("prepare",{id:"birdesengor:scene_v2"}),/examples\//);

    // Without the explicit scene registry environment the admin returns only the
    // production image project list; no scene target is invented from site scan.
    delete process.env.EFEKT_STUDIO_SCENE_TARGETS_FILE;
    const imagesOnly=await dispatch("list");
    assert.deepEqual(imagesOnly.map(project=>project.id),["demo-site"]);
    assert.deepEqual(imagesOnly[0].images.map(image=>image.id),["demo-site:hero"]);
  }finally{
    for(const [key,value] of Object.entries({
      EFEKT_STUDIO_WORKSPACE:old.workspace,EFEKT_STUDIO_PROJECTS_FILE:old.projects,
      EFEKT_STUDIO_DRAFTS_DIR:old.drafts,EFEKT_STUDIO_SCENE_TARGETS_FILE:old.scenes
    })) if(value===undefined)delete process.env[key];else process.env[key]=value;
    rmSync(root,{recursive:true,force:true});
  }
});
