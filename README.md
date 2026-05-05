# Spider-Man 2D Web Game

A 2D side-scrolling Spider-Man game built with HTML5 Canvas.

## Features

- **2D Gameplay**: Complete 2D game with canvas rendering
- **Spider-Man Character**: Detailed red suit with spider emblem
- **Multiple Enemy Types**: Minions, elites, and bosses
- **Level Progression**: Increasing difficulty with changing environments
- **Boss Fights**: Large bosses at the end of each level
- **Web Shooting**: Right-click to shoot webs for ranged attacks
- **Melee Combat**: Left-click for punch/kick combos
- **Start/Pause**: Start screen and P key to pause

## Controls

- **A/D**: Move left/right
- **Space**: Jump
- **Left Click**: Punch/Kick combo (close range)
- **Right Click**: Shoot web (long distance)
- **P**: Pause/Resume

## How to Run

1. Start a local web server:
   ```bash
   python -m http.server 8000
   ```

2. Open your browser and go to:
   ```
   http://localhost:8000
   ```

3. Click "START GAME" to begin!

## Game Mechanics

- Defeat enemies to progress through levels
- Each level ends with a boss fight
- Collect points and survive as long as possible
- Web energy regenerates over time
- Health is restored slightly between levels

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- No external dependencies
- Responsive design
- Particle effects and smooth animations