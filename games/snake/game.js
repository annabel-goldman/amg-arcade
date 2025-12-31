// Snake Game - AMG Arcade
// Uses shared utilities from js/audio.js and js/game-utils.js

class SnakeGame extends ArcadeGame {
    constructor() {
        super('gameCanvas', 'snake');
        
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        this.speed = 1;
        this.baseInterval = 150;
        this.gameInterval = null;
        
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
        super.init();
        this.input.setupMobileControls((action, pressed) => {
            if (pressed) this.handleMobileControl(action);
        });
        
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.drawBackground();
    }
    
    handleKeydown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'Space') {
            if (this.isPlaying) this.togglePause();
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
        this.updateStats();
        this.spawnFood();
        
        GameUI.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), this.baseInterval);
        
        this.playSound('start');
    }
    
    gameLoop() {
        if (this.isPaused) return;
        
        this.direction = { ...this.nextDirection };
        
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };
        
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }
        
        this.draw();
    }
    
    checkCollision(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // Self collision
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
        
        if (this.score % 50 === 0) {
            this.increaseSpeed();
        }
        
        this.updateStats();
    }
    
    spawnFood() {
        let newFood;
        let validPosition = false;
        
        while (!validPosition) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            
            validPosition = !this.snake.some(segment => 
                segment.x === newFood.x && segment.y === newFood.y
            );
        }
        
        this.food = newFood;
    }
    
    increaseSpeed() {
        this.speed++;
        
        clearInterval(this.gameInterval);
        const newInterval = Math.max(50, this.baseInterval - (this.speed - 1) * 15);
        this.gameInterval = setInterval(() => this.gameLoop(), newInterval);
        
        this.playSound('levelup');
        this.updateStats();
    }
    
    updateStats() {
        GameUI.updateText('length', this.snake.length);
        GameUI.updateText('speed', this.speed);
    }
    
    gameOver() {
        this.isPlaying = false;
        clearInterval(this.gameInterval);
        
        const isNewHighScore = HighScores.set(this.gameId, this.score);
        if (isNewHighScore) {
            this.highScore = this.score;
        }
        
        GameUI.updateText('finalScore', this.score);
        GameUI.updateHighScore(this.highScore);
        GameUI.showOverlay('gameOverScreen');
        
        this.playSound('gameover');
    }
    
    draw() {
        this.drawBackground();
        this.drawFood();
        this.drawSnake();
    }
    
    drawBackground() {
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
            
            Draw.glow(this.ctx, this.colors.snakeGlow, 10);
            
            const brightness = 1 - (index / this.snake.length) * 0.5;
            const green = Math.floor(255 * brightness);
            this.ctx.fillStyle = `rgb(${Math.floor(57 * brightness)}, ${green}, ${Math.floor(20 * brightness)})`;
            
            if (index === 0) {
                this.ctx.fillStyle = this.colors.snakeHead;
            }
            
            const padding = 1;
            this.ctx.fillRect(x + padding, y + padding, this.gridSize - padding * 2, this.gridSize - padding * 2);
            
            // Eyes on head
            if (index === 0) {
                Draw.noGlow(this.ctx);
                this.ctx.fillStyle = '#000';
                
                const eyeSize = 4;
                
                if (this.direction.x === 1) {
                    this.ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                } else if (this.direction.x === -1) {
                    this.ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
                } else if (this.direction.y === -1) {
                    this.ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 4, eyeSize, eyeSize);
                } else {
                    this.ctx.fillRect(x + 4, y + 12, eyeSize, eyeSize);
                    this.ctx.fillRect(x + 12, y + 12, eyeSize, eyeSize);
                }
            }
        });
        
        Draw.noGlow(this.ctx);
    }
    
    drawFood() {
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        
        const pulse = Math.sin(Date.now() / 200) * 5 + 15;
        Draw.glow(this.ctx, this.colors.foodGlow, pulse);
        
        this.ctx.fillStyle = this.colors.food;
        this.ctx.beginPath();
        this.ctx.arc(x + this.gridSize / 2, y + this.gridSize / 2, this.gridSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        Draw.noGlow(this.ctx);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
