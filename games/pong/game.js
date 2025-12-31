// Pong Game - AMG Arcade
class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.paddleWidth = 10;
        this.paddleHeight = 80;
        this.ballSize = 10;
        
        // Player paddle (left)
        this.player = {
            x: 20,
            y: this.canvas.height / 2 - 40,
            score: 0,
            speed: 8
        };
        
        // CPU paddle (right)
        this.cpu = {
            x: this.canvas.width - 30,
            y: this.canvas.height / 2 - 40,
            score: 0,
            speed: 4
        };
        
        // Ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            dx: 5,
            dy: 3,
            speed: 5
        };
        
        this.winScore = 11;
        this.highScore = parseInt(localStorage.getItem('pong_highscore')) || 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        
        this.upPressed = false;
        this.downPressed = false;
        
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
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (btn.dataset.dir === 'up') this.upPressed = true;
                if (btn.dataset.dir === 'down') this.downPressed = true;
            });
            btn.addEventListener('touchend', () => {
                this.upPressed = false;
                this.downPressed = false;
            });
            btn.addEventListener('mousedown', () => {
                if (btn.dataset.dir === 'up') this.upPressed = true;
                if (btn.dataset.dir === 'down') this.downPressed = true;
            });
            btn.addEventListener('mouseup', () => {
                this.upPressed = false;
                this.downPressed = false;
            });
        });
    }
    
    handleKeydown(e) {
        if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
        
        if (e.code === 'Space' && this.isPlaying) {
            this.togglePause();
            return;
        }
        
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            this.upPressed = true;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.downPressed = true;
        }
    }
    
    handleKeyup(e) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            this.upPressed = false;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.downPressed = false;
        }
    }
    
    startGame() {
        this.player.score = 0;
        this.cpu.score = 0;
        this.cpu.speed = 4;
        
        this.updateScores();
        this.resetBall();
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        
        this.playSound('start');
        this.gameLoop();
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed;
        this.ball.dy = (Math.random() - 0.5) * 6;
        
        this.player.y = this.canvas.height / 2 - this.paddleHeight / 2;
        this.cpu.y = this.canvas.height / 2 - this.paddleHeight / 2;
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
        // Move player paddle
        if (this.upPressed && this.player.y > 0) {
            this.player.y -= this.player.speed;
        }
        if (this.downPressed && this.player.y < this.canvas.height - this.paddleHeight) {
            this.player.y += this.player.speed;
        }
        
        // Move CPU paddle (AI)
        const cpuCenter = this.cpu.y + this.paddleHeight / 2;
        const ballCenter = this.ball.y;
        
        if (cpuCenter < ballCenter - 20) {
            this.cpu.y += this.cpu.speed;
        } else if (cpuCenter > ballCenter + 20) {
            this.cpu.y -= this.cpu.speed;
        }
        
        // Keep CPU in bounds
        this.cpu.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.cpu.y));
        
        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Ball collision with top/bottom
        if (this.ball.y <= 0 || this.ball.y >= this.canvas.height - this.ballSize) {
            this.ball.dy = -this.ball.dy;
            this.playSound('wall');
        }
        
        // Ball collision with player paddle
        if (this.ball.x <= this.player.x + this.paddleWidth &&
            this.ball.x >= this.player.x &&
            this.ball.y + this.ballSize >= this.player.y &&
            this.ball.y <= this.player.y + this.paddleHeight) {
            
            const hitPos = (this.ball.y - this.player.y) / this.paddleHeight - 0.5;
            this.ball.dx = Math.abs(this.ball.dx) * 1.05;
            this.ball.dy = hitPos * 10;
            this.ball.x = this.player.x + this.paddleWidth;
            this.playSound('paddle');
        }
        
        // Ball collision with CPU paddle
        if (this.ball.x + this.ballSize >= this.cpu.x &&
            this.ball.x <= this.cpu.x + this.paddleWidth &&
            this.ball.y + this.ballSize >= this.cpu.y &&
            this.ball.y <= this.cpu.y + this.paddleHeight) {
            
            const hitPos = (this.ball.y - this.cpu.y) / this.paddleHeight - 0.5;
            this.ball.dx = -Math.abs(this.ball.dx) * 1.05;
            this.ball.dy = hitPos * 10;
            this.ball.x = this.cpu.x - this.ballSize;
            this.playSound('paddle');
        }
        
        // Ball out of bounds
        if (this.ball.x < 0) {
            this.cpu.score++;
            this.updateScores();
            this.playSound('score');
            
            if (this.cpu.score >= this.winScore) {
                this.gameOver(false);
            } else {
                this.resetBall();
            }
        }
        
        if (this.ball.x > this.canvas.width) {
            this.player.score++;
            this.updateScores();
            this.playSound('score');
            
            // Increase CPU difficulty
            this.cpu.speed = Math.min(7, 4 + this.player.score * 0.2);
            
            if (this.player.score >= this.winScore) {
                this.gameOver(true);
            } else {
                this.resetBall();
            }
        }
        
        // Cap ball speed
        const maxSpeed = 15;
        this.ball.dx = Math.max(-maxSpeed, Math.min(maxSpeed, this.ball.dx));
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else {
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    gameOver(playerWon) {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationId);
        
        if (playerWon && this.player.score > this.highScore) {
            this.highScore = this.player.score;
            localStorage.setItem('pong_highscore', this.highScore);
            this.updateHighScoreDisplay();
        }
        
        document.getElementById('winnerText').textContent = playerWon ? 'YOU WIN!' : 'CPU WINS!';
        document.getElementById('winnerText').style.color = playerWon ? 'var(--neon-green)' : 'var(--neon-red)';
        document.getElementById('finalScore').textContent = `${this.player.score} - ${this.cpu.score}`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound(playerWon ? 'win' : 'gameover');
    }
    
    draw() {
        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Center line
        this.ctx.setLineDash([10, 10]);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Score display
        this.ctx.font = '48px "Press Start 2P"';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.player.score.toString(), this.canvas.width / 4, 60);
        this.ctx.fillText(this.cpu.score.toString(), (this.canvas.width / 4) * 3, 60);
        
        // Player paddle
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.player.x, this.player.y, this.paddleWidth, this.paddleHeight);
        
        // CPU paddle
        this.ctx.shadowColor = '#ff0040';
        this.ctx.fillStyle = '#ff0040';
        this.ctx.fillRect(this.cpu.x, this.cpu.y, this.paddleWidth, this.paddleHeight);
        
        // Ball
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.ball.x, this.ball.y, this.ballSize, this.ballSize);
        
        this.ctx.shadowBlur = 0;
    }
    
    updateScores() {
        document.getElementById('playerScore').textContent = this.player.score;
        document.getElementById('cpuScore').textContent = this.cpu.score;
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
    new PongGame();
});

