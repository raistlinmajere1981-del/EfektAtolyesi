import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,statSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {siteSceneSource,BIRDESENGOR_SITE,SITE_SCENE} from '../scripts/birdesengor-site.mjs';

const studio=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const id='birdesengor:scene_v2';
async function invoke(action,args,drafts){
 const keys=['EFEKT_STUDIO_DRAFTS_DIR','EFEKT_STUDIO_SCENE_TARGETS_FILE','EFEKT_STUDIO_PROJECTS_FILE','EFEKT_STUDIO_WORKSPACE'];
 const old=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try{
  keys.forEach(key=>delete process.env[key]);process.env.EFEKT_STUDIO_DRAFTS_DIR=drafts;
  const {dispatch}=await import('../scripts/admin-studio.mjs?drafts='+encodeURIComponent(drafts));
  return await dispatch(action,args);
 }finally{for(const key of keys)if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}
}

test('installed target opens exact CURRENT site objects/anchors/photo and safely ignores obsolete drafts',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'effect-site-admin-'));
 try{
  const original=readFileSync(join(BIRDESENGOR_SITE,SITE_SCENE),'utf8');
  const canonical=JSON.parse(original);
  const opened=await invoke('load',{id},temp);
  assert.deepEqual(opened.scene,canonical);
  assert.ok(opened.scene.objects.some(object=>object.id==='vefk-stand'));
  assert.ok(!opened.scene.objects.some(object=>['quill','parchment'].includes(object.id)));
  assert.ok(!opened.scene.objects.flatMap(object=>object.anchors).some(anchor=>anchor.id==='quill.tip'));
  assert.equal(opened.scene.objects.length,14);
  assert.equal(opened.siteSource,true);
  assert.equal(opened.scene.previewImage,undefined);
  assert.equal(opened.previewImage,'data:image/webp;base64,'+readFileSync(join(BIRDESENGOR_SITE,'public/scene-assets/approved/room-natural-sash-2to1.webp')).toString('base64'));
  const file=join(temp,'birdesengor__scene_v2.scene.json');
  const stale=readFileSync(join(studio,'examples/birdesengor-v2.scene.json'),'utf8');
  writeFileSync(file,stale);
  const reset=await invoke('load',{id},temp);
  assert.equal(reset.source,'installed');assert.match(reset.message,/Eski taslak/);
  assert.deepEqual(reset.scene,canonical);assert.equal(readFileSync(file,'utf8'),stale);
  await assert.rejects(invoke('prepare',{id},temp),/kaydedin/);
  const edit=structuredClone(canonical);edit.effects[0].params.opacity=.71;
  await assert.rejects(invoke('save',{id,scene:edit},temp),/kaynağı değişmiş/);
  const result=await invoke('save',{id,scene:edit,sourceHash:opened.sourceHash},temp);
  assert.equal(result.readiness.ready,true);assert.equal(result.readiness.mountedCount,13);
  assert.equal(result.readiness.enabledCount,edit.effects.filter(effect=>effect.enabled).length);
  assert.deepEqual((await invoke('load',{id},temp)).scene,edit);
  // Never call installed-target prepare from this test: it can write the real
  // local site source. Isolated staging below covers the writer safely.
  await assert.rejects(invoke('publish',{id},temp),/yayınlanamaz/);
  const wrongPose=structuredClone(edit);wrongPose.objects[0].pose.x+=.001;
  await assert.rejects(invoke('save',{id,scene:wrongPose,sourceHash:opened.sourceHash},temp),/pose/);
  writeFileSync(file+'.source.sha256','outdated');
  assert.equal((await invoke('load',{id},temp)).source,'installed');
  assert.equal(readFileSync(join(BIRDESENGOR_SITE,SITE_SCENE),'utf8'),original);
 }finally{rmSync(temp,{recursive:true,force:true});}
});

test('isolated site staging validates slots, pose, current source hash and writes only the approved file',async()=>{
 const actual=await siteSceneSource().snapshot();
 const temp=mkdtempSync(join(tmpdir(),'effect-site-stage-'));
 try{
  for(const [file,bytes] of actual.entries){mkdirSync(dirname(join(temp,file)),{recursive:true});writeFileSync(join(temp,file),bytes);}
  const source=siteSceneSource(temp),state=await source.snapshot();
  const scene=structuredClone(state.scene);
  scene.name+=' · isolated staging test';
  // All nine allowlisted effect slots now mount through the canonical runtime.
  // The staged file is isolated: no test ever writes the real site source.
  assert.equal(source.readiness(scene,state).mountedCount,13);
  assert.equal(source.readiness(scene,state).ready,true);
  const extra=structuredClone(scene);extra.effects.push({...structuredClone(scene.effects[0]),id:'manually-added'});
  await assert.rejects(source.stage(extra,state.sourceHash),/Desteklenmeyen site efekt yuvası/);
  const unsupported=structuredClone(scene);unsupported.effects[0].type='invented';
  await assert.rejects(source.stage(unsupported,state.sourceHash),/type|türü/);
  const missing=structuredClone(scene);missing.effects.pop();
  await assert.rejects(source.stage(missing,state.sourceHash),/Eksik site efekt yuvası/);
  const target=structuredClone(scene);target.effects[0].target.objectId='camera';target.effects[0].target.anchorId=scene.objects.find(o=>o.id==='camera').anchors[0].id;
  await assert.rejects(source.stage(target,state.sourceHash),/Desteklenmeyen site efekt yuvası/);
  const pose=structuredClone(scene);pose.objects[0].pose.x+=.01;
  await assert.rejects(source.stage(pose,state.sourceHash),/pose/);
  const anchor=structuredClone(scene);anchor.objects[0].anchors[0].x+=.01;
  await assert.rejects(source.stage(anchor,state.sourceHash),/coordinates/);
  await assert.rejects(source.stage(scene,'other'),/kaynağı değişmiş/);
  const siteFile=join(temp,SITE_SCENE),original=readFileSync(siteFile,'utf8');
  const parallel=source.stage(scene,state.sourceHash);
  writeFileSync(siteFile,original+'\n');
  await assert.rejects(parallel,/hazırlık sırasında değişmiş/);
  assert.equal(readFileSync(siteFile,'utf8'),original+'\n','parallel source edit survives');
  writeFileSync(siteFile,original);
  const mode=statSync(join(temp,SITE_SCENE)).mode&0o777;
  const result=await source.stage(scene,state.sourceHash);assert.equal(result.changed,true);
  assert.deepEqual(JSON.parse(readFileSync(join(temp,SITE_SCENE),'utf8')),scene);
  assert.equal(statSync(join(temp,SITE_SCENE)).mode&0o777,mode);
  for(const [file,bytes] of actual.entries)if(file!==SITE_SCENE)assert.deepEqual(readFileSync(join(temp,file)),bytes);
  const before=statSync(join(temp,SITE_SCENE)).mtimeMs;
  assert.equal((await source.stage(scene,result.sourceHash)).changed,false);
  assert.equal(statSync(join(temp,SITE_SCENE)).mtimeMs,before);
  chmodSync(siteFile,0o644);
  const revision=await source.snapshot(),another=structuredClone(scene);another.name+=' · test';
  const written=await source.stage(another,revision.sourceHash);
  assert.equal(statSync(siteFile).mode&0o777,0o644,'atomic write preserves public readability despite umask');
  const manifest=join(temp,'src/scene/data/study.scene.json');writeFileSync(manifest,readFileSync(manifest,'utf8')+'\n');
  await assert.rejects(source.stage(another,written.sourceHash),/kaynağı değişmiş/);
  assert.equal(readdirSync(dirname(join(temp,SITE_SCENE))).some(file=>file.endsWith('.tmp')),false);
  // Missing/invalid owning source fails closed, never falls back to a fixture.
  writeFileSync(manifest,'{}');await assert.rejects(source.snapshot(),/identity mismatch/);
  writeFileSync(manifest,actual.entries.get('src/scene/data/study.scene.json'));
  writeFileSync(join(temp,'src/scene/SceneRoot.jsx'),actual.entries.get('src/scene/SceneRoot.jsx')+'\nfunction useObjectEffects() {}\n');
  const mountChanged=await source.snapshot();
  await assert.rejects(source.stage(another,mountChanged.sourceHash),/bağlama sözleşmesi doğrulanamadı/);
  // Restore the real reviewed mount, then prove a CSS host regression also
  // blocks preparation. This is isolated from the checked-out site.
  writeFileSync(join(temp,'src/scene/SceneRoot.jsx'),actual.entries.get('src/scene/SceneRoot.jsx'));
  const cssFile=join(temp,'src/scene/study-foundation.css');
  const originalCss=readFileSync(cssFile,'utf8');
  assert.match(originalCss,/\.study-effect-host \{\s*position: absolute;/);
  writeFileSync(cssFile,originalCss.replace(/(\.study-effect-host \{\s*)position: absolute;/,'$1position: fixed;'));
  const layoutDrift=await source.snapshot();
  assert.equal(layoutDrift.mounted.ready,false);
  await assert.rejects(source.stage(another,layoutDrift.sourceHash),/bağlama sözleşmesi doğrulanamadı/);
  writeFileSync(cssFile,originalCss);
  const rootFile=join(temp,'src/scene/SceneRoot.jsx');
  writeFileSync(rootFile,actual.entries.get('src/scene/SceneRoot.jsx').toString().replace('onClick={()=>pulse(object.id)}','onClick={()=>undefined}'));
  const disconnected=await source.snapshot();assert.equal(disconnected.mounted.ready,false);
  await assert.rejects(source.stage(another,disconnected.sourceHash),/bağlama sözleşmesi/);
  rmSync(join(temp,'src/effects/effectsAdapter.js'));
  await assert.rejects(source.snapshot(),/ENOENT/);
 }finally{rmSync(temp,{recursive:true,force:true});}
});


test('motion artwork identity is part of the verified mounted site contract',async()=>{
 const actual=await siteSceneSource().snapshot();
 const root=mkdtempSync(join(tmpdir(),'effect-site-motion-'));
 try{
  for(const [file,bytes] of actual.entries){mkdirSync(dirname(join(root,file)),{recursive:true});writeFileSync(join(root,file),bytes);}
  const file=join(root,'src/scene/SceneRoot.jsx');writeFileSync(file,readFileSync(file,'utf8').replace('data-effect-layer={layer.id}','data-effect-layer="wrong-layer"'));
  const source=siteSceneSource(root),state=await source.snapshot();
  assert.equal(source.readiness(state.scene,state).ready,false);
  assert.ok(source.readiness(state.scene,state).problems.some(message=>message.includes('Motion slot')));
 }finally{rmSync(root,{recursive:true,force:true});}
});
