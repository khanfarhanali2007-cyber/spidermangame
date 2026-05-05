import * as THREE from "https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js";

// Perspective camera for third-person view
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camera.position.set(15, 16, 25);
camera.lookAt(5, 1.5, 5);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
