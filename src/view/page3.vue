<template>
  <div class="page-content" ref="container"></div>
  <button class="reset-button" @click="resetScene">切换</button>
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'

let BallIndex = 1 // 当前球的数量索引
const container = ref(null)
let renderer, camera, scene, animationId
let world
const balls = [] // 用于存储球的引用
const strings = [] // 用于存储绳子的引用
const ballbodies = [] // 用于存储球的物理体
const stringbodies = [] // 用于存储绳子的物理体

// 球坐标变量（用于控制相机）
const spherical = new THREE.Spherical()
const cameraTarget = new THREE.Vector3(0, 3, 0) // 相机永远看向这个点

// 鼠标相关变量
let isDragging = false
let previousMousePosition = { x: 0, y: 0 }

function initObjects() {

  BallIndex = BallIndex + 1
  if (BallIndex >= 5) {
    BallIndex = 1
  }

  const ballMat = new CANNON.Material('ballMaterial')
  world.gravity.set(0, -9.8, 0)// 设置重力

  // Ball 和 Ball 的接触属性
  const ballBallContactMat = new CANNON.ContactMaterial(ballMat, ballMat, {
    friction: 0.0,
    restitution: 0.90
  })
  world.addContactMaterial(ballBallContactMat)

  const ballRadius = 0.75
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32)
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xededed,
    roughness: 0.3,
    metalness: 0.5
  })
  const stringMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 })
  const spacing = 1.5

  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * spacing

    // 创建球
    const ball = new THREE.Mesh(ballGeometry, ballMaterial)
    ball.position.set(x, 2, 0)
    balls.push(ball)
    scene.add(ball)

    const ballShape = new CANNON.Sphere(ballRadius)
    const ballBody = new CANNON.Body({
      mass: 1,
      shape: ballShape,
      material: ballMat // 设置球的材质
    })
    ballBody.position.set(x, 2, 0)
    if (BallIndex > i)
    {
      ballBody.position.set(-4.1 + i * 1.5, 2.2, 0)
    }
    world.addBody(ballBody)
    ballbodies.push(ballBody)
    ballbodies[i].velocity.set(0, 0, 0) // 停止球体运动

    const fixedPointBody = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(x, 5, 0) })
    world.addBody(fixedPointBody)

    const constraint = new CANNON.DistanceConstraint(ballBody, fixedPointBody, 3)
    world.addConstraint(constraint)

    // 绳子
    const stringGeometry = new THREE.CylinderGeometry(0.03, 0.03, 3)
    const string = new THREE.Mesh(stringGeometry, stringMaterial)
    strings.push(string)
    scene.add(string)
  }
}

function resetScene() {
  // 清除 Three.js 物体
  balls.forEach(ball => scene.remove(ball))
  strings.forEach(string => scene.remove(string))
  balls.length = 0
  strings.length = 0

  // 清除 Cannon.js 刚体
  ballbodies.forEach(body => world.removeBody(body))
  ballbodies.length = 0

  // 不重建整个 world，只清除刚体即可

  // 重新创建物体
  initObjects()
}

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

  // 物理世界场景
  world = new CANNON.World()
  world.gravity.set(0, -9.87, 0)// 设置重力

  // 提前创建物理材质
  const ballMat = new CANNON.Material('ballMaterial')
  const floorMat = new CANNON.Material('floorMaterial')

  // 定义接触属性
  const contactMat = new CANNON.ContactMaterial(ballMat, floorMat, {
    friction: 0.0,         // 无摩擦（防止球滚动）
    restitution: 0.99      // 弹性很高
  })
  world.addContactMaterial(contactMat) // 加入世界中

  // Ball 和 Ball 的接触属性
  const ballBallContactMat = new CANNON.ContactMaterial(ballMat, ballMat, {
    friction: 0.0,
    restitution: 0.92
  })
  world.addContactMaterial(ballBallContactMat)

  // 初始化渲染器
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(dom.clientWidth, dom.clientHeight)
  dom.appendChild(renderer.domElement)

  // 初始化场景与相机
  scene = new THREE.Scene()
  //scene.background = new THREE.Color( 0x87ceeb )// 场景的背景颜色
  scene.background = new THREE.Color( 0xadd8e6 )// 场景的背景颜色
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
  scene.add(bar)

  // 创建球的属性
  const ballRadius = 0.75// 半径
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32)
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xededed, // 球的颜色
    roughness: 0.3, // 粗糙度
    metalness: 0.5
  })

  // 线的属性
  const stringMaterial = new THREE.MeshStandardMaterial({ color: 0x555555})

  const spacing = 1.5
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * spacing

    // --- Three.js 球体 ---
    const ball = new THREE.Mesh(ballGeometry, ballMaterial)
    ball.position.set(x, 2, 0)
    balls.push(ball) // 存储球的引用
    scene.add(ball) // 将球添加到场景中

      // --- Cannon.js 球体 ---
    const ballMass = 1 // 球的质量
    const ballShape = new CANNON.Sphere(ballRadius)
    const ballBody = new CANNON.Body({
      mass: ballMass,
      shape: ballShape,
      material: ballMat // ✨ 设置球的材质
    })
    // ballBody.angularDamping = 1.0 // 设置角阻尼，防止球体旋转
    // ballBody.angularVelocity.set(0, 0, 0) // 设置初始角速度为0
    ballBody.position.set(x, 2, 0)
    if (0 === i)
    {
      ballBody.position.set(-4, 1.7, 0)
    }
    world.addBody(ballBody)
    ballbodies.push(ballBody)

    // 加入球体在绳子上方的固定点
    const fixedPointBody = new CANNON.Body({
      mass: 0, // 不动
      position: new CANNON.Vec3(x, 5, 0) // 固定点在绳子上方
    })
    world.addBody(fixedPointBody)

      // 加绳长约束
    const stringLength = 3 // 绳子的长度
    const constraint = new CANNON.DistanceConstraint(ballBody, fixedPointBody, stringLength)
    world.addConstraint(constraint)

    // --- Three.js 绳子（细长的圆柱体） ---
    const stringHeight = 3
    const stringGeometry = new THREE.CylinderGeometry(0.03, 0.03, stringHeight)
    const string = new THREE.Mesh(stringGeometry, stringMaterial)
    string.position.set(x, 3.5, 0)
    strings.push(string) // 存储绳子的引用
    scene.add(string) // 将绳子添加到场景中

    // --- Cannon.js 绳子 ---   
    
  }

    // 新增：添加一个地板
  const floorGeometry = new THREE.PlaneGeometry(100, 100) // 地板大小
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2 // 让地板水平
  floor.position.y = 0 // 地板高度（在 y=0 上）
  scene.add(floor)

  // --- Cannon.js 地板刚体 ---
  const floorShape = new CANNON.Plane()
  const floorBody = new CANNON.Body({
    mass: 0,
    shape: floorShape,
    material: floorMat // ✨ 设置地板的材质
  })
  floorBody.addShape(floorShape)
  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // 旋转让法线朝上
  world.addBody(floorBody)

  // 新增：绑定鼠标事件（只绑定在当前页面容器，不影响其他页面）
  dom.addEventListener('mousedown', onMouseDown)
  dom.addEventListener('mouseup', onMouseUp)
  dom.addEventListener('mousemove', onMouseMove)

  const animate = () => {
  // 设置物理世界步长
  //world.step(1 / 90)
  world.step(1/60, undefined, 20)  // 默认是10，提到20更稳定

  // 每一帧同步 cannon 球体 → three 球体
  for (let i = 0; i < balls.length; i++) {

    // 获取当前球体的物理位置
    ballbodies[i].position.z = 0; // 确保球体在 Z=0 平面上
    const cannonPos = ballbodies[i].position
    const stringOriginX = (i - 2) * spacing
    const stringOrigin = new THREE.Vector3(stringOriginX, 5, 0)
    const ballPos = new THREE.Vector3(cannonPos.x, cannonPos.y, cannonPos.z)

    // 如果球体速度过小，认为它静止了
    const v = ballbodies[i].velocity // 球体速度
    const isAlmostStill = v.length() < 0.3 // 速度小于0.2认为是静止的
    const isNear = ballbodies[i].position.x - stringOriginX < 0.05 && ballbodies[i].position.x - stringOriginX > -0.05
    if (isAlmostStill && isNear) {
      ballbodies[i].velocity.set(0, 0, 0) // 停止球体运动
    }

    // 设置绳子的位置为中点
    const midPoint = new THREE.Vector3().addVectors(stringOrigin, ballPos).multiplyScalar(0.5)
    strings[i].position.copy(midPoint)

    // 计算方向向量（从锚点指向球）
    const dir = new THREE.Vector3().subVectors(ballPos, stringOrigin).normalize()

    // 绳子默认方向是沿Y轴的（上→下），所以从 Y 轴 → dir
    const up = new THREE.Vector3(0, -1, 0) // 因为 Cylinder 默认是从上到下（+Y 到 -Y）
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir)
    strings[i].quaternion.copy(quat)

    // 更新 Three.js 球体位置
    balls[i].position.set(cannonPos.x, cannonPos.y, cannonPos.z)
    strings[i].position.set((cannonPos.x + stringOriginX) / 2, cannonPos.y + 1.5, cannonPos.z) // 绳子位置在球上方
  }

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
.reset-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>