import * as THREE from 'three'
//导入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
//导入lil-gui
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'


const scense = new THREE.Scene();

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
)
camera.position.z = 5
camera.position.x = 2
camera.lookAt(0,0,0)

const geometry = new THREE.BoxGeometry(1,1,1)
const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
const cube = new THREE.Mesh(geometry, material)

scense.add(cube)

function animate(){
    requestAnimationFrame(animate)
    renderer.render(scense, camera)
}

animate()

let guiConObj = {
    FullScreen: function(){
        if (document.fullscreenEnabled) {
            document.documentElement.requestFullscreen()
        } else {
            alert('浏览器不支持全屏')
        }
    },
    ExitFullScreen: function(){
        if (document.fullscreenEnabled) {
            document.exitFullscreen()
        } else {
            alert('浏览器不支持全屏')
        }
    },
}

//创建GUI
const gui = new GUI()
gui.add(cube.position, 'x', -5, 5, 0.1).name('立方体x轴位置')
gui.add(cube.position, 'y', -5, 5, 0.1).name('立方体y轴位置')
gui.add(cube.position, 'z', -5, 5, 0.1).name('立方体z轴位置')
//gui相关的事件,可以使用onChange来监听事件
gui.add(cube.rotation, 'x', 0, Math.PI * 2, 0.01).name('立方体x轴旋转').onChange(function(value){
    console.log(value)
})
//当值改变后再触发
gui.add(cube.rotation, 'y', 0, Math.PI * 2, 0.01).name('立方体y轴旋转').onFinishChange(function(value){
    console.log(value)
})
gui.add(cube.rotation, 'z', 0, Math.PI * 2, 0.01).name('立方体z轴旋转')
gui.add(guiConObj, 'FullScreen').name('全屏')
gui.add(guiConObj, 'ExitFullScreen').name('退出全屏')

