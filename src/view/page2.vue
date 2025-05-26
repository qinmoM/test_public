<template>
    <div class="page-content">
        
    </div>
</template>
<script setup>
import { onMounted } from 'vue';
import * as CANNON from 'cannon-es'; //计算物理世界的坐标的
import router from '../router';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; //加载blender模型
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

//加载blender模型
const loader = new GLTFLoader();
//加载模型
loader.load(
    new URL('../assets/model/Revolver_Wushu.gltf', import.meta.url).href, //模型的路径
    (gltf) => { //加载成功的回调函数
        console.log('Model loaded successfully');
        const model = gltf.scene; //获取模型
        model.scale.set(2, 2, 2) //缩放模型
        scenc.add(model) //添加模型到场景中
    },
    undefined, //加载进度的回调函数
    (error) => { //加载失败的回调函数
        console.error('An error happened', error);
    }
)

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 添加灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scenc.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 1, 1);
scenc.add(directionalLight);

function animate() { //渲染函数
    //world.step(1/60) //物理世界的步长,可以理解为物理世界的刷新频率，这样一步是必须的，它保证了物理世界坐标的更新
    //cube.position.copy(sphereBody.position) //把物理世界的小球位置赋值给真实世界的小球
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