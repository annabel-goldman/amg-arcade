// Asteroids Game - AMG Arcade
class AsteroidsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Ship
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            angle: -Math.PI / 2,
            dx: 0,
            dy: 0,
            radius: 15,
            thrusting: false
        };
        
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('asteroids_highscore')) || 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        this.invincible = false;
        
        this.keys = {
            left: false,
            right: false,
            thrust: false,
            fire: false
        };
        
        this.canShoot = true;
        this.shootCooldown = 200;
        
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.draw();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        document.addEventListener('keyup', (e) => this.handleKeyup(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            const action = btn.dataset.action;
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (action === 'fire') {
                    this.shoot();
                } else {
                    this.keys[action] = true;
                }
            });
            
            btn.addEventListener('touchend', () => {
                if (action !== 'fire') {
                    this.keys[action] = false;
                }
            });
            
            btn.addEventListener('mousedown', () => {
                if (action === 'fire') {
                    this.shoot();
                } else {
                    this.keys[action] = true;
                }
            });
            
            btn.addEventListener('mouseup', () => {
                if (action !== 'fire') {
                    this.keys[action] = false;
                }
            });
        });
    }
    
    handleKeydown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'KeyP' && this.isPlaying) {
            this.togglePause();
            return;
        }
        
        if (!this.isPlaying || this.isPaused) return;
        
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.thrust = true;
                break;
            case 'Space':
                this.shoot();
                break;
        }
    }
    
    handleKeyup(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.thrust = false;
                break;
        }
    }
    
    shoot() {
        if (!this.canShoot || !this.isPlaying || this.isPaused) return;
        
        this.bullets.push({
            x: this.ship.x + Math.cos(this.ship.angle) * 20,
            y: this.ship.y + Math.sin(this.ship.angle) * 20,
            dx: Math.cos(this.ship.angle) * 10,
            dy: Math.sin(this.ship.angle) * 10,
            life: 50
        });
        
        this.canShoot = false;
        setTimeout(() => this.canShoot = true, this.shootCooldown);
        
        this.playSound('shoot');
    }
    
    createAsteroids(count, size = 'large') {
        const sizes = {
            large: { radius: 40, points: 20 },
            medium: { radius: 25, points: 10 },
            small: { radius: 12, points: 5 }
        };
        
        for (let i = 0; i < count; i++) {
            let x, y;
            
            // Spawn away from ship
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (Math.hypot(x - this.ship.x, y - this.ship.y) < 150);
            
            const speed = 1 + Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            
            this.asteroids.push({
                x,
                y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                radius: sizes[size].radius,
                points: sizes[size].points,
                size,
                vertices: this.generateAsteroidShape(sizes[size].radius),
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.05
            });
        }
    }
    
    generateAsteroidShape(radius) {
        const vertices = [];
        const count = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = radius * (0.7 + Math.random() * 0.5);
            vertices.push({ angle, r });
        }
        
        return vertices;
    }
    
    startGame() {
        this.ship.x = this.canvas.width / 2;
        this.ship.y = this.canvas.height / 2;
        this.ship.dx = 0;
        this.ship.dy = 0;
        this.ship.angle = -Math.PI / 2;
        
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.updateScore();
        this.updateLives();
        this.updateLevel();
        
        this.createAsteroids(4);
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        this.invincible = false;
        
        this.playSound('start');
        this.gameLoop();
    }
    
    nextLevel() {
        this.level++;
        this.updateLevel();
        
        this.ship.x = this.canvas.width / 2;
        this.ship.y = this.canvas.height / 2;
        this.ship.dx = 0;
        this.ship.dy = 0;
        
        this.createAsteroids(3 + this.level);
        
        this.invincible = true;
        setTimeout(() => this.invincible = false, 2000);
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        if (!this.isPaused) {
            this.update();
        }
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Rotate ship
        if (this.keys.left) {
            this.ship.angle -= 0.1;
        }
        if (this.keys.right) {
            this.ship.angle += 0.1;
        }
        
        // Thrust
        if (this.keys.thrust) {
            this.ship.dx += Math.cos(this.ship.angle) * 0.15;
            this.ship.dy += Math.sin(this.ship.angle) * 0.15;
            this.ship.thrusting = true;
            
            // Add thrust particles
            if (Math.random() > 0.5) {
                this.particles.push({
                    x: this.ship.x - Math.cos(this.ship.angle) * 20,
                    y: this.ship.y - Math.sin(this.ship.angle) * 20,
                    dx: -Math.cos(this.ship.angle) * 3 + (Math.random() - 0.5) * 2,
                    dy: -Math.sin(this.ship.angle) * 3 + (Math.random() - 0.5) * 2,
                    life: 20,
                    color: '#ff6600'
                });
            }
        } else {
            this.ship.thrusting = false;
        }
        
        // Apply friction
        this.ship.dx *= 0.99;
        this.ship.dy *= 0.99;
        
        // Move ship
        this.ship.x += this.ship.dx;
        this.ship.y += this.ship.dy;
        
        // Wrap around screen
        this.ship.x = (this.ship.x + this.canvas.width) % this.canvas.width;
        this.ship.y = (this.ship.y + this.canvas.height) % this.canvas.height;
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            bullet.life--;
            
            // Wrap
            bullet.x = (bullet.x + this.canvas.width) % this.canvas.width;
            bullet.y = (bullet.y + this.canvas.height) % this.canvas.height;
            
            return bullet.life > 0;
        });
        
        // Update asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.dx;
            asteroid.y += asteroid.dy;
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Wrap
            asteroid.x = (asteroid.x + this.canvas.width) % this.canvas.width;
            asteroid.y = (asteroid.y + this.canvas.height) % this.canvas.height;
        });
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.life--;
            return p.life > 0;
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Check level complete
        if (this.asteroids.length === 0) {
            this.nextLevel();
        }
    }
    
    checkCollisions() {
        // Bullets vs asteroids
        this.bullets.forEach(bullet => {
            this.asteroids.forEach((asteroid, index) => {
                const dist = Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y);
                
                if (dist < asteroid.radius) {
                    bullet.life = 0;
                    this.destroyAsteroid(index);
                }
            });
        });
        
        // Ship vs asteroids
        if (!this.invincible) {
            this.asteroids.forEach(asteroid => {
                const dist = Math.hypot(this.ship.x - asteroid.x, this.ship.y - asteroid.y);
                
                if (dist < asteroid.radius + this.ship.radius - 5) {
                    this.shipHit();
                }
            });
        }
    }
    
    destroyAsteroid(index) {
        const asteroid = this.asteroids[index];
        this.score += asteroid.points * this.level;
        this.updateScore();
        
        // Create explosion particles
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: asteroid.x,
                y: asteroid.y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                life: 30,
                color: '#ffffff'
            });
        }
        
        // Split asteroid
        if (asteroid.size === 'large') {
            this.spawnChildAsteroids(asteroid.x, asteroid.y, 'medium', 2);
        } else if (asteroid.size === 'medium') {
            this.spawnChildAsteroids(asteroid.x, asteroid.y, 'small', 2);
        }
        
        this.asteroids.splice(index, 1);
        this.playSound('explosion');
    }
    
    spawnChildAsteroids(x, y, size, count) {
        const sizes = {
            medium: { radius: 25, points: 10 },
            small: { radius: 12, points: 5 }
        };
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            
            this.asteroids.push({
                x,
                y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                radius: sizes[size].radius,
                points: sizes[size].points,
                size,
                vertices: this.generateAsteroidShape(sizes[size].radius),
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.08
            });
        }
    }
    
    shipHit() {
        this.lives--;
        this.updateLives();
        
        // Explosion
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: this.ship.x,
                y: this.ship.y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                life: 40,
                color: '#00ffff'
            });
        }
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset ship
            this.ship.x = this.canvas.width / 2;
            this.ship.y = this.canvas.height / 2;
            this.ship.dx = 0;
            this.ship.dy = 0;
            
            this.invincible = true;
            setTimeout(() => this.invincible = false, 3000);
            
            this.playSound('death');
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
            localStorage.setItem('asteroids_highscore', this.highScore);
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
        
        // Draw particles
        this.particles.forEach(p => {
            const alpha = p.life / 40;
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw asteroids
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            asteroid.vertices.forEach((v, i) => {
                const x = Math.cos(v.angle) * v.r;
                const y = Math.sin(v.angle) * v.r;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.restore();
        });
        
        // Draw bullets
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;
        
        // Draw ship
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);
        
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        
        // Ship body
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(-15, -12);
        this.ctx.lineTo(-10, 0);
        this.ctx.lineTo(-15, 12);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Thrust flame
        if (this.ship.thrusting) {
            this.ctx.strokeStyle = '#ff6600';
            this.ctx.shadowColor = '#ff6600';
            this.ctx.beginPath();
            this.ctx.moveTo(-10, -6);
            this.ctx.lineTo(-25 - Math.random() * 10, 0);
            this.ctx.lineTo(-10, 6);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = '▲'.repeat(Math.max(0, this.lives));
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
    new AsteroidsGame();
});

