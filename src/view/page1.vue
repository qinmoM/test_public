<template>
    <div class="page-content"></div>
    <!-- 操作按钮 -->
  <div class="button-group">
    <button @click="fire">测试1</button>
    <button @click="resetCamera">测试2</button>
  </div>
</template>
<script setup>
import * as THREE from 'three';
import * as CANNON from 'cannon-es'; 
import { onMounted } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; //引入轨道控制器
onMounted(()=>{
let dom = document.querySelector('.page-content')
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45, 
  dom.clientWidth/dom.clientHeight, 
  0.1, 
  1000 
)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(dom.clientWidth, dom.clientHeight) 
dom.appendChild(renderer.domElement) 

const groundMaterial = new CANNON.Material('ground')
const sphereMaterial = new CANNON.Material('sphere')
const {world, boxBody} = createWorld(groundMaterial)
sphereMaterial.restitution = 1
const contactMaterial = new CANNON.ContactMaterial(
    groundMaterial,
    sphereMaterial,
    {
        friction: 0, //摩擦力
        restitution: 0 //弹力
    }
)
world.addContactMaterial(contactMaterial) //添加接触材质

const textureUrl = new URL('../assets/textures/laminate_floor_02_diff_4k.jpg', import.meta.url).href
const geometry = new THREE.BoxGeometry(15, 0.1, 15) 
const texture = new THREE.TextureLoader().load(textureUrl, () => {
  console.log('Texture loaded');
}, undefined, (error) => {
  console.error('An error happened', error);
});
const material = new THREE.MeshBasicMaterial({ map: texture }) 
const cube = new THREE.Mesh(geometry, material) 
cube.position.copy(boxBody.position)

let phyCircle = createPhyCicle(sphereMaterial, 1, 1, {x:0, y:1+0.05, z:5}, -5)
let phyCircle2 = createPhyCicle(sphereMaterial,1, 1, {x:0, y:1+0.05, z:-5}, 5)
world.addBody(phyCircle)
world.addBody(phyCircle2)


let cirle1 = createBasicCircle(1, {x:0, y:1+0.05, z:5})
let cirle2 = createBasicCircle(1, {x:0, y:1+0.05, z:-5})

cirle1.position.copy(phyCircle.position)
cirle2.position.copy(phyCircle2.position)

scene.add(cirle2)
scene.add(cirle1)
scene.add(cube) 

camera.position.z = 2
camera.position.x = 20
camera.position.y = 5
camera.lookAt(0,0,0) 

const axesHelper = new THREE.AxesHelper(5) 
scene.add(axesHelper) 

const controls = new OrbitControls(camera, renderer.domElement) 
controls.enableDamping = true 
controls.dampingFactor = 0.05 
// controls.autoRotate = true    

//渲染函数：每一帧重新渲染场景
function animate() {
  controls.update() 
  world.step(1/60) //每一帧更新物理引擎
  updatePosition(cirle1, phyCircle)
  updatePosition(cirle2, phyCircle2)
//   cube.rotation.y += 0.01
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate() 

//监听窗口大小变化
window.addEventListener("resize", ()=>{
    //重置渲染器的大小
    renderer.setSize(window.innerWidth, window.innerHeight)
    //重置相机的宽高比
    camera.aspect = window.innerWidth / window.innerHeight
    //更新相机的投影矩阵
    camera.updateProjectionMatrix()
})
})

const createWorld=(groundMaterial)=> {
    const world = new CANNON.World()
    world.gravity.set(0, -9.82, 0) // 设置重力
    world.broadphase = new CANNON.SAPBroadphase(world) // 使用SAP算法进行碰撞检测
    world.solver.iterations = 10 // 设置迭代次数
    const boxPenal = new CANNON.Box(new CANNON.Vec3(7.5, 0.1, 7.5))
    const boxBody = new CANNON.Body({
    shape:boxPenal,
    position: new CANNON.Vec3(0, 0, 0),
    type:CANNON.Body.STATIC, //设置为静态物体
    })
    boxBody.material = groundMaterial //设置材质
    boxBody.addShape(boxPenal) //添加形状
    world.addBody(boxBody)
    return {world, boxBody}
}
function createPhyCicle(sphereMaterial, radius, mass, position, v0=0) {
    const sphereShape = new CANNON.Sphere(radius)
    const sphereBody = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(position.x, position.y, position.z)
    })
    sphereBody.material = sphereMaterial //设置材质
    sphereBody.velocity  = new CANNON.Vec3(0, 0, v0)
    sphereBody.addShape(sphereShape)
    return sphereBody
}
function createBasicCircle(radius, position) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const textureUrl = new URL('../assets/textures/terrazzo_tiles_diff_4k.jpg', import.meta.url).href
    const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(textureUrl, ()=>{console.log("success")}, ()=>{console.log('filad')}) })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(position.x, position.y, position.z)
    return sphere
}
function updatePosition(basicCir, phyCircle) {
    basicCir.position.copy(phyCircle.position)
    basicCir.quaternion.copy(phyCircle.quaternion)
}
</script>
<style scoped>
.page-content{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
.button-group{
  left:50%;
  
  position:absolute;
  width:100%;
  padding :10px 0;
  display:flex;
  /* justift-content:center; */
  transform:translateX(-50%);
  gap:10px;
  z-index: 100;
}
button {
  padding: 8px 16px;
  margin: 0 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

canvas{
    width: 100%;
    height: 100%;
    background-color: aliceblue;
}
</style>