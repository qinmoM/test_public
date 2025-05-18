import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";
import { render } from "vue";

//初始化物理世界
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0); //设置重力加速度

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000)
camera.position.z = 10
camera.position.y = 2
camera.lookAt(0,0,0)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)


//创建物理世界的实体（刚体）
const sphereShape = new CANNON.Sphere(0.5) //创建一个半径为0.5的球体, 定义刚体的形状
const sphereBody = new CANNON.Body({
    mass: 100, //设置质量
    shape: sphereShape, //设置形状
    position: new CANNON.Vec3(0, 5, 0) //设置位置
})
world.addBody(sphereBody)//将这个刚体添加到物理世界中
//在物理世界中创建一个平面
const ground = new CANNON.Plane()
const groundBody = new CANNON.Body({
    mass: 0, //设置质量为0表示静态物体,不会因受外力而运动
    shape: ground, //设置形状
    position: new CANNON.Vec3(0, 0, 0) //设置位置
})
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2)
world.addBody(groundBody) //将平面添加到物理世界中


//在three.js中创建一个球体网格对象
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32) //创建一个半径为0.5的球体几何体
const sphereMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00}) //创建材质
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial) //创建网格对象
scene.add(sphereMesh) //将网格对象添加到场景中

//在three.js中创建一个平面网格对象
const groundGeometry = new THREE.PlaneGeometry(10, 10) //创建一个平面几何体
const groundMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide}) //创建材质
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial) //创建网格对象
groundMesh.rotation.x = Math.PI / 2 //将平面旋转90度
groundMesh.position.y = -0.5 //将平面位置设置在y轴上
scene.add(groundMesh) //将网格对象添加到场景中

document.body.appendChild(renderer.domElement) //将渲染器的dom元素添加到页面中
//创建轨道控制器
const controls = new OrbitControls(camera, renderer.domElement) //创建轨道控制器:控制器实际上是控制相机的

//创建时钟
const clock = new THREE.Clock() //创建时钟对象
let animation = function(){
    //更新控制器
    controls.update() //更新控制器
    renderer.render(scene, camera) //渲染场景
    //更新物理世界
    const deltaTime = clock.getDelta() //获取时间间隔,两帧之间的时间间隔
    world.step(1/60, deltaTime, 3) //更新物理世界，1/60表示每秒60帧，deltaTime表示时间间隔，3表示最大迭代次数
    //将物理世界中的刚体位置和旋转更新到three.js中
    sphereMesh.position.copy(sphereBody.position) //将物理世界中的刚体位置更新到three.js中
    sphereMesh.quaternion.copy(sphereBody.quaternion) //将物理世界中的刚体旋转更新到three.js中
    requestAnimationFrame(animation)
}
animation() //开始渲染
