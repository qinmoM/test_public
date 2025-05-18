<template>
    <div class="page-content">
        
    </div>
</template>
<script setup>
import { onMounted } from 'vue';
import * as CANNON from 'cannon-es'; //计算物理世界的坐标的
import router from '../router';
import * as THREE from "three"


onMounted(()=>{  //当元素被挂载完成时回调函数被调用
    //获取元素
let dom = document.querySelector(".page-content") //参数：选择器
//threejs世界的三要素：场景， 相机， 渲染器
const scenc = new THREE.Scene(); //创建了一个场景 var/let/const
const camera = new THREE.PerspectiveCamera(75, dom.clientWidth/dom.clientHeight, 0.1, 1000) //构造函数的参数：指定视角，长宽比，近远裁剪面
//设置的相机的属性：相机的位置，相机照向的位置
camera.position.z = 5
camera.position.y = 2
camera.position.x = 0
camera.lookAt(0,0,0)


const renderer = new THREE.WebGLRenderer() //创建渲染器
renderer.setSize(dom.clientWidth, dom.clientHeight) //渲染的元素为canvas
dom.appendChild(renderer.domElement)


//创建一个物理世界 CANNON基本使用：1.创建物理世界，设置物理世界的基本属性(重量加速度)
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0) //设置重力加速度
//创建一个物理世界的小球(相当于小球的灵魂)： 设置形状，设置材质，设置物理世界的属性
const sphereShape = new CANNON.Sphere(1) //创建一个球体,1是半径
const sphereMaterial = new CANNON.Material('sphere') //创建一个材质：可以用来设置摩擦力和弹力
const sphereBody = new CANNON.Body({ //创建一个物体
    mass: 0.5, //质量
    position: new CANNON.Vec3(0, 3, 0), //位置
    material: sphereMaterial //材质
})
world.addBody(sphereBody) //把物体添加到物理世界中

//创建一个小球（小球的身体）:创建物体的一般步骤，首先创建几何形状，规定物体的材质， 再去创建物体，把几何形状和材质当作参数创建物体
 const geometry = new THREE.SphereGeometry(1) //创建几何体
 const textureUrl = new URL('../assets/textures/terrazzo_tiles_diff_4k.jpg', import.meta.url).href
 const texture = new THREE.TextureLoader().load(textureUrl, ()=>{console.log('Texture loaded');}, (error) => {console.error('An error happened', error);});
 const material = new THREE.MeshBasicMaterial({map:texture}) //创建材质
 const cube = new THREE.Mesh(geometry, material) //创建物体:形状和材质

 //灵魂和身体统一：把物理世界的小球位置赋值给真实世界的小球
 cube.position.copy(sphereBody.position) //把物理世界的小球位置赋值给真实世界的小球

//把物体添加到场景中
scenc.add(cube)



function animate() { //渲染函数
    world.step(1/60) //物理世界的步长,可以理解为物理世界的刷新频率，这样一步是必须的，它保证了物理世界坐标的更新
    cube.position.copy(sphereBody.position) //把物理世界的小球位置赋值给真实世界的小球
    requestAnimationFrame(animate) //请求动画帧
    renderer.render(scenc, camera) //渲染场景和相机
}
animate() //调用动画函数
// renderer.render(scenc, camera) //渲染场景和相机
})

</script>
<style scoped>
.page-content{
    height: 100%;
}
</style>