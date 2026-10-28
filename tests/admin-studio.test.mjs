import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

test("data-driven studio projects, drafts and scoped site publishing",async()=>{
 const root=mkdtempSync(join(tmpdir(),"effect-studio-contract-"));
 const old={workspace:process.env.EFEKT_STUDIO_WORKSPACE,projects:process.env.EFEKT_STUDIO_PROJECTS_FILE,
  drafts:process.env.EFEKT_STUDIO_DRAFTS_DIR,path:process.env.PATH};
 try{
  const bin=join(root,"bin");mkdirSync(bin);
  const spy=join(root,"rsync-args.txt");
  const fake=join(bin,"rsync");
  writeFileSync(fake,"#!/bin/sh\nprintf '%s\\n' \"$@\" > '"+spy+"'\n",{mode:0o755});
  process.env.PATH=bin+":"+old.path;
  process.env.EFEKT_STUDIO_WORKSPACE=root;
  process.env.EFEKT_STUDIO_PROJECTS_FILE=join(root,"projects.json");
  process.env.EFEKT_STUDIO_DRAFTS_DIR=join(root,"drafts");
  const projects=[];
  for(let p=0;p<20;p++){
   const id="project"+p,dir=join(root,id);mkdirSync(join(dir,"media"),{recursive:true});
   const images=[];
   for(let i=0;i<3;i++){
    const name="item"+i,photo="media/"+name+".png";
    writeFileSync(join(dir,photo),Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/zXcAAAAASUVORK5CYII=","base64"));
    images.push({id:name,name,photo,photoRef:"assets/"+name+".png",width:20,height:20,scene:"media/"+name+".scene.json",
     upload:{type:"ssh-rsync",host:"tester@example.org",remote:"/srv/site/"+name+".scene.json"}});
   }
   projects.push({id,name:id,directory:id,siteUrl:"https://example.org/",images});
  }
  writeFileSync(process.env.EFEKT_STUDIO_PROJECTS_FILE,JSON.stringify({version:1,projects}));
  const {dispatch}=await import("../scripts/admin-studio.mjs");
  const list=await dispatch("list");
  assert.equal(list.length,20);
  assert.equal(list.flatMap(p=>p.images).length,60);
  const id="project19:item2";
  const opened=await dispatch("load",{id});
  assert.equal(opened.source,"new");
  assert.match(opened.scene.photo.src,/^data:image\/png;base64,/);
  opened.scene.name="Test scene";
  await dispatch("save",{id,scene:opened.scene});
  const saved=await dispatch("load",{id});
  assert.equal(saved.source,"draft");
  assert.equal(saved.scene.name,"Test scene");
  const disk=JSON.parse(readFileSync(join(root,"drafts","project19__item2.scene.json"),"utf8"));
  assert.equal(disk.photo.src,"assets/item2.png");
  assert.ok(!disk.photo.src.startsWith("data:"));
  assert.equal(existsSync(join(root,"project18","media","item2.scene.json")),false);
  await assert.rejects(dispatch("save",{id:"../wrong",scene:saved.scene}),/Geçersiz hedef/);
  await dispatch("publish",{id});
  assert.ok(existsSync(join(root,"project19","media","item2.scene.json")));
  const command=readFileSync(spy,"utf8");
  assert.match(command,/project19\/media\/item2.scene.json/);
  assert.match(command,/tester@example.org:\/srv\/site\/item2.scene.json/);
  assert.ok(!command.includes("project18"));
 }finally{
  for(const [k,v]of Object.entries({EFEKT_STUDIO_WORKSPACE:old.workspace,EFEKT_STUDIO_PROJECTS_FILE:old.projects,EFEKT_STUDIO_DRAFTS_DIR:old.drafts,PATH:old.path}))
   if(v===undefined)delete process.env[k];else process.env[k]=v;
  rmSync(root,{recursive:true,force:true});
 }
});
