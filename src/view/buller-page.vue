<template>
  <div class="page-content">

  </div>
</template>
<script setup>
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { onMounted } from 'vue'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

onMounted(() => {
  const dom = document.querySelector('.page-content')
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, dom.clientWidth / dom.clientHeight, 0.1, 1000)
  camera.position.set(-8, 3, 8)
  camera.lookAt(0, 1, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(dom.clientWidth, dom.clientHeight)
  dom.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)

  // 物理世界
  const world = new CANNON.World()
  world.gravity.set(0, -9.82, 0)

  // 地面
  const groundShape = new CANNON.Plane()
  const groundBody = new CANNON.Body({ mass: 0 })
  groundBody.addShape(groundShape)
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  world.addBody(groundBody)
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  )
  groundMesh.rotation.x = -Math.PI / 2
  scene.add(groundMesh)

  // 木块
  const woodMass = 2
  const woodSize = [1, 1, 0.4]
  const woodBody = new CANNON.Body({
    mass: woodMass,
    shape: new CANNON.Box(new CANNON.Vec3(woodSize[0]/2, woodSize[1]/2, woodSize[2]/2)),
    position: new CANNON.Vec3(0, 1, 0)
  })
  world.addBody(woodBody)
  const woodMesh = new THREE.Mesh(
    new THREE.BoxGeometry(...woodSize),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  )
  woodMesh.position.copy(woodBody.position)
  scene.add(woodMesh)

  // 子弹
  const bulletMass = 0.05
  const bulletRadius = 0.08
  const bulletVelocity = 40
  const penetrationThreshold = 30 // 击穿速度阈值

  const bulletBody = new CANNON.Body({
    mass: bulletMass,
    shape: new CANNON.Sphere(bulletRadius),
    position: new CANNON.Vec3(-5, 1, 0),
    velocity: new CANNON.Vec3(bulletVelocity, 0, 0)
  })
  world.addBody(bulletBody)
  const bulletMesh = new THREE.Mesh(
    new THREE.SphereGeometry(bulletRadius, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x3333ff })
  )
  bulletMesh.position.copy(bulletBody.position)
  scene.add(bulletMesh)

  // 光源
  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(10, 10, 10)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.3))

  // 冲量模型：子弹击穿木块
  bulletBody.addEventListener('collide', (e) => {
    if (e.body === woodBody) {
      const v_before = bulletBody.velocity.x
      if (Math.abs(v_before) > penetrationThreshold) {
        // 击穿：木块获得全部冲量，子弹略减速
        const J = bulletMass * v_before
        const deltaV = J / woodMass
        woodBody.velocity.x += deltaV
        bulletBody.velocity.x *= 0.85 // 模拟能量损耗
      } else {
        // 未击穿：子弹停下，木块获得部分冲量
        const J = bulletMass * v_before
        const deltaV = J / woodMass
        woodBody.velocity.x += deltaV * 0.5
        bulletBody.velocity.x = 0
      }
    }
  })

  // 动画循环
  function animate() {
    requestAnimationFrame(animate)
    world.step(1/60)
    woodMesh.position.copy(woodBody.position)
    woodMesh.quaternion.copy(woodBody.quaternion)
    bulletMesh.position.copy(bulletBody.position)
    bulletMesh.quaternion.copy(bulletBody.quaternion)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
})
</script>
<style scoped>
.page-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>