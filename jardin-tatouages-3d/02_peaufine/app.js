import * as THREE from 'three';
import { artworks as initialArtworks } from '../assets/gallery.js';
import { wixArchiveArtworks } from '../assets/wix_2025_2026.js';

// === THREE.JS — Melisa Fortin, galerie spatiale (étape 2) ===
// Fonctionne sans serveur applicatif et sans clé API. Les images publiques restent hébergées sur Wix.
// Les photographies ne sont chargées qu'à proximité du visiteur (streaming spatial simple).
const $ = (s) => document.querySelector(s);
const canvas = $('#world');
const isTouch = matchMedia('(pointer: coarse)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#091b23');
scene.fog = new THREE.FogExp2('#18312f', 0.0045);
const camera = new THREE.PerspectiveCamera(isTouch ? 74 : 67, innerWidth/innerHeight, 0.1, 760);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.3 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = false;
const hemi = new THREE.HemisphereLight(0xc9e3d5, 0x303d36, 2.2);scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffddab, 2.45);sun.position.set(45,75,-60);scene.add(sun);
const blue = new THREE.DirectionalLight(0x83b9a7, .75);blue.position.set(-60,24,70);scene.add(blue);
const clock = new THREE.Clock();
const UP = new THREE.Vector3(0,1,0);
const v3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const palette = { forest: '#638a68', garden: '#8b9b68', night: '#575a78' };
const biomes = [
  {id:'forest',name:'FORÊT DES ENCRES',x:0,z:0,color:'#6a9d7d'},
  {id:'garden',name:'JARDIN BOTANIQUE',x:160,z:65,color:'#c2ab70'},
  {id:'night',name:'CRÉPUSCULE MYSTIQUE',x:-160,z:65,color:'#b3a3d3'}
];
// Keep the verified art labels; new Wix media are included but marked as unverified.
const baseWorks=[...initialArtworks,...wixArchiveArtworks];
function mergeCatalog(extra=[]){
 const seen=new Set();return [...baseWorks,...extra].filter(w=>{
   const key=(w.image||'').split('/v1/')[0].toLowerCase();
   if(!key||seen.has(key))return false;seen.add(key);return true;
 });
}
let works=mergeCatalog();
let positions=[];
let yaw=0, pitch=0, locked=false, active=false;
let keys={};
let camX=0,camZ=36, bob=0, mobileF=0,mobileR=0;
let interactionArt=null;
let toastTimer=0;
const activeCards=new Map();
const ray=new THREE.Raycaster();
const textureLoader=new THREE.TextureLoader();textureLoader.setCrossOrigin('anonymous');
const placeholderTexture=createPlaceholder();
const reusableGeo={panel:new THREE.PlaneGeometry(3.4,4.25),frame:new THREE.BoxGeometry(3.85,4.72,.22),post:new THREE.CylinderGeometry(.09,.13,2.3,7),base:new THREE.CylinderGeometry(.95,1.1,.24,10)};
const matFrame=new THREE.MeshStandardMaterial({color:0x998363,metalness:.48,roughness:.42});
const matPost=new THREE.MeshStandardMaterial({color:0x3e4941,metalness:.3,roughness:.6});
const matBase=new THREE.MeshStandardMaterial({color:0x41554c,roughness:.85});
const textureCache=new Map(); // entries released as visitor moves; never fetch all ~1000 at once

function rng(seed=312031){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}const rand=rng();
const terrain=(x,z)=> .48*Math.sin(x*.026)*Math.cos(z*.020)+.26*Math.sin(z*.049+x*.018);
function biomeAt(x,z){let best=biomes[0],d=Infinity;for(const b of biomes){const v=(x-b.x)**2+(z-b.z)**2;if(v<d){d=v;best=b}}return best;}
function addSky(){
  const geo=new THREE.SphereGeometry(650,40,24);
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{t:{value:0}},vertexShader:`varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vPos; void main(){float h=normalize(vPos).y;vec3 top=vec3(.023,.063,.110);vec3 horizon=vec3(.22,.34,.32);vec3 glow=vec3(.49,.36,.27);vec3 col=mix(horizon,top,smoothstep(-.20,.68,h));col=mix(glow,col,smoothstep(-.22,.19,h));gl_FragColor=vec4(col,1.);}`});
  scene.add(new THREE.Mesh(geo,mat));
  const starPositions=[];for(let i=0;i<420;i++){const a=rand()*Math.PI*2,phi=.12+rand()*Math.PI*.48,rr=505;starPositions.push(Math.cos(a)*Math.cos(phi)*rr,Math.sin(phi)*rr,Math.sin(a)*Math.cos(phi)*rr)}
  const starsG=new THREE.BufferGeometry();starsG.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));const stars=new THREE.Points(starsG,new THREE.PointsMaterial({color:0xdce7c6,size:1.9,sizeAttenuation:false,transparent:true,opacity:.62,depthWrite:false}));scene.add(stars);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(18,32,20),new THREE.MeshBasicMaterial({color:0xf2e7c3}));moon.position.set(-230,180,-400);scene.add(moon);
}
function makeGround(){
  const seg=150,size=820;const geo=new THREE.PlaneGeometry(size,size,seg,seg);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position, colors=[];const c=new THREE.Color();
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,terrain(x,z));const b=biomeAt(x,z);c.set(palette[b.id]);const d=Math.sin(x*.13)*Math.sin(z*.19)*.043;c.offsetHSL(0,0,d);colors.push(c.r,c.g,c.b)}
  pos.needsUpdate=true;geo.computeVertexNormals();geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  scene.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0})));
}
function placeInstanced(geometry,material,count,positionFn){const m=new THREE.InstancedMesh(geometry,material,count);const dummy=new THREE.Object3D();for(let i=0;i<count;i++){const p=positionFn(i);dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx||1,p.sy||1,p.sz||1);dummy.rotation.set(0,p.rot||0,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)}m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;scene.add(m);return m}
function trees(){
  const trunks=new THREE.CylinderGeometry(.17,.36,1,7);trunks.translate(0,.5,0);
  const crowns=new THREE.ConeGeometry(1.7,5,8);crowns.translate(0,2.55,0);
  const treePositions=[];for(let k=0;k<3;k++){const b=biomes[k];const n=k===0?360: k===1?220:300;for(let i=0;i<n;i++){
    const a=rand()*6.283, r=27+Math.sqrt(rand())*165;
    const x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;
    if(Math.abs(x)<7&&z<40&&z>-70)continue;
    if(Math.abs(x-(b.x+20))<5&&Math.abs(z-(b.z+20))<5)continue;
    treePositions.push({x,y:terrain(x,z),z,sx: .7+rand()*.72,sy:5+rand()*5,sz:.7+rand()*.72,rot:rand()*6.28});
  }}
  const tmat=new THREE.MeshStandardMaterial({color:0x4b4437,roughness:1});
  placeInstanced(trunks,tmat,treePositions.length,i=>({...treePositions[i],sx:treePositions[i].sx,sy:treePositions[i].sy,sz:treePositions[i].sz}));
  const cmat=new THREE.MeshStandardMaterial({color:0x245a47,roughness:1,flatShading:true});
  placeInstanced(crowns,cmat,treePositions.length,i=>{const p=treePositions[i];return {x:p.x,y:p.y+p.sy*.54,z:p.z,sx:p.sx*2.3,sy:p.sy*.48,sz:p.sz*2.3,rot:p.rot}});
  // Flower meadow: one draw call per palette, not thousands of individual meshes.
  const flowerGeo=new THREE.IcosahedronGeometry(.12,0);
  const paletteFlowers=[0xe2c48d,0xe7d9ca,0x9fb2c6,0xe3aba3];
  for(let colorIndex=0;colorIndex<4;colorIndex++){
    const floral=[];for(let i=0;i<390;i++){const b=biomes[(i+colorIndex)%3],a=rand()*6.28,r=15+Math.sqrt(rand())*130,x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;
      floral.push({x,y:terrain(x,z)+.20+rand()*.24,z,sx:.8+rand(),sy:1+rand(),sz:1})}
    placeInstanced(flowerGeo,new THREE.MeshStandardMaterial({color:paletteFlowers[colorIndex],emissive:paletteFlowers[colorIndex],emissiveIntensity:.18}),floral.length,i=>floral[i]);
  }
  const blades=new THREE.ConeGeometry(.10,1.0,3);blades.translate(0,.4,0);
  const grass=[];for(let i=0;i<1300;i++){const b=biomes[i%3],a=rand()*6.28,r=10+Math.sqrt(rand())*145,x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;grass.push({x,y:terrain(x,z),z,sx:.4+rand(),sy:.45+rand()*.8,sz:1,rot:rand()*6.28})}
  placeInstanced(blades,new THREE.MeshStandardMaterial({color:0x739a6f,side:THREE.DoubleSide,roughness:1}),grass.length,i=>grass[i]);
}
function createPlaceholder(){const c=document.createElement('canvas');c.width=512;c.height=640;const p=c.getContext('2d');const grad=p.createLinearGradient(0,0,512,640);grad.addColorStop(0,'#345c52');grad.addColorStop(1,'#122a29');p.fillStyle=grad;p.fillRect(0,0,512,640);p.strokeStyle='#c9b788';p.lineWidth=2;p.strokeRect(28,28,456,584);p.font='70px Georgia';p.textAlign='center';p.fillStyle='#d8c18e';p.fillText('✺',256,260);p.font='23px Georgia';p.fillStyle='#eee5ce';p.fillText('MELISA FORTIN',256,334);p.font='18px sans-serif';p.fillStyle='#b6c5bb';p.fillText('ARCHIVES DES TATOUAGES',256,368);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
function signCanvas(text){const c=document.createElement('canvas');c.width=1024;c.height=270;const ctx=c.getContext('2d');ctx.fillStyle='#122921';ctx.fillRect(0,0,1024,270);ctx.strokeStyle='#b8ad7b';ctx.lineWidth=6;ctx.strokeRect(14,14,996,242);ctx.font='46px Georgia';ctx.fillStyle='#dec9a5';ctx.textAlign='center';ctx.fillText(text,512,155);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
function landmarks(){
  const ringMat=new THREE.MeshStandardMaterial({color:0xa08b66,metalness:.22,roughness:.75});
  for(const b of biomes){
    const ge=new THREE.TorusGeometry(6.0,.20,8,70);const hoop=new THREE.Mesh(ge,ringMat);hoop.position.set(b.x,7.0+terrain(b.x,b.z),b.z);scene.add(hoop);
    const baseG=new THREE.CylinderGeometry(.56,.7,7,10);
    for(const xx of [-6,6]){const post=new THREE.Mesh(baseG,new THREE.MeshStandardMaterial({color:0x394e45,roughness:.9}));post.position.set(b.x+xx,3.5+terrain(b.x+xx,b.z),b.z);scene.add(post)}
    const label=new THREE.Mesh(new THREE.PlaneGeometry(9,2.3),new THREE.MeshBasicMaterial({map:signCanvas(b.name),side:THREE.DoubleSide}));label.position.set(b.x,11.7+terrain(b.x,b.z),b.z);scene.add(label);
    // Curving illuminated trail is a geometry, not a static image.
    const pts=[];for(let i=0;i<=160;i++){const t=i/160*Math.PI*7,r=8+i/160*130,x=b.x+Math.cos(t)*r,z=b.z+Math.sin(t)*r;pts.push(v3(x,terrain(x,z)+.08,z))}
    const curve=new THREE.CatmullRomCurve3(pts);const track=new THREE.Mesh(new THREE.TubeGeometry(curve,520,.055,3,false),new THREE.MeshBasicMaterial({color:b.color,transparent:true,opacity:.64}));scene.add(track);
  }
  // Water garden pond, with offset glints.
  const pool=new THREE.Mesh(new THREE.CircleGeometry(15,64),new THREE.MeshStandardMaterial({color:0x447b82,metalness:.65,roughness:.23,transparent:true,opacity:.85,side:THREE.DoubleSide}));pool.rotation.x=-Math.PI/2;pool.scale.y=.55;pool.position.set(193,terrain(193,102)+.13,102);scene.add(pool);
  // Moonglow under darker sector.
  const lamp=new THREE.PointLight(0x9887bd,70,85);lamp.position.set(-160,15,65);scene.add(lamp);
  const lamp2=new THREE.PointLight(0xd9af84,50,65);lamp2.position.set(160,9,65);scene.add(lamp2);
}
const butterflies=[];
function makeButterflies(){
  const wingGeo=new THREE.SphereGeometry(.55,8,5),wingMats=[0xdcc997,0xc7a3a8,0x9ec4b6].map(c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.35,roughness:.65,side:THREE.DoubleSide}));
  for(let i=0;i<20;i++){const b=biomes[i%3],a=rand()*6.28,r=12+rand()*90;const root=new THREE.Group();root.position.set(b.x+Math.cos(a)*r,2.3+rand()*3,b.z+Math.sin(a)*r);const left=new THREE.Mesh(wingGeo,wingMats[i%3]);left.scale.set(.16,.66,.46);left.position.set(-.3,0,0);const right=left.clone();right.position.x=.3;root.add(left,right);const body=new THREE.Mesh(new THREE.CapsuleGeometry(.06,.55,3,6),new THREE.MeshStandardMaterial({color:0x283532}));body.rotation.x=Math.PI/2;root.add(body);scene.add(root);butterflies.push({root,left,right,origin:root.position.clone(),seed:rand()*8,phase:rand()*6.28})}
}
const animals=[];
function makeAnimal(kind,x,z,scale=1){const bodymat=new THREE.MeshStandardMaterial({color:kind==='deer'?0x967b5d:0x9b654b,roughness:1});const dark=new THREE.MeshStandardMaterial({color:0x282c25});const grp=new THREE.Group();const body=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),bodymat);body.scale.set(.83,.54,.38);body.position.y=1.05;grp.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),bodymat);head.position.set(.8,1.52,0);grp.add(head);const neck=new THREE.Mesh(new THREE.CylinderGeometry(.21,.27,.92,7),bodymat);neck.position.set(.53,1.35,0);neck.rotation.z=-.35;grp.add(neck);for(const dx of [-.52,.54])for(const dz of [-.23,.23]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,.95,6),bodymat);leg.position.set(dx,.53,dz);grp.add(leg)}for(const dz of [-.20,.20]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.17,.53,6),bodymat);ear.position.set(.80,1.91,dz);grp.add(ear)}if(kind==='deer'){for(const dz of [-.19,.19]){const ant=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,.89,6),dark);ant.position.set(.69,2.25,dz);ant.rotation.z=.16;grp.add(ant)}}else{const tail=new THREE.Mesh(new THREE.ConeGeometry(.27,.73,8),bodymat);tail.position.set(-1.04,1.15,0);tail.rotation.z=-1.0;grp.add(tail)}grp.scale.setScalar(scale);grp.position.set(x,terrain(x,z),z);scene.add(grp);animals.push({grp,x,z,phase:rand()*6.28,kind})}
function makeFauna(){makeAnimal('deer',29,-8,1.12);makeAnimal('fox',-25,20,.78);makeAnimal('deer',170,30,.95);}
const flecks=[];let fleckGeo;
function makeFireflies(){const particles=260;const p=new Float32Array(particles*3);for(let i=0;i<particles;i++){const b=biomes[i%3],a=rand()*6.283,r=10+rand()*105;const x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r,y=2+rand()*7;flecks.push({x,y,z,offset:rand()*6.28});p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z}fleckGeo=new THREE.BufferGeometry();fleckGeo.setAttribute('position',new THREE.BufferAttribute(p,3));scene.add(new THREE.Points(fleckGeo,new THREE.PointsMaterial({color:0xefdc9a,size:.26,transparent:true,opacity:.8,depthWrite:false})))}
function createPositions(){positions=works.map((work,i)=>{const bi=biomes[i%3],j=Math.floor(i/3),angle=(j*2.399963229728653+biomes.indexOf(bi)*.43),r=19+Math.sqrt(j)*7.4;const x=bi.x+Math.cos(angle)*r,z=bi.z+Math.sin(angle)*r;return{x,z,y:terrain(x,z),biome:bi.id}})}
function makeCard(i){
  const art=works[i],p=positions[i],center=biomes[i%3];
  const g=new THREE.Group();g.position.set(p.x,p.y,p.z);
  // Face inward, so artwork is encountered naturally while following the spiral trail.
  g.lookAt(center.x,p.y,center.z);
  const base=new THREE.Mesh(reusableGeo.base,matBase);base.position.y=.15;g.add(base);
  const pillar=new THREE.Mesh(reusableGeo.post,matPost);pillar.position.y=1.4;g.add(pillar);
  const frame=new THREE.Mesh(reusableGeo.frame,matFrame);frame.position.set(0,3.65,0);g.add(frame);
  const face=new THREE.Mesh(reusableGeo.panel,new THREE.MeshBasicMaterial({map:placeholderTexture,side:THREE.DoubleSide}));face.position.set(0,3.65,.13);face.userData.artIndex=i;g.add(face);
  const light=new THREE.Mesh(new THREE.SphereGeometry(.10,8,6),new THREE.MeshBasicMaterial({color:0xd9bb88}));light.position.set(0,6.13,.18);g.add(light);
  scene.add(g);const rec={group:g,face,art,index:i,texture:null,requested:false};activeCards.set(i,rec);return rec;
}
function showPhoto(rec){
  if(rec.requested)return;rec.requested=true;
  const url=rec.art.thumb||rec.art.image;
  const install=(tex)=>{
    if(activeCards.get(rec.index)!==rec){tex.dispose();return;}
    tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    rec.texture=tex;rec.face.material.map=tex;rec.face.material.needsUpdate=true;
  };
  textureLoader.load(url,install,undefined,()=>{
    if(url!==rec.art.image && activeCards.get(rec.index)===rec){textureLoader.load(rec.art.image,install,undefined,()=>{});}
  });
}
function removeCard(i){const rec=activeCards.get(i);if(!rec)return;scene.remove(rec.group);rec.face.material.dispose();if(rec.texture)rec.texture.dispose();activeCards.delete(i)}
function refreshCards(){
  if(!works.length)return;
  const visibleLimit=isTouch?44:62,photoLimit=isTouch?24:37;
  const visibleSq=visibleLimit*visibleLimit,photoSq=photoLimit*photoLimit;
  const keepSq=(visibleLimit+10)**2;
  const eligible=new Set();
  for(let i=0;i<positions.length;i++){
    const p=positions[i],d=(p.x-camX)**2+(p.z-camZ)**2;
    if(d<visibleSq){eligible.add(i);const rec=activeCards.get(i)||makeCard(i);if(d<photoSq)showPhoto(rec)}
  }
  for(const [i,rec] of activeCards){const p=positions[i],d=(p.x-camX)**2+(p.z-camZ)**2;if(d>keepSq)removeCard(i)}
  $('#visibleCount').textContent=String(activeCards.size);
}
function freeCards(){for(const i of [...activeCards.keys()])removeCard(i)}
function updateStats(){ $('#totalCount').textContent=String(works.length).padStart(2,'0') }
function getNearest(){
  ray.setFromCamera(new THREE.Vector2(0,0),camera);
  const meshes=[...activeCards.values()].map(o=>o.face);
  const hit=ray.intersectObjects(meshes,false).find(h=>h.distance<12);
  return hit?works[hit.object.userData.artIndex]:null;
}
function inspect(art){ if(!art)return;document.exitPointerLock?.();$('#detailTitle').textContent=art.title;$('#detailYear').textContent=art.year||'—';$('#detailDescription').textContent=art.description||'Une œuvre de Melisa Fortin.';$('#detailCategory').textContent=art.category||'Tatouage';$('#detailPhoto').src=art.image;$('#detailPhoto').alt=art.title;const link=$('#detailSource');if(art.source?.startsWith('https://')){link.hidden=false;link.href=art.source}else{link.hidden=true;link.removeAttribute('href')}$('#details').hidden=false;}
function hideDetails(){$('#details').hidden=true}
function hideHelp(){$('#help').hidden=true}
function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800)}
function teleport(x,z){
  camX=x;camZ=z;pitch=-.07;
  // Look toward nearest artwork or toward the center of the garden.
  const nearest=positions.reduce((best,p)=>{const d=(p.x-x)**2+(p.z-z)**2;return d<best.d?{d,p}:best},{d:Infinity,p:null}).p;
  const dest=nearest||{x:0,z:0};yaw=Math.atan2(-(dest.x-camX),-(dest.z-camZ));
  freeCards();refreshCards();updateBiome();drawMiniMap();
}
function goBiome(id){const bi=biomes.find(b=>b.id===id);if(!bi)return;teleport(bi.x+7,bi.z+30);showToast(bi.name);}
function updateBiome(){const b=biomeAt(camX,camZ);$('#biomeLabel').textContent=b.name;$('#coords').textContent=`X ${Math.round(camX)} · Z ${Math.round(camZ)}`;document.querySelectorAll('.biome').forEach(btn=>btn.classList.toggle('active',btn.dataset.biome===b.id))}
function drawMiniMap(){
  const can=$('#minimap'),ctx=can.getContext('2d'),w=can.width,h=can.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(7,26,24,.65)';ctx.fillRect(0,0,w,h);
  for(let x=0;x<=w;x+=23){ctx.strokeStyle='rgba(183,200,176,.09)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<=h;y+=22){ctx.strokeStyle='rgba(183,200,176,.09)';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  const scale=1.08,tx=x=>w/2+(x-camX)*scale,ty=z=>h/2+(z-camZ)*scale;
  for(const b of biomes){const x=tx(b.x),y=ty(b.z);ctx.strokeStyle=b.color;ctx.globalAlpha=.36;ctx.beginPath();ctx.arc(x,y,24,0,6.283);ctx.stroke();ctx.globalAlpha=1;ctx.font='9px sans-serif';ctx.fillStyle=b.color;ctx.fillText(b.id.toUpperCase(),x-14,y-29)}
  for(let i=0;i<positions.length;i++){const p=positions[i],x=tx(p.x),y=ty(p.z);if(x<0||x>w||y<0||y>h)continue;ctx.fillStyle='rgba(233,215,164,.82)';ctx.fillRect(x-1,y-1,2,2)}
  ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-yaw);ctx.fillStyle='#d0efae';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.closePath();ctx.fill();ctx.restore();
}
function searchResults(){
  const term=$('#search').value.trim().toLocaleLowerCase('fr');const out=$('#results');
  if(!term){out.hidden=true;out.replaceChildren();$('#searchCount').textContent='';return}
  const matches=works.map((w,i)=>({w,i})).filter(({w})=>[w.title,w.category,w.description,String(w.year)].some(s=>String(s||'').toLocaleLowerCase('fr').includes(term)));
  out.hidden=false;out.replaceChildren();$('#searchCount').textContent=`${matches.length} RÉSULTAT(S)`;
  for(const {w,i} of matches.slice(0,9)){const button=document.createElement('button');button.textContent=w.title;const small=document.createElement('small');small.textContent=`${w.category||'Tatouage'} · ${w.year||'—'}`;button.append(small);button.onclick=()=>{const p=positions[i];teleport(p.x+Math.sin(i*1.6)*8,p.z+Math.cos(i*1.6)*8);$('#search').value='';searchResults();$('#search').blur();showToast(`Œuvre trouvée : ${w.title}`)};out.append(button)}
  if(!matches.length){const p=document.createElement('p');p.textContent='Aucune œuvre trouvée.';p.style.cssText='font-size:12px;color:#c4c7b9';out.append(p)}
}
function validateCatalog(raw){
  const arr=Array.isArray(raw)?raw:raw?.artworks;
  if(!Array.isArray(arr))throw Error('Le fichier doit contenir un tableau d’œuvres ou {"artworks": [...]}.');
  if(arr.length>10000)throw Error('Le catalogue dépasse la limite actuelle de 10 000 œuvres.');
  const clean=arr.map((w,i)=>{
    if(typeof w!=='object'||!w||typeof w.image!=='string'||!w.image.trim())return null;
    const image=w.image.trim();if(!/^(https?:\/\/|\.{0,2}\/|images\/|assets\/)/i.test(image))return null;
    return{id:String(w.id||`import-${i}`),title:String(w.title||`Œuvre ${i+1}`),category:String(w.category||'Tatouage'),year:w.year||null,description:String(w.description||''),image,thumb: typeof w.thumb==='string'?w.thumb:image,source: typeof w.source==='string'&&w.source.startsWith('https://')?w.source:''}
  }).filter(Boolean);
  if(!clean.length)throw Error('Aucune œuvre valide avec une adresse « image ».');
  return clean;
}
function adoptCatalog(entries){works=entries;freeCards();createPositions();updateStats();refreshCards();searchResults();drawMiniMap()}
function setupInput(){
  $('#importBtn').addEventListener('click',()=>$('#importInput').click());
  $('#importInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const text=await file.text();const newWorks=validateCatalog(JSON.parse(text));localStorage.setItem('mft-portfolio-3d-v1',JSON.stringify(newWorks));adoptCatalog(mergeCatalog(newWorks));showToast(`${newWorks.length} médias supplémentaires importés, sans effacer les archives Wix.`)}catch(err){showToast(`Erreur d'importation : ${err.message}`)}e.target.value=''});
  try{const saved=localStorage.getItem('mft-portfolio-3d-v1');if(saved)adoptCatalog(mergeCatalog(validateCatalog(JSON.parse(saved))))}catch{localStorage.removeItem('mft-portfolio-3d-v1')}
}
function setupEvents(){
  $('#enter').onclick=()=>{$('#intro').hidden=true;active=true;if(!isTouch)canvas.requestPointerLock?.().catch(()=>showToast('Clique dans le monde pour orienter la caméra.'))};
  canvas.addEventListener('click',e=>{if(!active||!$('#details').hidden)return;if(!isTouch&&document.pointerLockElement!==canvas){const ndc=new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(ndc,camera);const hit=ray.intersectObjects([...activeCards.values()].map(v=>v.face)).find(h=>h.distance<14);if(hit){inspect(works[hit.object.userData.artIndex]);return}canvas.requestPointerLock?.().catch(()=>{})}else if(isTouch){const near=getNearest();if(near)inspect(near)}});
  document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===canvas);
  document.addEventListener('mousemove',e=>{if(!locked||!active||!$('#details').hidden)return;yaw-=e.movementX*.00225;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.00225,-1.35,1.35)});
  document.addEventListener('keydown',e=>{
    if(e.target instanceof HTMLInputElement)return;
    keys[e.code]=true;
    if(e.code==='KeyE'&&active&&$('#details').hidden&&$('#help').hidden)inspect(interactionArt||getNearest());
    if(e.code==='Digit1')goBiome('forest');if(e.code==='Digit2')goBiome('garden');if(e.code==='Digit3')goBiome('night');
    if(e.code==='Escape'){hideDetails();hideHelp()}
  });
  document.addEventListener('keyup',e=>{keys[e.code]=false});
  document.querySelectorAll('.biome').forEach(b=>b.onclick=()=>goBiome(b.dataset.biome));
  $('#search').addEventListener('input',searchResults);
  $('#fullscreen').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
  $('#helpBtn').onclick=()=>{document.exitPointerLock?.();$('#help').hidden=false};
  $('#helpDim').onclick=$('#closeHelp').onclick=$('#helpOkay').onclick=hideHelp;
  $('#closeDetails').onclick=$('#closeDim').onclick=hideDetails;
  $('#mobileInspect').onclick=()=>inspect(interactionArt||getNearest());
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.3:1.75))});
  if(isTouch)setupTouch();
}
function setupTouch(){
  $('#mobileControls').hidden=false;const joy=$('#joystick'),knob=$('#knob');let joyId=null,lookId=null,lastX=0,lastY=0;
  joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);joystickMove(e)});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joystickMove(e)});
  const release=e=>{if(e.pointerId!==joyId)return;joyId=null;mobileR=mobileF=0;knob.style.transform='translate(0,0)'};
  joy.addEventListener('pointerup',release);joy.addEventListener('pointercancel',release);
  function joystickMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(len,39)/len;mobileR=dx*scale/39;mobileF=-dy*scale/39;knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`}
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookId||!active)return;yaw-=(e.clientX-lastX)*.006;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lastY)*.006,-1.35,1.35);lastX=e.clientX;lastY=e.clientY});
  canvas.addEventListener('pointerup',e=>{if(e.pointerId===lookId)lookId=null});
  $('#mobileLook').onclick=()=>showToast('Glisse sur le paysage pour tourner la caméra.');
}
function animateDecor(t){
  for(const b of butterflies){const tm=t+b.seed;b.root.position.x=b.origin.x+Math.sin(tm*.65)*1.5;b.root.position.y=b.origin.y+Math.sin(tm*2.3+b.phase)*.24;b.root.position.z=b.origin.z+Math.cos(tm*.6)*1.7;b.root.rotation.y=tm*.18;b.left.rotation.y=Math.sin(tm*12+b.phase)*.8;b.right.rotation.y=-Math.sin(tm*12+b.phase)*.8}
  for(const a of animals){a.grp.position.x=a.x+Math.sin(t*.25+a.phase)*2;a.grp.position.z=a.z+Math.cos(t*.25+a.phase)*2;a.grp.rotation.y=Math.sin(t*.25+a.phase)*.25;a.grp.position.y=terrain(a.grp.position.x,a.grp.position.z)+Math.max(0,Math.sin(t*2+a.phase))*.02}
  const attr=fleckGeo.attributes.position;for(let i=0;i<flecks.length;i++)attr.setY(i,flecks[i].y+Math.sin(t*.85+flecks[i].offset)*.38);attr.needsUpdate=true;
}
let frameCounter=0,fpsLast=0,worldLast=0,miniLast=0,interactionLast=0;
function animate(){requestAnimationFrame(animate);const delta=Math.min(clock.getDelta(),.065),t=clock.elapsedTime;
  const modal=!$('#details').hidden||!$('#help').hidden;
  let f=0,r=0;if(active&&!modal&&document.activeElement!==$('#search')){f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+mobileF;r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+mobileR}
  const velocity=v3(r,0,-f);if(velocity.lengthSq()){velocity.normalize().applyAxisAngle(UP,yaw).multiplyScalar((keys.ShiftLeft||keys.ShiftRight?12.4:6.2)*delta);camX=THREE.MathUtils.clamp(camX+velocity.x,-350,350);camZ=THREE.MathUtils.clamp(camZ+velocity.z,-350,350);bob+=delta*11}else{bob+=delta*3}
  camera.position.set(camX,terrain(camX,camZ)+1.85+(velocity.lengthSq()?.034*Math.sin(bob):0),camZ);camera.rotation.set(pitch,yaw,0,'YXZ');
  animateDecor(t);renderer.render(scene,camera);
  frameCounter++;if(t-fpsLast>1){$('#fps').textContent=String(Math.round(frameCounter/(t-fpsLast)));frameCounter=0;fpsLast=t}
  if(t-worldLast>.42){refreshCards();updateBiome();worldLast=t}
  if(t-miniLast>.26){drawMiniMap();miniLast=t}
  if(t-interactionLast>.13){interactionArt=active&&!modal?getNearest():null;$('#interaction').hidden=!interactionArt;if(interactionArt)$('#nearTitle').textContent=interactionArt.title;interactionLast=t}
}
function start(){addSky();makeGround();trees();landmarks();makeButterflies();makeFauna();makeFireflies();createPositions();setupEvents();setupInput();updateStats();updateBiome();refreshCards();drawMiniMap();animate()}
try{start()}catch(err){console.error('Erreur de la scène 3D',err);showToast('Erreur du rendu 3D : '+err.message)}
