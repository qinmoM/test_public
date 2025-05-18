import * as THREE from 'three'
//导入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45, 
  window.innerWidth/window.innerHeight,  
  0.1, 
  1000 
)


const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight) 
document.body.appendChild(renderer.domElement) 


const geometry = new THREE.BoxGeometry(1, 1, 1) 
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }) 
const cube = new THREE.Mesh(geometry, material) 

scene.add(cube) 


camera.position.z = 5 
camera.position.x = 2
camera.position.y = 2
camera.lookAt(0,0,0) 

const axesHelper = new THREE.AxesHelper(5) 
scene.add(axesHelper) 


const controls = new OrbitControls(camera, renderer.domElement) 
controls.enableDamping = true 
controls.dampingFactor = 0.05 
controls.autoRotate = true    

//渲染函数：每一帧重新渲染场景
function animate() {
  controls.update() 
  requestAnimationFrame(animate)
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
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

//画布全屏显示
const buttont = document.createElement("button");
buttont.innerHTML = "全屏显示"
buttont.style.position = "absolute";
buttont.style.top = "10px";
buttont.style.right = "10px";
buttont.style.zIndex = "9999";
document.body.appendChild(buttont);
buttont.onclick = function(){
    renderer.domElement.requestFullscreen(); //请求全屏
}
