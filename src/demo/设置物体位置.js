import * as THREE from 'three'
//导入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const scene = new THREE.Scene();

//创建相机
const camera = new THREE.PerspectiveCamera(
  45, 
  window.innerWidth/window.innerHeight, 
  0.1, 
  1000 
)


const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight) 
document.body.appendChild(renderer.domElement) 

const geomertry = new THREE.BoxGeometry(1, 1, 1) 
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }) 
const cube = new THREE.Mesh(geomertry, material) 


cube.position.set(1, 0, 0) //设置立方体的位置:这里设置的位置是相对的，不是绝对的。这里cube的父元素是scene，所以这里设置的是相对于scene的位置
//现在设置cube相对于另一个物体的位置
const childMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }) //创建一个红色的材质
const childCube = new THREE.Mesh(geomertry, childMaterial) //创建一个父物体
cube.add(childCube) //将子物体添加到父物体上
childCube.position.set(-1, 0, 0) //设置子物体的位置:这里设置的是相对于父物体的位置



scene.add(cube)

//设置相机的位置
camera.position.z = 5
camera.position.x = 2 
camera.position.y = 2 
camera.lookAt(0, 0, 0) 

//添加世界坐标辅助器
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper) 

//渲染场景
renderer.render(scene, camera) 