<template>
  <div class="page-content">
      <div class="control-panel">
          <h3>物理模拟控制</h3>
          <div class="control-group">
              <label>重力加速度:</label>
              <input type="range" v-model="gravity" min="0" max="20" step="0.1" @input="updateGravity">
              <span>{{ gravity }} m/s²</span>
          </div>
          <div class="control-group">
              <label>小球1质量:</label>
              <input type="range" v-model="sphere1Mass" min="0.1" max="10" step="0.1" @input="updatePhysics">
              <span>{{ sphere1Mass }} kg</span>
          </div>
          <div class="control-group">
              <label>小球1初速度:</label>
              <input type="range" v-model="sphere1Velocity" min="-10" max="10" step="0.1" @input="updatePhysics">
              <span>{{ sphere1Velocity }} m/s</span>
          </div>
          <div class="control-group">
              <label>小球2质量:</label>
              <input type="range" v-model="sphere2Mass" min="0.1" max="10" step="0.1" @input="updatePhysics">
              <span>{{ sphere2Mass }} kg</span>
          </div>
          <div class="control-group">
              <label>小球2初速度:</label>
              <input type="range" v-model="sphere2Velocity" min="-10" max="10" step="0.1" @input="updatePhysics">
              <span>{{ sphere2Velocity }} m/s</span>
          </div>
          <button @click="resetSimulation">重置模拟</button>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as THREE from 'three';
import * as CANNON from 'cannon-es'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const gravity = ref(9.8);
const sphere1Mass = ref(1);
const sphere2Mass = ref(1);
const sphere1Velocity = ref(-2);
const sphere2Velocity = ref(2);

let world, boxBody, phyCircle, phyCircle2;
let cirle1, cirle2, scene, camera, renderer;

onMounted(() => {
  let dom = document.querySelector('.page-content');
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xadd8e6 )

  camera = new THREE.PerspectiveCamera(
      45, 
      dom.clientWidth/dom.clientHeight, 
      0.1, 
      1000 
  );
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(dom.clientWidth, dom.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  dom.appendChild(renderer.domElement);

  setupScene();
  setupPhysics();
  setupCameraAndControls();
  animate();

  window.addEventListener("resize", () => {
      renderer.setSize(dom.clientWidth, dom.clientHeight);
      camera.aspect = dom.clientWidth / dom.clientHeight;
      camera.updateProjectionMatrix();
  });
});

function setupScene() {
  const geometry = new THREE.BoxGeometry(15, 0.1, 15); 
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const cube = new THREE.Mesh(geometry, material); 
  cube.position.copy(boxBody?.position || new THREE.Vector3(0, 0, 0));
  cube.receiveShadow = true;
  scene.add(cube);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  light.castShadow = true;
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
}

function setupPhysics() {
  const groundMaterial = new CANNON.Material('ground');
  const sphereMaterial = new CANNON.Material('sphere');

  const result = createWorld(groundMaterial);
  world = result.world;
  boxBody = result.boxBody;

  sphereMaterial.restitution = 1;
  const contactMaterial = new CANNON.ContactMaterial(
      groundMaterial,
      sphereMaterial,
      {
          friction: 0,
          restitution: 0.5
      }
  );
  world.addContactMaterial(contactMaterial);

  world.gravity.set(0, -gravity.value, 0);

  phyCircle = createPhyCicle(sphereMaterial, 1, sphere1Mass.value, {x:0, y:1+0.05, z:5}, sphere1Velocity.value);
  phyCircle2 = createPhyCicle(sphereMaterial, 1, sphere2Mass.value, {x:0, y:1+0.05, z:-5}, sphere2Velocity.value);
  world.addBody(phyCircle);
  world.addBody(phyCircle2);

  cirle1 = createBasicCircle(1, {x:0, y:1+0.05, z:5});
  cirle2 = createBasicCircle(1, {x:0, y:1+0.05, z:-5});

  scene.add(cirle1);
  scene.add(cirle2);
}

function setupCameraAndControls() {
  camera.position.set(20, 5, 2);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
}

function animate() {
  requestAnimationFrame(animate);

  if (world) world.step(1/60);
  if (cirle1 && phyCircle) updatePosition(cirle1, phyCircle);
  if (cirle2 && phyCircle2) updatePosition(cirle2, phyCircle2);

  renderer.render(scene, camera);
}

const createWorld = (groundMaterial) => {
  const world = new CANNON.World();
  world.gravity.set(0, -gravity.value, 0);
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.solver.iterations = 10;

  const boxPenal = new CANNON.Box(new CANNON.Vec3(7.5, 0.1, 7.5));
  const boxBody = new CANNON.Body({
      shape: boxPenal,
      position: new CANNON.Vec3(0, 0, 0),
      type: CANNON.Body.STATIC,
      material: groundMaterial
  });

  world.addBody(boxBody);
  return { world, boxBody };
};

function createPhyCicle(sphereMaterial, radius, mass, position, v0 = 0) {
  const sphereShape = new CANNON.Sphere(radius);
  const sphereBody = new CANNON.Body({
      mass: mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: sphereMaterial
  });
  sphereBody.velocity = new CANNON.Vec3(0, 0, v0);
  sphereBody.addShape(sphereShape);
  return sphereBody;
}

function createBasicCircle(radius, position) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
  const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget);
  scene.add(cubeCamera);

  const material = new THREE.MeshStandardMaterial({ 
      color: 0x000000,
      metalness: 1.0,
      roughness: 0.1,
      envMap: cubeRenderTarget.texture
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(position.x, position.y, position.z);
  sphere.castShadow = true;

  // 设置反射用 cube camera 跟随小球更新
  sphere.userData.cubeCamera = cubeCamera;

  return sphere;
}

function updatePosition(basicCir, phyCircle) {
  basicCir.position.copy(phyCircle.position);
  basicCir.quaternion.copy(phyCircle.quaternion);
  if (basicCir.userData.cubeCamera) {
      basicCir.userData.cubeCamera.position.copy(basicCir.position);
      basicCir.userData.cubeCamera.update(renderer, scene);
  }
}

function updateGravity() {
  if (world) {
      world.gravity.set(0, -gravity.value, 0);
  }
}

function updatePhysics() {
  if (phyCircle && phyCircle2) {
      phyCircle.mass = sphere1Mass.value;
      phyCircle.velocity.z = sphere1Velocity.value;
      phyCircle2.mass = sphere2Mass.value;
      phyCircle2.velocity.z = sphere2Velocity.value;

      phyCircle.updateMassProperties();
      phyCircle2.updateMassProperties();
  }
}

function resetSimulation() {
  if (scene) {
      while(scene.children.length > 0) { 
          scene.remove(scene.children[0]); 
      }
  }

  setupScene();
  setupPhysics();
}
</script>

<style scoped>
.page-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #ffffff;
}

canvas {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.8);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-width: 300px;
}

.control-panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.control-group {
  margin-bottom: 10px;
}

.control-group label {
  color: black;
  display: inline-block;
  width: 120px;
  margin-right: 10px;
}

.control-group input[type="range"] {
  width: 100px;
  vertical-align: middle;
}

.control-group span {
  color: black;
  display: inline-block;
  width: 40px;
  text-align: right;
  margin-left: 5px;
}

button {
  margin-top: 10px;
  padding: 5px 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #45a049;
}
</style>

