// Frogger Game - AMG Arcade
class FroggerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.tileSize = 40;
        this.cols = 10;
        this.rows = 13;
        
        // Frog
        this.frog = {
            x: 4,
            y: 12,
            targetX: 4,
            targetY: 12,
            hopping: false,
            hopProgress: 0,
            onLog: null
        };
        
        // Lane configuration (from top to bottom)
        this.lanes = [
            { type: 'goal', y: 0 },
            { type: 'water', y: 1, objects: [], speed: 1.5, direction: 1, objectType: 'log', objectWidth: 3 },
            { type: 'water', y: 2, objects: [], speed: -2, direction: -1, objectType: 'log', objectWidth: 2 },
            { type: 'water', y: 3, objects: [], speed: 1, direction: 1, objectType: 'turtle', objectWidth: 3 },
            { type: 'water', y: 4, objects: [], speed: -1.5, direction: -1, objectType: 'log', objectWidth: 4 },
            { type: 'water', y: 5, objects: [], speed: 2, direction: 1, objectType: 'log', objectWidth: 2 },
            { type: 'safe', y: 6 },
            { type: 'road', y: 7, objects: [], speed: -2, direction: -1, objectType: 'car' },
            { type: 'road', y: 8, objects: [], speed: 1.5, direction: 1, objectType: 'truck' },
            { type: 'road', y: 9, objects: [], speed: -1, direction: -1, objectType: 'car' },
            { type: 'road', y: 10, objects: [], speed: 2.5, direction: 1, objectType: 'car' },
            { type: 'road', y: 11, objects: [], speed: -1.5, direction: -1, objectType: 'truck' },
            { type: 'start', y: 12 }
        ];
        
        this.goals = [false, false, false, false, false];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('frogger_highscore')) || 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.createObjects();
        this.draw();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.hop(btn.dataset.dir);
            });
            btn.addEventListener('click', () => this.hop(btn.dataset.dir));
        });
    }
    
    handleKeydown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'Space' && this.isPlaying) {
            this.togglePause();
            return;
        }
        
        if (!this.isPlaying || this.isPaused || this.frog.hopping) return;
        
        const dirMap = {
            'ArrowUp': 'up', 'KeyW': 'up',
            'ArrowDown': 'down', 'KeyS': 'down',
            'ArrowLeft': 'left', 'KeyA': 'left',
            'ArrowRight': 'right', 'KeyD': 'right'
        };
        
        if (dirMap[e.code]) {
            this.hop(dirMap[e.code]);
        }
    }
    
    hop(direction) {
        if (!this.isPlaying || this.isPaused || this.frog.hopping) return;
        
        let newX = this.frog.x;
        let newY = this.frog.y;
        
        switch (direction) {
            case 'up': newY--; break;
            case 'down': newY++; break;
            case 'left': newX--; break;
            case 'right': newX++; break;
        }
        
        // Bounds check
        if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
            return;
        }
        
        this.frog.targetX = newX;
        this.frog.targetY = newY;
        this.frog.hopping = true;
        this.frog.hopProgress = 0;
        this.frog.onLog = null;
        
        this.playSound('hop');
    }
    
    createObjects() {
        this.lanes.forEach(lane => {
            if (lane.type === 'road' || lane.type === 'water') {
                lane.objects = [];
                const spacing = lane.objectType === 'truck' ? 4 : 3;
                const count = Math.floor(this.cols / spacing);
                
                for (let i = 0; i < count; i++) {
                    lane.objects.push({
                        x: i * spacing * this.tileSize + (lane.direction > 0 ? 0 : this.tileSize),
                        width: (lane.objectWidth || 1) * this.tileSize
                    });
                }
            }
        });
    }
    
    startGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.goals = [false, false, false, false, false];
        
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        
        this.resetFrog();
        this.createObjects();
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        this.playSound('start');
        this.gameLoop(performance.now());
    }
    
    resetFrog() {
        this.frog.x = 4;
        this.frog.y = 12;
        this.frog.targetX = 4;
        this.frog.targetY = 12;
        this.frog.hopping = false;
        this.frog.onLog = null;
    }
    
    nextLevel() {
        this.level++;
        this.updateLevel();
        this.goals = [false, false, false, false, false];
        
        // Speed up lanes
        this.lanes.forEach(lane => {
            if (lane.speed) {
                lane.speed *= 1.1;
            }
        });
        
        this.resetFrog();
    }
    
    gameLoop(currentTime) {
        if (!this.isPlaying) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.draw();
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update(dt) {
        // Update hop animation
        if (this.frog.hopping) {
            this.frog.hopProgress += dt * 8;
            
            if (this.frog.hopProgress >= 1) {
                this.frog.x = this.frog.targetX;
                this.frog.y = this.frog.targetY;
                this.frog.hopping = false;
                this.frog.hopProgress = 0;
                
                // Check what we landed on
                this.checkLanding();
            }
        }
        
        // Update lane objects
        this.lanes.forEach(lane => {
            if (lane.objects) {
                lane.objects.forEach(obj => {
                    obj.x += lane.speed * dt * 60;
                    
                    // Wrap around
                    if (lane.direction > 0 && obj.x > this.canvas.width) {
                        obj.x = -obj.width;
                    } else if (lane.direction < 0 && obj.x + obj.width < 0) {
                        obj.x = this.canvas.width;
                    }
                });
            }
        });
        
        // Move frog with log
        if (this.frog.onLog && !this.frog.hopping) {
            const lane = this.lanes.find(l => l.y === this.frog.y);
            if (lane) {
                const pixelX = this.frog.x * this.tileSize + lane.speed * dt * 60;
                this.frog.x = pixelX / this.tileSize;
                
                // Check if moved off screen
                if (this.frog.x < -1 || this.frog.x >= this.cols + 1) {
                    this.die();
                }
            }
        }
        
        // Continuous collision check for road
        if (!this.frog.hopping) {
            this.checkRoadCollision();
            this.checkWaterCollision();
        }
    }
    
    checkLanding() {
        const lane = this.lanes.find(l => l.y === this.frog.y);
        
        if (!lane) return;
        
        if (lane.type === 'goal') {
            this.reachGoal();
        } else if (lane.type === 'water') {
            this.checkWaterCollision();
        } else if (lane.type === 'road') {
            this.checkRoadCollision();
        }
        
        // Score for forward progress
        if (this.frog.y < 12) {
            const progress = 12 - this.frog.y;
            this.score = Math.max(this.score, progress * 10);
            this.updateScore();
        }
    }
    
    checkRoadCollision() {
        const lane = this.lanes.find(l => l.y === this.frog.y && l.type === 'road');
        if (!lane) return;
        
        const frogLeft = this.frog.x * this.tileSize;
        const frogRight = frogLeft + this.tileSize;
        
        lane.objects.forEach(obj => {
            if (frogRight > obj.x && frogLeft < obj.x + obj.width) {
                this.die();
            }
        });
    }
    
    checkWaterCollision() {
        const lane = this.lanes.find(l => l.y === this.frog.y && l.type === 'water');
        if (!lane) return;
        
        const frogCenterX = this.frog.x * this.tileSize + this.tileSize / 2;
        let onSomething = false;
        
        lane.objects.forEach(obj => {
            if (frogCenterX > obj.x && frogCenterX < obj.x + obj.width) {
                onSomething = true;
                this.frog.onLog = obj;
            }
        });
        
        if (!onSomething) {
            this.die();
        }
    }
    
    reachGoal() {
        const goalIndex = Math.round(this.frog.x / 2);
        
        if (goalIndex >= 0 && goalIndex < 5 && !this.goals[goalIndex]) {
            this.goals[goalIndex] = true;
            this.score += 100;
            this.updateScore();
            this.playSound('goal');
            
            // Check if all goals reached
            if (this.goals.every(g => g)) {
                this.score += 500;
                this.updateScore();
                this.nextLevel();
            } else {
                this.resetFrog();
            }
        } else {
            this.die();
        }
    }
    
    die() {
        this.lives--;
        this.updateLives();
        this.playSound('death');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetFrog();
        }
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
            localStorage.setItem('frogger_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound('gameover');
    }
    
    draw() {
        // Clear
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw lanes
        this.drawLanes();
        
        // Draw objects
        this.drawObjects();
        
        // Draw frog
        this.drawFrog();
        
        // Draw goals
        this.drawGoals();
    }
    
    drawLanes() {
        this.lanes.forEach(lane => {
            const y = lane.y * this.tileSize;
            
            switch (lane.type) {
                case 'goal':
                    this.ctx.fillStyle = '#0a3a0a';
                    break;
                case 'water':
                    this.ctx.fillStyle = '#0a0a4a';
                    break;
                case 'safe':
                case 'start':
                    this.ctx.fillStyle = '#2a1a4a';
                    break;
                case 'road':
                    this.ctx.fillStyle = '#1a1a1a';
                    break;
            }
            
            this.ctx.fillRect(0, y, this.canvas.width, this.tileSize);
            
            // Road markings
            if (lane.type === 'road') {
                this.ctx.strokeStyle = '#ffff00';
                this.ctx.setLineDash([20, 20]);
                this.ctx.beginPath();
                this.ctx.moveTo(0, y + this.tileSize);
                this.ctx.lineTo(this.canvas.width, y + this.tileSize);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        });
    }
    
    drawObjects() {
        this.lanes.forEach(lane => {
            if (!lane.objects) return;
            
            const y = lane.y * this.tileSize;
            
            lane.objects.forEach(obj => {
                if (lane.type === 'road') {
                    // Draw vehicles
                    const color = lane.objectType === 'truck' ? '#ff6600' : '#ff0040';
                    this.ctx.fillStyle = color;
                    this.ctx.shadowColor = color;
                    this.ctx.shadowBlur = 10;
                    this.ctx.fillRect(obj.x, y + 5, obj.width - 4, this.tileSize - 10);
                    
                    // Headlights
                    this.ctx.fillStyle = '#ffff00';
                    if (lane.direction > 0) {
                        this.ctx.fillRect(obj.x + obj.width - 8, y + 8, 4, 6);
                        this.ctx.fillRect(obj.x + obj.width - 8, y + 26, 4, 6);
                    } else {
                        this.ctx.fillRect(obj.x + 4, y + 8, 4, 6);
                        this.ctx.fillRect(obj.x + 4, y + 26, 4, 6);
                    }
                } else if (lane.type === 'water') {
                    // Draw logs/turtles
                    if (lane.objectType === 'log') {
                        this.ctx.fillStyle = '#8B4513';
                        this.ctx.fillRect(obj.x, y + 4, obj.width - 2, this.tileSize - 8);
                        this.ctx.fillStyle = '#654321';
                        this.ctx.fillRect(obj.x + 2, y + 8, obj.width - 6, 4);
                    } else {
                        // Turtles
                        const turtleCount = Math.floor(obj.width / this.tileSize);
                        for (let i = 0; i < turtleCount; i++) {
                            this.ctx.fillStyle = '#006400';
                            this.ctx.beginPath();
                            this.ctx.arc(
                                obj.x + i * this.tileSize + this.tileSize / 2,
                                y + this.tileSize / 2,
                                14,
                                0, Math.PI * 2
                            );
                            this.ctx.fill();
                        }
                    }
                }
            });
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawGoals() {
        const goalY = 0;
        const goalPositions = [0, 2, 4, 6, 8];
        
        goalPositions.forEach((x, i) => {
            const px = x * this.tileSize;
            
            if (this.goals[i]) {
                // Frog in goal
                this.ctx.fillStyle = '#39ff14';
                this.ctx.shadowColor = '#39ff14';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(px + this.tileSize, goalY + this.tileSize / 2, 15, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Lily pad
                this.ctx.fillStyle = '#0a5a0a';
                this.ctx.beginPath();
                this.ctx.arc(px + this.tileSize, goalY + this.tileSize / 2, 18, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.shadowBlur = 0;
    }
    
    drawFrog() {
        let x = this.frog.x;
        let y = this.frog.y;
        
        // Animate hop
        if (this.frog.hopping) {
            const progress = this.frog.hopProgress;
            x = this.frog.x + (this.frog.targetX - this.frog.x) * progress;
            y = this.frog.y + (this.frog.targetY - this.frog.y) * progress;
            
            // Add jump arc
            const jumpHeight = Math.sin(progress * Math.PI) * 0.5;
            y -= jumpHeight;
        }
        
        const px = x * this.tileSize + this.tileSize / 2;
        const py = y * this.tileSize + this.tileSize / 2;
        
        // Glow
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 15;
        
        // Body
        this.ctx.fillStyle = '#39ff14';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(px - 6, py - 8, 5, 0, Math.PI * 2);
        this.ctx.arc(px + 6, py - 8, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(px - 6, py - 8, 2, 0, Math.PI * 2);
        this.ctx.arc(px + 6, py - 8, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = '🐸'.repeat(Math.max(0, this.lives));
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

document.addEventListener('DOMContentLoaded', () => {
    new FroggerGame();
});

