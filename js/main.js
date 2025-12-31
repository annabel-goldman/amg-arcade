// AMG Arcade - Main JavaScript
// Handles landing page interactions and effects

document.addEventListener('DOMContentLoaded', () => {
    initScrollingMarquee();
    initGameCardEffects();
    initCoinInsertSound();
});

// Double the marquee text for seamless scrolling
function initScrollingMarquee() {
    const scrollText = document.querySelector('.scroll-text');
    if (scrollText) {
        scrollText.innerHTML += scrollText.innerHTML;
    }
}

// Add hover sound effects and particle effects to game cards
function initGameCardEffects() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            playArcadeSound('hover');
        });
        
        const playBtn = card.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                playArcadeSound('select');
            });
        }
    });
}

// Initialize coin insert easter egg
function initCoinInsertSound() {
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        konamiCode = konamiCode.slice(-10);
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            activateKonamiMode();
        }
    });
}

// Play arcade-style sound effects using Web Audio API
function playArcadeSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
        case 'hover':
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
            
        case 'select':
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
            
        case 'coin':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(987.77, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
    }
}

// Easter egg: Konami code activation
function activateKonamiMode() {
    playArcadeSound('coin');
    
    document.body.style.animation = 'rainbow-bg 2s linear infinite';
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rainbow-bg {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Show secret message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Press Start 2P', cursive;
        font-size: 1.5rem;
        color: #fff;
        text-shadow: 0 0 20px #ff00ff, 0 0 40px #00ffff;
        z-index: 9999;
        text-align: center;
        animation: pulse 0.5s ease-in-out infinite alternate;
    `;
    message.innerHTML = '★ 30 LIVES UNLOCKED! ★<br><small>Just kidding. Have fun!</small>';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
        document.body.style.animation = '';
    }, 3000);
}

// Utility: Generate random number
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

