import * as THREE from 'three';
import * as CANNON from 'cannon-es';
//导入ligui
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
//导入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';   


const sense = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000)
camera.position.z = 10
camera.position.y = 10
camera.lookAt(0,0,0)
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight)
//设置环境光
const ambientLight = new THREE.AmbientLight(0x404040, 0.5) //创建环境光
sense.add(ambientLight)
const directionalLigth = new THREE.DirectionalLight(0xffffff)
sense.add(directionalLigth) //添加平行光


const world = new CANNON.World()
world.gravity = new CANNON.Vec3(0, -9.8, 0)
world.solver.iterations = 10 //设置迭代次数
//创建物理平台
const boxPenal = new CANNON.Box(new CANNON.Vec3(5, 0.1, 5))
const boxBody = new CANNON.Body({
    shape:boxPenal,
    position: new CANNON.Vec3(0, 0, 0),
    type:CANNON.Body.STATIC, //设置为静态物体
})
const groundMaterial = new CANNON.Material('ground')
boxBody.material = groundMaterial //设置材质
boxBody.addShape(boxPenal) //添加形状
world.addBody(boxBody)

//创建物理世界中运动的小球
const sphereShape = new CANNON.Sphere(0.5) //创建一个半径为0.5的球体, 定义刚体的形状
const sphereBody = new CANNON.Body({mass: 1}) //创建一个刚体
sphereBody.addShape(sphereShape) //添加形状
sphereBody.position.set(-5, 0.6, 0.1)
//设置小球的材质
const sphereMaterial = new CANNON.Material('sphere')
sphereMaterial.restitution = 1
sphereBody.material = sphereMaterial //设置材质
//设置小球与地面的接触属性
const contactMaterial = new CANNON.ContactMaterial(
    groundMaterial,
    sphereMaterial,
    {
        friction: 0, //摩擦力
        restitution: 0 //弹力
    }
)
world.addContactMaterial(contactMaterial) //添加接触材质
const initalVelocity = new CANNON.Vec3(5, 0, 0) //设置初始速度
sphereBody.velocity = initalVelocity //设置速度
world.addBody(sphereBody) //将小球添加到物理世界中

//创建第二个物理小球
const sphereShape2 = new CANNON.Sphere(0.5) //创建一个半径为0.5的球体, 定义刚体的形状
const sphereBody2 = new CANNON.Body({mass: 1}) //创建一个刚体
sphereBody2.addShape(sphereShape2) //添加形状
sphereBody2.position.set(5, 0.6, -0.1)
//设置小球的材质
sphereBody2.material = sphereMaterial //设置材质
const initalVelocity2 = new CANNON.Vec3(-3, 0, 0)
sphereBody2.velocity = initalVelocity2 //设置速度
world.addBody(sphereBody2) //将小球添加到物理世界中


//在three.js中创建一个小球网格对象
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32) //创建一个半径为0.5的球体几何体
const sphereMaterialMesh = new THREE.MeshBasicMaterial({color: 0x00ff00}) //创建材质
const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterialMesh) //创建网格对象
sphereMesh.position.copy(sphereBody.position) //将物理位置赋值给three.js的mesh
sense.add(sphereMesh) //将网格对象添加到场景中

//在three.js中创建第二个小球网格对象
const sphereMesh2 = new THREE.Mesh(sphereGeometry, sphereMaterialMesh) //创建网格对象
sphereMesh2.position.copy(sphereBody2.position) //将物理位置赋值给three.js的mesh
sense.add(sphereMesh2) //将网格对象添加到场景中


//在three.js中创建对应的平台实体
const panel = new THREE.BoxGeometry(10, 0.1, 10)
const material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide}) //创建材质
const mesh = new THREE.Mesh(panel, material)
mesh.position.copy(boxBody.position) //将物理位置赋值给three.js的mesh
sense.add(mesh)

const gui = new GUI()
gui.add(sphereBody.velocity, 'x', -10, 10, 0.1).name('小球x轴速度')
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement) //创建轨道控制器:控制器实际上是控制相机的
//添加世界坐标
const axesHelper = new THREE.AxesHelper(5) //创建坐标轴辅助器
sense.add(axesHelper) //将坐标轴辅助器添加到场景中
function animation(){
    controls.update() //更新控制器
    //更新物理位置
    world.step(1/60) //更新物理世界，1/60表示每秒60帧
    //更新three.js的mesh的位置
    sphereMesh.position.copy(sphereBody.position) //将物理位置赋值给three.js的mesh
    sphereMesh.quaternion.copy(sphereBody.quaternion) //将物理旋转赋值给three.js的mesh
    sphereMesh2.position.copy(sphereBody2.position) //将物理位置赋值给three.js的mesh
    sphereMesh2.quaternion.copy(sphereBody2.quaternion) //将物理旋转赋值给three.js的mesh
    renderer.render(sense, camera)
    //计算并显示小球的速度
    // const velocity = sphereBody.velocity.length() //获取小球的速度
    //通过更新gui中显示的小球的速度
    // gui.__controllers[0].setValue(velocity) //更新gui中显示的小球的速度
    requestAnimationFrame(animation)
}

window.addEventListener('resize', ()=>{
    //重置渲染器的大小
    renderer.setSize(window.innerWidth, window.innerHeight)
    //重置相机的宽高比
    camera.aspect = window.innerWidth / window.innerHeight
    //更新相机的投影矩阵
    camera.updateProjectionMatrix()
})

animation();
