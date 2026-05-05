// Spider-Man 2D Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgMusic = document.getElementById('bgMusic');
const punchSound = document.getElementById('punchSound');

// Game state
let gameState = {
  running: false,
  paused: false,
  level: 1,
  score: 0,
  enemiesDefeated: 0,
  levelEnemiesDefeated: 0,
  levelEnemiesSpawned: 0,
  spawnRate: 120,
  spawnCounter: 0,
  bossSpawned: false,
  bossDefeated: false,
  gameStarted: false
};

// Game objects
let player = {
  x: 400,
  y: 500,
  width: 40,
  height: 60,
  velocityX: 0,
  velocityY: 0,
  onGround: false,
  health: 150,
  maxHealth: 150,
  web: 100,
  maxWeb: 100,
  facing: 1, // 1 = right, -1 = left
  attacking: false,
  attackTimer: 0,
  attackCombo: 0,
  attackPose: 'punch',
  webShooting: false,
  webShootTimer: 0,
  swinging: false,
  swingWeb: null,
  swingAnchorX: 0,
  swingAnchorY: 0,
  swingLength: 0
};

let enemies = [];
let webs = [];
let particles = [];
let bossLasers = [];
let enemyBullets = [];
let clouds = [];
let trees = [];
let buildings = [];
let platforms = [];
let environmentEndX = 0;

// Mouse tracking for aiming
let mouseX = 0;
let mouseY = 0;

// Environment
let ground = 550;
let cameraX = 0;
let levelBackgrounds = [
  '#87CEEB', // Level 1 - Sky blue
  '#4B0082', // Level 2 - Dark purple
  '#2F4F4F', // Level 3 - Dark slate gray
  '#8B0000', // Level 4 - Dark red
  '#000000'  // Level 5+ - Black
];

// Input handling
let keys = {};
let mouseButtons = {};

// Initialize canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ground = canvas.height - 120;
  generateEnvironmentObjects();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function generateEnvironmentObjects() {
  clouds = [];
  trees = [];
  buildings = [];
  platforms = [];
  environmentEndX = canvas.width * 3;

  const cloudCount = 8;
  for (let i = 0; i < cloudCount; i++) {
    clouds.push({
      x: Math.random() * environmentEndX,
      y: 60 + Math.random() * 80,
      speed: 0.2 + Math.random() * 0.4,
      width: 120 + Math.random() * 80,
      height: 40 + Math.random() * 20
    });
  }

  const treeCount = 12;
  for (let i = 0; i < treeCount; i++) {
    trees.push({
      x: Math.random() * environmentEndX,
      y: ground - 20,
      trunkHeight: 80 + Math.random() * 40,
      crownRadius: 40 + Math.random() * 20
    });
  }

  const buildingCount = Math.min(gameState.level + 6, 14);
  for (let i = 0; i < buildingCount; i++) {
    buildings.push({
      x: i * (environmentEndX / buildingCount) + (Math.random() * 80 - 40),
      width: environmentEndX / buildingCount - 10,
      height: 120 + (i % 3) * 40 + (gameState.level * 8),
      color: i % 2 === 0 ? '#5A5A5A' : '#4A4A4A'
    });
  }

  // Generate floating platforms
  const platformCount = Math.min(gameState.level + 8, 20);
  for (let i = 0; i < platformCount; i++) {
    const platformY = ground - 150 - Math.random() * 200; // Platforms between 150-350 pixels above ground
    platforms.push({
      x: i * (environmentEndX / platformCount) + (Math.random() * 100 - 50),
      y: platformY,
      width: 60 + Math.random() * 40,
      height: 20,
      color: '#8B4513' // Brown color for wooden platforms
    });
  }
}

function updateEnvironment() {
  const targetX = cameraX + canvas.width * 2;

  while (environmentEndX < targetX) {
    const nextX = environmentEndX + 120 + Math.random() * 140;

    clouds.push({
      x: nextX,
      y: 60 + Math.random() * 120,
      speed: 0.2 + Math.random() * 0.4,
      width: 120 + Math.random() * 80,
      height: 40 + Math.random() * 20
    });

    trees.push({
      x: nextX + 40 + Math.random() * 100,
      y: ground - 20,
      trunkHeight: 80 + Math.random() * 40,
      crownRadius: 40 + Math.random() * 20
    });

    if (Math.random() > 0.35) {
      buildings.push({
        x: nextX + 80 + Math.random() * 120,
        width: 80 + Math.random() * 80,
        height: 120 + Math.random() * 80 + gameState.level * 8,
        color: Math.random() > 0.5 ? '#5A5A5A' : '#4A4A4A'
      });
    }

    // Add floating platform
    if (Math.random() > 0.4) {
      const platformY = ground - 150 - Math.random() * 200;
      platforms.push({
        x: nextX + 60 + Math.random() * 80,
        y: platformY,
        width: 60 + Math.random() * 40,
        height: 20,
        color: '#8B4513'
      });
    }

    environmentEndX = nextX + 180;
  }

  clouds.forEach(cloud => {
    cloud.x += cloud.speed;
    if (cloud.x < cameraX - cloud.width * 2) {
      cloud.x = cameraX + canvas.width + cloud.width;
    } else if (cloud.x > cameraX + canvas.width + cloud.width * 2) {
      cloud.x = cameraX - cloud.width;
    }
  });
}

function drawSkyBackground() {
  const timeIndex = gameState.level % 3;
  let skyStart = '#87CEEB';
  let skyMid = '#A0D8EF';
  let skyEnd = '#FFFFFF';
  if (timeIndex === 1) {
    skyStart = '#FFA500';
    skyMid = '#FF8C00';
    skyEnd = '#4B0082';
  } else if (timeIndex === 2) {
    skyStart = '#001834';
    skyMid = '#001f4d';
    skyEnd = '#000000';
  }

  const skyGradient = ctx.createLinearGradient(0, 0, 0, ground);
  skyGradient.addColorStop(0, skyStart);
  skyGradient.addColorStop(0.6, skyMid);
  skyGradient.addColorStop(1, skyEnd);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, ground);

  if (timeIndex === 2) {
    ctx.fillStyle = '#F5F3CE';
    ctx.beginPath();
    ctx.arc(canvas.width - 120, 100, 35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#FFEC8B';
    ctx.beginPath();
    ctx.arc(canvas.width - 120, 100, 45, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Input listeners
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === 'p' && gameState.gameStarted) {
    gameState.paused = !gameState.paused;
    updatePauseScreen();
  }

  if (e.key === 'Shift' && gameState.gameStarted && !player.swinging) {
    shootSwingWeb(mouseX, mouseY);
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('mousedown', (e) => {
  mouseButtons[e.button] = true;

  if (!gameState.gameStarted) return;

  if (e.button === 0) { // Left click - Attack
    performAttack();
  } else if (e.button === 2) { // Right click - Web shoot
    shootWeb(e.clientX, e.clientY);
  }
});

window.addEventListener('mouseup', (e) => {
  mouseButtons[e.button] = false;
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Start screen
document.getElementById('startButton').addEventListener('click', startGame);

function startGame() {
  document.getElementById('startScreen').style.display = 'none';
  gameState.gameStarted = true;
  gameState.running = true;
  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {
      // autoplay may be blocked until user interacts; start after first click if needed
    });
  }
  gameLoop();
}

// Dialog helper
function showBossDialog() {
  const dialog = document.getElementById('bossDialog');
  if (!dialog) return;
  dialog.style.display = 'block';
  setTimeout(() => {
    dialog.style.display = 'none';
  }, 3200);
}

// Game loop
function gameLoop() {
  if (!gameState.running) return;

  if (!gameState.paused) {
    update();
  }

  render();

  requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
  updatePlayer();
  updateEnvironment();
  updateEnemies();
  updateWebs();
  updateParticles();
  updateBossLasers();
  updateEnemyBullets();
  updateSpawning();
  updateLevel();
  updateUI();
}

// Render everything
function render() {
  drawSkyBackground();

  // Draw road ground
  ctx.fillStyle = '#4B4B4B';
  ctx.fillRect(0, ground, canvas.width, canvas.height - ground);
  ctx.fillStyle = '#FFFFFF';
  const lineY = ground + 30;
  for (let x = 0; x < canvas.width; x += 80) {
    ctx.fillRect(x + 20, lineY, 40, 6);
  }
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, ground + 10, canvas.width, 10);

  // Draw buildings and world objects with camera offset
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawEnvironment();
  drawPlayer();
  drawEnemies();
  drawEnemyBullets();
  drawBossLasers();
  drawWebs();
  drawParticles();
  ctx.restore();

  // Draw crosshair
  if (gameState.gameStarted && !gameState.paused) {
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal line
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    // Vertical line
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
  }
}

// Player functions
function updatePlayer() {
  // Handle web swinging
  if (player.swinging && player.swingWeb) {
    const dx = player.x + player.width/2 - player.swingAnchorX;
    const dy = player.y + player.height/2 - player.swingAnchorY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Apply gravity
    player.velocityY += 0.6;

    // Swing physics
    if (distance > player.swingLength) {
      const angle = Math.atan2(dy, dx);
      const force = (distance - player.swingLength) * 0.02;
      player.velocityX += Math.cos(angle) * force;
      player.velocityY += Math.sin(angle) * force;
    }

    // Air control
    if (keys['a'] || keys['arrowleft']) {
      player.velocityX -= 0.5;
      player.facing = -1;
    } else if (keys['d'] || keys['arrowright']) {
      player.velocityX += 0.5;
      player.facing = 1;
    }

    // Release swing with space or shift
    if (keys[' '] || keys['space'] || keys['shift']) {
      player.swinging = false;
      player.swingWeb = null;
    }
  } else {
    // Normal movement
    if (keys['a'] || keys['arrowleft']) {
      player.velocityX = -5;
      player.facing = -1;
    } else if (keys['d'] || keys['arrowright']) {
      player.velocityX = 5;
      player.facing = 1;
    } else {
      player.velocityX *= 0.8;
    }

    // Jump
    if ((keys[' '] || keys['space']) && player.onGround) {
      player.velocityY = -15;
      player.onGround = false;
    }

    // Gravity
    player.velocityY += 0.8;
  }

  // Update position
  player.x += player.velocityX;
  player.y += player.velocityY;

  // Camera follows player horizontally
  cameraX = Math.max(0, player.x - canvas.width * 0.3);

  // Platform collision
  let onPlatform = false;
  platforms.forEach(platform => {
    if (player.velocityY > 0 && // Moving down
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + platform.height + 10 &&
        player.x + player.width > platform.x - cameraX &&
        player.x < platform.x + platform.width - cameraX) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
      onPlatform = true;
      // Release swing when landing on platform
      if (player.swinging) {
        player.swinging = false;
        player.swingWeb = null;
      }
    }
  });

  // Ground collision (only if not on platform)
  if (!onPlatform && player.y >= ground - player.height) {
    player.y = ground - player.height;
    player.velocityY = 0;
    player.onGround = true;
    // Release swing when hitting ground
    if (player.swinging) {
      player.swinging = false;
      player.swingWeb = null;
    }
  } else if (!onPlatform) {
    player.onGround = false;
  }


  // Attack timer
  if (player.attacking) {
    player.attackTimer--;
    if (player.attackTimer <= 0) {
      player.attacking = false;
    }
  }

  // Web shooting timer
  if (player.webShooting) {
    player.webShootTimer--;
    if (player.webShootTimer <= 0) {
      player.webShooting = false;
    }
  }

  // Regenerate web
  if (player.web < player.maxWeb) {
    player.web += 0.1;
  }

  // Regenerate health
  if (player.health < player.maxHealth) {
    player.health += 0.05;
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.width/2, player.y + player.height/2);

  if (player.facing === -1) {
    ctx.scale(-1, 1);
  }

  const isPunch = player.attacking && player.attackPose === 'punch';
  const isKick = player.attacking && player.attackPose === 'kick';
  const isWebShoot = player.webShooting;
  const armExtension = isPunch ? 18 : isWebShoot ? 22 : 10;
  const legLift = isKick ? -10 : 0;

  // Legs
  ctx.fillStyle = '#000000';
  ctx.fillRect(-player.width/2 + 4, player.height/2 - 12 + legLift, 10, 20);
  ctx.fillRect(player.width/2 - 14, player.height/2 - 12 - legLift, 10, 20);
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(-player.width/2 + 4, player.height/2 + 10 + legLift, 10, 10);
  ctx.fillRect(player.width/2 - 14, player.height/2 + 10 - legLift, 10, 10);

  // Torso
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(-player.width/2, -player.height/2 + 4, player.width, player.height - 36);
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(-player.width/2, player.height/2 - 40, player.width, 28);

  // Webbing detail
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  for (let x = -player.width/2 + 10; x < player.width/2; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, -player.height/2 + 8);
    ctx.lineTo(x, player.height/2 - 28);
    ctx.stroke();
  }
  for (let y = -player.height/2 + 14; y < player.height/2 - 20; y += 10) {
    ctx.beginPath();
    ctx.moveTo(-player.width/2 + 8, y);
    ctx.quadraticCurveTo(0, y + 8, player.width/2 - 8, y);
    ctx.stroke();
  }

  // Arms
  ctx.fillStyle = '#FF0000';
  const leftArmY = isPunch ? -player.height/2 + 8 : -player.height/2 + 10;
  const rightArmY = isPunch || isWebShoot ? -player.height/2 + 2 : -player.height/2 + 10;
  ctx.fillRect(-player.width/2 - 10 - armExtension, leftArmY, 10 + armExtension, 18);
  ctx.fillRect(player.width/2, rightArmY, 10 + armExtension, 18);
  ctx.fillStyle = '#000000';
  ctx.fillRect(-player.width/2 - 12 - armExtension, leftArmY + 12, 14, 10);
  ctx.fillRect(player.width/2 + armExtension, rightArmY + 12, 14, 10);

  if (isWebShoot) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.width/2 + 10, -player.height/2 + 24);
    ctx.lineTo(player.width/2 + 40, -player.height/2 + 10);
    ctx.stroke();
  }

  // Head
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(0, -player.height/2 - 10, 18, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-8, -player.height/2 - 12, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, -player.height/2 - 12, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(-8, -player.height/2 - 12, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, -player.height/2 - 12, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spider emblem
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -player.height/2 + 4);
  ctx.lineTo(0, -player.height/2 + 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -player.height/2 + 10);
  ctx.lineTo(-10, -player.height/2 + 18);
  ctx.moveTo(0, -player.height/2 + 10);
  ctx.lineTo(10, -player.height/2 + 18);
  ctx.stroke();

  if (player.attacking) {
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.strokeRect(-player.width/2 - 12, -player.height/2 - 12, player.width + 24, player.height + 24);
  }

  ctx.restore();
}

function performAttack() {
  if (player.attacking) return;

  player.attacking = true;
  player.attackTimer = 20;
  player.attackCombo = (player.attackCombo + 1) % 3;
  player.attackPose = player.attackCombo === 2 ? 'kick' : 'punch';

  // Check for hits
  enemies.forEach((enemy, index) => {
    const hitDistance = player.attackPose === 'kick' ? 80 : 60;
    if (Math.abs(player.x - enemy.x) < hitDistance && Math.abs(player.y - enemy.y) < 60) {
      enemy.health -= player.attackPose === 'kick' ? 35 : 25;
      // Play punch sound effect
      if (punchSound) {
        punchSound.currentTime = 0;
        punchSound.play().catch(() => {});
      }
      if (enemy.health <= 0) {
        enemies.splice(index, 1);
        gameState.score += 100 * gameState.level;
        gameState.enemiesDefeated++;
        gameState.levelEnemiesDefeated++;
        if (enemy.type === 'boss' || enemy.type === 'finalBoss') {
          gameState.bossDefeated = true;
          showBossDialog();
        }
        createParticles(enemy.x, enemy.y, '#FF0000', 10);
      }
    }
  });
}

function shootWeb(mouseX, mouseY) {
  if (player.web < 10) return;

  player.web -= 10;
  player.webShooting = true;
  player.webShootTimer = 18;

  const worldMouseX = mouseX + cameraX;
  const angle = Math.atan2(mouseY - (player.y + player.height/2), worldMouseX - (player.x + player.width/2));
  const speed = 15;

  webs.push({
    x: player.x + player.width/2,
    y: player.y + player.height/2,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    life: 180
  });
}

function shootSwingWeb(mouseX, mouseY) {
  if (player.web < 15 || player.swinging) return;

  player.web -= 15;
  player.webShooting = true;
  player.webShootTimer = 18;

  const worldMouseX = mouseX + cameraX;
  const startX = player.x + player.width/2;
  const startY = player.y + player.height/2;

  // Calculate direction and speed to target
  const dx = worldMouseX - startX;
  const dy = mouseY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const speed = Math.min(distance * 0.15, 25); // Faster movement, cap at 25

  // Create a swing web that travels to find an anchor point
  player.swingWeb = {
    x: startX,
    y: startY,
    targetX: worldMouseX,
    targetY: mouseY,
    velocityX: (dx / distance) * speed,
    velocityY: (dy / distance) * speed,
    life: 180, // Increased life
    attached: false
  };
}

// Enemy functions
function updateEnemies() {
  enemies.forEach((enemy, index) => {
    const dx = player.x - enemy.x;
    const dist = Math.abs(dx);

    if (enemy.type === 'minion' || enemy.type === 'elite') {
      if (dist > 60) {
        enemy.velocityX = (dx > 0 ? 1 : -1) * enemy.speed;
      } else {
        enemy.velocityX *= 0.9;
      }
      enemy.x += enemy.velocityX;
    }

    if (enemy.type === 'boss' || enemy.type === 'finalBoss') {
      // Bosses slowly advance toward the player
      const bossSpeed = enemy.speed || 1.2;
      if (dist > 150) {
        enemy.velocityX = (dx > 0 ? 1 : -1) * bossSpeed;
      } else if (dist > 80) {
        enemy.velocityX = (dx > 0 ? 1 : -1) * (bossSpeed * 0.5);
      } else {
        enemy.velocityX *= 0.9;
      }
      enemy.x += enemy.velocityX;
    }

    // Boss laser attack if not in melee range
    const attackRange = enemy.type === 'finalBoss' ? 100 : enemy.type === 'boss' ? 80 : 40;
    if (enemy.type === 'boss' || enemy.type === 'finalBoss') {
      const shootRange = enemy.type === 'finalBoss' ? 800 : 700;
      if (dist < attackRange && Math.abs(player.y - enemy.y) < 60) {
        if (enemy.attackCooldown <= 0) {
          player.health -= enemy.damage;
          enemy.attackCooldown = enemy.type === 'finalBoss' ? 45 : 55;
          if (player.health <= 0) gameOver();
        }
      } else if (dist < shootRange && enemy.attackCooldown <= 0) {
        const targetX = player.x + player.width/2;
        const targetY = player.y + player.height/2;
        const startX = enemy.x;
        const startY = enemy.y - enemy.height/2 + 30;
        const baseAngle = Math.atan2(targetY - startY, targetX - startX);
        const shots = enemy.type === 'finalBoss' ? 9 : 7;
        const spread = enemy.type === 'finalBoss' ? 1.2 : 1.0;
        const speed = enemy.type === 'finalBoss' ? 25 : 22;

        for (let i = 0; i < shots; i++) {
          const angle = baseAngle + spread * (i - (shots - 1) / 2) / ((shots - 1) / 2);
          bossLasers.push({
            x: startX,
            y: startY,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            life: enemy.type === 'finalBoss' ? 300 : 260,
            damage: enemy.type === 'finalBoss' ? 18 : 12,
            color: enemy.accent,
            width: enemy.type === 'finalBoss' ? 6 : 5
          });
        }
        enemy.attackCooldown = enemy.type === 'finalBoss' ? 70 : 80;
      }
    } else if (enemy.type === 'minion' || enemy.type === 'elite') {
      if (dist < 220 && dist > 60 && Math.abs(player.y - enemy.y) < 50 && enemy.attackCooldown <= 0) {
        const targetX = player.x + player.width/2;
        const targetY = player.y + player.height/2;
        const startX = enemy.x + (dx > 0 ? enemy.width/2 : -enemy.width/2);
        const startY = enemy.y - enemy.height/2 + 28;
        const angle = Math.atan2(targetY - startY, targetX - startX);
        const speed = enemy.type === 'elite' ? 18 : 15;
        enemyBullets.push({
          x: startX,
          y: startY,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          life: 120,
          damage: enemy.type === 'elite' ? 12 : 8,
          color: '#FF4040',
          width: 4
        });
        enemy.attackCooldown = enemy.type === 'elite' ? 80 : 100;
      } else if (dist < attackRange && Math.abs(player.y - enemy.y) < 40) {
        if (enemy.attackCooldown <= 0) {
          player.health -= enemy.damage;
          enemy.attackCooldown = 60;
          if (player.health <= 0) {
            gameOver();
          }
        }
      }
    }

    enemy.attackCooldown = Math.max(enemy.attackCooldown - 1, 0);

    // Remove if off screen in world coordinates
    if (enemy.x < cameraX - 300 || enemy.x > cameraX + canvas.width + 300) {
      enemies.splice(index, 1);
    }
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    const centerX = enemy.x;
    const centerY = enemy.y - enemy.height/2 + 20;

    if (enemy.type !== 'boss' && enemy.type !== 'finalBoss') {
      // Normal enemy legs
      ctx.fillStyle = '#000000';
      ctx.fillRect(centerX - enemy.width/2 + 6, enemy.y - 20, 10, 20);
      ctx.fillRect(centerX + enemy.width/2 - 16, enemy.y - 20, 10, 20);
      ctx.fillRect(centerX - enemy.width/2 + 4, enemy.y - 12, 6, 10);
      ctx.fillRect(centerX + enemy.width/2 - 10, enemy.y - 12, 6, 10);

      // Normal enemy body
      ctx.fillStyle = enemy.color;
      ctx.fillRect(centerX - enemy.width/2, centerY - enemy.height/2 + 20, enemy.width, enemy.height - 40);

      // Normal enemy arms
      ctx.fillStyle = enemy.color;
      ctx.fillRect(centerX - enemy.width/2 - 10, centerY - enemy.height/2 + 30, 10, 28);
      ctx.fillRect(centerX + enemy.width/2, centerY - enemy.height/2 + 30, 10, 28);
      ctx.fillRect(centerX - enemy.width/2 - 16, centerY - enemy.height/2 + 44, 10, 10);
      ctx.fillRect(centerX + enemy.width/2 + 6, centerY - enemy.height/2 + 44, 10, 10);

      ctx.fillStyle = '#6B6B6B';
      ctx.fillRect(centerX + enemy.width/2 - 4, centerY - enemy.height/2 + 40, 14, 6);
      ctx.fillRect(centerX + enemy.width/2 + 6, centerY - enemy.height/2 + 28, 4, 10);

      // Normal enemy body detail
      ctx.strokeStyle = enemy.accent || '#222222';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - enemy.width/4, centerY - enemy.height/2 + 28, enemy.width/2, enemy.height - 52);
      ctx.fillStyle = enemy.accent || '#B0B0B0';
      ctx.fillRect(centerX - enemy.width/4 + 4, centerY - enemy.height/2 + 36, enemy.width/2 - 8, 8);

      // Normal enemy head + antenna
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY - enemy.height/2 - 10, Math.max(12, enemy.width * 0.25), 0, Math.PI * 2);
      ctx.fill();

      const antennaHeight = 18;
      ctx.strokeStyle = enemy.accent || '#888888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 6, centerY - enemy.height/2 - 22);
      ctx.lineTo(centerX - 10, centerY - enemy.height/2 - 22 - antennaHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 6, centerY - enemy.height/2 - 22);
      ctx.lineTo(centerX + 10, centerY - enemy.height/2 - 22 - antennaHeight);
      ctx.stroke();
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(centerX - 10, centerY - enemy.height/2 - 22 - antennaHeight, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 10, centerY - enemy.height/2 - 22 - antennaHeight, 3, 0, Math.PI * 2);
      ctx.fill();

      // Normal enemy eyes
      ctx.fillStyle = '#FF2020';
      ctx.beginPath();
      ctx.arc(centerX - 6, centerY - enemy.height/2 - 14, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 6, centerY - enemy.height/2 - 14, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const headRadius = Math.max(18, enemy.width * 0.28);
      const torsoWidth = enemy.width * 0.92;
      const torsoHeight = enemy.height * 0.56;
      const torsoTop = centerY - enemy.height/2 + 36;
      const torsoCenterY = torsoTop + torsoHeight / 2;
      const shoulderRadius = enemy.width * 0.18;
      const armWidth = 12;
      const legWidth = enemy.width * 0.22;
      const legHeight = enemy.height * 0.28;

      // Boss torso
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.ellipse(centerX, torsoCenterY, torsoWidth / 2, torsoHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boss chest panel
      ctx.fillStyle = enemy.accent;
      ctx.fillRect(centerX - torsoWidth * 0.18, torsoTop + torsoHeight * 0.12, torsoWidth * 0.36, torsoHeight * 0.18);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(centerX - torsoWidth * 0.08, torsoTop + torsoHeight * 0.18, torsoWidth * 0.16, torsoHeight * 0.08);

      // Boss shoulders
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(centerX - torsoWidth / 2 + shoulderRadius, torsoTop + 16, shoulderRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + torsoWidth / 2 - shoulderRadius, torsoTop + 16, shoulderRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = enemy.accent;
      ctx.beginPath();
      ctx.arc(centerX - torsoWidth / 2 + shoulderRadius, torsoTop + 16, shoulderRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + torsoWidth / 2 - shoulderRadius, torsoTop + 16, shoulderRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Boss arms
      ctx.fillStyle = enemy.color;
      ctx.fillRect(centerX - torsoWidth / 2 - armWidth, torsoTop + 22, armWidth, 38);
      ctx.fillRect(centerX + torsoWidth / 2, torsoTop + 22, armWidth, 38);
      ctx.fillRect(centerX - torsoWidth / 2 - armWidth, torsoTop + 60, armWidth, 24);
      ctx.fillRect(centerX + torsoWidth / 2, torsoTop + 60, armWidth, 24);

      ctx.fillStyle = enemy.accent;
      ctx.fillRect(centerX - torsoWidth / 2 - armWidth - 2, torsoTop + 82, armWidth + 4, 10);
      ctx.fillRect(centerX + torsoWidth / 2 - 2, torsoTop + 82, armWidth + 4, 10);

      // Boss legs
      ctx.fillStyle = enemy.color;
      ctx.fillRect(centerX - torsoWidth * 0.24 - legWidth / 2, torsoTop + torsoHeight - legHeight + 4, legWidth, legHeight);
      ctx.fillRect(centerX + torsoWidth * 0.24 - legWidth / 2, torsoTop + torsoHeight - legHeight + 4, legWidth, legHeight);
      ctx.fillStyle = enemy.accent;
      ctx.fillRect(centerX - torsoWidth * 0.24 - legWidth / 2, torsoTop + torsoHeight + 6, legWidth, 10);
      ctx.fillRect(centerX + torsoWidth * 0.24 - legWidth / 2, torsoTop + torsoHeight + 6, legWidth, 10);

      // Boss head
      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.arc(centerX, centerY - enemy.height/2 - 10, headRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B0B0B0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Boss angry eyebrows
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY - enemy.height/2 - 20);
      ctx.lineTo(centerX - 4, centerY - enemy.height/2 - 18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX + 4, centerY - enemy.height/2 - 18);
      ctx.lineTo(centerX + 12, centerY - enemy.height/2 - 20);
      ctx.stroke();

      // Boss glowing blue eyes
      ctx.fillStyle = '#0088FF';
      ctx.beginPath();
      ctx.arc(centerX - 8, centerY - enemy.height/2 - 14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 8, centerY - enemy.height/2 - 14, 5, 0, Math.PI * 2);
      ctx.fill();

      // Eye glow effect
      ctx.fillStyle = 'rgba(0, 136, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - 8, centerY - enemy.height/2 - 14, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 8, centerY - enemy.height/2 - 14, 8, 0, Math.PI * 2);
      ctx.fill();

      // Boss angry mouth
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 6, centerY - enemy.height/2 - 2);
      ctx.lineTo(centerX, centerY - enemy.height/2 + 2);
      ctx.lineTo(centerX + 6, centerY - enemy.height/2 - 2);
      ctx.stroke();

      // Boss antenna
      ctx.strokeStyle = enemy.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - enemy.height/2 - headRadius - 2);
      ctx.lineTo(centerX, centerY - enemy.height/2 - headRadius - 24);
      ctx.stroke();
      ctx.fillStyle = enemy.accent;
      ctx.beginPath();
      ctx.arc(centerX, centerY - enemy.height/2 - headRadius - 24, 4, 0, Math.PI * 2);
      ctx.fill();

      // Boss metal texture
      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 1;
      for (let y = torsoTop + 14; y < torsoTop + torsoHeight - 12; y += 16) {
        ctx.beginPath();
        ctx.moveTo(centerX - torsoWidth / 2 + 12, y);
        ctx.lineTo(centerX + torsoWidth / 2 - 12, y);
        ctx.stroke();
      }
      for (let x = centerX - torsoWidth / 2 + 10; x < centerX + torsoWidth / 2 - 10; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, torsoTop + 10);
        ctx.lineTo(x + 4, torsoTop + torsoHeight - 10);
        ctx.stroke();
      }
    }

    if (enemy.type === 'boss' || enemy.type === 'finalBoss') {
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', centerX, centerY - enemy.height/2 - 40);

      const barWidth = enemy.width;
      const barHeight = 8;
      const barX = centerX - barWidth/2;
      const barY = centerY - enemy.height/2 - 30;

      ctx.fillStyle = '#000000';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = healthPercent > 0.3 ? '#00FF00' : '#FF0000';
      ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * healthPercent, barHeight - 2);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  });
}


function updateBossLasers() {
  bossLasers.forEach((laser, index) => {
    laser.x += laser.velocityX;
    laser.y += laser.velocityY;
    laser.life--;

    const hitX = player.x + player.width/2;
    const hitY = player.y + player.height/2;
    if (Math.abs(laser.x - hitX) < 20 && Math.abs(laser.y - hitY) < 20) {
      player.health -= laser.damage;
      bossLasers.splice(index, 1);
      if (player.health <= 0) {
        gameOver();
      }
      return;
    }

    if (laser.life <= 0 || laser.x < cameraX - 200 || laser.x > cameraX + canvas.width + 200 || laser.y < -100 || laser.y > canvas.height + 100) {
      bossLasers.splice(index, 1);
    }
  });
}

function updateEnemyBullets() {
  enemyBullets.forEach((bullet, index) => {
    bullet.x += bullet.velocityX;
    bullet.y += bullet.velocityY;
    bullet.life--;

    const hitX = player.x + player.width/2;
    const hitY = player.y + player.height/2;
    if (Math.abs(bullet.x - hitX) < 18 && Math.abs(bullet.y - hitY) < 18) {
      player.health -= bullet.damage;
      enemyBullets.splice(index, 1);
      if (player.health <= 0) gameOver();
      return;
    }

    if (bullet.life <= 0 || bullet.x < cameraX - 200 || bullet.x > cameraX + canvas.width + 200 || bullet.y < -100 || bullet.y > canvas.height + 100) {
      enemyBullets.splice(index, 1);
    }
  });
}

function drawEnemyBullets() {
  enemyBullets.forEach(bullet => {
    ctx.strokeStyle = bullet.color;
    ctx.lineWidth = bullet.width;
    ctx.beginPath();
    ctx.moveTo(bullet.x - bullet.velocityX * 1.5, bullet.y - bullet.velocityY * 1.5);
    ctx.lineTo(bullet.x, bullet.y);
    ctx.stroke();
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.width, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBossLasers() {
  bossLasers.forEach(laser => {
    ctx.strokeStyle = laser.color;
    ctx.lineWidth = laser.width;
    ctx.beginPath();
    ctx.moveTo(laser.x, laser.y);
    ctx.lineTo(laser.x - laser.velocityX * 2, laser.y - laser.velocityY * 2);
    ctx.stroke();
    ctx.fillStyle = laser.color;
    ctx.beginPath();
    ctx.arc(laser.x, laser.y, laser.width * 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function spawnEnemy(isBoss = false) {
  const enemiesPerLevel = 5 * gameState.level;
  let type = 'minion';

  if (isBoss) {
    type = gameState.level % 5 === 0 ? 'finalBoss' : 'boss';
  } else {
    if (gameState.level >= 5 && Math.random() > 0.8) type = 'elite';
    if (gameState.level >= 8 && Math.random() > 0.92) type = 'elite';
  }

  let enemyConfig;
  switch(type) {
    case 'minion':
      enemyConfig = {
        width: 40,
        height: 60,
        speed: 3,
        health: 50,
        damage: 10,
        color: '#E8E8E8',
        accent: '#A0A0A0'
      };
      break;
    case 'elite':
      enemyConfig = {
        width: 50,
        height: 80,
        speed: 2.2,
        health: 110,
        damage: 15,
        color: '#F5F5F5',
        accent: '#8A8A8A'
      };
      break;
    case 'boss': {
      const bossHue = gameState.level % 3;
      const bossColor = '#E8E8E8';
      const accentColor = bossHue === 1 ? '#FFD700' : bossHue === 2 ? '#00FFFF' : '#ADFF2F';

      enemyConfig = {
        width: 80,
        height: 120,
        speed: 1.1,
        health: 280 + gameState.level * 20,
        damage: 30 + Math.floor(gameState.level / 3) * 5,
        color: bossColor,
        accent: accentColor,
        design: bossHue
      };
      break;
    }
    case 'finalBoss': {
      const bossHue = gameState.level % 3;
      const bossColor = '#DCDCDC';
      const accentColor = bossHue === 1 ? '#FFD700' : bossHue === 2 ? '#00FFFF' : '#ADFF2F';
      enemyConfig = {
        width: 160,
        height: 240,
        speed: 0.8,
        health: 1000 + gameState.level * 40,
        damage: 55 + Math.floor(gameState.level / 2) * 5,
        color: bossColor,
        accent: accentColor,
        design: bossHue
      };
      break;
    }
  }

  const enemy = {
    x: cameraX + canvas.width + enemyConfig.width + 100,
    y: ground - enemyConfig.height,
    width: enemyConfig.width,
    height: enemyConfig.height,
    velocityX: 0,
    speed: enemyConfig.speed,
    health: enemyConfig.health,
    maxHealth: enemyConfig.health,
    damage: enemyConfig.damage,
    color: enemyConfig.color,
    accent: enemyConfig.accent || '#FFFFFF',
    design: enemyConfig.design || 0,
    attackCooldown: 0,
    type: type
  };

  if (!isBoss) {
    gameState.levelEnemiesSpawned++;
  }

  enemies.push(enemy);
}

// Web functions
function updateWebs() {
  // Update swing web
  if (player.swingWeb && !player.swingWeb.attached) {
    // Store previous position for collision detection
    const prevX = player.swingWeb.x;
    const prevY = player.swingWeb.y;

    player.swingWeb.x += player.swingWeb.velocityX;
    player.swingWeb.y += player.swingWeb.velocityY;
    player.swingWeb.life--;

    // Check if web hits a building or platform
    let hitSurface = false;

    // Check buildings first
    buildings.forEach(building => {
      if (player.swingWeb.x >= building.x &&
          player.swingWeb.x <= building.x + building.width &&
          player.swingWeb.y >= ground - building.height &&
          player.swingWeb.y <= ground) {
        hitSurface = true;
        player.swingAnchorX = player.swingWeb.x;
        player.swingAnchorY = ground - building.height;
        player.swingLength = Math.sqrt(
          Math.pow(player.x + player.width/2 - player.swingAnchorX, 2) +
          Math.pow(player.y + player.height/2 - player.swingAnchorY, 2)
        );
        player.swinging = true;
        player.swingWeb.attached = true;
        player.onGround = false;
        return;
      }
    });

    // Check platforms if no building hit
    if (!hitSurface) {
      platforms.forEach(platform => {
        // Check both current and previous position for collision
        const currentHit = player.swingWeb.x >= platform.x &&
                          player.swingWeb.x <= platform.x + platform.width &&
                          player.swingWeb.y >= platform.y - 5 &&
                          player.swingWeb.y <= platform.y + platform.height;

        const prevHit = prevX >= platform.x &&
                       prevX <= platform.x + platform.width &&
                       prevY >= platform.y - 5 &&
                       prevY <= platform.y + platform.height;

        if (currentHit || prevHit) {
          hitSurface = true;
          player.swingAnchorX = player.swingWeb.x;
          player.swingAnchorY = platform.y; // Attach to top of platform
          player.swingLength = Math.sqrt(
            Math.pow(player.x + player.width/2 - player.swingAnchorX, 2) +
            Math.pow(player.y + player.height/2 - player.swingAnchorY, 2)
          );
          player.swinging = true;
          player.swingWeb.attached = true;
          player.onGround = false;
          return;
        }
      });
    }

    if (!hitSurface && (player.swingWeb.life <= 0 ||
        player.swingWeb.x < cameraX - 200 ||
        player.swingWeb.x > cameraX + canvas.width + 200 ||
        player.swingWeb.y < 0 ||
        player.swingWeb.y > canvas.height)) {
      player.swingWeb = null;
    }
  }

  webs.forEach((web, index) => {
    web.x += web.velocityX;
    web.y += web.velocityY;
    web.life--;

    // Check collision with enemies
    enemies.forEach((enemy, eIndex) => {
      if (Math.abs(web.x - enemy.x) < enemy.width/2 && Math.abs(web.y - enemy.y) < enemy.height/2) {
        enemy.health -= 15;
        // Play punch sound effect
        if (punchSound) {
          punchSound.currentTime = 0;
          punchSound.play().catch(() => {});
        }
        webs.splice(index, 1);
        if (enemy.health <= 0) {
          enemies.splice(eIndex, 1);
          gameState.score += 100 * gameState.level;
          gameState.enemiesDefeated++;
          gameState.levelEnemiesDefeated++;
          if (enemy.type === 'boss' || enemy.type === 'finalBoss') {
            gameState.bossDefeated = true;
          }
          createParticles(enemy.x, enemy.y, '#FF0000', 10);
        }
        return;
      }
    });

    if (web.life <= 0 || web.x < cameraX - 200 || web.x > cameraX + canvas.width + 200 || web.y < 0 || web.y > canvas.height) {
      webs.splice(index, 1);
    }
  });
}

function drawWebs() {
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  webs.forEach(web => {
    ctx.beginPath();
    ctx.moveTo(player.x + player.width/2, player.y + player.height/2);
    ctx.lineTo(web.x, web.y);
    ctx.stroke();
  });

  // Draw swing web
  if (player.swingWeb) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width/2, player.y + player.height/2);
    if (player.swinging) {
      ctx.lineTo(player.swingAnchorX, player.swingAnchorY);
    } else {
      ctx.lineTo(player.swingWeb.x, player.swingWeb.y);
    }
    ctx.stroke();
  }
}

// Particle effects
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      velocityX: (Math.random() - 0.5) * 10,
      velocityY: (Math.random() - 0.5) * 10,
      life: 30,
      color: color
    });
  }
}

function updateParticles() {
  particles.forEach((particle, index) => {
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;
    particle.velocityY += 0.2; // Gravity
    particle.life--;

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  });
}

function drawParticles() {
  particles.forEach(particle => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = particle.life / 30;
    ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  });
}

// Environment
function drawEnvironment() {
  clouds.forEach(cloud => {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.width * 0.5, cloud.height * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.width * 0.3, cloud.y + 5, cloud.width * 0.4, cloud.height * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - cloud.width * 0.3, cloud.y + 5, cloud.width * 0.35, cloud.height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  buildings.forEach(building => {
    ctx.fillStyle = building.color;
    ctx.fillRect(building.x, ground - building.height - 20, building.width, building.height);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let y = ground - building.height - 10; y < ground - 30; y += 18) {
      ctx.fillRect(building.x + 6, y, 8, 10);
      ctx.fillRect(building.x + building.width / 2, y, 8, 10);
    }
  });

  // Draw platforms
  platforms.forEach(platform => {
    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    // Add some texture/detail to platforms
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(platform.x, platform.y, platform.width, 3);
    ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
  });

  trees.forEach(tree => {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(tree.x - 10, tree.y - tree.trunkHeight, 20, tree.trunkHeight);

    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(tree.x, tree.y - tree.trunkHeight, tree.crownRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tree.x - tree.crownRadius * 0.6, tree.y - tree.trunkHeight + 10, tree.crownRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tree.x + tree.crownRadius * 0.6, tree.y - tree.trunkHeight + 10, tree.crownRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Game logic
function updateSpawning() {
  const enemiesPerLevel = 5 * gameState.level;
  const spawnThreshold = Math.max(40, gameState.spawnRate - gameState.level * 6);
  const enemyLimit = Math.min(4 + gameState.level, 8);
  gameState.spawnCounter++;

  const bossAlive = enemies.some(enemy => enemy.type === 'boss' || enemy.type === 'finalBoss');

  if (!gameState.bossSpawned && gameState.levelEnemiesSpawned < enemiesPerLevel && enemies.length < enemyLimit) {
    if (gameState.spawnCounter >= spawnThreshold) {
      spawnEnemy(false);
      gameState.spawnCounter = 0;
    }
  }

  if (!gameState.bossSpawned && gameState.levelEnemiesDefeated >= enemiesPerLevel && !bossAlive) {
    gameState.bossSpawned = true;
    spawnEnemy(true);
  }
}

function updateLevel() {
  if (gameState.bossDefeated) {
    gameState.level++;
    gameState.score += 500 * gameState.level;
    gameState.bossSpawned = false;
    gameState.bossDefeated = false;
    gameState.levelEnemiesSpawned = 0;
    gameState.levelEnemiesDefeated = 0;
    gameState.spawnCounter = 0;

    // Heal player
    player.health = Math.min(player.maxHealth, player.health + 20);

    // Refresh environment for the next level daylight cycle
    generateEnvironmentObjects();
  }
}

function updateUI() {
  document.getElementById('healthFill').style.width = (player.health / player.maxHealth) * 100 + '%';
  document.getElementById('webFill').style.width = (player.web / player.maxWeb) * 100 + '%';
  document.getElementById('levelDisplay').textContent = gameState.level;
  document.getElementById('enemyCount').textContent = enemies.length;
  document.getElementById('scoreDisplay').textContent = gameState.score;

  // Low health warning
  if (player.health < 30) {
    document.getElementById('healthFill').classList.add('low');
  } else {
    document.getElementById('healthFill').classList.remove('low');
  }
}

function updatePauseScreen() {
  document.getElementById('pauseScreen').style.display = gameState.paused ? 'flex' : 'none';
}

function gameOver() {
  gameState.running = false;
  document.getElementById('finalScore').textContent = gameState.score;
  document.getElementById('gameOver').style.display = 'block';
}

// Initialize
console.log('Spider-Man 2D Game initialized');