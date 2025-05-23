<template>
    <div class="page-content">
        页面3
    </div>
</template>
<script setup>
import {onMounted} from 'vue';
import * as THREE from "three"

onMounted(()=>{  //当元素被挂载完成时回调函数被调用
     //获取元素
let dom = document.querySelector(".page-content")  //参数：选择器
const scenc = new THREE.Scene();  //创建一个场景
const camera = new THREE.PerspectiveCamera(75,dom.clientWidth/dom.clientHeight,0.1,1000)  //构造函数的参数：指定视角，长宽比，近远裁剪面
//设置相机的属性：相机的位置，相机照向的位置
camera.position.z=5
camera.position.y=2
camera.position.x=0
camera.lookAt(0,0,0)


const renderer = new THREE.WebGLRender()//创建渲染器
renderer.setSize(dom.clientWidth,dom.clientHeight)
dom.appendChlid(renderer.domElement)


//创建一个物理世界（基本属性，重力加速度）
const world = new CANNON.World()
world.gravity.set(0,-9.82,0) //设置重力加速度
//创建一个物理世界的小球（相当于小球的灵魂）：设置形状，设置材质，设置物理世界的属性
const sphereShape = new CANNON(1) //创建一个球体，1是半径
const sphereMaterial = new CANNON.Material('sphere') //创建一个材质：可以用来设置摩擦力和弹力
const sphereBody = new CANNON.Body({ //创建一个物体
    mass:1, //质量
    position:new CANNON.Vec3(0,0,0), //位置
    material:sphereMaterial //材质
})
world.addBody(sphereBody) //把物体添加到物理世界中



// 创建立方体
        const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
        const cubeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00aaff,
            roughness: 0.1,
            metalness: 0.5
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        scene.add(cube);

        // 创建凹陷的半球（用球体的上半部分）
        const hemisphereGeometry = new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const hemisphereMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            side: THREE.BackSide // 内部可见
        });
        const hemisphere = new THREE.Mesh(hemisphereGeometry, hemisphereMaterial);
        hemisphere.position.y = -0.5; // 调整位置使其凹陷
        hemisphere.rotation.x = Math.PI; // 翻转半球使其朝内
        cube.add(hemisphere); // 将半球作为立方体的子对象


        //初始化小球的位置
function initBall() {
        ball.x = semicircle.centerX - semicircle.radius + ball.radius + 10;
        ball.y = semicircle.centerY - Math.sqrt(Math.pow(semicircle.radius - ball.radius, 2) - 
                      Math.pow(ball.x - semicircle.centerX, 2));
        ball.velocityX = 0;
        ball.velocityY = 0;
        ball.angle = Math.PI;
        ball.angularVelocity = 0;
    }


        // 显示信息
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.fillText(`速度: ${Math.sqrt(ball.velocityX*ball.velocityX + ball.velocityY*ball.velocityY).toFixed(2)} m/s`, 20, 30);
        ctx.fillText(`角速度: ${ball.angularVelocity.toFixed(4)} rad/s`, 20, 60);
        ctx.fillText(`位置角度: ${ball.angle.toFixed(4)} rad`, 20, 90);
    
        
function animate(){ //渲染函数
    world.step(1/60) //物理世界的步长，可以理解为物理世界的刷新频率
    requestAnimationFrame(animate) //请求动画帧
    cube.rotation.x +=0.01 //物体的旋转
    cube.rotation.y +=0.01
    renderer.render(scenc,camera) //渲染场景，相机
}
animate() //调用动画函数
})




</script>
<style scoped>
.page-content{
    position: relative;
    width: 100%;
    height: 100%;
}
</style>