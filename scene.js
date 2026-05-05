import * as THREE from "https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js";

// Three.js scene with proper lighting and environment
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 200, 800); // Extended fog range

// Ambient light for general illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
scene.add(ambientLight);

// Directional light for realistic shadows and depth
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
directionalLight.position.set(60, 120, 60);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.left = -150;
directionalLight.shadow.camera.right = 150;
directionalLight.shadow.camera.top = 150;
directionalLight.shadow.camera.bottom = -150;
directionalLight.shadow.camera.far = 800;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.bias = -0.001;
scene.add(directionalLight);

// Hemisphere light for better ambient lighting
const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a4a4a, 0.4);
scene.add(hemisphereLight);

export { directionalLight };
