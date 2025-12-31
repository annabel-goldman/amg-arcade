// Tetris Game - AMG Arcade
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        
        // Tetromino shapes
        this.shapes = {
            I: [[1,1,1,1]],
            O: [[1,1],[1,1]],
            T: [[0,1,0],[1,1,1]],
            S: [[0,1,1],[1,1,0]],
            Z: [[1,1,0],[0,1,1]],
            J: [[1,0,0],[1,1,1]],
            L: [[0,0,1],[1,1,1]]
        };
        
        this.colors = {
            I: '#00ffff',
            O: '#ffff00',
            T: '#ff00ff',
            S: '#39ff14',
            Z: '#ff0040',
            J: '#4d4dff',
            L: '#ff6600'
        };
        
        this.board = [];
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentType = '';
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('tetris_highscore')) || 0;
        
        this.isPlaying = false;
        this.isPaused = false;
        this.gameInterval = null;
        this.dropSpeed = 1000;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateHighScoreDisplay();
        this.draw();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        
        // Mobile controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            const action = btn.dataset.action;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleAction(action);
            });
            btn.addEventListener('click', () => this.handleAction(action));
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
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.movePiece(0, 1);
                this.score += 1;
                this.updateScore();
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.rotatePiece();
                break;
            case 'Space':
                this.hardDrop();
                break;
        }
    }
    
    handleAction(action) {
        if (!this.isPlaying || this.isPaused) return;
        
        switch (action) {
            case 'left':
                this.movePiece(-1, 0);
                break;
            case 'right':
                this.movePiece(1, 0);
                break;
            case 'down':
                this.movePiece(0, 1);
                break;
            case 'rotate':
                this.rotatePiece();
                break;
        }
    }
    
    startGame() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropSpeed = 1000;
        
        this.updateScore();
        this.updateLines();
        this.updateLevel();
        
        this.spawnPiece();
        this.hideAllOverlays();
        
        this.isPlaying = true;
        this.isPaused = false;
        
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), this.dropSpeed);
        
        this.playSound('start');
    }
    
    spawnPiece() {
        const types = Object.keys(this.shapes);
        this.currentType = types[Math.floor(Math.random() * types.length)];
        this.currentPiece = this.shapes[this.currentType].map(row => [...row]);
        this.currentX = Math.floor((this.cols - this.currentPiece[0].length) / 2);
        this.currentY = 0;
        
        if (this.checkCollision(this.currentX, this.currentY, this.currentPiece)) {
            this.gameOver();
        }
    }
    
    gameLoop() {
        if (this.isPaused) return;
        
        if (!this.movePiece(0, 1)) {
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        }
        
        this.draw();
    }
    
    movePiece(dx, dy) {
        const newX = this.currentX + dx;
        const newY = this.currentY + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece)) {
            this.currentX = newX;
            this.currentY = newY;
            this.draw();
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        
        if (!this.checkCollision(this.currentX, this.currentY, rotated)) {
            this.currentPiece = rotated;
            this.playSound('rotate');
            this.draw();
        }
    }
    
    hardDrop() {
        let dropDistance = 0;
        while (!this.checkCollision(this.currentX, this.currentY + 1, this.currentPiece)) {
            this.currentY++;
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.updateScore();
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
        this.playSound('drop');
    }
    
    checkCollision(x, y, piece) {
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        for (let row = 0; row < this.currentPiece.length; row++) {
            for (let col = 0; col < this.currentPiece[row].length; col++) {
                if (this.currentPiece[row][col]) {
                    const boardY = this.currentY + row;
                    const boardX = this.currentX + col;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentType;
                    }
                }
            }
        }
        this.playSound('lock');
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800][linesCleared] * this.level;
            this.score += points;
            this.lines += linesCleared;
            this.updateScore();
            this.updateLines();
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateLevel();
                this.dropSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.gameLoop(), this.dropSpeed);
            }
            
            this.playSound('clear');
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
        clearInterval(this.gameInterval);
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('tetris_highscore', this.highScore);
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        this.playSound('gameover');
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
        
        // Draw board
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.colors[this.board[row][col]]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            const color = this.colors[this.currentType];
            for (let row = 0; row < this.currentPiece.length; row++) {
                for (let col = 0; col < this.currentPiece[row].length; col++) {
                    if (this.currentPiece[row][col]) {
                        this.drawBlock(this.currentX + col, this.currentY + row, color);
                    }
                }
            }
            
            // Draw ghost piece
            let ghostY = this.currentY;
            while (!this.checkCollision(this.currentX, ghostY + 1, this.currentPiece)) {
                ghostY++;
            }
            
            if (ghostY > this.currentY) {
                this.ctx.globalAlpha = 0.3;
                for (let row = 0; row < this.currentPiece.length; row++) {
                    for (let col = 0; col < this.currentPiece[row].length; col++) {
                        if (this.currentPiece[row][col]) {
                            this.drawBlock(this.currentX + col, ghostY + row, color);
                        }
                    }
                }
                this.ctx.globalAlpha = 1;
            }
        }
    }
    
    drawBlock(x, y, color) {
        const px = x * this.blockSize;
        const py = y * this.blockSize;
        const size = this.blockSize - 2;
        
        // Glow
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        
        // Main block
        this.ctx.fillStyle = color;
        this.ctx.fillRect(px + 1, py + 1, size, size);
        
        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(px + 1, py + 1, size, 4);
        this.ctx.fillRect(px + 1, py + 1, 4, size);
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(px + size - 3, py + 1, 4, size);
        this.ctx.fillRect(px + 1, py + size - 3, size, 4);
        
        this.ctx.shadowBlur = 0;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLines() {
        document.getElementById('lines').textContent = this.lines;
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
    new TetrisGame();
});

