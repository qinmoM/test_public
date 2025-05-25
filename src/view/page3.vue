<template>
  <div class="page-content" ref="container"></div>
  
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const container = ref(null)
let renderer, camera, scene, animationId

// 球坐标变量（用于控制相机）
const spherical = new THREE.Spherical()
const cameraTarget = new THREE.Vector3(0, 3, 0) // 相机永远看向这个点

// 鼠标相关变量
let isDragging = false
let previousMousePosition = { x: 0, y: 0 }

// 鼠标按下时，标记拖动开始
 function onMouseDown(event) {
   isDragging = true
   previousMousePosition = { x: event.clientX, y: event.clientY }
 }

// 鼠标释放时，标记拖动结束
function onMouseUp() {
  isDragging = false
}

// 鼠标移动时，根据偏移量旋转相机
//  function onMouseMove(event) {
//    if (!isDragging) return

//    const deltaX = event.clientX - previousMousePosition.x
//    const angle = deltaX * 0.005 // 调整旋转速度
//    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle) // 绕 Y 轴旋转
//    camera.lookAt(0, 0, 0) // 始终看向中心点

//    previousMousePosition = { x: event.clientX, y: event.clientY }
//  }


// function onMouseMove(event) {
//   if (!isDragging) return

//   const deltaX = event.clientX - previousMousePosition.x
//   const deltaY = event.clientY - previousMousePosition.y

//   const rotateSpeed = 0.005

//   // 左右转头（绕 y 轴）
//   camera.rotation.y -= deltaX * rotateSpeed

//   // 上下抬头低头（绕 x 轴）
//   camera.rotation.x -= deltaY * rotateSpeed

//   // 限制上下角度，防止翻转
//   const maxPitch = Math.PI / 2 - 0.1
//   const minPitch = -Math.PI / 2 + 0.1
//   camera.rotation.x = Math.max(minPitch, Math.min(maxPitch, camera.rotation.x))

//   previousMousePosition = { x: event.clientX, y: event.clientY }
// }

 function onMouseMove(event) {
   if (!isDragging) return

   const deltaX = event.clientX - previousMousePosition.x
   const deltaY = event.clientY - previousMousePosition.y

   const rotateSpeed = 0.005

   spherical.theta -= deltaX * rotateSpeed     // 左右旋转（绕Y轴）
   spherical.phi -= deltaY * rotateSpeed       // 上下旋转（绕X轴）

   // 限制phi角度避免翻转（仰视俯视）
   spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi))

   const newPos = new THREE.Vector3().setFromSpherical(spherical)
   camera.position.copy(newPos)
   camera.lookAt(cameraTarget) // 始终看中心

   previousMousePosition = { x: event.clientX, y: event.clientY }
 }

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
  camera.position.set(0, 5, 8)// 相机位置
  camera.lookAt(0, 3, 0)// 相机看向的位置

    // 初始化球坐标（相对于 cameraTarget）
  spherical.setFromVector3(camera.position.clone().sub(cameraTarget))

  // 添加光照
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(5, 10, 5)
  scene.add(light)

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

    // ✅ 新增：添加一个地板
  const floorGeometry = new THREE.PlaneGeometry(100, 100) // 地板大小
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2 // 让地板水平
  floor.position.y = 0 // 地板高度（在 y=0 上）
  scene.add(floor)

  scene.add(group1)

  // 新增：绑定鼠标事件（只绑定在当前页面容器，不影响其他页面）
  dom.addEventListener('mousedown', onMouseDown)
  dom.addEventListener('mouseup', onMouseUp)
  dom.addEventListener('mousemove', onMouseMove)

  const animate = () => {
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

  // 新增：解绑事件监听器，避免内存泄漏
  const dom = container.value
  dom.removeEventListener('mousedown', onMouseDown)
  dom.removeEventListener('mouseup', onMouseUp)
  dom.removeEventListener('mousemove', onMouseMove)
})

</script>

<style scoped>
.page-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>