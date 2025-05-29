<template>
  <div class="scene-container">
    <div ref="container" class="three-scene"></div>
  </div>
  <div class="control-panel">
    <div class="control-group">
      <h2>反冲模型</h2>
      <div class="control-item">
        <label>子弹速度：</label>
        <input type="number" v-model.number="inputVelocity" min="1" max="500">
        <button @click="fire">开火</button>
        <button @click="resetCamera">重置视角</button>
      </div>
    </div>

    <div class="data-display">
      <h3>冲量数据</h3>
      <p>子弹速度: {{ bulletSpeed.toFixed(2) }} m/s</p>
      <p>冲量大小: {{ impulse.toFixed(2) }} N·s</p>
      <p>能量损耗: {{ energyLoss.toFixed(2) }} J</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'; //加载blender模型
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 响应式数据
const container = ref(null)
const animationId = ref(null)
const isRecoiling = ref(false)//是否处于后坐力状态
const inputVelocity = ref(100)//输入速度

// 显示数据
const bulletSpeed = ref(0)//子弹速度
const impulse = ref(0)//冲量 
const energyLoss = ref(0)//能量损耗

// 使用reactive管理物理数据
const physicsData = reactive({
  bulletSpeed: 0,
  impulse: 0,
  energyLoss: 0
})

// Three.js对象
let scene, camera, renderer, controls, weapon

// 计算物理数据
const calculatePhysics = (velocity) => {
  // 假设武器质量为5kg
  const weaponMass = 5 
  // 假设子弹质量为0.01kg
  const bulletMass = 0.01 
  
  // 根据动量守恒定律计算
  physicsData.bulletSpeed = velocity
  physicsData.impulse = bulletMass * velocity
  physicsData.energyLoss = 0.5 * bulletMass * velocity * velocity
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
  resetCamera()

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

  // 10. 开始动画循环
  animate()
}

// 创建地面（带错误处理）
const createGround = async () => {
  try {
    const geometry = new THREE.BoxGeometry(15, 0.01, 15)
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
  //加载blender模型
const loader = new GLTFLoader();
//加载模型
loader.load(
    new URL('../assets/model/Revolver_Wushu.gltf', import.meta.url).href, //模型的路径
    (gltf) => { //加载成功的回调函数
        console.log('Model loaded successfully');
        weapon = gltf.scene; //获取模型
        weapon.scale.set(5, 5, 5) //缩放模型
        //将模型沿y轴旋转180度
        weapon.rotation.y = Math.PI // 绕Y轴旋转180度
        weapon.position.set(2, 0.5, 0) // 确保初始位置正确
        // //旋转90
        // weapon.rotation.y = -Math.PI/2  // 绕X轴旋转90度
        scene.add(weapon) //添加模型到场景中
    },
    undefined, //加载进度的回调函数
    (error) => { //加载失败的回调函数
        console.error('An error happened', error);
    }
)}

// 开火功能
const fire = () => {
  if (isRecoiling.value || !weapon) return
  isRecoiling.value = true
  // 计算物理数据
  calculatePhysics(inputVelocity.value)
  //创建粒子火花
  createMuzzleParticles()
  // 枪口闪光
  const flash = createMuzzleFlash()
  weapon.add(flash)
  
  // 后坐力动画
  recoilAnimation(() => {
    weapon.remove(flash)
    isRecoiling.value = false
  })
}
// 修正后的枪口闪光（向前扩散）
const createMuzzleFlash = () => {
  const group = new THREE.Group()
  
  // 核心闪光
  const coreGeometry = new THREE.SphereGeometry(0.01, 0.1, 0.1)
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.9
  })
  const core = new THREE.Mesh(coreGeometry, coreMaterial)
  
  // 光晕
  const haloGeometry = new THREE.PlaneGeometry(0.1, 0.1)
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8c00,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  })
  const halo = new THREE.Mesh(haloGeometry, haloMaterial)
  halo.rotation.x = Math.PI / 2
  
  group.add(core)
  group.add(halo)
  group.position.set(0.5, 0.1, 0) // 保持原始Y轴位置

  // 闪光动画（只向前扩散）
  let scale = 1
  const animate = () => {
    scale += 0.2
    core.scale.set(scale, scale, scale)
    halo.scale.set(scale * 2, scale * 2, 1)
    core.material.opacity *= 0.9
    halo.material.opacity *= 0.85
    
    // 轻微向前移动（Z轴负方向）
    group.position.x += 0.02
    
    if (core.material.opacity > 0.05) {
      requestAnimationFrame(animate)
    }
  }
  animate()
  
  return group
}

// 粒子效果（向前扩散）
const createMuzzleParticles = () => {
  const particles = new THREE.BufferGeometry()
  const count = 1
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  
  //更深的火焰色系
  const fireColors=[
    0xFF4500,//深红橙
    0xFF6347,//番茄红
    0xFF8C00 //深橙
  ]
  
  for (let i = 0; i < count; i++) {
    // 锥形向前分布
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 0.1
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = Math.sin(angle) * radius // 移除*2，避免向上偏移
    positions[i * 3 + 2] = 0 // 保持Z轴位置为0
    
    // 从深色火焰色系中随机选择
    const colorHex = fireColors[Math.floor(Math.random() * fireColors.length)]
    const color = new THREE.Color(colorHex)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particles.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })
  
  const particleSystem = new THREE.Points(particles, particleMaterial)
  particleSystem.position.set(0.5, 0.1, 0) // 保持原始Y轴位置
  
  // 粒子动画（只向前运动）
  let life = 0
  const maxLife = 30
  const animate = () => {
    life++
    const positions = particles.attributes.position.array
    
    for (let i = 0; i < count; i++) {
      // positions[i * 3] += 0.05  // 只向前移动
      positions[i*3]+=(0.1-((0.1/maxLife)*life));
    }
    
    particles.attributes.position.needsUpdate = true
    
    if (life < maxLife) {
      requestAnimationFrame(animate)
    } else {
      weapon.remove(particleSystem)
    }
  }
  
  weapon.add(particleSystem)
  animate()
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
  camera.position.set(0, 1.5, 6) // 调整到更好的观察位置
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
  // 1. 停止所有动画循环
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
    animationId.value = null;
  }
  window.removeEventListener('resize', onWindowResize)
  cancelAnimationFrame(animationId.value)
  //销毁渲染器
  if(renderer){
    // 强制释放WebGL上下文
    renderer.dispose();
    const context = renderer.getContext();
    if (context && context.getExtension) {
      const loseContext = context.getExtension('WEBGL_lose_context');
      if (loseContext) loseContext.loseContext();
  }
  }
  // 3. 清理场景资源
  if (scene) {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        // 释放几何体和材质
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material?.dispose();
        }
        
        // 释放纹理
        if (obj.material?.map) obj.material.map.dispose();
      }
      
      // 释放光源
      if (obj.isLight) {
        obj.dispose();
      }
    });
    scene = null;
  }

  // 4. 销毁控制器
  if (controls) {
    controls.dispose();
    controls = null;
  }

  // 5. 移除事件监听
  window.removeEventListener('resize', onWindowResize);
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

.control-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  font-size: 14px;
  max-width: 300px;
  backdrop-filter: blur(5px);
}

.control-group {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.control-group h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.control-item {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.control-item label {
  min-width: 80px;
  margin-right: 10px;
  font-weight: 500;
}

.control-item input[type="number"],
.control-item select {
  flex: 1;
  margin: 0 8px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.control-item button {
  padding: 6px 12px;
  margin-left: 8px;
  background-color: #4a6baf;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-item button:hover {
  background-color: #3a5a9f;
}

.data-display {
  background: rgba(240, 240, 240, 0.7);
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
}

.data-display h2 {
  margin: 0 0 8px 0;
  font-size: 15px;
}

.data-display p {
  margin: 4px 0;
  font-size: 13px;
}
</style>