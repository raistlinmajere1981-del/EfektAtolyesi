import {$,el,button,field,download,readFile} from './dom.mjs';
import {History} from './history.mjs';
import {validateProject,importProject,exportProject,MAX_FILE_BYTES} from '../model/project.mjs';
import {objectEffectRegistry,defaultObjectParams} from '../registry/effects.mjs';
import {anchorScenePoint,effectScenePoint} from '../runtime/object-scene.mjs';
import {bindObjectScene} from '../runtime/object-overlay.mjs';

let scene=null,objectId=null,effectId=null,anchorId=null,playing=true;
let previewHandle=null,previewFrame=null;
const objectElements=new Map(),markerElements=new Map();
const history=new History();
const embedded=new URLSearchParams(location.search).get('embedded')==='1';
const notify=(type,extra={})=>{if(embedded)window.parent.postMessage({type,...extra},'*');};
const changed=()=>notify('studio:dirty');
const status=(message,isError=false)=>{const node=$('#status');node.textContent=message;node.classList.toggle('error',isError);};
const error=e=>{const message=e?.message||String(e);status(message,true);};
const object=()=>scene?.objects.find(item=>item.id===objectId);
const effect=()=>scene?.effects.find(item=>item.id===effectId);
const anchor=()=>object()?.anchors.find(item=>item.id===anchorId);
const effectsForObject=()=>scene?.effects.filter(item=>item.target.objectId===objectId)??[];
const uid=()=>crypto.randomUUID();
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const round=value=>Math.round(value*1e4)/1e4;
const isObjectScene=value=>value?.version===2&&value?.kind==='objectScene';

function uniqueEffectId(type){
  for(let i=0;i<100;i++){
    const id=`${type}-${uid().slice(0,8)}`;
    if(!scene.objects.some(item=>item.id===id)&&!scene.effects.some(item=>item.id===id))return id;
  }
  throw new Error('Benzersiz efekt kimliği üretilemedi.');
}
function selectObject(id){
  objectId=id;
  const target=object();
  anchorId=target?.anchors[0]?.id??null;
  effectId=scene.effects.find(item=>item.target.objectId===id)?.id??null;
  draw();
}
function selectEffect(id){
  const next=scene.effects.find(item=>item.id===id);
  if(!next)return;
  effectId=next.id;objectId=next.target.objectId;anchorId=next.target.anchorId;
  draw();
}
function selectForDrag(next){
  effectId=next.id;objectId=next.target.objectId;anchorId=next.target.anchorId;
  renderLists();renderObjectInspector();renderEffectInspector();renderStageSelection();
}
function mutate(action,key=null){
  if(!scene)return false;
  try{
    const next=structuredClone(scene);
    action(next);
    validateProject(next);
    if(!isObjectScene(next))throw new Error('Yalnız v2 objectScene düzenlenebilir.');
    history.record(scene,key);
    scene=next;
    draw();
    status(embedded?'Değişiklik yapıldı.':'Değişiklik uygulandı. JSON dışa aktararak kaydedin.');
    changed();
    return true;
  }catch(e){error(e);draw();return false;}
}
function numberInput(label,value,change,attrs={}){
  const input=el('input',{type:'number',value,onchange:event=>change(event.target.valueAsNumber),...attrs});
  return field(label,input);
}
function checkField(label,checked,change){
  return field(label,el('input',{type:'checkbox',checked,onchange:event=>change(event.target.checked)}));
}

function renderLists(){
  if(!scene)return;
  $('#object-count').textContent=String(scene.objects.length);
  const rows=scene.objects.map(item=>{
    const count=scene.effects.filter(entry=>entry.target.objectId===item.id).length;
    return el('div',{class:`scene-list-row ${item.id===objectId?'selected':''}`},
      button(item.name,()=>selectObject(item.id),{class:'scene-row-select'}),
      el('span',{class:'scene-row-meta',text:`${count} efek`}),
      el('label',{class:'scene-row-check',title:`${item.name} görünür`},
        el('input',{type:'checkbox',checked:item.visible,'aria-label':`${item.name} görünür`,onchange:event=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).visible=event.target.checked;})}))
    );
  });
  $('#object-list').replaceChildren(...(rows.length?rows:[el('p',{class:'scene-empty',text:'Nesne yok.'})]));
  const effects=effectsForObject();
  $('#effect-count').textContent=String(effects.length);
  const effectRows=effects.map(item=>el('div',{class:`scene-list-row ${item.id===effectId?'selected':''}`},
    button(`${objectEffectRegistry[item.type].label} · ${item.target.anchorId}`,()=>selectEffect(item.id),{class:'scene-row-select'}),
    el('label',{class:'scene-row-check',title:`${objectEffectRegistry[item.type].label} etkin`},
      el('input',{type:'checkbox',checked:item.enabled,'aria-label':`${objectEffectRegistry[item.type].label} etkin`,onchange:event=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).enabled=event.target.checked;})}))
  ));
  $('#effect-list').replaceChildren(...(effectRows.length?effectRows:[el('p',{class:'scene-empty',text:'Bu nesnede efekt yok.'})]));
  $('#add-effect').disabled=!object()?.anchors.length;
}
function renderObjectInspector(){
  const host=$('#object-inspector');const item=object();
  host.replaceChildren(el('h2',{text:'Nesne'}));
  if(!item){host.append(el('p',{class:'scene-empty',text:'Bir nesne seçin.'}));return;}
  host.append(
    field('Nesne adı',el('input',{value:item.name,maxlength:160,onchange:event=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).name=event.target.value;},`object:${item.id}:name`)})),
    checkField('Görünür',item.visible,value=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).visible=value;},`object:${item.id}:visible`)),
    el('h3',{text:'Yerleşim (sahne normali)'}),
    numberInput('X',item.pose.x,value=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).pose.x=value;},`object:${item.id}:pose-x`),{min:0,max:1,step:.001}),
    numberInput('Y',item.pose.y,value=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).pose.y=value;},`object:${item.id}:pose-y`),{min:0,max:1,step:.001}),
    numberInput('Genişlik',item.pose.width,value=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).pose.width=value;},`object:${item.id}:pose-w`),{min:.001,max:1,step:.001}),
    numberInput('Yükseklik',item.pose.height,value=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).pose.height=value;},`object:${item.id}:pose-h`),{min:.001,max:1,step:.001}),
    numberInput('Dönüş (derece)',item.pose.rotation,value=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).pose.rotation=value;},`object:${item.id}:rotation`),{min:-360,max:360,step:1}),
    numberInput('Derinlik',item.pose.depth,value=>mutate(s=>{s.objects.find(entry=>entry.id===item.id).pose.depth=value;},`object:${item.id}:depth`),{min:-100,max:100,step:1})
  );
  if(!item.anchors.length){host.append(el('p',{class:'scene-empty',text:'Bu nesnede adlandırılmış bağlantı yok.'}));return;}
  const select=el('select',{'aria-label':'Adlandırılmış bağlantı noktası',onchange:event=>{anchorId=event.target.value;draw();}},
    ...item.anchors.map(entry=>el('option',{value:entry.id,text:entry.id,selected:entry.id===anchorId})));
  host.append(el('h3',{text:'Adlandırılmış bağlantı'}),field('Bağlantı noktası',select));
  const current=anchor();
  if(current){
    host.append(
      numberInput('Bağlantı X',current.x,value=>mutate(s=>{const target=s.objects.find(entry=>entry.id===item.id);target.anchors.find(entry=>entry.id===anchorId).x=value;},`anchor:${item.id}:${anchorId}:x`),{min:0,max:1,step:.001}),
      numberInput('Bağlantı Y',current.y,value=>mutate(s=>{const target=s.objects.find(entry=>entry.id===item.id);target.anchors.find(entry=>entry.id===anchorId).y=value;},`anchor:${item.id}:${anchorId}:y`),{min:0,max:1,step:.001})
    );
    const point=anchorScenePoint(item,current.id);
    const px=Math.round(point.x*scene.viewport.width),py=Math.round(point.y*scene.viewport.height);
    host.append(el('p',{class:'scene-location'},el('strong',{text:'Görsel konum'}),el('br'),`Sahne: ${point.x.toFixed(4)} × ${point.y.toFixed(4)}`,el('br'),`${px} × ${py} px (${scene.viewport.width} × ${scene.viewport.height})`));
  }
}
function renderEffectInspector(){
  const host=$('#effect-inspector');const item=effect();
  host.replaceChildren(el('h2',{text:'Efekt'}));
  if(!item){host.append(el('p',{class:'scene-empty',text:'Bir efekt seçin veya ekleyin.'}));return;}
  const owner=object();
  const anchorSelect=el('select',{'aria-label':'Efekt hedef bağlantısı',onchange:event=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).target.anchorId=event.target.value;},`effect:${item.id}:anchor`)},
    ...owner.anchors.map(entry=>el('option',{value:entry.id,text:entry.id,selected:entry.id===item.target.anchorId})));
  const typeSelect=el('select',{'aria-label':'Efekt türü',onchange:event=>mutate(s=>{const target=s.effects.find(entry=>entry.id===item.id);target.type=event.target.value;target.params=defaultObjectParams(target.type);},`effect:${item.id}:type`)},
    ...Object.entries(objectEffectRegistry).map(([type,info])=>el('option',{value:type,text:info.label,selected:type===item.type})));
  host.append(
    field('Tür',typeSelect),
    field('Hedef bağlantı',anchorSelect),
    numberInput('Kaydırma X',item.target.offset.x,value=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).target.offset.x=value;},`effect:${item.id}:offset-x`),{id:'effect-offset-x',min:-5,max:5,step:.01}),
    numberInput('Kaydırma Y',item.target.offset.y,value=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).target.offset.y=value;},`effect:${item.id}:offset-y`),{id:'effect-offset-y',min:-5,max:5,step:.01}),
    numberInput('Ölçek',item.target.scale,value=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).target.scale=value;},`effect:${item.id}:scale`),{min:.01,max:10,step:.01}),
    numberInput('Efekt derinliği',item.target.depth,value=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).target.depth=value;},`effect:${item.id}:depth`),{min:-100,max:100,step:1}),
    field('Efekt tohumu',el('input',{value:item.seed,maxlength:120,onchange:event=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).seed=event.target.value;},`effect:${item.id}:seed`)})),
    checkField('Etkin',item.enabled,value=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).enabled=value;},`effect:${item.id}:enabled`)),
    el('p',{class:'scene-location'},el('strong',{text:'Hedef'}),el('br'),`${owner.name} → ${item.target.anchorId}`,el('br'),`Kaydırma nesne genişliği/yüksekliğine göre normalleştirilir.`)
  );
  for(const control of objectEffectRegistry[item.type].controls){
    const input=el('input',{type:'number',value:item.params[control.key],min:control.min,max:control.max,step:control.step,'aria-label':control.label,
      onchange:event=>mutate(s=>{s.effects.find(entry=>entry.id===item.id).params[control.key]=event.target.valueAsNumber;},`param:${item.id}:${control.key}`)});
    host.append(el('div',{class:'scene-param'},el('div',{class:'scene-param-line'},el('label',{text:control.label}),input)));
  }
  host.append(el('div',{class:'scene-button-row'},
    button('Kopyala',()=>mutate(s=>{const copy=structuredClone(item);copy.id=uniqueEffectId(copy.type);copy.seed=`${copy.seed}-copy`;s.effects.push(copy);effectId=copy.id;})),
    button('Sil',()=>mutate(s=>{s.effects=s.effects.filter(entry=>entry.id!==item.id);effectId=null;}),{class:'scene-danger'})
  ));
}

function buildObject(item){
  const node=el('div',{
    class:`scene-object ${item.id===objectId?'selected':''} ${item.visible?'':'is-hidden'}`,
    'data-scene-object':item.id,'data-scene-object-id':item.id,'data-object-id':item.id,'data-scene-id':scene.sceneId,
    role:'button',tabindex:0,'aria-label':`${item.name} nesnesi`,
    title:`${item.name} · ${item.id}`
  });
  Object.assign(node.style,{
    left:`${item.pose.x*100}%`,top:`${item.pose.y*100}%`,width:`${item.pose.width*100}%`,height:`${item.pose.height*100}%`,
    transform:`rotate(${item.pose.rotation}deg)`,zIndex:String(100+Math.round(item.pose.depth))
  });
  node.append(el('span',{class:'scene-object-label',text:item.name}));
  for(const point of item.anchors){
    const dot=el('span',{class:`scene-object-anchor ${point.id===anchorId?'is-selected':''}`,'data-anchor-id':point.id,'aria-hidden':'true'});
    dot.style.left=`${point.x*100}%`;dot.style.top=`${point.y*100}%`;node.append(dot);
  }
  node.addEventListener('click',()=>selectObject(item.id));
  node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectObject(item.id);}});
  return node;
}
function renderMarkers(){
  $('#scene-markers').replaceChildren();
  markerElements.clear();
  if(!scene)return;
  scene.effects.forEach((item,index)=>{
    const owner=scene.objects.find(entry=>entry.id===item.target.objectId);
    if(!owner)return;
    const point=effectScenePoint(owner,item);
    const marker=el('button',{type:'button',class:`scene-marker ${item.id===effectId?'is-selected':''} ${item.enabled&&owner.visible?'':'is-off'}`,text:String(index+1),
      title:`${objectEffectRegistry[item.type].label} · ${owner.name} → ${item.target.anchorId}`,'aria-label':`${objectEffectRegistry[item.type].label} hedefini sürükle`});
    marker.dataset.effectId=item.id;
    Object.assign(marker.style,{left:`${point.x*100}%`,top:`${point.y*100}%`});
    marker.addEventListener('pointerdown',event=>beginDrag(event,item));
    marker.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight'&&event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
      event.preventDefault();
      const step=event.shiftKey?.05:.01;
      mutate(s=>{const target=s.effects.find(entry=>entry.id===item.id);target.target.offset.x=round(clamp(target.target.offset.x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),-5,5));target.target.offset.y=round(clamp(target.target.offset.y+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0),-5,5));},`effect:${item.id}:offset`);
    });
    markerElements.set(item.id,marker);
    $('#scene-markers').append(marker);
  });
}
function renderStageSelection(){
  for(const [id,node] of objectElements)node.classList.toggle('selected',id===objectId);
  for(const [id,node] of markerElements)node.classList.toggle('is-selected',id===effectId);
}
function bindPreview(){
  previewHandle?.destroy();previewHandle=null;
  if(!scene)return;
  try{
    previewHandle=bindObjectScene(scene,id=>objectElements.get(id),{expectedSceneId:scene.sceneId});
    if(!playing)previewHandle.setPaused(true);
  }catch(e){previewHandle=null;error(e);}
}
function renderStage(){
  previewHandle?.destroy();previewHandle=null;
  const host=$('#scene-objects');host.replaceChildren();objectElements.clear();
  if(!scene)return;
  for(const item of scene.objects){
    const node=buildObject(item);objectElements.set(item.id,node);host.append(node);
  }
  bindPreview();
  renderMarkers();
}
function draw(){
  if(!scene)return;
  if(!object())objectId=scene.objects[0]?.id??null;
  const owner=object();
  if(!owner)objectId=scene.objects[0]?.id??null;
  if(anchorId&&!anchor())anchorId=owner?.anchors[0]?.id??null;
  if(!anchorId)anchorId=owner?.anchors[0]?.id??null;
  if(effectId&&!effectsForObject().some(item=>item.id===effectId))effectId=null;
  if(!effectId)effectId=effectsForObject()[0]?.id??null;
  if(effect()&&anchorId!==effect().target.anchorId)anchorId=effect().target.anchorId;
  $('#scene-name').value=scene.name;
  $('#scene-id-line').textContent=`sceneId: ${scene.sceneId} · ${scene.viewport.width} × ${scene.viewport.height}`;
  $('#scene-seed').value=scene.seed;
  renderLists();
  renderObjectInspector();
  renderEffectInspector();
  renderStage();
  updateHistoryButtons();
}
function updateHistoryButtons(){
  $('#undo').disabled=!history.past.length;
  $('#redo').disabled=!history.future.length;
}
let drag=null;
function beginDrag(event,item){
  if(event.button!==undefined&&event.button!==0)return;
  event.preventDefault();event.stopPropagation();
  selectForDrag(item);
  const owner=object(),element=objectElements.get(owner.id),marker=markerElements.get(item.id),rect=element?.getBoundingClientRect();
  if(!rect)return;
  drag={id:item.id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,
    offsetX:item.target.offset.x,offsetY:item.target.offset.y,
    width:Math.max(1,rect.width),height:Math.max(1,rect.height),before:structuredClone(scene),changed:false,marker};
  marker?.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove',moveDrag);
  window.addEventListener('pointerup',endDrag);
  window.addEventListener('pointercancel',endDrag);
}
function moveDrag(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  const x=round(clamp(drag.offsetX+(event.clientX-drag.startX)/drag.width,-5,5));
  const y=round(clamp(drag.offsetY+(event.clientY-drag.startY)/drag.height,-5,5));
  const current=effect();
  if(!current||(current.target.offset.x===x&&current.target.offset.y===y))return;
  const next=structuredClone(scene);
  const target=next.effects.find(entry=>entry.id===drag.id);
  target.target.offset={x,y};
  try{validateProject(next);}catch(e){error(e);return;}
  scene=next;drag.changed=true;
  const owner=next.objects.find(entry=>entry.target?.id===drag.id)??next.objects.find(entry=>entry.id===target.target.objectId);
  const point=effectScenePoint(owner,target);
  drag.marker.style.left=`${point.x*100}%`;drag.marker.style.top=`${point.y*100}%`;
  const ox=$('#effect-offset-x'),oy=$('#effect-offset-y');
  if(ox)ox.value=String(x);if(oy)oy.value=String(y);
  status(`Kaydırma: ${x.toFixed(2)} / ${y.toFixed(2)}`);
  if(!previewFrame)previewFrame=requestAnimationFrame(()=>{previewFrame=null;bindPreview();});
}
function endDrag(event){
  if(!drag||event.pointerId!==drag.pointerId)return;
  window.removeEventListener('pointermove',moveDrag);
  window.removeEventListener('pointerup',endDrag);
  window.removeEventListener('pointercancel',endDrag);
  if(drag.changed){history.record(drag.before);changed();status('Efekt hedef kaydırması güncellendi.');}
  drag=null;
  draw();
}
function install(next,message,{resetHistory=false}={}){
  validateProject(next);
  if(!isObjectScene(next))throw new Error('Bu düzenleyici yalnız version 2 objectScene sahnelerini açar.');
  if(scene)history.record(scene);
  scene=next;
  if(resetHistory){history.past.length=0;history.future.length=0;}
  objectId=scene.objects[0]?.id??null;
  anchorId=scene.objects[0]?.anchors[0]?.id??null;
  effectId=scene.effects.find(item=>item.target.objectId===objectId)?.id??null;
  draw();
  status(message);
}
function loadText(text,message,options){
  const next=importProject(text);
  if(!isObjectScene(next))throw new Error('Bu düzenleyici yalnız version 2 objectScene sahnelerini açar; v1 fotoğraf dosyası kabul edilmez.');
  install(next,message,options);
}
function travel(direction){
  if(!scene)return;
  const next=history[direction](scene);
  scene=next;
  draw();
  status(direction==='undo'?'Geri alındı.':'Yinelendi.');
  changed();
}

for(const [type,info]of Object.entries(objectEffectRegistry)){
  $('#add-effect-type').append(el('option',{value:type,text:info.label}));
}
$('#add-effect').onclick=()=>{
  const owner=object(),point=anchor();
  if(!owner||!point)return;
  const type=$('#add-effect-type').value;
  mutate(s=>{
    const id=uniqueEffectId(type);
    s.effects.push({id,type,target:{kind:'sceneObject',objectId:owner.id,anchorId:point.id,offset:{x:0,y:0},scale:1,depth:0},enabled:true,seed:`${type}-${uid().slice(0,8)}`,params:defaultObjectParams(type)});
    effectId=id;
  });
};
$('#scene-name').onchange=event=>mutate(s=>{s.name=event.target.value;});
$('#scene-seed').onchange=event=>mutate(s=>{s.seed=event.target.value;});
$('#undo').onclick=()=>travel('undo');
$('#redo').onclick=()=>travel('redo');
$('#play').onclick=()=>{
  playing=!playing;
  previewHandle?.setPaused(!playing);
  $('#play').textContent=playing?'Ⅱ Duraklat':'▶ Oynat';
  $('#play').setAttribute('aria-pressed',String(playing));
  status(playing?'Önizleme oynatılıyor.':'Önizleme duraklatıldı; sahne değişiklikleri yine doğrulanır.');
};
$('#export').onclick=()=>{
  try{
    if(!scene)throw new Error('Önce sahne yükleyin.');
    const text=exportProject(scene);
    if(new TextEncoder().encode(text).length>MAX_FILE_BYTES)throw new Error('Dışa aktarım 25 MB sınırını aşıyor.');
    download(text,'birdesengor-study-v2.scene.json');
    status('V2 JSON indirildi.');
  }catch(e){error(e);}
};
$('#open-project').onclick=()=>$('#project-file').click();
$('#project-file').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>MAX_FILE_BYTES)throw new Error('Dosya 25 MB sınırını aşıyor.');
    loadText(await readFile(file),'V2 proje açıldı.');
  }catch(e){error(e);}finally{event.target.value='';}
};
$('#reset').onclick=async()=>{
  try{
    const response=await fetch('examples/birdesengor-v2.scene.json');
    if(!response.ok)throw new Error('Yerel V2 fikstürü okunamadı.');
    loadText(await response.text(),'Yerel V2 fikstürü yüklendi.');
  }catch(e){error(e);}
};
document.addEventListener('keydown',event=>{
  if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='z'||event.target.matches('input,select,textarea'))return;
  event.preventDefault();travel(event.shiftKey?'redo':'undo');
});
setInterval(()=>{
  const info=previewHandle?.inspect();
  const overlays=info?.overlays??[];
  const running=overlays.some(item=>item.running);
  const frames=overlays.reduce((sum,item)=>sum+item.frames,0);
  const pixels=overlays.reduce((sum,item)=>sum+item.pixelCount,0);
  $('#preview-status').textContent=!scene?'Sahne yok':info?.unresolved?.length?`Eksik nesne: ${info.unresolved.join(', ')}`:`${running?'Çalışıyor':'Duraklatıldı'} · ${frames} kare · ${Math.round(pixels/1000)}k piksel`;
},600);

if(embedded){
  document.body.classList.add('embedded');
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||!event.data||typeof event.data!=='object')return;
    if(event.data.type==='studio:hello'){notify('studio:ready');return;}
    if(event.data.type==='studio:load'){
      try{
        loadText(JSON.stringify(event.data.scene),'Sahne hazır.',{resetHistory:true});
        notify('studio:loaded',{requestId:event.data.requestId});
      }catch(e){error(e);notify('studio:error',{message:e.message||String(e),requestId:event.data.requestId});}
    }
    if(event.data.type==='studio:get'){
      try{notify('studio:data',{requestId:event.data.requestId,scene:structuredClone(scene)});}
      catch(e){notify('studio:error',{requestId:event.data.requestId,message:e.message||String(e)});}
    }
  });
  notify('studio:ready');
}else{
  (async()=>{
    try{
      const response=await fetch('examples/birdesengor-v2.scene.json');
      if(!response.ok)throw new Error('Yerel V2 fikstürü okunamadı.');
      loadText(await response.text(),'Yerel V2 fikstürü yüklendi. Yerel sözleşme önizlemesidir; gerçek V2 bağlantısı değildir.');
    }catch(e){error(e);}
  })();
}

// Small read-only surface for local browser smoke tests; never part of the JSON.
window.__sceneEditor={
  getScene:()=>scene?structuredClone(scene):null,
  inspect:()=>previewHandle?.inspect()??null,
  selectObject,
  selectEffect,
};
