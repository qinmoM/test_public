<template>
    <div class="page-content">
    </div>
    <button @click="fire">开火</button>
    <button @click="resetCamera">重置视角</button>
</template>
<script setup>
import * as THREE from 'three';
import * as CANNON from 'cannon-es'; 
import { onMounted } from 'vue';
// import { ref, onMounted } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; //引入轨道控制器
onMounted(()=>{
let dom = document.querySelector('.page-content')
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
const camera = new THREE.PerspectiveCamera(
  75, 
  dom.clientWidth/dom.clientHeight, 
  0.1, 
  1000 
)
//创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(dom.clientWidth, dom.clientHeight) 
renderer.setPixelRatio(window.devicePixelRatio)
dom.appendChild(renderer.domElement) 

const groundMaterial = new CANNON.Material('ground')
const {world, boxBody} = createWorld(groundMaterial)
const contactMaterial = new CANNON.ContactMaterial(
    groundMaterial
)
world.addContactMaterial(contactMaterial) //添加接触材质
const textureUrl = new URL('../assets/textures/laminate_floor_02_diff_4k.jpg', import.meta.url).href
const geometry = new THREE.BoxGeometry(15, 0.1, 15) 
const texture = new THREE.TextureLoader().load(textureUrl, () => {
  console.log('Texture loaded');
}, undefined, (error) => {
  console.error('An error happened', error);
});
const material = new THREE.MeshBasicMaterial({ map: texture }) 
const cube = new THREE.Mesh(geometry, material) 
cube.position.copy(boxBody.position)
// 添加轨道控制器
controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      // 添加光源
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      // 创建武器模型
      createWeaponModel();
      // 添加坐标轴辅助
      const axesHelper = new THREE.AxesHelper(1);
      scene.add(axesHelper);
      // 开始动画循环
      animate();
})
    // 创建简易武器模型
    const createWeaponModel = () => {
      weapon = new THREE.Group();
      // 枪身
      const bodyGeometry = new THREE.BoxGeometry(1, 0.2, 0.1);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      weapon.add(body);
      // 枪管
      const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 32);
      barrelGeometry.rotateX(Math.PI / 2);
      const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(0, 0, -0.4);
      weapon.add(barrel);
      // 枪托
      const stockGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4);
      const stockMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      const stock = new THREE.Mesh(stockGeometry, stockMaterial);
      stock.position.set(0, 0, 0.3);
      weapon.add(stock);
      // 扳机
      const triggerGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.05);
      const triggerMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
      const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
      trigger.position.set(0, -0.1, 0.1);
      weapon.add(trigger);
      scene.add(weapon);
    };
    // 反冲动画
    const recoilAnimation = () => {
      if (!weapon) return;
      isRecoiling = true;
      const startTime = Date.now();
      const duration = 200; // 动画持续时间(ms)
      const recoilDistance = 0.2; // 反冲距离
      const animateRecoil = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // 使用缓动函数使动画更自然
        const easeOut = 1 - Math.pow(1 - progress, 3);

        if (progress < 0.5) {
          // 反冲阶段
          weapon.position.z = easeOut * recoilDistance;
        } else {
          // 恢复阶段
          weapon.position.z = recoilDistance - (easeOut - 0.5) * 2 * recoilDistance;
        }
        if (progress >= 1) {
          weapon.position.z = 0;
          isRecoiling = false;
          return;
        }
        animationId = requestAnimationFrame(animateRecoil);
      };
      animateRecoil();
    };
    // 开火函数
    const fire = () => {
      if (isRecoiling) return;
      recoilAnimation();
      // 添加枪口闪光效果
      const flashGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
      });
      const flash = new THREE.Mesh(flashGeometry, flashMaterial);
      flash.position.set(0, 0, -0.9);
      weapon.add(flash);

      // 闪光消失动画
      setTimeout(() => {
        weapon.remove(flash);
      }, 50);
    };
    // 重置相机位置
    const resetCamera = () => {
      if (!camera || !controls) return;
      camera.position.set(0, 0.5, 2);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    // 动画循环
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    // 窗口大小调整
    const onWindowResize = () => {
      if (!container.value || !camera || !renderer) return;
      camera.aspect = container.value.clientWidth / container.value.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.value.clientWidth, container.value.clientHeight);
    };

    // 生命周期钩子
    onMounted(() => {
      initScene();
      window.addEventListener('resize', onWindowResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationId);
      if (container.value && renderer?.domElement) {
        container.value.removeChild(renderer.domElement);
      }
    });
    const container = ref(null); //chuangjian一个响应式对象，他会根据数据的变化而变化，
    // 假如container的值发生变化，页面会自动更新
const fire_1 = ref(null); //创建一个响应式对象
// onMounted(() => { //元素被挂在时被自动调用
// });
</script>
<style scoped>
.page-content{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
button {
  padding: 8px 16px;
  margin: 0 5px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #45a049;
}
canvas{
    width: 100%;
    height: 100%;
    background-color: aliceblue;
}
</style>