// Brick Breaker Game - AMG Arcade
class BrickBreakerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Paddle
        this.paddle = {
            width: 80,
            height: 12,
            x: 0,
            speed: 8
        };
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        this.paddle.y = this.canvas.height - 30;
        
        // Ball
        this.ball = {
            radius: 8,
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            dx: 4,
            dy: -4,
            speed: 5
        };
        
        // Bricks
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 50;
        this.brickHeight = 18;
        this.brickPadding = 6;
        this.brickOffsetTop = 40;
        this.brickOffsetLeft = 15;
        this.bricks = [];
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('brickbreaker_highscore')) || 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        this.ballLaunched = false;
        
        // Controls
        this.leftPressed = false;
        this.rightPressed = false;
        
        // Colors for bricks
        this.brickColors = [
            { fill: '#ff0040', glow: 'rgba(255, 0, 64, 0.5)' },
            { fill: '#ff6600', glow: 'rgba(255, 102, 0, 0.5)' },
            { fill: '#ffff00', glow: 'rgba(255, 255, 0, 0.5)' },
            { fill: '#39ff14', glow: 'rgba(57, 255, 20, 0.5)' },
            { fill: '#00ffff', glow: 'rgba(0, 255, 255, 0.5)' }
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.draw();
    }
    
    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        document.addEventListener('keyup', (e) => this.handleKeyup(e));
        
        // Mouse/touch controls
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('click', () => this.launchBall());
        
        // Button controls
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        
        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (btn.dataset.dir === 'left') this.leftPressed = true;
                if (btn.dataset.dir === 'right') this.rightPressed = true;
            });
            btn.addEventListener('touchend', () => {
                this.leftPressed = false;
                this.rightPressed = false;
            });
            btn.addEventListener('mousedown', () => {
                if (btn.dataset.dir === 'left') this.leftPressed = true;
                if (btn.dataset.dir === 'right') this.rightPressed = true;
            });
            btn.addEventListener('mouseup', () => {
                this.leftPressed = false;
                this.rightPressed = false;
            });
        });
    }
    
    handleKeydown(e) {
        if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'Space') {
            if (this.isPlaying && !this.ballLaunched) {
                this.launchBall();
            } else if (this.isPlaying) {
                this.togglePause();
            }
            return;
        }
        
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.leftPressed = true;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.rightPressed = true;
        }
    }
    
    handleKeyup(e) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.leftPressed = false;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.rightPressed = false;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        
        const newX = mouseX - this.paddle.width / 2;
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, newX));
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const touchX = (e.touches[0].clientX - rect.left) * scaleX;
        
        const newX = touchX - this.paddle.width / 2;
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, newX));
    }
    
    createBricks() {
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                // Add some variety based on level
                const hits = this.level > 2 && r === 0 ? 2 : 1;
                this.bricks[c][r] = { 
                    x: 0, 
                    y: 0, 
                    status: 1,
                    hits: hits,
                    maxHits: hits
                };
            }
        }
    }
    
    startGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        
        this.resetBall();
        this.createBricks();
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        this.ballLaunched = false;
        
        this.playSound('start');
        this.gameLoop();
    }
    
    nextLevel() {
        this.level++;
        this.updateLevel();
        
        // Increase difficulty
        this.ball.speed = 5 + this.level * 0.5;
        
        this.resetBall();
        this.createBricks();
        this.hideAllOverlays();
        
        this.isPaused = false;
        this.ballLaunched = false;
        
        this.playSound('start');
        this.gameLoop();
    }
    
    resetBall() {
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height - 50;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.dy = -this.ball.speed;
        this.ballLaunched = false;
    }
    
    launchBall() {
        if (!this.ballLaunched && this.isPlaying) {
            this.ballLaunched = true;
            this.playSound('launch');
        }
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        if (this.isPaused) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Move paddle
        if (this.leftPressed && this.paddle.x > 0) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.rightPressed && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += this.paddle.speed;
        }
        
        // If ball not launched, follow paddle
        if (!this.ballLaunched) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            return;
        }
        
        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Wall collisions
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) {
            this.ball.dx = -this.ball.dx;
            this.playSound('wall');
        }
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy = -this.ball.dy;
            this.playSound('wall');
        }
        
        // Paddle collision
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            // Calculate bounce angle based on where ball hits paddle
            const hitPoint = (this.ball.x - this.paddle.x) / this.paddle.width;
            const angle = (hitPoint - 0.5) * Math.PI * 0.7; // -63 to 63 degrees
            
            const speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
            this.ball.dx = Math.sin(angle) * speed;
            this.ball.dy = -Math.abs(Math.cos(angle) * speed);
            
            this.playSound('paddle');
        }
        
        // Ball fell off bottom
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.lives--;
            this.updateLives();
            
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBall();
                this.playSound('lose');
            }
        }
        
        // Brick collisions
        this.checkBrickCollisions();
        
        // Check win condition
        if (this.checkWin()) {
            this.levelComplete();
        }
    }
    
    checkBrickCollisions() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                if (brick.status === 1) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    brick.x = brickX;
                    brick.y = brickY;
                    
                    if (this.ball.x + this.ball.radius > brickX &&
                        this.ball.x - this.ball.radius < brickX + this.brickWidth &&
                        this.ball.y + this.ball.radius > brickY &&
                        this.ball.y - this.ball.radius < brickY + this.brickHeight) {
                        
                        this.ball.dy = -this.ball.dy;
                        brick.hits--;
                        
                        if (brick.hits <= 0) {
                            brick.status = 0;
                            this.score += 10 * this.level;
                            this.updateScore();
                            this.playSound('break');
                        } else {
                            this.playSound('hit');
                        }
                    }
                }
            }
        }
    }
    
    checkWin() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    return false;
                }
            }
        }
        return true;
    }
    
    levelComplete() {
        this.isPaused = true;
        this.score += 100 * this.level; // Level bonus
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
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('brickbreaker_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound('gameover');
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2a1030');
        gradient.addColorStop(1, '#1a0a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBricks();
        this.drawPaddle();
        this.drawBall();
        
        // Draw launch prompt
        if (!this.ballLaunched && this.isPlaying) {
            this.ctx.font = '12px "Press Start 2P"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLICK OR PRESS SPACE TO LAUNCH', this.canvas.width / 2, this.canvas.height - 80);
        }
    }
    
    drawBricks() {
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const brick = this.bricks[c][r];
                if (brick && brick.status === 1) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    
                    const colorIndex = r % this.brickColors.length;
                    const color = this.brickColors[colorIndex];
                    
                    // Glow effect
                    this.ctx.shadowColor = color.glow;
                    this.ctx.shadowBlur = 10;
                    
                    // Draw brick
                    this.ctx.fillStyle = color.fill;
                    
                    // Darker if damaged
                    if (brick.hits < brick.maxHits) {
                        this.ctx.globalAlpha = 0.6;
                    }
                    
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, this.brickHeight);
                    
                    // Highlight
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(brickX, brickY, this.brickWidth, 4);
                    
                    this.ctx.globalAlpha = 1;
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }
    
    drawPaddle() {
        // Glow
        this.ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        this.ctx.shadowBlur = 15;
        
        // Gradient paddle
        const gradient = this.ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#0088aa');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 4);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawBall() {
        // Glow
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 15;
        
        // Ball
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - 2, this.ball.y - 2, this.ball.radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = '♥'.repeat(this.lives);
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
    new BrickBreakerGame();
});

