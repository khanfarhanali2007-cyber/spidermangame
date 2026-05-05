import * as THREE from "https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js";

/**
 * Creates an enemy character
 * Different types: minion, elite, boss
 */
export function createEnemy(scene, type = 'minion', position = new THREE.Vector3()) {
  const enemy = new THREE.Group();
  enemy.type = type;
  enemy.position.copy(position);

  // Define stats by type
  const stats = {
    minion: { health: 30, speed: 0.08, damage: 5, color: 0x4444ff, scale: 0.8 },
    elite: { health: 60, speed: 0.12, damage: 10, color: 0xffaa00, scale: 1.0 },
    boss: { health: 150, speed: 0.06, damage: 15, color: 0xff0000, scale: 1.3 }
  };

  const stat = stats[type] || stats.minion;

  // Body
  const bodyGeom = new THREE.BoxGeometry(0.4 * stat.scale, 0.8 * stat.scale, 0.4 * stat.scale);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: stat.color,
    metalness: 0.5,
    roughness: 0.5
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  body.position.y = 0.4 * stat.scale;
  enemy.add(body);

  // Head
  const headGeom = new THREE.SphereGeometry(0.25 * stat.scale, 8, 8);
  const headMat = new THREE.MeshStandardMaterial({
    color: stat.color,
    metalness: 0.5,
    roughness: 0.5
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.castShadow = true;
  head.receiveShadow = true;
  head.position.y = 1.1 * stat.scale;
  enemy.add(head);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.06 * stat.scale, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.08 * stat.scale, 0.08 * stat.scale, 0.15 * stat.scale);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.08 * stat.scale, 0.08 * stat.scale, 0.15 * stat.scale);
  head.add(rightEye);

  // Arms (danger indicators)
  const armGeom = new THREE.BoxGeometry(0.15 * stat.scale, 0.6 * stat.scale, 0.15 * stat.scale);
  const armMat = new THREE.MeshStandardMaterial({
    color: stat.color,
    metalness: 0.6,
    roughness: 0.4
  });

  const leftArm = new THREE.Mesh(armGeom, armMat);
  leftArm.castShadow = true;
  leftArm.position.set(-0.35 * stat.scale, 0.6 * stat.scale, 0);
  enemy.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, armMat);
  rightArm.castShadow = true;
  rightArm.position.set(0.35 * stat.scale, 0.6 * stat.scale, 0);
  enemy.add(rightArm);

  // Physics
  enemy.velocity = new THREE.Vector3();
  enemy.health = stat.health;
  enemy.maxHealth = stat.health;
  enemy.speed = stat.speed;
  enemy.damage = stat.damage;
  enemy.attackCooldown = 0;
  enemy.attackRange = 2.5;
  enemy.sightRange = 30;
  enemy.parts = { body, head };

  scene.add(enemy);
  return enemy;
}

/**
 * Update enemy AI and behavior
 */
export function updateEnemies(enemies, player, scene) {
  enemies.forEach((enemy, index) => {
    if (!enemy || !enemy.parent) return;

    const distToPlayer = enemy.position.distanceTo(player.position);

    // AI Behavior
    if (distToPlayer < enemy.sightRange) {
      // Chase player
      const direction = new THREE.Vector3();
      direction.subVectors(player.position, enemy.position).normalize();

      enemy.velocity.x += direction.x * enemy.speed;
      enemy.velocity.z += direction.z * enemy.speed;

      // Animation - look at player
      enemy.lookAt(player.position.x, enemy.position.y, player.position.z);

      // Attack if close enough
      if (distToPlayer < enemy.attackRange && enemy.attackCooldown <= 0) {
        // Attack will be handled by main game loop
        enemy.attackCooldown = 60; // frames between attacks
      }
    } else {
      // Patrol/idle
      enemy.velocity.x *= 0.9;
      enemy.velocity.z *= 0.9;
    }

    // Apply friction
    enemy.velocity.x *= 0.85;
    enemy.velocity.z *= 0.85;

    // Update position
    enemy.position.add(enemy.velocity);

    // Ground collision
    if (enemy.position.y < 0.4) {
      enemy.position.y = 0.4;
      enemy.velocity.y = 0;
    }

    // Boundary
    const boundary = 150;
    if (Math.abs(enemy.position.x) > boundary) {
      enemy.position.x = Math.sign(enemy.position.x) * (boundary - 5);
      enemy.velocity.x *= -0.5;
    }
    if (Math.abs(enemy.position.z) > boundary) {
      enemy.position.z = Math.sign(enemy.position.z) * (boundary - 5);
      enemy.velocity.z *= -0.5;
    }

    // Reduce attack cooldown
    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown--;
    }

    // Remove dead enemies
    if (enemy.health <= 0) {
      scene.remove(enemy);
      enemies.splice(index, 1);
    }
  });
}

/**
 * Create and spawn new enemies
 */
export function spawnEnemy(scene, enemies, position, type = 'minion') {
  // Random spawn position if not specified
  if (!position) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 80;
    position = new THREE.Vector3(
      Math.cos(angle) * radius,
      2,
      Math.sin(angle) * radius
    );
  }

  const enemy = createEnemy(scene, type, position);
  enemies.push(enemy);
  return enemy;
}

/**
 * Damage enemy
 */
export function damageEnemy(enemy, damage) {
  enemy.health = Math.max(0, enemy.health - damage);

  // Visual feedback
  if (enemy.parts.body) {
    enemy.parts.body.material.emissive.setHex(0xffffff);
    setTimeout(() => {
      enemy.parts.body.material.emissive.setHex(0x000000);
    }, 50);
  }

  return enemy.health <= 0;
}

/**
 * Get distance from enemy to player
 */
export function getDistanceToPlayer(enemy, player) {
  return enemy.position.distanceTo(player.position);
}