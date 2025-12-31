// Chomper Game - AMG Arcade (Pac-Man style)
class ChomperGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.tileSize = 20;
        this.cols = 21;
        this.rows = 22;
        
        // Maze layout: 0=wall, 1=dot, 2=empty, 3=power pellet, 4=ghost house
        this.mazeTemplate = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
            [0,3,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,3,0],
            [0,1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,1,0],
            [0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0],
            [0,0,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,0,0],
            [2,2,2,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,2,2,2],
            [0,0,0,0,1,0,1,0,0,4,4,4,0,0,1,0,1,0,0,0,0],
            [2,2,2,2,1,1,1,0,4,4,4,4,4,0,1,1,1,2,2,2,2],
            [0,0,0,0,1,0,1,0,4,4,4,4,4,0,1,0,1,0,0,0,0],
            [2,2,2,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,2,2,2],
            [0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0],
            [0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,1,1,1,0,1,1,1,1,0,1,0,0,1,0],
            [0,3,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,3,0],
            [0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0],
            [0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0],
            [0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        ];
        
        this.maze = [];
        
        // Player (Chomper)
        this.player = {
            x: 10,
            y: 16,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            mouthOpen: 0
        };
        
        // Ghosts
        this.ghosts = [];
        this.ghostColors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb851'];
        this.ghostNames = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.dotsRemaining = 0;
        this.powerMode = false;
        this.powerTimer = null;
        this.highScore = parseInt(localStorage.getItem('chomper_highscore')) || 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        
        this.animationId = null;
        this.lastTime = 0;
        this.accumulator = 0;
        this.tickRate = 150; // ms per game tick
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.resetMaze();
        this.draw();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        
        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            const handler = (e) => {
                e.preventDefault();
                this.handleMobileControl(btn.dataset.dir);
            };
            btn.addEventListener('touchstart', handler);
            btn.addEventListener('click', handler);
        });
    }
    
    handleKeydown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'Space') {
            if (this.isPlaying) {
                this.togglePause();
            }
            return;
        }
        
        if (!this.isPlaying || this.isPaused) return;
        
        const keyMap = {
            'ArrowUp': { x: 0, y: -1 },
            'ArrowDown': { x: 0, y: 1 },
            'ArrowLeft': { x: -1, y: 0 },
            'ArrowRight': { x: 1, y: 0 },
            'KeyW': { x: 0, y: -1 },
            'KeyS': { x: 0, y: 1 },
            'KeyA': { x: -1, y: 0 },
            'KeyD': { x: 1, y: 0 }
        };
        
        const dir = keyMap[e.code];
        if (dir) {
            this.player.nextDirection = dir;
        }
    }
    
    handleMobileControl(dir) {
        if (!this.isPlaying || this.isPaused) return;
        
        const dirMap = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };
        
        this.player.nextDirection = dirMap[dir];
    }
    
    resetMaze() {
        this.maze = this.mazeTemplate.map(row => [...row]);
        this.dotsRemaining = 0;
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 1 || this.maze[y][x] === 3) {
                    this.dotsRemaining++;
                }
            }
        }
    }
    
    createGhosts() {
        this.ghosts = [];
        const startPositions = [
            { x: 10, y: 9 },
            { x: 9, y: 10 },
            { x: 10, y: 10 },
            { x: 11, y: 10 }
        ];
        
        for (let i = 0; i < 4; i++) {
            this.ghosts.push({
                x: startPositions[i].x,
                y: startPositions[i].y,
                color: this.ghostColors[i],
                direction: { x: 0, y: -1 },
                scared: false,
                eaten: false,
                inHouse: true,
                releaseTimer: i * 50 // Staggered release
            });
        }
    }
    
    startGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        
        this.resetMaze();
        this.resetPositions();
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        this.powerMode = false;
        
        this.tickRate = 150;
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        this.playSound('start');
        this.gameLoop(performance.now());
    }
    
    nextLevel() {
        this.level++;
        this.updateLevel();
        
        // Increase difficulty
        this.tickRate = Math.max(80, 150 - this.level * 10);
        
        this.resetMaze();
        this.resetPositions();
        this.hideAllOverlays();
        
        this.isPaused = false;
        this.powerMode = false;
        
        this.playSound('start');
        this.gameLoop(performance.now());
    }
    
    resetPositions() {
        this.player.x = 10;
        this.player.y = 16;
        this.player.direction = { x: 0, y: 0 };
        this.player.nextDirection = { x: 0, y: 0 };
        
        this.createGhosts();
    }
    
    gameLoop(currentTime) {
        if (!this.isPlaying) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.accumulator += deltaTime;
            
            while (this.accumulator >= this.tickRate) {
                this.update();
                this.accumulator -= this.tickRate;
            }
        }
        
        this.draw();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update() {
        // Animate mouth
        this.player.mouthOpen = (this.player.mouthOpen + 1) % 3;
        
        // Try to turn
        const nextX = this.player.x + this.player.nextDirection.x;
        const nextY = this.player.y + this.player.nextDirection.y;
        
        if (this.canMove(nextX, nextY)) {
            this.player.direction = { ...this.player.nextDirection };
        }
        
        // Move player
        const newX = this.player.x + this.player.direction.x;
        const newY = this.player.y + this.player.direction.y;
        
        if (this.canMove(newX, newY)) {
            this.player.x = newX;
            this.player.y = newY;
            
            // Tunnel wrap
            if (this.player.x < 0) this.player.x = this.cols - 1;
            if (this.player.x >= this.cols) this.player.x = 0;
            
            // Eat dots
            this.eatDot();
        }
        
        // Update ghosts
        this.updateGhosts();
        
        // Check ghost collisions
        this.checkGhostCollisions();
        
        // Check win
        if (this.dotsRemaining <= 0) {
            this.levelComplete();
        }
    }
    
    canMove(x, y) {
        // Handle tunnel
        if (x < 0 || x >= this.cols) return true;
        if (y < 0 || y >= this.rows) return false;
        
        const tile = this.maze[y][x];
        return tile !== 0;
    }
    
    eatDot() {
        const tile = this.maze[this.player.y][this.player.x];
        
        if (tile === 1) {
            this.maze[this.player.y][this.player.x] = 2;
            this.score += 10;
            this.dotsRemaining--;
            this.updateScore();
            this.playSound('eat');
        } else if (tile === 3) {
            this.maze[this.player.y][this.player.x] = 2;
            this.score += 50;
            this.dotsRemaining--;
            this.updateScore();
            this.activatePowerMode();
        }
    }
    
    activatePowerMode() {
        this.powerMode = true;
        this.ghosts.forEach(g => {
            if (!g.eaten) g.scared = true;
        });
        
        if (this.powerTimer) clearTimeout(this.powerTimer);
        
        const duration = Math.max(3000, 8000 - this.level * 500);
        this.powerTimer = setTimeout(() => {
            this.powerMode = false;
            this.ghosts.forEach(g => g.scared = false);
        }, duration);
        
        this.playSound('power');
    }
    
    updateGhosts() {
        this.ghosts.forEach((ghost, index) => {
            // Release from house
            if (ghost.inHouse) {
                ghost.releaseTimer--;
                if (ghost.releaseTimer <= 0) {
                    ghost.inHouse = false;
                    ghost.y = 8;
                }
                return;
            }
            
            // If eaten, return to house
            if (ghost.eaten) {
                const homeX = 10;
                const homeY = 10;
                
                if (Math.abs(ghost.x - homeX) < 1 && Math.abs(ghost.y - homeY) < 1) {
                    ghost.eaten = false;
                    ghost.scared = this.powerMode;
                    ghost.inHouse = true;
                    ghost.releaseTimer = 20;
                    return;
                }
                
                // Move toward home
                if (ghost.x < homeX) ghost.x++;
                else if (ghost.x > homeX) ghost.x--;
                if (ghost.y < homeY) ghost.y++;
                else if (ghost.y > homeY) ghost.y--;
                return;
            }
            
            // Choose direction
            const directions = [
                { x: 0, y: -1 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
                { x: 1, y: 0 }
            ];
            
            // Remove reverse direction (ghosts can't turn around)
            const validDirs = directions.filter(d => {
                if (d.x === -ghost.direction.x && d.y === -ghost.direction.y) return false;
                const nx = ghost.x + d.x;
                const ny = ghost.y + d.y;
                return this.canMoveGhost(nx, ny);
            });
            
            if (validDirs.length === 0) {
                // Dead end, reverse
                ghost.direction = { x: -ghost.direction.x, y: -ghost.direction.y };
            } else if (validDirs.length === 1) {
                ghost.direction = validDirs[0];
            } else {
                // Chase or scatter based on ghost type and mode
                let targetX, targetY;
                
                if (ghost.scared) {
                    // Run away from player
                    targetX = ghost.x + (ghost.x - this.player.x);
                    targetY = ghost.y + (ghost.y - this.player.y);
                } else {
                    // Different targeting per ghost
                    switch (index) {
                        case 0: // Blinky - directly chase
                            targetX = this.player.x;
                            targetY = this.player.y;
                            break;
                        case 1: // Pinky - target ahead of player
                            targetX = this.player.x + this.player.direction.x * 4;
                            targetY = this.player.y + this.player.direction.y * 4;
                            break;
                        case 2: // Inky - complex targeting
                            targetX = this.player.x + this.player.direction.x * 2;
                            targetY = this.player.y + this.player.direction.y * 2;
                            break;
                        case 3: // Clyde - chase when far, scatter when close
                            const dist = Math.abs(ghost.x - this.player.x) + Math.abs(ghost.y - this.player.y);
                            if (dist > 8) {
                                targetX = this.player.x;
                                targetY = this.player.y;
                            } else {
                                targetX = 0;
                                targetY = this.rows;
                            }
                            break;
                    }
                }
                
                // Choose direction that gets closest to target
                let bestDir = validDirs[0];
                let bestDist = Infinity;
                
                validDirs.forEach(d => {
                    const nx = ghost.x + d.x;
                    const ny = ghost.y + d.y;
                    const dist = Math.abs(nx - targetX) + Math.abs(ny - targetY);
                    
                    // Add randomness when scared
                    const adjustedDist = ghost.scared ? dist + Math.random() * 10 : dist;
                    
                    if (adjustedDist < bestDist) {
                        bestDist = adjustedDist;
                        bestDir = d;
                    }
                });
                
                ghost.direction = bestDir;
            }
            
            // Move ghost
            const newX = ghost.x + ghost.direction.x;
            const newY = ghost.y + ghost.direction.y;
            
            if (this.canMoveGhost(newX, newY)) {
                ghost.x = newX;
                ghost.y = newY;
                
                // Tunnel wrap
                if (ghost.x < 0) ghost.x = this.cols - 1;
                if (ghost.x >= this.cols) ghost.x = 0;
            }
        });
    }
    
    canMoveGhost(x, y) {
        if (x < 0 || x >= this.cols) return true; // Tunnel
        if (y < 0 || y >= this.rows) return false;
        
        const tile = this.maze[y][x];
        return tile !== 0;
    }
    
    checkGhostCollisions() {
        this.ghosts.forEach(ghost => {
            if (ghost.eaten || ghost.inHouse) return;
            
            if (ghost.x === this.player.x && ghost.y === this.player.y) {
                if (ghost.scared) {
                    // Eat ghost
                    ghost.eaten = true;
                    this.score += 200;
                    this.updateScore();
                    this.playSound('eatghost');
                } else {
                    // Player dies
                    this.playerDeath();
                }
            }
        });
    }
    
    playerDeath() {
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.playSound('death');
            // Brief pause then reset positions
            this.isPaused = true;
            setTimeout(() => {
                this.resetPositions();
                this.isPaused = false;
            }, 1500);
        }
    }
    
    levelComplete() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationId);
        
        this.score += 500 * this.level;
        this.updateScore();
        
        document.getElementById('levelScore').textContent = this.score;
        document.getElementById('winScreen').classList.remove('hidden');
        
        this.playSound('win');
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationId);
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('chomper_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound('gameover');
    }
    
    draw() {
        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawMaze();
        this.drawPlayer();
        this.drawGhosts();
    }
    
    drawMaze() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.maze[y][x];
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                if (tile === 0) {
                    // Wall
                    this.ctx.fillStyle = '#2121de';
                    this.ctx.fillRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
                } else if (tile === 1) {
                    // Dot
                    this.ctx.fillStyle = '#ffb897';
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (tile === 3) {
                    // Power pellet
                    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                    this.ctx.fillStyle = `rgba(255, 184, 151, ${pulse})`;
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, 7, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawPlayer() {
        const px = this.player.x * this.tileSize + this.tileSize / 2;
        const py = this.player.y * this.tileSize + this.tileSize / 2;
        const radius = this.tileSize / 2 - 2;
        
        // Glow
        this.ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        
        // Calculate mouth angle based on direction
        let startAngle = 0;
        if (this.player.direction.x === 1) startAngle = 0;
        else if (this.player.direction.x === -1) startAngle = Math.PI;
        else if (this.player.direction.y === -1) startAngle = -Math.PI / 2;
        else if (this.player.direction.y === 1) startAngle = Math.PI / 2;
        
        // Mouth animation
        const mouthAngle = [0.2, 0.4, 0.2][this.player.mouthOpen];
        
        this.ctx.moveTo(px, py);
        this.ctx.arc(px, py, radius, startAngle + mouthAngle * Math.PI, startAngle - mouthAngle * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawGhosts() {
        this.ghosts.forEach(ghost => {
            const px = ghost.x * this.tileSize + this.tileSize / 2;
            const py = ghost.y * this.tileSize + this.tileSize / 2;
            const size = this.tileSize - 4;
            
            // Determine color
            let color = ghost.color;
            if (ghost.scared) {
                const flash = this.powerTimer && Math.floor(Date.now() / 200) % 2 === 0;
                color = flash ? '#ffffff' : '#0000ff';
            }
            if (ghost.eaten) {
                color = 'rgba(255, 255, 255, 0.3)';
            }
            
            // Glow
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 8;
            
            this.ctx.fillStyle = color;
            
            // Ghost body (rounded top, wavy bottom)
            this.ctx.beginPath();
            this.ctx.arc(px, py - 2, size / 2, Math.PI, 0);
            
            // Wavy bottom
            const waveOffset = Math.sin(Date.now() / 100 + ghost.x) * 2;
            this.ctx.lineTo(px + size / 2, py + size / 2);
            this.ctx.lineTo(px + size / 3, py + size / 3 + waveOffset);
            this.ctx.lineTo(px, py + size / 2);
            this.ctx.lineTo(px - size / 3, py + size / 3 - waveOffset);
            this.ctx.lineTo(px - size / 2, py + size / 2);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Eyes
            if (!ghost.eaten) {
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(px - 4, py - 4, 4, 0, Math.PI * 2);
                this.ctx.arc(px + 4, py - 4, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Pupils (look toward player if not scared)
                let pupilOffsetX = 0, pupilOffsetY = 0;
                if (!ghost.scared) {
                    pupilOffsetX = Math.sign(this.player.x - ghost.x) * 2;
                    pupilOffsetY = Math.sign(this.player.y - ghost.y) * 2;
                }
                
                this.ctx.fillStyle = '#00f';
                this.ctx.beginPath();
                this.ctx.arc(px - 4 + pupilOffsetX, py - 4 + pupilOffsetY, 2, 0, Math.PI * 2);
                this.ctx.arc(px + 4 + pupilOffsetX, py - 4 + pupilOffsetY, 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Just eyes for eaten ghosts
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(px - 4, py - 4, 3, 0, Math.PI * 2);
                this.ctx.arc(px + 4, py - 4, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = '●'.repeat(Math.max(0, this.lives));
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    hideAllOverlays() {
        GameUI.hideAllOverlays();
    }
    
    playSound(type) {
        if (typeof arcadeAudio !== 'undefined') {
            arcadeAudio.play(type);
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChomperGame();
});

