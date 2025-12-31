// Runner Game - AMG Arcade
// Endless runner with obstacles

class RunnerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.highScore = parseInt(localStorage.getItem('runner_highscore')) || 0;
        
        this.groundHeight = 60;
        this.gravity = 0.8;
        this.jumpForce = -14;
        
        this.isPlaying = false;
        this.isPaused = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.drawStartScreen();
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Mobile jump button
        const jumpBtn = document.querySelector('.jump-btn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.jump();
            });
            jumpBtn.addEventListener('mousedown', () => this.jump());
        }
        
        // Canvas tap to jump
        this.canvas.addEventListener('click', () => {
            if (this.isPlaying && !this.isPaused) {
                this.jump();
            }
        });
    }
    
    handleKeydown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            
            if (!this.isPlaying) return;
            
            if (this.isPaused) {
                this.togglePause();
                return;
            }
            
            this.jump();
        }
        
        if (e.code === 'KeyP' || e.code === 'Escape') {
            if (this.isPlaying) {
                this.togglePause();
            }
        }
    }
    
    jump() {
        if (!this.isPlaying || this.isPaused) return;
        
        if (this.player.grounded) {
            this.player.vy = this.jumpForce;
            this.player.grounded = false;
            this.player.jumps = 1;
            this.playSound('hop');
        } else if (this.player.jumps < 2) {
            // Double jump
            this.player.vy = this.jumpForce * 0.85;
            this.player.jumps = 2;
            this.playSound('hop');
        }
    }
    
    startGame() {
        this.score = 0;
        this.speed = 5;
        this.speedLevel = 1;
        this.distance = 0;
        
        this.player = {
            x: 80,
            y: this.canvas.height - this.groundHeight - 40,
            width: 30,
            height: 40,
            vy: 0,
            grounded: true,
            jumps: 0
        };
        
        this.obstacles = [];
        this.particles = [];
        this.clouds = this.generateClouds();
        this.stars = this.generateStars();
        
        this.obstacleTimer = 0;
        this.nextObstacleTime = 60;
        
        this.updateScore();
        this.updateStats();
        
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        
        this.playSound('start');
        this.gameLoop();
    }
    
    generateClouds() {
        const clouds = [];
        for (let i = 0; i < 5; i++) {
            clouds.push({
                x: Math.random() * this.canvas.width,
                y: 30 + Math.random() * 80,
                width: 40 + Math.random() * 60,
                speed: 0.2 + Math.random() * 0.3
            });
        }
        return clouds;
    }
    
    generateStars() {
        const stars = [];
        for (let i = 0; i < 30; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 150,
                size: Math.random() * 2 + 1,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        return stars;
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
        // Update distance/score
        this.distance += this.speed / 10;
        this.score = Math.floor(this.distance);
        this.updateScore();
        
        // Increase speed over time
        if (this.score > 0 && this.score % 100 === 0 && this.score / 100 > this.speedLevel - 1) {
            this.speedLevel++;
            this.speed = 5 + this.speedLevel * 0.5;
            this.updateStats();
            this.playSound('levelup');
        }
        
        // Update player
        this.player.vy += this.gravity;
        this.player.y += this.player.vy;
        
        const groundY = this.canvas.height - this.groundHeight - this.player.height;
        if (this.player.y >= groundY) {
            this.player.y = groundY;
            this.player.vy = 0;
            this.player.grounded = true;
            this.player.jumps = 0;
        }
        
        // Spawn obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.nextObstacleTime) {
            this.spawnObstacle();
            this.obstacleTimer = 0;
            this.nextObstacleTime = 50 + Math.random() * 60 - this.speedLevel * 3;
            this.nextObstacleTime = Math.max(30, this.nextObstacleTime);
        }
        
        // Update obstacles
        this.obstacles.forEach((obs, i) => {
            obs.x -= this.speed;
            
            // Remove off-screen obstacles
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        });
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width + cloud.width;
                cloud.y = 30 + Math.random() * 80;
            }
        });
        
        // Update particles
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        });
        
        // Add running particles
        if (this.player.grounded && Math.random() < 0.3) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y + this.player.height,
                vx: -this.speed * 0.3 + (Math.random() - 0.5),
                vy: -Math.random() * 2,
                life: 15,
                color: '#8b7355'
            });
        }
        
        // Check collisions
        this.checkCollisions();
    }
    
    spawnObstacle() {
        const types = ['cactus', 'rock', 'bird'];
        const type = types[Math.floor(Math.random() * (this.speedLevel > 3 ? 3 : 2))];
        
        let obstacle;
        
        if (type === 'cactus') {
            const height = 30 + Math.random() * 30;
            obstacle = {
                type: 'cactus',
                x: this.canvas.width,
                y: this.canvas.height - this.groundHeight - height,
                width: 20,
                height: height
            };
        } else if (type === 'rock') {
            obstacle = {
                type: 'rock',
                x: this.canvas.width,
                y: this.canvas.height - this.groundHeight - 25,
                width: 35,
                height: 25
            };
        } else {
            // Flying bird
            obstacle = {
                type: 'bird',
                x: this.canvas.width,
                y: this.canvas.height - this.groundHeight - 60 - Math.random() * 40,
                width: 30,
                height: 20,
                wingPhase: 0
            };
        }
        
        this.obstacles.push(obstacle);
    }
    
    checkCollisions() {
        const p = this.player;
        const hitbox = {
            x: p.x + 5,
            y: p.y + 5,
            width: p.width - 10,
            height: p.height - 5
        };
        
        for (const obs of this.obstacles) {
            const obsHitbox = {
                x: obs.x + 3,
                y: obs.y + 3,
                width: obs.width - 6,
                height: obs.height - 6
            };
            
            if (hitbox.x < obsHitbox.x + obsHitbox.width &&
                hitbox.x + hitbox.width > obsHitbox.x &&
                hitbox.y < obsHitbox.y + obsHitbox.height &&
                hitbox.y + hitbox.height > obsHitbox.y) {
                
                this.gameOver();
                return;
            }
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
        
        // Explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30,
                color: '#ff6b6b'
            });
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('runner_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound('gameover');
    }
    
    draw() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a20');
        gradient.addColorStop(0.5, '#1a1a40');
        gradient.addColorStop(1, '#2a1a50');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Stars
        this.stars.forEach(star => {
            star.twinkle += 0.05;
            const brightness = 0.5 + Math.sin(star.twinkle) * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width / 3, cloud.y - 5, cloud.width / 4, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width / 2, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Ground
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, this.groundHeight);
        
        // Ground texture
        this.ctx.fillStyle = '#4a3a2a';
        for (let i = 0; i < this.canvas.width; i += 20) {
            const offset = (this.distance * 5 + i) % 20;
            this.ctx.fillRect(i - offset, this.canvas.height - this.groundHeight, 10, 3);
        }
        
        // Ground line
        this.ctx.strokeStyle = '#5a4a3a';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - this.groundHeight);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - this.groundHeight);
        this.ctx.stroke();
        
        // Particles
        this.particles.forEach(p => {
            const alpha = p.life / 30;
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Obstacles
        this.obstacles.forEach(obs => {
            if (obs.type === 'cactus') {
                this.drawCactus(obs);
            } else if (obs.type === 'rock') {
                this.drawRock(obs);
            } else if (obs.type === 'bird') {
                this.drawBird(obs);
            }
        });
        
        // Player
        this.drawPlayer();
    }
    
    drawPlayer() {
        const p = this.player;
        
        // Glow
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 15;
        
        // Body
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(p.x, p.y + 10, p.width, p.height - 10);
        
        // Head
        this.ctx.fillStyle = '#ffb6b6';
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2, p.y + 8, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(p.x + 8, p.y + 5, 4, 4);
        this.ctx.fillRect(p.x + 18, p.y + 5, 4, 4);
        
        // Running legs animation
        if (p.grounded) {
            const legOffset = Math.sin(this.distance * 0.5) * 5;
            this.ctx.fillStyle = '#cc5555';
            this.ctx.fillRect(p.x + 5, p.y + p.height - 5, 8, 5 + legOffset);
            this.ctx.fillRect(p.x + 17, p.y + p.height - 5, 8, 5 - legOffset);
        } else {
            // Jumping pose
            this.ctx.fillStyle = '#cc5555';
            this.ctx.fillRect(p.x + 2, p.y + p.height - 8, 10, 8);
            this.ctx.fillRect(p.x + 18, p.y + p.height - 8, 10, 8);
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawCactus(obs) {
        this.ctx.fillStyle = '#2d5a2d';
        this.ctx.shadowColor = '#4a8a4a';
        this.ctx.shadowBlur = 10;
        
        // Main stem
        this.ctx.fillRect(obs.x + 5, obs.y, 10, obs.height);
        
        // Arms
        if (obs.height > 35) {
            this.ctx.fillRect(obs.x, obs.y + 10, 8, 6);
            this.ctx.fillRect(obs.x, obs.y + 10, 6, 15);
            
            this.ctx.fillRect(obs.x + 12, obs.y + 20, 8, 6);
            this.ctx.fillRect(obs.x + 14, obs.y + 15, 6, 15);
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawRock(obs) {
        this.ctx.fillStyle = '#666';
        this.ctx.shadowColor = '#888';
        this.ctx.shadowBlur = 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x + 5, obs.y + obs.height);
        this.ctx.lineTo(obs.x, obs.y + obs.height);
        this.ctx.lineTo(obs.x + 8, obs.y + 5);
        this.ctx.lineTo(obs.x + 18, obs.y);
        this.ctx.lineTo(obs.x + 28, obs.y + 8);
        this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Highlight
        this.ctx.fillStyle = '#888';
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x + 10, obs.y + 8);
        this.ctx.lineTo(obs.x + 18, obs.y + 3);
        this.ctx.lineTo(obs.x + 22, obs.y + 10);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawBird(obs) {
        obs.wingPhase += 0.3;
        const wingY = Math.sin(obs.wingPhase) * 8;
        
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 10;
        
        // Body
        this.ctx.beginPath();
        this.ctx.ellipse(obs.x + 15, obs.y + 10, 12, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wings
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x + 10, obs.y + 10);
        this.ctx.lineTo(obs.x + 5, obs.y + wingY);
        this.ctx.lineTo(obs.x + 15, obs.y + 10);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x + 20, obs.y + 10);
        this.ctx.lineTo(obs.x + 25, obs.y + wingY);
        this.ctx.lineTo(obs.x + 15, obs.y + 10);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.moveTo(obs.x + 27, obs.y + 10);
        this.ctx.lineTo(obs.x + 32, obs.y + 12);
        this.ctx.lineTo(obs.x + 27, obs.y + 14);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(obs.x + 22, obs.y + 8, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(obs.x + 23, obs.y + 8, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    drawStartScreen() {
        // Draw a preview
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a20');
        gradient.addColorStop(1, '#2a1a50');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Ground
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, this.groundHeight);
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateStats() {
        document.getElementById('bestScore').textContent = this.highScore;
        document.getElementById('speed').textContent = this.speedLevel;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('bestScore').textContent = this.highScore;
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
    new RunnerGame();
});

