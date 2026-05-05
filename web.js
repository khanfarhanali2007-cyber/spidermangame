import * as THREE from "https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js";

/**
 * Web shooting and swinging system for Spider-Man
 */

export class WebSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.webCooldown = 0;
    this.maxWebCooldown = 30; // frames
    this.webReach = 50;
    this.swinging = false;
    this.swingPoint = null;
    this.webLine = null;
    this.swingRope = null;
    this.websArray = [];
    this.particles = [];
  }

  /**
   * Shoot a web towards a target
   */
  shootWeb(scene, enemies) {
    if (this.webCooldown > 0) return false;

    const origin = this.player.position.clone().add(new THREE.Vector3(0, 0.5, 0));
    const forward = new THREE.Vector3(0, 0, -1);
    
    // Raycasting to find targets
    const raycaster = new THREE.Raycaster(origin, forward, 0, this.webReach);
    
    // Check for enemies
    const enemyMeshes = enemies.map(e => e.children).flat();
    const intersects = raycaster.intersectObjects(enemyMeshes, true);

    if (intersects.length > 0) {
      // Hit an enemy
      const hitObject = intersects[0].object;
      const hit = intersects[0];
      
      // Create impact effect
      this.createWebImpact(hit.point);
      
      return { hit: true, point: hit.point, object: hitObject };
    }

    // If no hit, create a web line to max reach
    const endPoint = origin.clone().add(forward.clone().multiplyScalar(this.webReach));
    this.createWebLine(origin, endPoint);

    this.webCooldown = this.maxWebCooldown;
    return { hit: false, point: endPoint };
  }

  /**
   * Start swinging from a web attachment point
   */
  startSwing(attachPoint) {
    if (this.swinging) return;

    this.swinging = true;
    this.swingPoint = attachPoint.clone();
    this.createSwingRope();
    return true;
  }

  /**
   * Stop swinging
   */
  stopSwing() {
    if (this.swingRope) {
      this.scene.remove(this.swingRope);
      this.swingRope = null;
    }
    this.swinging = false;
    this.swingPoint = null;
  }

  /**
   * Update swing physics
   */
  updateSwing() {
    if (!this.swinging || !this.swingPoint) return;

    // Calculate rope vector
    const ropeVector = new THREE.Vector3().subVectors(this.player.position, this.swingPoint);
    const ropeLength = ropeVector.length();
    const ropeDir = ropeVector.normalize();

    // Pendulum Physics
    // Add momentum in swing direction
    const swingDirection = new THREE.Vector3(-ropeDir.z, 0, ropeDir.x); // Perpendicular to rope
    
    // Calculate swing force based on angle
    const vertical = new THREE.Vector3(0, -1, 0);
    const angle = Math.acos(Math.max(-1, Math.min(1, ropeDir.dot(vertical))));
    const swingForce = Math.sin(angle) * 0.15;

    this.player.velocity.add(swingDirection.multiplyScalar(swingForce));

    // Keep rope length constant
    if (ropeLength > 5) {
      const constraintForce = ropeVector.clone().normalize().multiplyScalar((ropeLength - 5) * 0.1);
      this.player.velocity.sub(constraintForce);
    }

    // Update rope visuals
    if (this.swingRope) {
      const positions = this.swingRope.geometry.attributes.position.array;
      positions[0] = this.swingPoint.x;
      positions[1] = this.swingPoint.y;
      positions[2] = this.swingPoint.z;
      positions[3] = this.player.position.x;
      positions[4] = this.player.position.y;
      positions[5] = this.player.position.z;
      this.swingRope.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Create a visual web line
   */
  createWebLine(start, end) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });

    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    // Add to array and remove after time
    this.websArray.push({ mesh: line, lifetime: 120 });
  }

  /**
   * Create swing rope visual
   */
  createSwingRope() {
    if (this.swingRope) this.scene.remove(this.swingRope);

    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    positions[0] = this.swingPoint.x;
    positions[1] = this.swingPoint.y;
    positions[2] = this.swingPoint.z;
    positions[3] = this.player.position.x;
    positions[4] = this.player.position.y;
    positions[5] = this.player.position.z;

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3
    });

    this.swingRope = new THREE.Line(geom, mat);
    this.scene.add(this.swingRope);
  }

  /**
   * Create web impact particles
   */
  createWebImpact(position) {
    const particleCount = 10;
    for (let i = 0; i < particleCount; i++) {
      const geom = new THREE.SphereGeometry(0.1, 4, 4);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
      });

      const particle = new THREE.Mesh(geom, mat);
      particle.position.copy(position);

      const randomDir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      particle.velocity = randomDir.multiplyScalar(0.3);
      particle.lifetime = 40;

      this.scene.add(particle);
      this.particles.push(particle);
    }
  }

  /**
   * Update web system effects
   */
  update() {
    // Update cooldown
    if (this.webCooldown > 0) {
      this.webCooldown--;
    }

    // Update web lines
    this.websArray = this.websArray.filter(web => {
      web.lifetime--;
      web.mesh.material.opacity = web.lifetime / 120;
      
      if (web.lifetime <= 0) {
        this.scene.remove(web.mesh);
        return false;
      }
      return true;
    });

    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.lifetime--;
      particle.position.add(particle.velocity);
      particle.material.opacity = particle.lifetime / 40;
      particle.velocity.multiplyScalar(0.95);

      if (particle.lifetime <= 0) {
        this.scene.remove(particle);
        return false;
      }
      return true;
    });

    // Update swinging
    if (this.swinging) {
      this.updateSwing();
    }
  }
}

/**
 * Perform melee attack
 */
export function performMeleeAttack(player, enemies, scene) {
  const attackOrigin = player.position.clone();
  const attackRange = 3;
  let damage = 15;

  // Increase damage for bosses
  const hitEnemies = [];
  enemies.forEach(enemy => {
    const dist = enemy.position.distanceTo(attackOrigin);
    if (dist < attackRange) {
      hitEnemies.push(enemy);
    }
  });

  // Create attack visual effect
  if (hitEnemies.length > 0) {
    createAttackEffect(scene, attackOrigin);
  }

  return hitEnemies;
}

/**
 * Create attack visual effect
 */
function createAttackEffect(scene, position) {
  const geom = new THREE.SphereGeometry(2, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.3,
    wireframe: true
  });

  const sphere = new THREE.Mesh(geom, mat);
  sphere.position.copy(position);
  scene.add(sphere);

  // Animate and remove
  let time = 0;
  const interval = setInterval(() => {
    time++;
    sphere.scale.multiplyScalar(1.1);
    sphere.material.opacity = 0.3 * (1 - time / 10);

    if (time >= 10) {
      clearInterval(interval);
      scene.remove(sphere);
    }
  }, 30);
}