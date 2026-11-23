import * as THREE from 'three';
import { artworks } from '../assets/gallery.js';
const scene = new THREE.Scene();scene.background=new THREE.Color('#9aaea6');scene.fog=new THREE.Fog('#9aaea6',55,190);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.1,350);camera.position.set(0,1.8,14);camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight('#e7fff0','#314632',2.4));const sun=new THREE.DirectionalLight('#fff1c3',2.3);sun.position.set(-30,60,10);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:'#42664b',roughness:1}));ground.rotation.x=-Math.PI/2;scene.add(ground);
const path=new THREE.Mesh(new THREE.PlaneGeometry(7,160),new THREE.MeshStandardMaterial({color:'#b69d78',roughness:1}));path.rotation.x=-Math.PI/2;path.position.y=.015;scene.add(path);
const trunkG=new THREE.CylinderGeometry(.22,.38,4,7),coneG=new THREE.ConeGeometry(2.3,6.4,8);
for(let i=0;i<175;i++){const z=(Math.random()-.5)*145,x=(Math.random()<.5?-1:1)*(6+Math.random()*64);const h=.7+Math.random()*.8;const t=new THREE.Mesh(trunkG,new THREE.MeshStandardMaterial({color:'#614c39'}));t.position.set(x,2*h,z);t.scale.set(h,h,h);scene.add(t);const c=new THREE.Mesh(coneG,new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.31+Math.random()*.1,.36,.17+Math.random()*.14)}));c.scale.set(h,h,h);c.position.set(x,6*h,z);scene.add(c)}
const spots=[];const loader=new THREE.TextureLoader();const ray=new THREE.Raycaster();
artworks.forEach((art,i)=>{const z=5-i*9,x=i%2===0?-6.0:6.0;const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=i%2===0?Math.PI/2:-Math.PI/2;
const post=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,2.4,8),new THREE.MeshStandardMaterial({color:'#4e3e32'}));post.position.y=1.2;group.add(post);
const frame=new THREE.Mesh(new THREE.BoxGeometry(3.8,4.7,.23),new THREE.MeshStandardMaterial({color:'#886b48',metalness:.4,roughness:.4}));frame.position.y=3.45;group.add(frame);
const face=new THREE.Mesh(new THREE.PlaneGeometry(3.42,4.32),new THREE.MeshBasicMaterial({color:'#253c32',side:THREE.DoubleSide}));face.position.set(0,3.45,.14);face.userData.art=art;group.add(face);spots.push(face);scene.add(group);
loader.load(art.thumb,tex=>{tex.colorSpace=THREE.SRGBColorSpace;face.material.map=tex;face.material.needsUpdate=true;},undefined,()=>{});
});
const keys={};let yaw=0,pitch=0,locked=false;const modal=document.querySelector('#modal');
renderer.domElement.addEventListener('click',()=>{if(!modal.classList.contains('show'))renderer.domElement.requestPointerLock?.()});document.getElementById('start').onclick=()=>renderer.domElement.requestPointerLock?.();document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;document.getElementById('start').textContent=locked?'Souris activée':'Continuer la promenade'});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0023;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0023,-1.4,1.4)});
document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE'&&modal.classList.contains('show')===false)inspect();if(e.code==='Escape')modal.classList.remove('show')});document.addEventListener('keyup',e=>keys[e.code]=false);
function nearest(){const dir=new THREE.Vector3(0,0,-1).applyEuler(camera.rotation);ray.set(camera.position,dir);const hits=ray.intersectObjects(spots);return hits.find(h=>h.distance<9)?.object?.userData.art;}
function inspect(){const a=nearest();if(!a)return;document.exitPointerLock?.();document.getElementById('caption').textContent=a.title;document.getElementById('meta').textContent=a.description;document.getElementById('large').src=a.image;document.getElementById('source').href=a.source;modal.classList.add('show')}
document.getElementById('close').onclick=()=>modal.classList.remove('show');
const clock=new THREE.Clock();function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);camera.rotation.set(pitch,yaw,0,'YXZ');let f=0,r=0;if(!modal.classList.contains('show')){f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)}let v=new THREE.Vector3(r,0,-f);if(v.lengthSq()){v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw).multiplyScalar(dt*(keys.ShiftLeft?10:5.5));camera.position.add(v)}camera.position.x=THREE.MathUtils.clamp(camera.position.x,-100,100);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-115,115);document.getElementById('hint').textContent=nearest()?'Appuie sur E pour observer ce tatouage.':'Approche-toi d’une œuvre et appuie sur E.';renderer.render(scene,camera)}loop();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
