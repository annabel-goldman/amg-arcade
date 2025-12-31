// AMG Arcade - Shared Game Utilities

// ========================================
// High Score Management
// ========================================
const HighScores = {
    get(gameId) {
        return parseInt(localStorage.getItem(`${gameId}_highscore`)) || 0;
    },
    
    set(gameId, score) {
        const current = this.get(gameId);
        if (score > current) {
            localStorage.setItem(`${gameId}_highscore`, score);
            return true; // New high score
        }
        return false;
    },
    
    clear(gameId) {
        localStorage.removeItem(`${gameId}_highscore`);
    },
    
    clearAll() {
        const gameIds = ['snake', 'tetris', 'brickbreaker', 'pong', 'starblaster', 
                        'runner', 'chomper', 'asteroids', 'frogger'];
        gameIds.forEach(id => this.clear(id));
    }
};

// ========================================
// UI Helpers
// ========================================
const GameUI = {
    // Hide all overlay screens
    hideAllOverlays() {
        const overlayIds = ['startScreen', 'gameOverScreen', 'pauseScreen', 'winScreen', 'waveScreen'];
        overlayIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    },
    
    // Show a specific overlay
    showOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    },
    
    // Hide a specific overlay
    hideOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    },
    
    // Update text content of an element
    updateText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },
    
    // Update score display
    updateScore(score) {
        this.updateText('score', score);
    },
    
    // Update lives display with a character repeated
    updateLives(count, char = '♥') {
        this.updateText('lives', char.repeat(Math.max(0, count)));
    },
    
    // Update level display
    updateLevel(level) {
        this.updateText('level', level);
    },
    
    // Update high score display
    updateHighScore(score) {
        this.updateText('highScore', score);
    },
    
    // Show game over screen with final stats
    showGameOver(score, highScore) {
        this.updateText('finalScore', score);
        this.updateText('highScore', highScore);
        this.showOverlay('gameOverScreen');
    }
};

// ========================================
// Input Handling
// ========================================
class GameInput {
    constructor() {
        this.keys = {};
        this.touchControls = {};
        this.enabled = true;
        
        this.setupKeyboardListeners();
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupMobileControls(callback) {
        document.querySelectorAll('.control-btn').forEach(btn => {
            const action = btn.dataset.dir || btn.dataset.action;
            
            const startHandler = (e) => {
                e.preventDefault();
                this.touchControls[action] = true;
                if (callback) callback(action, true);
            };
            
            const endHandler = () => {
                this.touchControls[action] = false;
                if (callback) callback(action, false);
            };
            
            btn.addEventListener('touchstart', startHandler);
            btn.addEventListener('touchend', endHandler);
            btn.addEventListener('mousedown', startHandler);
            btn.addEventListener('mouseup', endHandler);
            btn.addEventListener('mouseleave', endHandler);
        });
    }
    
    isPressed(key) {
        return this.keys[key] || false;
    }
    
    isTouching(action) {
        return this.touchControls[action] || false;
    }
    
    // Check for common movement keys
    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls['left'];
    }
    
    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls['right'];
    }
    
    isUp() {
        return this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls['up'];
    }
    
    isDown() {
        return this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls['down'];
    }
    
    isSpace() {
        return this.keys['Space'];
    }
    
    isPause() {
        return this.keys['KeyP'] || this.keys['Escape'];
    }
    
    clearKey(key) {
        this.keys[key] = false;
    }
    
    clearAll() {
        this.keys = {};
        this.touchControls = {};
    }
}

// ========================================
// Collision Detection Helpers
// ========================================
const Collision = {
    // Rectangle collision
    rect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    },
    
    // Circle collision
    circle(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < a.radius + b.radius;
    },
    
    // Point in rectangle
    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    },
    
    // Point in circle
    pointInCircle(px, py, circle) {
        const dx = px - circle.x;
        const dy = py - circle.y;
        return Math.sqrt(dx * dx + dy * dy) < circle.radius;
    },
    
    // Distance between two points
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
};

// ========================================
// Math Utilities
// ========================================
const GameMath = {
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Random float between min and max
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // Linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    // Convert degrees to radians
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    // Convert radians to degrees
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },
    
    // Normalize angle to 0-2PI
    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }
};

// ========================================
// Canvas Drawing Helpers
// ========================================
const Draw = {
    // Set glow effect
    glow(ctx, color, blur = 10) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
    },
    
    // Clear glow effect
    noGlow(ctx) {
        ctx.shadowBlur = 0;
    },
    
    // Draw text with glow
    glowText(ctx, text, x, y, color, font = '16px "Press Start 2P"', blur = 10) {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
    },
    
    // Draw a rounded rectangle
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
};

// ========================================
// Base Game Class
// ========================================
class ArcadeGame {
    constructor(canvasId, gameId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gameId = gameId;
        
        this.score = 0;
        this.highScore = HighScores.get(gameId);
        this.lives = 3;
        this.level = 1;
        
        this.isPlaying = false;
        this.isPaused = false;
        
        this.animationId = null;
        this.lastTime = 0;
        
        this.input = new GameInput();
    }
    
    // Override in subclass
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
    }
    
    bindEvents() {
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (restartBtn) restartBtn.addEventListener('click', () => this.startGame());
        if (nextLevelBtn) nextLevelBtn.addEventListener('click', () => this.nextLevel());
    }
    
    // Override in subclass
    startGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        
        GameUI.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        
        this.playSound('start');
    }
    
    // Override in subclass
    nextLevel() {
        this.level++;
        this.updateLevel();
        GameUI.hideAllOverlays();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            GameUI.showOverlay('pauseScreen');
        } else {
            GameUI.hideOverlay('pauseScreen');
        }
    }
    
    gameOver() {
        this.isPlaying = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const isNewHighScore = HighScores.set(this.gameId, this.score);
        if (isNewHighScore) {
            this.highScore = this.score;
        }
        
        GameUI.showGameOver(this.score, this.highScore);
        this.playSound('gameover');
    }
    
    updateScore() {
        GameUI.updateScore(this.score);
    }
    
    updateLives(char = '♥') {
        GameUI.updateLives(this.lives, char);
    }
    
    updateLevel() {
        GameUI.updateLevel(this.level);
    }
    
    updateHighScoreDisplay() {
        GameUI.updateHighScore(this.highScore);
    }
    
    playSound(type) {
        if (typeof arcadeAudio !== 'undefined') {
            arcadeAudio.play(type);
        }
    }
    
    // Override in subclass
    update(deltaTime) {}
    
    // Override in subclass
    draw() {}
    
    // Standard game loop
    gameLoop(currentTime = 0) {
        if (!this.isPlaying) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.draw();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
}

