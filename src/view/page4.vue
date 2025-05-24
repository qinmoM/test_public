<template>
  <div class="scene-container">
    <div ref="container" class="three-scene"></div>
    <div class="button-group">
      <button @click="fire">开火</button>
      <button @click="resetCamera">重置视角</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 响应式数据
const container = ref(null)
const animationId = ref(null)
const isRecoiling = ref(false)

// Three.js对象
let scene, camera, renderer, controls, weapon

// 调试立方体（测试用）
const addDebugCube = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)
  console.log('调试立方体已添加')
}

// 场景初始化
const initScene = () => {
  console.log('初始化场景...')
  
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
  resetCamera()

  // 3. 创建渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true // 调试时透明背景
  })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)
  console.log('渲染器已创建', renderer.domElement)

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
  world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, groundMaterial))

  // 7. 创建地面（带错误处理）
  createGround().catch(console.error)

  // 8. 添加坐标轴辅助
  const axesHelper = new THREE.AxesHelper(5) // 增大辅助线尺寸
  scene.add(axesHelper)

  // 9. 创建武器模型
  createWeaponModel()

  // 调试：添加红色立方体
  addDebugCube()

  // 10. 开始动画循环
  animate()
}

// 创建地面（带错误处理）
const createGround = async () => {
  try {
    const geometry = new THREE.BoxGeometry(15, 0.1, 15)
    const textureUrl = new URL('../assets/textures/laminate_floor_02_diff_4k.jpg', import.meta.url).href
    
    const texture = await new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        textureUrl,
        resolve,
        undefined,
        reject
      )
    })
    
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      side: THREE.DoubleSide // 双面渲染
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(0, -0.05, 0)
    scene.add(cube)
    console.log('地面创建成功')
  } catch (error) {
    console.error('地面创建失败:', error)
    // 回退方案：使用纯色地面
    const geometry = new THREE.BoxGeometry(15, 0.1, 15)
    const material = new THREE.MeshBasicMaterial({ color: 0x888888 })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(0, -0.05, 0)
    scene.add(cube)
  }
}

// 物理世界创建
const createWorld = (groundMaterial) => {
  const world = new CANNON.World()
  world.gravity.set(0, -9.82, 0)
  
  const groundShape = new CANNON.Box(new CANNON.Vec3(7.5, 0.05, 7.5))
  const boxBody = new CANNON.Body({
    mass: 0,
    shape: groundShape,
    material: groundMaterial,
    position: new CANNON.Vec3(0, -0.05, 0)
  })
  world.addBody(boxBody)
  
  return { world, boxBody }
}

// 武器模型创建
const createWeaponModel = () => {
  weapon = new THREE.Group()
  weapon.position.set(0, 0, 0) // 确保初始位置正确
  // 枪身
  const bodyGeometry = new THREE.BoxGeometry(1, 0.2, 0.1)
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x555555,
    shininess: 30
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  weapon.add(body)
  
  // 枪管
  const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 32)
  barrelGeometry.rotateX(Math.PI / 2)
  const barrelMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    specular: 0x111111
  })
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
  console.log('武器模型已创建', weapon)
}

// 开火功能
const fire = () => {
  if (isRecoiling.value || !weapon) return
  isRecoiling.value = true
  
  // 枪口闪光
  const flash = createMuzzleFlash()
  weapon.add(flash)
  
  // 后坐力动画
  recoilAnimation(() => {
    weapon.remove(flash)
    isRecoiling.value = false
  })
}

const createMuzzleFlash = () => {
  const geometry = new THREE.SphereGeometry(0.1, 16, 16)
  const material = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.8
  })
  const flash = new THREE.Mesh(geometry, material)
  flash.position.set(0, 0, -0.9)
  return flash
}

// 改进的后坐力动画
const recoilAnimation = (onComplete) => {
  const duration = 200
  const distance = 0.2
  let startTime = null

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数
    const ease = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2
    
    weapon.position.z = progress < 0.5 
      ? ease * distance 
      : distance - (ease - 0.5) * 2 * distance

    if (progress < 1) {
      animationId.value = requestAnimationFrame(animate)
    } else {
      weapon.position.z = 0
      onComplete?.()
    }
  }
  
  animationId.value = requestAnimationFrame(animate)
}

// 重置相机
const resetCamera = () => {
  if (!camera || !controls) return
  camera.position.set(0, 1.5, 3) // 调整到更好的观察位置
  controls.target.set(0, 0, 0)
  controls.update()
  console.log('相机已重置', camera.position)
}

// 动画循环
const animate = () => {
  animationId.value = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

// 窗口大小调整
const onWindowResize = () => {
  if (!container.value || !camera || !renderer) return
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

// 生命周期
onMounted(() => {
  if (!container.value) {
    console.error('容器元素未找到!')
    return
  }
  initScene()
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  cancelAnimationFrame(animationId.value)
  if (container.value && renderer?.domElement) {
    container.value.removeChild(renderer.domElement)
  }
})
</script>

<style scoped>
.scene-container {
  display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.three-scene {
  width: 100%;
  height: 100%;
  display: block;
}

.button-group {
  position: absolute;
  top: 80px;
  left: 55%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-width: 100px;
}

button:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

button:active {
  transform: translateY(0);
}
</style>