<template>
  <div class="page-content"></div>
  <div class="control-panel">
    <div class="control-group">
      <h3>子弹控制</h3>
      <div class="control-item">
        <label>子弹速度：</label>
        <input type="number" v-model.number="inputVelocity" min="1" max="500">
        <button @click="fireBullet">发射</button>
        <button @click="resetScene">重置场景</button>
      </div>
      <div class="control-item">
        <label>连续发射：</label>
        <input type="checkbox" v-model="continuousFire">
        <span v-if="continuousFire">间隔: <input type="number" v-model.number="fireInterval" min="100" max="2000" step="100">ms</span>
      </div>
    </div>

    <div class="control-group">
      <h3>木块设置</h3>
      <div class="control-item">
        <label>材质：</label>
        <select v-model="woodMaterial">
          <option value="wood">木材 (e=0.5)</option>
          <option value="metal">金属 (e=0.2)</option>
          <option value="plastic">塑料 (e=0.7)</option>
          <option value="rubber">橡胶 (e=0.9)</option>
        </select>
      </div>
      <div class="control-item">
        <label>倾斜角度：</label>
        <input type="range" v-model.number="woodAngle" min="-180" max="180" step="1">
        <span>{{ woodAngle }}°</span>
      </div>
    </div>

    <div class="control-group">
      <h3>物理参数</h3>
      <div class="control-item">
        <label>地面摩擦：</label>
        <button @click="toggleFriction">{{ frictionEnabled ? '关闭' : '开启' }}</button>
      </div>
      <div class="control-item">
        <label>击穿阈值：</label>
        <input type="number" v-model.number="penetrationThreshold" min="10" max="100">
      </div>
    </div>

    <div class="data-display">
      <h3>冲量数据</h3>
      <p>子弹速度: {{ bulletSpeed.toFixed(2) }} m/s</p>
      <p>木块速度: {{ woodSpeed.toFixed(2) }} m/s</p>
      <p>冲量大小: {{ impulse.toFixed(2) }} N·s</p>
      <p>能量损耗: {{ energyLoss.toFixed(2) }} J</p>
      <p v-if="penetrated" class="penetrated">击穿!</p>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 控制参数
const inputVelocity = ref(0)
const woodMaterial = ref('wood')
const woodAngle = ref(0)
const frictionEnabled = ref(false)
const penetrationThreshold = ref(30)
const continuousFire = ref(false)
const fireInterval = ref(500)

// 显示数据
const bulletSpeed = ref(0)
const woodSpeed = ref(0)
const impulse = ref(0)
const energyLoss = ref(0)
const penetrated = ref(false)

// 物理对象
let world, scene, camera, renderer, controls
let bulletBodies = [], bulletMeshes = [], bulletTrails = []
let woodBody, woodMesh
let groundBody
let fireTimer = null
let lastFireTime = 0

const restitutionMap = {
  wood: 0.5,
  metal: 0.2,
  plastic: 0.7,
  rubber: 0.9
}

const materialColors = {
  wood: 0x8B4513,
  metal: 0xC0C0C0,
  plastic: 0x1E90FF,
  rubber: 0x2E8B57
}

function createBullet() {
  const bulletRadius = 0.24
  const bulletMass = 0.1
  
  const bulletBody = new CANNON.Body({
    mass: bulletMass,
    shape: new CANNON.Sphere(bulletRadius),
    position: new CANNON.Vec3(-5, 1, 0),
    velocity: new CANNON.Vec3(inputVelocity.value, 0, 0),
    linearDamping: 0.01 //线性阻尼，模拟空气阻力，防止速度无限增大
  })
  
  world.addBody(bulletBody)
  
  const bulletMesh = new THREE.Mesh(
    new THREE.SphereGeometry(bulletRadius, 32, 32),
    new THREE.MeshStandardMaterial({ 
      color: 0x3333ff,
      metalness: 0.8,
      roughness: 0.3
    })
  )
  
  // 添加子弹尾迹
  const trailGeometry = new THREE.BufferGeometry()
  const trailMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00FFFF,
    transparent: true,
    opacity: 0.7
  })
  const trail = new THREE.Line(trailGeometry, trailMaterial)
  scene.add(trail)
  
  bulletBodies.push(bulletBody)
  bulletMeshes.push(bulletMesh)
  bulletTrails.push({ 
    mesh: trail,
    positions: [],
    maxPoints: 20
  })
  
  scene.add(bulletMesh)
  
  // 碰撞事件
  bulletBody.addEventListener('collide', (e) => {
    if (e.body === woodBody) {
      const v_before = bulletBody.velocity.x
      bulletSpeed.value = Math.abs(v_before)
      woodSpeed.value = Math.abs(woodBody.velocity.x)
      
      if (Math.abs(v_before) > penetrationThreshold.value) {
        // 击穿效果
        penetrated.value = true
        setTimeout(() => penetrated.value = false, 1000)
        
        const J = bulletMass * v_before
        const deltaV = J / woodBody.mass//速度变化量
        woodBody.velocity.x += deltaV
        bulletBody.velocity.x *= 0.85//保留85%的速度
        
        impulse.value = J
        energyLoss.value = 0.5 * bulletMass * v_before * v_before * 0.15
        
        // 击穿视觉效果
        createImpactEffect(e.contact.point, true)
      } else {
        // 未击穿
        const J = bulletMass * v_before
        const deltaV = J / woodBody.mass
        woodBody.velocity.x += deltaV * restitutionMap[woodMaterial.value]//弹性系数越大，木块的速度增量越大
        bulletBody.velocity.x = 0
        
        impulse.value = J * restitutionMap[woodMaterial.value]
        energyLoss.value = 0.5 * bulletMass * v_before * v_before * (1 - restitutionMap[woodMaterial.value])
        
        // 普通击中效果
        createImpactEffect(e.contact.point, false)
      }
    }
  })
  
  return bulletBody
}

function createImpactEffect(position, isPenetrated) {
  const color = isPenetrated ? 0xFF4500 : 0xFFD700
  const size = isPenetrated ? 0.5 : 0.3
  
  const particles = new THREE.BufferGeometry()
  const particleCount = 30
  const positions = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = position.x + (Math.random() - 0.5) * size
    positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * size
    positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * size
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  const particleMaterial = new THREE.PointsMaterial({
    color: color,
    size: 0.1,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
  })
  
  const particleSystem = new THREE.Points(particles, particleMaterial)
  scene.add(particleSystem)
  
  // 动画消失
  let opacity = 1
  const fadeInterval = setInterval(() => {
    opacity -= 0.05
    particleMaterial.opacity = opacity
    if (opacity <= 0) {
      clearInterval(fadeInterval)
      scene.remove(particleSystem)
    }
  }, 50)
}

function fireBullet() {
  if (Date.now() - lastFireTime < 100) return
  lastFireTime = Date.now()
  createBullet()
}

function resetScene() {
  // 清除所有子弹
  bulletBodies.forEach(body => world.removeBody(body))
  bulletMeshes.forEach(mesh => scene.remove(mesh))
  bulletTrails.forEach(trail => scene.remove(trail.mesh))
  
  bulletBodies = []
  bulletMeshes = []
  bulletTrails = []
  
  // 重置木块
  woodBody.position.set(0, 1.5, 0)
  woodBody.velocity.set(0, 0, 0)
  woodBody.angularVelocity.set(0, 0, 0)
  woodBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), woodAngle.value * Math.PI / 180)
  
  // 重置数据
  bulletSpeed.value = 0
  woodSpeed.value = 0
  impulse.value = 0
  energyLoss.value = 0
  penetrated.value = false
}

function toggleFriction() {
  frictionEnabled.value = !frictionEnabled.value
  groundBody.material.friction = frictionEnabled.value ? 0.4 : 0
}

function updateWoodMaterial() {
  woodBody.material.restitution = restitutionMap[woodMaterial.value]
  woodMesh.material.color.setHex(materialColors[woodMaterial.value])
  
  // 更新物理材质
  const woodMaterialPhys = new CANNON.Material("woodMaterial")
  woodMaterialPhys.restitution = restitutionMap[woodMaterial.value]
  woodBody.material = woodMaterialPhys
}

function updateWoodAngle() {
  woodBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), woodAngle.value * Math.PI / 180)
}

watch(woodMaterial, updateWoodMaterial)
watch(woodAngle, updateWoodAngle)
watch(continuousFire, (val) => {
  if (val) {
    fireTimer = setInterval(fireBullet, fireInterval.value)
  } else {
    clearInterval(fireTimer)
  }
})
watch(fireInterval, (val) => {
  if (continuousFire.value) {
    clearInterval(fireTimer)
    fireTimer = setInterval(fireBullet, val)
  }
})

onMounted(() => {
  const dom = document.querySelector('.page-content')
  
  // 初始化场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color( 0xadd8e6 )
  
  camera = new THREE.PerspectiveCamera(60, dom.clientWidth / dom.clientHeight, 0.1, 1000)
  camera.position.set(-8, 3, 8)
  camera.lookAt(0, 1, 0)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(dom.clientWidth, dom.clientHeight)
  renderer.shadowMap.enabled = true
  dom.appendChild(renderer.domElement)
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  
  // 初始化物理世界
  world = new CANNON.World()
  world.gravity.set(0, -9.82, 0)
  world.broadphase = new CANNON.SAPBroadphase(world)
  world.allowSleep = true
  
  // 地面
  const groundShape = new CANNON.Plane()
  const groundMaterial = new CANNON.Material("groundMaterial")
  groundMaterial.friction = 0
  
  groundBody = new CANNON.Body({ mass: 0, material: groundMaterial })
  groundBody.addShape(groundShape)
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  world.addBody(groundBody)
  
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.2
    })
  )
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.receiveShadow = true
  scene.add(groundMesh)
  
  // 木块
  const woodMass = 2
  const woodSize = [3, 3, 1.4]
  const woodMaterialPhys = new CANNON.Material("woodMaterial")
  woodMaterialPhys.restitution = restitutionMap[woodMaterial.value]
  
  woodBody = new CANNON.Body({
    mass: woodMass,
    shape: new CANNON.Box(new CANNON.Vec3(woodSize[0]/2, woodSize[1]/2, woodSize[2]/2)),
    position: new CANNON.Vec3(0, 1.5, 0),
    material: woodMaterialPhys
  })
  world.addBody(woodBody)
  
  woodMesh = new THREE.Mesh(
    new THREE.BoxGeometry(...woodSize),
    new THREE.MeshStandardMaterial({ 
      color: materialColors[woodMaterial.value],
      roughness: 0.7,
      metalness: woodMaterial.value === 'metal' ? 0.9 : 0.1
    })
  )
  woodMesh.position.copy(woodBody.position)
  woodMesh.castShadow = true
  woodMesh.receiveShadow = true
  scene.add(woodMesh)
  
  // 光源
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 10, 10)
  light.castShadow = true
  light.shadow.mapSize.width = 2048
  light.shadow.mapSize.height = 2048
  scene.add(light)
  
  scene.add(new THREE.AmbientLight(0xffffff, 0.3))
  
  // 动画循环
  function animate() {
    requestAnimationFrame(animate)
    
    world.step(1/60)
    
    // 更新木块
    woodMesh.position.copy(woodBody.position)
    woodMesh.quaternion.copy(woodBody.quaternion)
    
    // 更新子弹和尾迹
    for (let i = 0; i < bulletBodies.length; i++) {
      const bulletBody = bulletBodies[i]
      const bulletMesh = bulletMeshes[i]
      const trail = bulletTrails[i]
      
      bulletMesh.position.copy(bulletBody.position)
      bulletMesh.quaternion.copy(bulletBody.quaternion)
      
      // 更新尾迹
      trail.positions.push(bulletBody.position.x, bulletBody.position.y, bulletBody.position.z)
      if (trail.positions.length > trail.maxPoints * 3) {
        trail.positions.splice(0, 3)
      }
      
      trail.mesh.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(trail.positions, 3)
      )
      
      // 移除超出边界的子弹
      if (bulletBody.position.x > 15 || bulletBody.position.x < -15 || 
          bulletBody.position.y < -5 || Math.abs(bulletBody.position.z) > 15) {
        world.removeBody(bulletBody)
        scene.remove(bulletMesh)
        scene.remove(trail.mesh)
        bulletBodies.splice(i, 1)
        bulletMeshes.splice(i, 1)
        bulletTrails.splice(i, 1)
        i--
      }
    }
    
    controls.update()
    renderer.render(scene, camera)
  }
  
  animate()
  
  // 窗口大小调整
  window.addEventListener('resize', () => {
    camera.aspect = dom.clientWidth / dom.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(dom.clientWidth, dom.clientHeight)
  })
})

onBeforeUnmount(() => {
  if (fireTimer) clearInterval(fireTimer)
})
</script>

<style scoped>
html, body, #app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.page-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.control-panel {
  position: absolute;
  top: 20px;
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
.control-item input[type="range"],
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

.data-display h3 {
  margin: 0 0 8px 0;
  font-size: 15px;
}

.data-display p {
  margin: 4px 0;
  font-size: 13px;
}

.penetrated {
  color: #e77c3c;
  font-weight: bold;
  animation: flash 0.5s;
}

@keyframes flash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
  
  