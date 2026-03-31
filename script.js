const cells = document.querySelectorAll('.cell');
const statusMessage = document.getElementById('statusMessage');
const winnerText = document.getElementById('winnerText');
const restartBtn = document.getElementById('restartBtn');
const turnIndicator = document.getElementById('turnIndicator');
const board = document.getElementById('board');

const btnPvP = document.getElementById('btnPvP');
const btnPvE = document.getElementById('btnPvE');

let isXTurn = true;
let boardState = Array(9).fill(null);
let gameActive = true;
let gameMode = 'PvP'; // 'PvP' or 'PvE'
let isComputerThinking = false;

const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// --- Web Audio API Synth ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSplatSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Thud
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.1);
    
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(1, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    
    // Wet Noise (Splash)
    const bufferSize = audioCtx.sampleRate * 0.25;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, audioCtx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
    noiseSource.start();
}

function playWinSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Scary dissonant drone
    const freqs = [40, 45, 52.33];
    freqs.forEach(freq => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 3);
    });
}

function playDrawSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Dull thud
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}
// --- End Web Audio API ---

cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

restartBtn.addEventListener('click', () => {
    playSplatSound();
    restartGame();
});

if (btnPvP && btnPvE) {
    btnPvP.addEventListener('click', () => {
        if (gameMode !== 'PvP') playSplatSound();
        setGameMode('PvP');
    });
    btnPvE.addEventListener('click', () => {
        if (gameMode !== 'PvE') playSplatSound();
        setGameMode('PvE');
    });
}

function setGameMode(mode) {
    if (gameMode === mode) return;
    gameMode = mode;
    btnPvP.classList.toggle('active', mode === 'PvP');
    btnPvE.classList.toggle('active', mode === 'PvE');
    restartGame();
}

function handleCellClick(e) {
    if (isComputerThinking) return;

    const targetCell = e.target.closest('.cell');
    
    if(!targetCell) return;
    const index = targetCell.getAttribute('data-index');

    if (boardState[index] || !gameActive) return;

    playMove(targetCell, index);
}

function playMove(targetCell, index) {
    // Screen shake
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');

    playSplatSound(); // Play custom splat sound

    const currentClass = isXTurn ? 'x' : 'o';
    targetCell.classList.add(currentClass);
    boardState[index] = currentClass;

    createSplash(targetCell, currentClass);

    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        isXTurn = !isXTurn;
        updateTurnIndicator();

        if (gameMode === 'PvE' && !isXTurn && gameActive) {
            isComputerThinking = true;
            setTimeout(computerMove, 700 + Math.random() * 600);
        }
    }
}

function computerMove() {
    if (!gameActive) return;

    let bestMove = getBestMove('o'); 
    if (bestMove === null) bestMove = getBestMove('x'); 
    
    if (bestMove === null) {
        const available = boardState.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        if (available.length > 0) {
            bestMove = available[Math.floor(Math.random() * available.length)];
        }
    }

    if (bestMove !== null) {
        const targetCell = document.querySelector(`[data-index="${bestMove}"]`);
        isComputerThinking = false;
        playMove(targetCell, bestMove);
    }
}

function getBestMove(playerClass) {
    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
        const [a, b, c] = WINNING_COMBINATIONS[i];
        if (boardState[a] === playerClass && boardState[b] === playerClass && boardState[c] === null) return c;
        if (boardState[a] === playerClass && boardState[c] === playerClass && boardState[b] === null) return b;
        if (boardState[b] === playerClass && boardState[c] === playerClass && boardState[a] === null) return a;
    }
    return null;
}

function updateTurnIndicator() {
    turnIndicator.textContent = `Player ${isXTurn ? 'X' : 'O'}'s Turn`;
    turnIndicator.style.color = isXTurn ? '#ffcccc' : '#cc0000';
}

function createSplash(cell, type) {
    const color = type === 'x' ? '#ff0022' : '#aa0000';
    const numDrips = Math.floor(Math.random() * 4) + 5; 
    
    for(let i=0; i<numDrips; i++) {
        const drip = document.createElement('div');
        drip.classList.add('drip');
        
        const size = Math.random() * 20 + 8;
        drip.style.width = `${size}px`;
        drip.style.height = `${size}px`;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 20 + 10;
        
        const centerX = 50 - size/2;
        const centerY = 50 - size/2;
        
        const posX = centerX + Math.cos(angle) * distance;
        const posY = centerY + Math.sin(angle) * distance;
        
        drip.style.left = `${posX}px`;
        drip.style.top = `${posY}px`;
        drip.style.backgroundColor = color;
        drip.style.boxShadow = `inset 0 4px 5px rgba(255,255,255,0.7), 0 0 10px ${color}`;
        
        cell.appendChild(drip);
        
        setTimeout(() => {
            if(cell.contains(drip)) cell.removeChild(drip);
        }, 1000);
    }
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return boardState[index] === currentClass;
        });
    });
}

function isDraw() {
    return boardState.every(cell => cell !== null);
}

function endGame(draw) {
    gameActive = false;
    isComputerThinking = false;
    
    if (draw) {
        playDrawSound();
    } else {
        playWinSound();
    }
    
    setTimeout(() => {
        statusMessage.classList.remove('hidden');
        statusMessage.style.pointerEvents = 'auto'; 
        if (draw) {
            winnerText.textContent = "IT'S A DEAD END!";
            winnerText.style.color = "#aaaaaa";
        } else {
            winnerText.textContent = `${isXTurn ? 'X' : 'O'} HAS CLAIMED A SOUL!`;
            winnerText.style.color = isXTurn ? 'var(--x-color)' : 'var(--o-color)';
        }
    }, 600); 
}

function restartGame() {
    isXTurn = true;
    boardState = Array(9).fill(null);
    gameActive = true;
    isComputerThinking = false;
    
    cells.forEach(cell => {
        cell.classList.remove('x');
        cell.classList.remove('o');
        cell.innerHTML = '';
    });
    
    statusMessage.classList.add('hidden');
    statusMessage.style.pointerEvents = 'none';
    updateTurnIndicator();
}
