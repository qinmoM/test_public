//几何体包括了形状(geometry)和材质(material)，
//材质是用来定义物体表面的属性的，比如颜色、纹理、透明度等。
//而几何体是用来定义物体的形状的，比如立方体、球体、平面等。

//几何体由顶点、边和面组成，其中面是由三个顶点组成的三角形。
//要自定义几何体，可以使用THREE.Geometry类来创建一个几何体对象，然后使用vertices属性来添加顶点

import * as THREE from 'three'
//添加控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const sense = new THREE.Scene()
//创建相机
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000 
)
camera.position.z = 5 //设置相机的z轴位置
camera.lookAt(0,0,0)
//创建渲染器
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight) 
document.body.appendChild(renderer.domElement) 

//创建一个面
// const geomertry = new THREE.BufferGeometry();
// //创建面的顶点数据：其中逆时针为正面，顺时针为反面
// const vertices =  new Float32Array([
//     0, 0, 0,
//     1, 0, 0,
//     1, 1, 0
// ])
// geomertry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)) //设置顶点数据
// //创建材质
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
// const plane = new THREE.Mesh(geomertry, material)
// sense.add(plane)

//创建一个正方行
const geometry = new THREE.BufferGeometry() //创建一个平面几何体
//创建面的顶点数据：其中逆时针为正面，顺时针为反面 
const vertices = new Float32Array([
    0, 0, 0,
    1, 0, 0,
    1, 1, 0,
    0, 1, 0
])
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)) //设置顶点数据
//创建索引数据：定义了顶点的顺序(每个面的顶点顺序，012表示第一个面的顶点，230表示第二个面的顶点)，这样可以达到共用顶点的效果
const indices = new Uint16Array([0, 1, 2, 2, 3, 0])
geometry.setIndex(new THREE.BufferAttribute(indices, 1)) //设置索引数据
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }) //创建材质
const plane = new THREE.Mesh(geometry, material) //创建网格对象
sense.add(plane) //将网格对象添加到场景中

const contrals = new OrbitControls(camera, renderer.domElement) //创建轨道控制器:控制器实际上是控制相机的

//添加世界坐标
const axesHelper = new THREE.AxesHelper(5) //创建一个坐标轴辅助器
sense.add(axesHelper) //将坐标轴辅助器添加到场景中

//渲染函数
function animate() {
    contrals.update() //更新轨道控制器
    requestAnimationFrame(animate)
    renderer.render(sense, camera)
}
animate() //调用渲染函数
