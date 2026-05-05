import * as THREE from "https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js";

/**
 * Creates a procedural Spider-Man character model
 * Features: 3D humanoid shape with proper hierarchy
 */
export function createPlayer(scene) {
  const player = new THREE.Group();
  player.name = "player";

  // Body
  const bodyGeom = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12);
  const bodyMat = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    metalness: 0.3,
    roughness: 0.4
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = 0.8;
  player.add(body);

  // Head
  const headGeom = new THREE.SphereGeometry(0.32, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    metalness: 0.3,
    roughness: 0.4
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.castShadow = true;
  head.receiveShadow = true;
  head.position.y = 1.7;
  
  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.12, 0.1, 0.2);
  head.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.12, 0.1, 0.2);
  head.add(rightEye);

  // Pupils
  const pupilGeom = new THREE.SphereGeometry(0.04, 8, 8);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
  leftPupil.position.set(-0.12, 0.1, 0.27);
  head.add(leftPupil);
  
  const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
  rightPupil.position.set(0.12, 0.1, 0.27);
  head.add(rightPupil);

  player.add(head);

  // Arms
  const armGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
  const armMat = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    metalness: 0.3,
    roughness: 0.4
  });

  const leftArm = new THREE.Mesh(armGeom, armMat);
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  leftArm.position.set(-0.55, 1.0, 0);
  leftArm.rotation.z = 0.3;
  player.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, armMat);
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  rightArm.position.set(0.55, 1.0, 0);
  rightArm.rotation.z = -0.3;
  player.add(rightArm);

  // Legs
  const legGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
  const legMat = new THREE.MeshStandardMaterial({ 
    color: 0x220000,
    metalness: 0.3,
    roughness: 0.4
  });

  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  leftLeg.position.set(-0.25, 0.4, 0);
  player.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, legMat);
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  rightLeg.position.set(0.25, 0.4, 0);
  player.add(rightLeg);

  // Hands (web shooters)
  const handGeom = new THREE.SphereGeometry(0.08, 8, 8);
  const handMat = new THREE.MeshStandardMaterial({ 
    color: 0xffaa00,
    metalness: 0.5,
    roughness: 0.3
  });

  const leftHand = new THREE.Mesh(handGeom, handMat);
  leftHand.castShadow = true;
  leftHand.position.set(-0.55, 0.5, 0);
  player.add(leftHand);

  const rightHand = new THREE.Mesh(handGeom, handMat);
  rightHand.castShadow = true;
  rightHand.position.set(0.55, 0.5, 0);
  player.add(rightHand);

  // Physics properties
  player.position.set(5, 1.5, 5);
  player.velocity = new THREE.Vector3();
  player.acceleration = new THREE.Vector3();
  player.isGrounded = false;
  player.isJumping = false;

  // Character stats
  player.health = 100;
  player.maxHealth = 100;
  player.speed = 0.1;
  player.sprintSpeed = 0.15;
  player.jumpForce = 0.4;
  player.mass = 1;
  player.friction = 0.85;
  player.groundDrag = 0.9;
  player.airDrag = 0.95;

  // Animation state
  player.animationState = {
    idle: true,
    walking: false,
    running: false,
    jumping: false,
    attacking: false,
    swinging: false,
    legSwing: 0,
    armSwing: 0
  };

  // Store references for animation
  player.parts = {
    body, head, leftArm, rightArm, leftLeg, rightLeg, leftHand, rightHand
  };

  console.log('[Player] Adding player to scene. Player children:', player.children.length);
  scene.add(player);
  console.log('[Player] Player added. Scene now has', scene.children.length, 'objects');
  return player;
}

/**
 * Update player physics and movement
 */
export function updatePlayer(player, keys, isSwinging = false) {
  // Movement input
  let moveX = 0;
  let moveZ = 0;
  
  if (keys['w'] || keys['W']) moveZ -= 1;
  if (keys['s'] || keys['S']) moveZ += 1;
  if (keys['a'] || keys['A']) moveX -= 1;
  if (keys['d'] || keys['D']) moveX += 1;

  // Normalize movement
  const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
  if (moveLength > 0) {
    moveX /= moveLength;
    moveZ /= moveLength;
  }

  // Sprint
  const isSprinting = keys['Shift'];
  const moveSpeed = isSprinting ? player.sprintSpeed : player.speed;

  // Apply movement (only when not swinging)
  if (!isSwinging) {
    player.velocity.x += moveX * moveSpeed;
    player.velocity.z += moveZ * moveSpeed;

    // Update animation state
    if (moveLength > 0) {
      player.animationState.walking = !isSprinting;
      player.animationState.running = isSprinting;
    } else {
      player.animationState.walking = false;
      player.animationState.running = false;
    }
  }

  // Jump
  if ((keys[' '] || keys['Space']) && player.isGrounded && !player.isJumping) {
    player.isJumping = true;
    player.velocity.y += player.jumpForce;
    player.isGrounded = false;
    player.animationState.jumping = true;
  }

  // Apply gravity
  player.velocity.y -= 0.015; // Gravity

  // Apply drag
  const dragCoefficient = player.isGrounded ? player.groundDrag : player.airDrag;
  player.velocity.x *= dragCoefficient;
  player.velocity.z *= dragCoefficient;

  // Update position
  player.position.add(player.velocity);

  // Ground collision (simple plane at y=0)
  if (player.position.y < 0) {
    player.position.y = 0;
    player.velocity.y = 0;
    player.isGrounded = true;
    player.isJumping = false;
    player.animationState.jumping = false;
  } else {
    player.isGrounded = false;
  }

  // Boundary check (keep player in game world)
  const boundary = 150;
  if (Math.abs(player.position.x) > boundary) {
    player.position.x = Math.sign(player.position.x) * boundary;
    player.velocity.x *= -0.3;
  }
  if (Math.abs(player.position.z) > boundary) {
    player.position.z = Math.sign(player.position.z) * boundary;
    player.velocity.z *= -0.3;
  }

  // Animate player (leg swing for walking/running)
  updatePlayerAnimation(player, moveLength > 0, isSprinting);

  return player;
}

/**
 * Animate player based on movement state
 */
function updatePlayerAnimation(player, isMoving, isSprinting) {
  const cycle = isSprinting ? 0.15 : 0.25;
  const speed = isSprinting ? 0.12 : 0.08;

  if (isMoving || player.animationState.jumping) {
    player.animationState.legSwing += speed;
    const legSwing = Math.sin(player.animationState.legSwing) * 0.3;
    
    if (player.parts.leftLeg) {
      player.parts.leftLeg.rotation.x = legSwing;
    }
    if (player.parts.rightLeg) {
      player.parts.rightLeg.rotation.x = -legSwing;
    }

    if (player.parts.leftArm) {
      player.parts.leftArm.rotation.x = -legSwing * 0.5;
    }
    if (player.parts.rightArm) {
      player.parts.rightArm.rotation.x = legSwing * 0.5;
    }
  } else {
    // Idle animation - small sway
    const idleTime = Date.now() * 0.001;
    const idleSway = Math.sin(idleTime * 1.5) * 0.05;
    
    if (player.parts.leftLeg) {
      player.parts.leftLeg.rotation.x = idleSway * 0.3;
    }
    if (player.parts.rightLeg) {
      player.parts.rightLeg.rotation.x = -idleSway * 0.3;
    }
    
    if (player.parts.leftArm) {
      player.parts.leftArm.rotation.x = -idleSway;
    }
    if (player.parts.rightArm) {
      player.parts.rightArm.rotation.x = idleSway;
    }
  }
}

/**
 * Apply damage to player
 */
export function damagePlayer(player, damage) {
  player.health -= damage;
  if (player.health < 0) {
    player.health = 0;
  }
  
  // Visual feedback - red tint
  if (player.parts.body) {
    const originalColor = 0xff0000;
    player.parts.body.material.emissive.setHex(0xff0000);
    setTimeout(() => {
      player.parts.body.material.emissive.setHex(0x000000);
    }, 100);
  }

  return player.health <= 0;
}

/**
 * Heal player
 */
export function healPlayer(player, amount) {
  player.health = Math.min(player.health + amount, player.maxHealth);
}