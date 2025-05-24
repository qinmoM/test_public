<template>
  <div class="page-content" ref="container"></div>
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let renderer, camera, scene, animationId

onMounted(() => {
  const dom = container.value
  // 初始化渲染器
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(dom.clientWidth, dom.clientHeight)
  dom.appendChild(renderer.domElement)

  // 初始化场景与相机
  scene = new THREE.Scene()
  scene.background = new THREE.Color( 0x444444 )// 场景的背景颜色
  camera = new THREE.PerspectiveCamera(
    75,
    dom.clientWidth / dom.clientHeight,// 相机里的显示宽高为组件里的宽高
    0.1,
    1000
)
  camera.position.set(0, 3, 12)// 相机位置
  camera.lookAt(0, 0, 0)// 相机看向的位置

  // 添加光照
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 10, 5)
  scene.add(light)

//   // 创建一个正方形
//   const geometry = new THREE.BoxGeometry()// 创建一个正方形几何形状常量
//   const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })// 对应一个材质常量
//   const cube = new THREE.Mesh(geometry, material)// 用上面两个常量构建一个几何体
//   scene.add(cube)// 添加到场景中

// 横梁
  const barGeometry = new THREE.BoxGeometry(10, 0.3, 0.3)
  const barMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
  const bar = new THREE.Mesh(barGeometry, barMaterial)
  bar.position.set(0, 5, 0)
//   scene.add(bar)

  // 创建球的属性
  const ballRadius = 0.75// 半径
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32)
  const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd })

  // 线的属性
  const stringMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 })

  // 创建一个组
  const group1 = new THREE.Group();
  group1.add(bar);

  const spacing = 1.5
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * spacing

    // 球
    const ball = new THREE.Mesh(ballGeometry, ballMaterial)
    ball.position.set(x, 2, 0)
    // scene.add(ball)

    // 绳子（细长的圆柱体）
    const stringHeight = 3
    const stringGeometry = new THREE.CylinderGeometry(0.03, 0.03, stringHeight)
    const string = new THREE.Mesh(stringGeometry, stringMaterial)
    string.position.set(x, 3.5, 0)
    // scene.add(string)

    // 加入组
    group1.add(ball);
    group1.add(string);
  }

  scene.add(group1)

  const animate = () => {
    // cube.rotation.y += 0.01
    // cube.rotation.x += 0.01// 每次循环改变几何体的角度
    // group1.rotation.y += 0.01
    renderer.render(scene, camera)// 调用渲染器的渲染功能，渲染每一帧
    animationId = requestAnimationFrame(animate)
  }
  animate()// 启动动画循环
})

// 销毁资源
onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  if (renderer && container.value?.contains(renderer.domElement)) {
    renderer.dispose()
    container.value.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
.page-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>