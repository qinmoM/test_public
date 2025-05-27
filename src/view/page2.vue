<template>
    <div class="page-content">
        <div class="control-panel">
            <h3>Physics Controls</h3>
            <div class="control-group">
                <label>Gravity:</label>
                <input type="range" v-model="gravity" min="0" max="20" step="0.1" @input="updateGravity">
                <span>{{ gravity }}</span>
            </div>
            <div class="control-group">
                <label>Sphere 1 Mass:</label>
                <input type="range" v-model="sphere1Mass" min="0.1" max="10" step="0.1" @input="updatePhysics">
                <span>{{ sphere1Mass }}</span>
            </div>
            <div class="control-group">
                <label>Sphere 1 Velocity:</label>
                <input type="range" v-model="sphere1Velocity" min="-20" max="20" step="0.1" @input="updatePhysics">
                <span>{{ sphere1Velocity }}</span>
            </div>
            <div class="control-group">
                <label>Sphere 2 Mass:</label>
                <input type="range" v-model="sphere2Mass" min="0.1" max="10" step="0.1" @input="updatePhysics">
                <span>{{ sphere2Mass }}</span>
            </div>
            <div class="control-group">
                <label>Sphere 2 Velocity:</label>
                <input type="range" v-model="sphere2Velocity" min="-20" max="20" step="0.1" @input="updatePhysics">
                <span>{{ sphere2Velocity }}</span>
            </div>
            <button @click="resetSimulation">Reset Simulation</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import * as THREE from 'three';
import * as CANNON from 'cannon-es'; 
import { onMounted } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Reactive variables for controls
const gravity = ref(9.8);
const sphere1Mass = ref(1);
const sphere2Mass = ref(1);
const sphere1Velocity = ref(-5);
const sphere2Velocity = ref(5);

// Physics objects
let world, boxBody, phyCircle, phyCircle2;
// Three.js objects
let cirle1, cirle2, scene, camera, renderer;

onMounted(() => {
    let dom = document.querySelector('.page-content');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        45, 
        dom.clientWidth/dom.clientHeight, 
        0.1, 
        1000 
    );
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(dom.clientWidth, dom.clientHeight);
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
    const textureUrl = new URL('../assets/textures/laminate_floor_02_diff_4k.jpg', import.meta.url).href;
    const geometry = new THREE.BoxGeometry(15, 0.1, 15); 
    const texture = new THREE.TextureLoader().load(textureUrl);
    const material = new THREE.MeshBasicMaterial({ map: texture }); 
    const cube = new THREE.Mesh(geometry, material); 
    cube.position.copy(boxBody?.position || new THREE.Vector3(0, 0, 0));
    scene.add(cube);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
}

function setupPhysics() {
    const groundMaterial = new CANNON.Material('ground');
    const sphereMaterial = new CANNON.Material('sphere');
    
    // Create world
    const result = createWorld(groundMaterial);
    world = result.world;
    boxBody = result.boxBody;
    
    sphereMaterial.restitution = 1;
    const contactMaterial = new CANNON.ContactMaterial(
        groundMaterial,
        sphereMaterial,
        {
            friction: 0,
            restitution: 0
        }
    );
    world.addContactMaterial(contactMaterial);
    
    // Update gravity with reactive value
    world.gravity.set(0, -gravity.value, 0);
    
    // Create physics spheres
    phyCircle = createPhyCicle(sphereMaterial, 1, sphere1Mass.value, {x:0, y:1+0.05, z:5}, sphere1Velocity.value);
    phyCircle2 = createPhyCicle(sphereMaterial, 1, sphere2Mass.value, {x:0, y:1+0.05, z:-5}, sphere2Velocity.value);
    world.addBody(phyCircle);
    world.addBody(phyCircle2);
    
    // Create visual spheres
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
    const textureUrl = new URL('../assets/textures/terrazzo_tiles_diff_4k.jpg', import.meta.url).href;
    const material = new THREE.MeshBasicMaterial({ 
        map: new THREE.TextureLoader().load(textureUrl) 
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position.x, position.y, position.z);
    return sphere;
}

function updatePosition(basicCir, phyCircle) {
    basicCir.position.copy(phyCircle.position);
    basicCir.quaternion.copy(phyCircle.quaternion);
}

// Control functions
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
        
        // Need to update mass properties
        phyCircle.updateMassProperties();
        phyCircle2.updateMassProperties();
    }
}

function resetSimulation() {
    // Clear existing objects
    if (scene) {
        while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
        }
    }
    
    // Recreate everything
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
}

canvas {
    width: 100%;
    height: 100%;
    background-color: aliceblue;
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
    display: inline-block;
    width: 120px;
    margin-right: 10px;
}

.control-group input[type="range"] {
    width: 100px;
    vertical-align: middle;
}

.control-group span {
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