import * as THREE from "https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js";

/**
 * Generate a realistic city environment
 */
export function createCity(scene) {
  // Add a test cube to verify rendering works
  const testCubeGeom = new THREE.BoxGeometry(2, 2, 2);
  const testCubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const testCube = new THREE.Mesh(testCubeGeom, testCubeMat);
  testCube.position.set(5, 1, 0);
  testCube.castShadow = true;
  testCube.receiveShadow = true;
  scene.add(testCube);

  const axes = new THREE.AxesHelper(5);
  axes.position.set(5, 0, 0);
  scene.add(axes);

  const helperLight = new THREE.PointLight(0xffffff, 1.0, 50);
  helperLight.position.set(5, 10, 5);
  scene.add(helperLight);

  console.log('[City] Added test cube, axes helper, and helper light');

  // Ground plane
  const groundGeom = new THREE.PlaneGeometry(400, 400);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.8,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
  console.log('[City] Added ground, scene now has', scene.children.length, 'objects');

  // Create buildings in a grid pattern
  const gridSize = 10;
  const gridSpacing = 20;
  const buildingMaxHeight = 30;

  // Building materials
  const buildingMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x4488ff, metalness: 0.3, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.3, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: 0xccccee, metalness: 0.2, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.4 })
  ];

  for (let x = -gridSize / 2; x < gridSize / 2; x++) {
    for (let z = -gridSize / 2; z < gridSize / 2; z++) {
      const posX = x * gridSpacing;
      const posZ = z * gridSpacing;

      // Vary building height
      const heightVariation = Math.sin(x * 0.5) * Math.cos(z * 0.5) + 1;
      const buildingHeight = 5 + heightVariation * buildingMaxHeight * 0.5;

      // Vary building width/depth
      const widthVariation = Math.sin(x * 0.7) + 1;
      const depthVariation = Math.cos(z * 0.7) + 1;
      const buildingWidth = 8 + widthVariation * 2;
      const buildingDepth = 8 + depthVariation * 2;

      // Create building
      const buildingGeom = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
      const materialIndex = (Math.abs(x) + Math.abs(z)) % buildingMaterials.length;
      const building = new THREE.Mesh(buildingGeom, buildingMaterials[materialIndex]);
      
      building.position.set(posX, buildingHeight / 2, posZ);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);

      // Add windows to building
      addWindowsToBuilding(building, scene, buildingMaterials[materialIndex].color);

      // Add simple rooftop detail
      const rooftopGeom = new THREE.BoxGeometry(buildingWidth + 0.5, 0.5, buildingDepth + 0.5);
      const rooftopMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.3,
        roughness: 0.7
      });
      const rooftop = new THREE.Mesh(rooftopGeom, rooftopMat);
      rooftop.position.set(posX, buildingHeight + 0.25, posZ);
      rooftop.castShadow = true;
      rooftop.receiveShadow = true;
      scene.add(rooftop);
    }
  }

  // Create roads
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0
  });

  // Horizontal roads
  for (let x = -gridSize / 2; x <= gridSize / 2; x++) {
    const roadGeom = new THREE.PlaneGeometry(300, 3);
    const road = new THREE.Mesh(roadGeom, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.05, x * gridSpacing);
    road.receiveShadow = true;
    scene.add(road);
  }

  // Vertical roads
  for (let z = -gridSize / 2; z <= gridSize / 2; z++) {
    const roadGeom = new THREE.PlaneGeometry(3, 300);
    const road = new THREE.Mesh(roadGeom, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(z * gridSpacing, 0.05, 0);
    road.receiveShadow = true;
    scene.add(road);
  }
}

/**
 * Add windows to building for visual detail
 */
function addWindowsToBuilding(building, scene, buildingColor) {
  const windowSize = 0.8;
  const windowSpacing = 2;
  const buildingWidth = building.scale.x;
  const buildingHeight = building.scale.y;

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    metalness: 0.8,
    roughness: 0.2
  });

  // Add window lights
  for (let y = windowSpacing; y < buildingHeight * 3; y += windowSpacing) {
    for (let x = -buildingWidth * 1.5; x < buildingWidth * 1.5; x += windowSpacing) {
      const windowGeom = new THREE.PlaneGeometry(windowSize, windowSize);
      const windowMesh = new THREE.Mesh(windowGeom, windowMat);

      const probability = Math.random();
      if (probability > 0.3) {
        // Light on
        windowMesh.position.set(building.position.x + x, building.position.y + y - building.scale.y * 1.5, building.position.z + buildingWidth * 1.5);
        scene.add(windowMesh);
      }
    }
  }
}

/**
 * Create sky anchor points for web swinging
 */
export function createSkyAnchors(scene, count = 20) {
  const anchors = [];
  const distance = 100;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = 40 + Math.random() * 20;

    anchors.push(
      new THREE.Vector3(x, y, z)
    );

    // Optional: Add visual markers
    const markerGeom = new THREE.SphereGeometry(0.5, 8, 8);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      metalness: 0.9
    });
    const marker = new THREE.Mesh(markerGeom, markerMat);
    marker.position.set(x, y, z);
    scene.add(marker);
  }

  return anchors;
}