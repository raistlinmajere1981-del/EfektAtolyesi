import {readFile,writeFile,rename,mkdir,stat} from "node:fs/promises";
import {existsSync} from "node:fs";
import {dirname,resolve,join,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {randomUUID} from "node:crypto";
import {spawn,execFileSync} from "node:child_process";
import {importProject,exportProject,validateProject,MAX_FILE_BYTES} from "../src/model/project.mjs";
import {compileScene} from "../src/runtime/index.mjs";

const studioRoot=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const workspace=process.env.EFEKT_STUDIO_WORKSPACE ? resolve(process.env.EFEKT_STUDIO_WORKSPACE) : resolve(studioRoot,"..");
const registryFile=process.env.EFEKT_STUDIO_PROJECTS_FILE ? resolve(process.env.EFEKT_STUDIO_PROJECTS_FILE) : join(studioRoot,"config/projects.json");
const draftsRoot=process.env.EFEKT_STUDIO_DRAFTS_DIR ? resolve(process.env.EFEKT_STUDIO_DRAFTS_DIR) : join(studioRoot,".studio-drafts");
const within=(base,path)=>{const full=resolve(base,path);if(full!==base&&!full.startsWith(base+sep))throw Error("Proje yolu dışına çıkılamaz.");return full;};
const fileFor=(project,path)=>within(within(workspace,project.directory),path);
const idOf=(p,i)=>p.id+":"+i.id;
const safeId=(id)=>/^[a-z0-9_-]+:[a-z0-9_-]+$/.test(id);

async function projects(){
 const reg=JSON.parse(await readFile(registryFile,"utf8"));
 if(reg.version!==1||!Array.isArray(reg.projects))throw Error("Proje kaydı geçersiz.");
 return reg.projects;
}
async function selected(id) {
 if(!safeId(id))throw Error("Geçersiz hedef.");
 for(const project of await projects())for(const image of project.images??[])
   if(idOf(project,image)===id)return {project,image,id};
 throw Error("Kayıtlı görsel bulunamadı.");
}
function draftPath(id){if(!safeId(id))throw Error("Geçersiz hedef.");return join(draftsRoot,id.replace(":","__")+".scene.json");}
function checkScene(scene,im) {
 scene.photo={...scene.photo,src:im.photoRef,width:im.width,height:im.height};
 validateProject(scene);
 compileScene(scene);
 return scene;
}
async function saveAtomic(path,contents){
 await mkdir(dirname(path),{recursive:true});
 const temp=path+"."+randomUUID()+".tmp";
 try{await writeFile(temp,contents,{mode:0o600});await rename(temp,path);}
 finally{const {unlink}=await import("node:fs/promises");await unlink(temp).catch(()=>{});}
}
async function list(){
 return Promise.all((await projects()).map(async project=>{
 const images=await Promise.all((project.images??[]).map(async image=>{
 const id=idOf(project,image),photo=fileFor(project,image.photo),scene=fileFor(project,image.scene);
 return {id,name:image.name,available:existsSync(photo),hasDraft:existsSync(draftPath(id)),hasScene:existsSync(scene),canPublish:image.upload?.type!=="disabled"&&Boolean(image.upload),note:image.upload?.note??"",width:image.width,height:image.height};
 }));
 return {id:project.id,name:project.name,siteUrl:project.siteUrl,images};
 }));
}
async function load(id) {
 const {project,image}=await selected(id);
 const photoFile=fileFor(project,image.photo);
 const mime=photoFile.match(/\.(png|jpe?g|webp|avif)$/i)?.[1].toLowerCase();
 if(!mime)throw Error("Desteklenmeyen görsel.");
 const bytes=await readFile(photoFile);
 if(bytes.length>MAX_FILE_BYTES*0.7)throw Error("Fotoğraf önizleme sınırını aşıyor.");
 const preview="data:image/"+(mime==="jpg"?"jpeg":mime)+";base64,"+bytes.toString("base64");
 const sceneFile=existsSync(draftPath(id))?draftPath(id):fileFor(project,image.scene);
 let scene;
 if(existsSync(sceneFile)){
   scene=importProject(await readFile(sceneFile,"utf8"));
   if(scene.photo.width!==image.width||scene.photo.height!==image.height)throw Error("Sahne ile görsel boyutları uyuşmuyor.");
 } else {
   scene={format:"efekt-atolyesi",version:1,name:project.name+" · "+image.name,seed:id,zones:[],effects:[],
     photo:{src:image.photoRef,width:image.width,height:image.height,name:image.name,credit:""}};
 }
 checkScene(scene,image);
 scene.photo.src=preview;
 return {scene,source:existsSync(draftPath(id))?"draft":existsSync(fileFor(project,image.scene))?"installed":"new"};
}
async function save(id,input){
 const {image}=await selected(id);
 if(typeof input!=="object"||!input)throw Error("Sahne bulunamadı.");
 const scene=structuredClone(input);
 checkScene(scene,image);
 const contents=exportProject(scene);
 if(Buffer.byteLength(contents)>MAX_FILE_BYTES)throw Error("Sahne sınırı aşıldı.");
 await saveAtomic(draftPath(id),contents);
 return {ok:true,message:"Yerel taslak kaydedildi.",effectCount:scene.effects.length};
}
function execute(command,args,{input,env,cwd}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{cwd,env:env??process.env,stdio:["pipe","pipe","pipe"],shell:false});
  let output="",error="";
  child.stdout.on("data",b=>{output+=b.toString();if(output.length>80000)child.kill();});
  child.stderr.on("data",b=>{error+=b.toString();if(error.length>80000)child.kill();});
  child.on("error",reject);
  child.on("close",code=>code===0?resolve(output.trim()):reject(Error(error.trim()||("Komut başarısız: "+command+" "+code))));
  child.stdin.end(input??"");
 });
}
async function publish(id){
 const {project,image}=await selected(id);
 if(image.upload?.type==="disabled"||!image.upload)throw Error(image.upload?.note||"Bu görsel için yayın tanımlı değil.");
 const source=draftPath(id);
 if(!existsSync(source))throw Error("Önce taslağı kaydedin.");
 const scene=importProject(await readFile(source,"utf8"));
 checkScene(scene,image);
 const target=fileFor(project,image.scene);
 const contents=exportProject(scene);
 // Local source update is kept if the network fails, so retry does not lose work.
 await saveAtomic(target,contents);
 if(image.upload.type==="natro-ftp"){
   const credentialFile=join(workspace,"YardimciAsistan/config/credentials.local.json");
   const extractor=join(workspace,"YardimciAsistan/scripts/read-local-credentials.mjs");
   const data=execFileSync("node",[extractor,credentialFile,image.upload.credentialId,
     "ftpProtocol","ftpHost","ftpPort","ftpUser","ftpPassword","ftpRemoteRoot","ftpTlsMode"]);
   const fields=data.toString("utf8").split("\0");
   const [protocol,host,port,user,password,remoteRoot,tlsMode]=fields;
   if(!host||!user||!password)throw Error("Kayıtlı BlackSea FTP bağlantısı okunamadı.");
   const safePath=x=>/^[a-zA-Z0-9_./-]+$/.test(x)&&!x.includes("..");
   const destination=(remoteRoot||"/httpdocs").replace(/\/$/,"")+"/"+image.upload.remote;
   if(!safePath(destination)||!safePath(host)||!safePath(port||"21"))throw Error("Geçersiz FTP hedefi.");
   const secure=tlsMode==="required"||tlsMode==="insecure-ftps"
     ?"set ftp:ssl-force true; set ftp:ssl-protect-data true; ":"set ftp:ssl-allow false; ";
   const verify=tlsMode==="insecure-ftps"?"set ssl:verify-certificate false; ":"";
   const url=(protocol||"ftp")+"://"+host+":"+(port||"21");
   const cmd="set cmd:fail-exit yes; set net:max-retries 2; set net:timeout 20; "+
     secure+verify+"put "+target+" -o "+destination+"; bye";
   await execute("lftp",["-u",user+","+password,url,"-e",cmd]);
 } else if(image.upload.type==="ssh-rsync"){
   const host=image.upload.host,remote=image.upload.remote;
   if(!/^[\w.@-]+$/.test(host)||!/^\/[\w./-]+$/.test(remote)||remote.includes(".."))throw Error("Geçersiz SSH hedefi.");
   await execute("rsync",["-az","--chmod=F644","-e","ssh -o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=yes",target,host+":"+remote]);
 } else throw Error("Bilinmeyen yayın yöntemi.");
 if(image.publicSceneUrl) {
   const separator=image.publicSceneUrl.includes("?")?"&":"?";
   const remoteText=await execute("curl",["--fail","--silent","--show-error","--location","--connect-timeout","8","--max-time","18",
     image.publicSceneUrl+separator+"studio="+randomUUID()]);
   const remote=importProject(remoteText);
   if(exportProject(remote)!==contents)throw Error("Aktarım yapıldı ancak canlı sahne doğrulanamadı.");
 }
 return {ok:true,message:"Sahne yüklendi ve doğrulandı.",siteUrl:project.siteUrl};
}
export async function dispatch(action,args={}){
 if(action==="list")return list();
 if(action==="load")return load(args.id);
 if(action==="save")return save(args.id,args.scene);
 if(action==="publish")return publish(args.id);
 throw Error("Bilinmeyen işlem.");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let body="";
 process.stdin.setEncoding("utf8");
 for await(const chunk of process.stdin){body+=chunk;if(body.length>35*1024*1024)throw Error("İstek çok büyük.");}
 try{const result=await dispatch(process.argv[2],body?JSON.parse(body):{});process.stdout.write(JSON.stringify({ok:true,result}));}
 catch(error){process.stdout.write(JSON.stringify({ok:false,error:error.message}));process.exitCode=1;}
}
