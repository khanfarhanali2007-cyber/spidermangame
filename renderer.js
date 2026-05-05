import * as THREE from "https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js";
import { camera } from "./camera.js";

// WebGL renderer with shadow support
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(0x87ceeb, 1);

// Handle color space (try both old and new API)
try {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
} catch (e) {
  renderer.outputEncoding = THREE.sRGBEncoding;
}
renderer.autoClear = true;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.autoUpdate = true;

// Position canvas absolutely and cover full viewport
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '0';

document.body.insertBefore(renderer.domElement, document.body.firstChild);

// Handle window resize
window.addEventListener('resize', () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);
