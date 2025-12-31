// Star Blaster Game - AMG Arcade (Galaga-style)
class StarBlasterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Player ship
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 30,
            speed: 6
        };
        
        // Bullets
        this.bullets = [];
        this.bulletSpeed = 10;
        this.canShoot = true;
        this.shootCooldown = 200;
        
        // Enemies
        this.enemies = [];
        this.enemyBullets = [];
        this.enemySpeed = 1;
        this.enemyDirection = 1;
        
        // Stars (background)
        this.stars = [];
        this.initStars();
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.highScore = parseInt(localStorage.getItem('starblaster_highscore')) || 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        
        // Controls
        this.leftPressed = false;
        this.rightPressed = false;
        this.firePressed = false;
        
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.draw();
    }
    
    initStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 0.5
            });
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        document.addEventListener('keyup', (e) => this.handleKeyup(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (btn.dataset.dir === 'left') this.leftPressed = true;
                if (btn.dataset.dir === 'right') this.rightPressed = true;
                if (btn.dataset.action === 'fire') this.shoot();
            });
            btn.addEventListener('touchend', () => {
                this.leftPressed = false;
                this.rightPressed = false;
            });
            btn.addEventListener('mousedown', () => {
                if (btn.dataset.dir === 'left') this.leftPressed = true;
                if (btn.dataset.dir === 'right') this.rightPressed = true;
                if (btn.dataset.action === 'fire') this.shoot();
            });
            btn.addEventListener('mouseup', () => {
                this.leftPressed = false;
                this.rightPressed = false;
            });
        });
    }
    
    handleKeydown(e) {
        if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'Escape' && this.isPlaying) {
            this.togglePause();
            return;
        }
        
        if (e.code === 'Space') {
            if (this.isPlaying && !this.isPaused) {
                this.shoot();
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
    
    shoot() {
        if (!this.canShoot || !this.isPlaying || this.isPaused) return;
        
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 15,
            width: 4,
            height: 12
        });
        
        this.canShoot = false;
        setTimeout(() => this.canShoot = true, this.shootCooldown);
        
        this.playSound('shoot');
    }
    
    createEnemies() {
        this.enemies = [];
        const rows = Math.min(3 + Math.floor(this.wave / 2), 5);
        const cols = Math.min(6 + this.wave, 10);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.enemies.push({
                    x: 50 + col * 35,
                    y: 50 + row * 35,
                    width: 25,
                    height: 25,
                    type: row === 0 ? 2 : (row < 2 ? 1 : 0), // Different enemy types
                    alive: true,
                    frame: 0
                });
            }
        }
        
        this.enemySpeed = 0.5 + this.wave * 0.2;
        this.enemyDirection = 1;
    }
    
    startGame() {
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        
        this.updateScore();
        this.updateLives();
        this.updateWave();
        
        this.player.x = this.canvas.width / 2;
        this.bullets = [];
        this.enemyBullets = [];
        
        this.hideAllOverlays();
        this.showWaveScreen();
    }
    
    showWaveScreen() {
        document.getElementById('waveText').textContent = `WAVE ${this.wave}`;
        document.getElementById('waveScreen').classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('waveScreen').classList.add('hidden');
            this.createEnemies();
            this.isPlaying = true;
            this.isPaused = false;
            this.gameLoop();
        }, 2000);
    }
    
    nextWave() {
        this.wave++;
        this.updateWave();
        this.bullets = [];
        this.enemyBullets = [];
        this.showWaveScreen();
        this.playSound('wave');
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        if (this.isPaused) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
        
        // Move player
        if (this.leftPressed && this.player.x > this.player.width / 2) {
            this.player.x -= this.player.speed;
        }
        if (this.rightPressed && this.player.x < this.canvas.width - this.player.width / 2) {
            this.player.x += this.player.speed;
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= this.bulletSpeed;
            return bullet.y > 0;
        });
        
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed;
            return bullet.y < this.canvas.height;
        });
        
        // Move enemies
        let hitEdge = false;
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            enemy.x += this.enemySpeed * this.enemyDirection;
            
            if (enemy.x < 20 || enemy.x > this.canvas.width - 20) {
                hitEdge = true;
            }
        });
        
        if (hitEdge) {
            this.enemyDirection *= -1;
            this.enemies.forEach(enemy => {
                if (enemy.alive) {
                    enemy.y += 10;
                }
            });
        }
        
        // Enemy shooting
        if (Math.random() < 0.02 * (1 + this.wave * 0.1)) {
            const aliveEnemies = this.enemies.filter(e => e.alive);
            if (aliveEnemies.length > 0) {
                const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                this.enemyBullets.push({
                    x: shooter.x,
                    y: shooter.y + 15,
                    width: 4,
                    height: 8,
                    speed: 4 + this.wave * 0.3
                });
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check win/lose conditions
        if (this.enemies.every(e => !e.alive)) {
            this.isPlaying = false;
            this.score += 100 * this.wave;
            this.updateScore();
            setTimeout(() => this.nextWave(), 1000);
        }
        
        // Check if enemies reached bottom
        if (this.enemies.some(e => e.alive && e.y > this.canvas.height - 80)) {
            this.gameOver();
        }
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (!enemy.alive) return;
                
                if (this.rectCollision(bullet, enemy)) {
                    enemy.alive = false;
                    bullet.y = -100; // Remove bullet
                    
                    const points = (enemy.type + 1) * 10;
                    this.score += points;
                    this.updateScore();
                    
                    this.playSound('hit');
                }
            });
        });
        
        // Enemy bullets vs player
        this.enemyBullets.forEach(bullet => {
            const playerRect = {
                x: this.player.x - this.player.width / 2,
                y: this.player.y - this.player.height / 2,
                width: this.player.width,
                height: this.player.height
            };
            
            if (this.rectCollision(bullet, playerRect)) {
                bullet.y = this.canvas.height + 100;
                this.playerHit();
            }
        });
        
        // Enemies vs player
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const playerRect = {
                x: this.player.x - this.player.width / 2,
                y: this.player.y - this.player.height / 2,
                width: this.player.width,
                height: this.player.height
            };
            
            if (this.rectCollision(enemy, playerRect)) {
                enemy.alive = false;
                this.playerHit();
            }
        });
    }
    
    rectCollision(a, b) {
        const ax = a.x - (a.width || 0) / 2;
        const ay = a.y - (a.height || 0) / 2;
        const bx = b.x - (b.width || 0) / 2;
        const by = b.y - (b.height || 0) / 2;
        
        return ax < bx + b.width &&
               ax + a.width > bx &&
               ay < by + b.height &&
               ay + a.height > by;
    }
    
    playerHit() {
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.playSound('hit');
            // Brief invincibility would go here
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
            localStorage.setItem('starblaster_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound('gameover');
    }
    
    draw() {
        // Clear and draw background
        this.ctx.fillStyle = '#000010';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.drawStars();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw player
        this.drawPlayer();
        
        // Draw bullets
        this.drawBullets();
        
        // Draw enemy bullets
        this.drawEnemyBullets();
    }
    
    drawStars() {
        this.stars.forEach(star => {
            const brightness = 0.3 + Math.random() * 0.7;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
    
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        
        // Glow
        this.ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
        this.ctx.shadowBlur = 15;
        
        // Ship body (triangle)
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 15);
        this.ctx.lineTo(x - 15, y + 15);
        this.ctx.lineTo(x + 15, y + 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Cockpit
        this.ctx.fillStyle = '#004466';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 5);
        this.ctx.lineTo(x - 6, y + 8);
        this.ctx.lineTo(x + 6, y + 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Engine glow
        this.ctx.fillStyle = '#ff6600';
        this.ctx.shadowColor = 'rgba(255, 102, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 8, y + 15);
        this.ctx.lineTo(x, y + 20 + Math.random() * 5);
        this.ctx.lineTo(x + 8, y + 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const x = enemy.x;
            const y = enemy.y;
            
            // Different colors per type
            const colors = ['#ff0040', '#ff6600', '#ff00ff'];
            const color = colors[enemy.type];
            
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            
            // Enemy body
            this.ctx.fillStyle = color;
            
            if (enemy.type === 0) {
                // Basic enemy - square
                this.ctx.fillRect(x - 10, y - 10, 20, 20);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x - 6, y - 4, 4, 4);
                this.ctx.fillRect(x + 2, y - 4, 4, 4);
            } else if (enemy.type === 1) {
                // Medium enemy - diamond
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 12);
                this.ctx.lineTo(x + 12, y);
                this.ctx.lineTo(x, y + 12);
                this.ctx.lineTo(x - 12, y);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Boss enemy - star shape
                this.ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const px = x + Math.cos(angle) * 12;
                    const py = y + Math.sin(angle) * 12;
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawBullets() {
        this.ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ffff';
        
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x - 2, bullet.y - 6, 4, 12);
        });
        
        this.ctx.shadowBlur = 0;
    }
    
    drawEnemyBullets() {
        this.ctx.shadowColor = 'rgba(255, 0, 64, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ff0040';
        
        this.enemyBullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = '♦'.repeat(Math.max(0, this.lives));
    }
    
    updateWave() {
        document.getElementById('wave').textContent = this.wave;
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
    new StarBlasterGame();
});

