import * as THREE from 'three'
//导入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const scene = new THREE.Scene();

//创建相机
const camera = new THREE.PerspectiveCamera(
  45, //视角
  window.innerWidth/window.innerHeight,  // 宽高比
  0.1, //近平面
  1000 //远平面
)

//创建渲染器
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight) //设置渲染器的大小
document.body.appendChild(renderer.domElement) //将渲染器的dom元素添加到body中

//创建几何体
const geometry = new THREE.BoxGeometry(1, 1, 1) //创建一个立方体几何体
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }) //创建一个绿色的材质
const cube = new THREE.Mesh(geometry, material) //创建一个网格对象

scene.add(cube) //将网格对象添加到场景中

//设置相机的位置
camera.position.z = 5 //设置相机的z轴位置
camera.position.x = 2 //设置相机的x轴位置
camera.position.y = 2 //设置相机的y轴位置
camera.lookAt(0,0,0) //让相机朝向立方体

//添加世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5) //创建一个坐标轴辅助器
scene.add(axesHelper) //将坐标轴辅助器添加到场景中

//添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement) //创建轨道控制器:控制器实际上是控制相机的
//设置带有阻尼的轨道控制器
controls.enableDamping = true //启用阻尼：可以让相机在移动时有一个缓冲的效果
controls.dampingFactor = 0.05 //设置阻尼系数
controls.autoRotate = true    //启用自动旋转:实际上是让相机自动旋转

//渲染函数：每一帧重新渲染场景
function animate() {
  controls.update() //更新轨道控制器
  requestAnimationFrame(animate)
  //旋转立方体
  // cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  //渲染场景
  renderer.render(scene, camera)
}
animate() //调用渲染函数