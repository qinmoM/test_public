<template>
  <!-- 容器元素绑定ref -->
  <div ref="container" class="page-content"></div>
  <!-- 操作按钮 -->
  <div class="button-group">
    <button @click="fire">开火</button>
    <button @click="resetCamera">重置视角</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

//响应式数据
const container = ref(null)          // 场景容器
const animationId = ref(null)        // 动画ID
const isRecoiling = ref(false)       // 是否正在后坐力动画

//Three.js对象
let scene, camera, renderer, controls, weapon

//场景初始化
const initScene = () => {
  if (!container.value) return

  // 1. 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x222222)

  // 2. 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0,2,5)
  resetCamera() // 初始化相机位置

  // 3. 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  // 4. 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  // 5. 添加光源
  const ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  // 6. 创建物理世界
  const groundMaterial = new CANNON.Material('ground')
  const { world, boxBody } = createWorld(groundMaterial)
  const contactMaterial = new CANNON.ContactMaterial(groundMaterial)
  world.addContactMaterial(contactMaterial)

  // 7. 创建地面
  const textureUrl = new URL('../assets/textures/laminate_floor_02_diff_4k.jpg', import.meta.url).href
  const geometry = new THREE.BoxGeometry(15, 0.1, 15)
  const texture = new THREE.TextureLoader().load(textureUrl)
  const material = new THREE.MeshBasicMaterial({ map: texture })
  const cube = new THREE.Mesh(geometry, material)
  cube.position.copy(boxBody.position)
  scene.add(cube)

  // 8. 添加坐标轴辅助
  const axesHelper = new THREE.AxesHelper(1)
  scene.add(axesHelper)

  // 9. 创建武器模型
  createWeaponModel()

  // 10. 开始动画循环
  animate()
}//物理世界创建
const createWorld = (groundMaterial) => {
  const world = new CANNON.World()
  world.gravity.set(0, -9.82, 0)
  
  const groundShape = new CANNON.Box(new CANNON.Vec3(7.5, 0.05, 7.5))
  const boxBody = new CANNON.Body({
    mass: 0,  // 质量为0表示静态物体
    shape: groundShape,
    material: groundMaterial,
    position: new CANNON.Vec3(0, -0.05, 0)
  })
  world.addBody(boxBody)
  
  return { world, boxBody }
}

//武器模型创建
const createWeaponModel = () => {
  weapon = new THREE.Group()
  
  // 枪身
  const bodyGeometry = new THREE.BoxGeometry(1, 0.2, 0.1)
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  weapon.add(body)
  
  // 枪管
  const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 32)
  barrelGeometry.rotateX(Math.PI / 2) // 旋转90度
  const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 })
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
  barrel.position.set(0, 0, -0.4)
  weapon.add(barrel)
  
  // 枪托
  const stockGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4)
  const stockMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 })
  const stock = new THREE.Mesh(stockGeometry, stockMaterial)
  stock.position.set(0, 0, 0.3)
  weapon.add(stock)
  
  // 扳机
  const triggerGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.05)
  const triggerMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 })
  const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial)
  trigger.position.set(0, -0.1, 0.1)
  weapon.add(trigger)
  
  scene.add(weapon)
}

//开火功能 
const fire = () => {
  if (isRecoiling.value) return
  recoilAnimation()
  
  // 枪口闪光效果
  const flashGeometry = new THREE.SphereGeometry(0.1, 16, 16)
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.8
  })
  const flash = new THREE.Mesh(flashGeometry, flashMaterial)
  flash.position.set(0, 0, -0.9)
  weapon.add(flash)

  // 50毫秒后移除闪光
  setTimeout(() => {
    weapon.remove(flash)
  }, 50)
}

// 后坐力动画
const recoilAnimation = () => {
  if (!weapon) return
  isRecoiling.value = true
  const startTime = Date.now()
  const duration = 200    // 动画持续时间(毫秒)
  const recoilDistance = 0.2  // 后坐距离

  const animateRecoil = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    // 使用缓动函数使动画更平滑
    const easeOut = 1 - Math.pow(1 - progress, 3)

    // 前半段：后坐
    if (progress < 0.5) {
      weapon.position.z = easeOut * recoilDistance
    } 
    // 后半段：复位
    else {
      weapon.position.z = recoilDistance - (easeOut - 0.5) * 2 * recoilDistance
    }
    
    // 动画结束
    if (progress >= 1) {
      weapon.position.z = 0
      isRecoiling.value = false
      return
    }
    
    animationId.value = requestAnimationFrame(animateRecoil)
  }
  
  animateRecoil()
}

// 重置相机
const resetCamera = () => {
  if (!camera || !controls) return
  camera.position.set(0, 0.5, 2)
  controls.target.set(0, 0, 0)
  controls.update()
}

//  动画循环 
const animate = () => {
  animationId.value = requestAnimationFrame(animate)
  controls.update()  // 更新控制器
  renderer.render(scene, camera)
}

//窗口大小调整 
const onWindowResize = () => {
  if (!container.value || !camera || !renderer) return
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

//生命周期钩子
  initScene()
  window.addEventListener('resize', onWindowResize)

onBeforeUnmount(() => {
  // 清理资源
  window.removeEventListener('resize', onWindowResize)
  cancelAnimationFrame(animationId.value)
  if (container.value && renderer?.domElement) {
    container.value.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
.page-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.button-group{
  position:absolute;
  bottom: 20px;
  left:50%;
  transform:translateX(-50%);
  display:flex;
  gap:10px;
}
button {
  padding: 8px 16px;
  margin: 0 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

canvas {
  width: 100%;
  height: 100%;
  background-color: aliceblue;
}
</style>