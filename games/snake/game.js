// Snake Game - AMG Arcade
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snake_highscore')) || 0;
        this.speed = 1;
        this.baseInterval = 150;
        this.gameInterval = null;
        
        this.isPlaying = false;
        this.isPaused = false;
        
        this.colors = {
            snake: '#39ff14',
            snakeHead: '#7fff00',
            snakeGlow: 'rgba(57, 255, 20, 0.5)',
            food: '#ff0040',
            foodGlow: 'rgba(255, 0, 64, 0.5)'
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        
        // Draw initial state
        this.drawBackground();
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Button controls
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMobileControl(btn.dataset.dir);
            });
            btn.addEventListener('click', () => {
                this.handleMobileControl(btn.dataset.dir);
            });
        });
    }
    
    handleKeydown(e) {
        // Prevent default for arrow keys
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
        
        const newDir = keyMap[e.code];
        if (newDir) {
            // Prevent 180-degree turns
            if (this.direction.x + newDir.x !== 0 || this.direction.y + newDir.y !== 0) {
                this.nextDirection = newDir;
            }
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
        
        const newDir = dirMap[dir];
        if (newDir && (this.direction.x + newDir.x !== 0 || this.direction.y + newDir.y !== 0)) {
            this.nextDirection = newDir;
        }
    }
    
    startGame() {
        // Reset state
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.speed = 1;
        
        this.updateScore();
        this.spawnFood();
        
        // Hide overlays
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        
        // Start game loop
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), this.baseInterval);
        
        this.playSound('start');
    }
    
    gameLoop() {
        if (this.isPaused) return;
        
        this.direction = { ...this.nextDirection };
        
        // Calculate new head position
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };
        
        // Check collisions
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        // Add new head
        this.snake.unshift(head);
        
        // Check if eating food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            // Remove tail if not eating
            this.snake.pop();
        }
        
        this.draw();
    }
    
    checkCollision(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // Self collision (skip head)
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    eatFood() {
        this.score += 10;
        this.updateScore();
        this.spawnFood();
        this.playSound('eat');
        
        // Increase speed every 50 points
        if (this.score % 50 === 0) {
            this.increaseSpeed();
        }
    }
    
    spawnFood() {
        let newFood;
        let validPosition = false;
        
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            // Make sure food doesn't spawn on snake
            validPosition = !this.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
        }
        
        this.food = newFood;
    }
    
    increaseSpeed() {
        this.speed++;
        document.getElementById('speed').textContent = this.speed;
        
        clearInterval(this.gameInterval);
        const newInterval = Math.max(50, this.baseInterval - (this.speed - 1) * 15);
        this.gameInterval = setInterval(() => this.gameLoop(), newInterval);
        
        this.playSound('levelup');
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
        clearInterval(this.gameInterval);
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound('gameover');
    }
    
    draw() {
        this.drawBackground();
        this.drawFood();
        this.drawSnake();
    }
    
    drawBackground() {
        // Dark green background
        this.ctx.fillStyle = '#0a1a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Subtle grid
        this.ctx.strokeStyle = 'rgba(57, 255, 20, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            const pos = i * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            
            // Glow effect
            this.ctx.shadowColor = this.colors.snakeGlow;
            this.ctx.shadowBlur = 10;
            
            // Gradient from head to tail
            const brightness = 1 - (index / this.snake.length) * 0.5;
            const green = Math.floor(255 * brightness);
            this.ctx.fillStyle = `rgb(${Math.floor(57 * brightness)}, ${green}, ${Math.floor(20 * brightness)})`;
            
            if (index === 0) {
                // Head is brighter
                this.ctx.fillStyle = this.colors.snakeHead;
            }
            
            // Draw segment with slight padding
            const padding = 1;
            this.ctx.fillRect(
                x + padding, 
                y + padding, 
                this.gridSize - padding * 2, 
                this.gridSize - padding * 2
            );
            
            // Draw eyes on head
            if (index === 0) {
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#000';
                
                const eyeSize = 4;
                const eyeOffset = 5;
                
                if (this.direction.x === 1) {
                    // Facing right
                    this.ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                } else if (this.direction.x === -1) {
                    // Facing left
                    this.ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
                } else if (this.direction.y === -1) {
                    // Facing up
                    this.ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
                } else {
                    // Facing down
                    this.ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                }
            }
        });
        
        this.ctx.shadowBlur = 0;
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        // Pulsing glow effect
        const pulse = Math.sin(Date.now() / 200) * 5 + 15;
        this.ctx.shadowColor = this.colors.foodGlow;
        this.ctx.shadowBlur = pulse;
        
        this.ctx.fillStyle = this.colors.food;
        
        // Draw as circle (apple)
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.gridSize / 2,
            y + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('length').textContent = this.snake.length;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    hideAllOverlays() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch (type) {
                case 'eat':
                    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
                    
                case 'gameover':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
                    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                    break;
                    
                case 'start':
                    oscillator.frequency.setValueAtTime(262, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(330, audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(392, audioContext.currentTime + 0.2);
                    oscillator.frequency.setValueAtTime(523, audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.4);
                    break;
                    
                case 'levelup':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(554.37, audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2);
                    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.4);
                    break;
            }
        } catch (e) {
            // Audio not supported
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});

