/**
 * UI System - Display game information and manage UI elements
 */

export class UISystem {
  constructor() {
    this.healthFill = document.getElementById('healthFill');
    this.webFill = document.getElementById('webFill');
    this.levelDisplay = document.getElementById('levelDisplay');
    this.enemyCount = document.getElementById('enemyCount');
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.gameOverScreen = document.getElementById('gameOver');
    this.pauseScreen = document.getElementById('pauseScreen');
    this.finalScore = document.getElementById('finalScore');
  }

  /**
   * Update UI based on game state
   */
  update(player, enemies, level, score, webSystem) {
    // Update health bar
    const healthPercent = (player.health / player.maxHealth) * 100;
    this.healthFill.style.width = healthPercent + '%';
    
    // Low health warning
    if (healthPercent < 30) {
      this.healthFill.classList.add('low');
    } else {
      this.healthFill.classList.remove('low');
    }

    // Update web bar
    const webPercent = ((webSystem.maxWebCooldown - webSystem.webCooldown) / webSystem.maxWebCooldown) * 100;
    this.webFill.style.width = webPercent + '%';

    // Update level and enemy count
    this.levelDisplay.textContent = level;
    this.enemyCount.textContent = enemies.length;
    this.scoreDisplay.textContent = Math.floor(score);
  }

  /**
   * Show game over screen
   */
  showGameOver(score, playerWon = false) {
    this.gameOverScreen.style.display = 'block';
    const title = document.getElementById('gameOverTitle');
    const text = document.getElementById('gameOverText');
    
    if (playerWon) {
      title.textContent = 'VICTORY!';
      text.textContent = 'You defeated all enemies!';
    } else {
      title.textContent = 'GAME OVER';
      text.textContent = 'You were defeated...';
    }
    
    this.finalScore.textContent = Math.floor(score);
  }

  /**
   * Show pause screen
   */
  togglePause(paused) {
    this.pauseScreen.style.display = paused ? 'flex' : 'none';
  }
}

/**
 * Update UI display
 */
export function updateUI(player) {
  const healthBar = document.getElementById('healthFill');
  const healthPercent = (player.health / 100) * 100;
  healthBar.style.width = healthPercent + '%';
}