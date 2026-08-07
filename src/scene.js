import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfdf3e3);
  // 岛扩大到半径 54 后，雾和远裁剪面都得跟着推远，否则牧场那头会被雾吃掉/裁掉
  scene.fog = new THREE.Fog(0xfdf3e3, 120, 240);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(10, 13, 13);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, -2.6);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 150; // 岛大了，得拉得更远才看得全
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.25; // 保持斜俯视，不能钻到地下
  controls.update();

  const ambient = new THREE.AmbientLight(0xfff2dd, 0.75);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff3d6, 1.6);
  sun.position.set(14, 30, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); // 范围变大，加分辨率保住阴影清晰度
  sun.shadow.camera.far = 90;
  const s = 34;
  sun.shadow.camera.left = -s; sun.shadow.camera.right = s;
  sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xcfe6ff, 0.4);
  fill.position.set(-6, 5, -5);
  scene.add(fill);

  // 某些环境下页面初始化时窗口尺寸为 0，每帧校验一次尺寸最稳妥
  function ensureSize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (w === 0 || h === 0) return;
    const cur = renderer.getSize(new THREE.Vector2());
    if (cur.x !== w || cur.y !== h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  }
  window.addEventListener('resize', ensureSize);

  return { renderer, scene, camera, controls, ensureSize, lights: { sun, ambient, fill } };
}
