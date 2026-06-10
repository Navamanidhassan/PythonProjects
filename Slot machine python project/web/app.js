// GAME SYSTEM - SLOT MACHINE FRONTEND LOGIC

// Game Constants (matching main.py exactly)
const ROWS = 3;
const COLS = 3;
const MIN_BET = 1;
const MAX_BET = 100;

const symbolCount = {
    '💎': 2,   // Jackpot (rarest)
    '🔔': 4,   // Bell
    '🍋': 6,   // Lemon
    '🍒': 8    // Cherry (common)
};

const symbolValue = {
    '💎': 5,   // Multiplier
    '🔔': 4,
    '🍋': 3,
    '🍒': 2
};

const defaultStats = {
    total_spins: 0,
    total_won: 0,
    total_bet: 0,
    biggest_win: 0,
    rounds_won: 0
};

// State Variables
let allProfiles = {};
let currentProfileName = '';
let currentBalance = 0;
let currentStats = { ...defaultStats };
let activeLines = 1;
let betPerLine = 10;
let isSpinning = false;
let soundEnabled = false;

// Audio System (Web Audio API)
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;

        if (type === 'spin') {
            // Rising pitch sci-fi hum
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(240, now + 1.2);
            gainNode.gain.setValueAtTime(0.04, now);
            gainNode.gain.exponentialRampToValueAtTime(0.005, now + 1.2);
            
            // Subtle vibrato
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.frequency.setValueAtTime(20, now);
            lfoGain.gain.setValueAtTime(10, now);
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            lfo.start(now);
            osc.start(now);
            lfo.stop(now + 1.2);
            osc.stop(now + 1.2);
            
        } else if (type === 'stop') {
            // Mechanical clunk/thump
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
            
        } else if (type === 'win') {
            // Retro 8-bit win fanfare (C5 -> E5 -> G5 -> C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gainNode.gain.setValueAtTime(0.04, now + idx * 0.08);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
                
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.2);
            });
            
        } else if (type === 'lose') {
            // Descending minor chord buzz
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.45);
            gainNode.gain.setValueAtTime(0.06, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.45);
            
        } else if (type === 'deposit') {
            // Double coin ding (retro)
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        console.warn('Web Audio synthesis failed or blocked:', e);
    }
}

// REST API Handlers
async function loadProfilesFromServer() {
    try {
        const response = await fetch('/api/profiles');
        if (response.ok) {
            allProfiles = await response.json();
            populateProfilesDropdown();
        } else {
            console.error('Failed to load profiles');
        }
    } catch (error) {
        console.error('Error contacting server for profiles:', error);
    }
}

async function saveProfilesToServer() {
    try {
        const response = await fetch('/api/profiles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(allProfiles)
        });
        if (!response.ok) {
            console.error('Failed to save profiles to server');
        }
    } catch (error) {
        console.error('Error saving profiles to server:', error);
    }
}

// UI Population
function populateProfilesDropdown() {
    const dropdown = document.getElementById('select-profile-dropdown');
    // Clear existing options, save placeholder
    dropdown.innerHTML = '<option value="" disabled selected>Choose a profile...</option>';
    
    Object.keys(allProfiles).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (Balance: $${allProfiles[name].balance})`;
        dropdown.appendChild(option);
    });
}

function updateGameDashboard() {
    document.getElementById('display-player-name').textContent = currentProfileName;
    document.getElementById('display-balance').textContent = `$${currentBalance}`;
    
    // Update stats text
    document.getElementById('stat-spins').textContent = currentStats.total_spins;
    
    const winRate = currentStats.total_spins > 0 
        ? ((currentStats.rounds_won / currentStats.total_spins) * 100).toFixed(1) 
        : '0.0';
    document.getElementById('stat-winrate').textContent = `${winRate}%`;
    document.getElementById('stat-bet').textContent = `$${currentStats.total_bet}`;
    document.getElementById('stat-won').textContent = `$${currentStats.total_won}`;
    
    const netProfit = currentStats.total_won - currentStats.total_bet;
    const netBox = document.getElementById('stat-net-box');
    const netEl = document.getElementById('stat-net');
    
    const sign = netProfit >= 0 ? '+' : '-';
    netEl.textContent = sign + `$${Math.abs(netProfit)}`;
    if (netProfit >= 0) {
        netBox.className = 'stat-box col-span-2 highlight-box text-green';
    } else {
        netBox.className = 'stat-box col-span-2 highlight-box text-red';
    }
    
    document.getElementById('stat-biggest').textContent = `$${currentStats.biggest_win}`;
    
    // Update active lines button highlights
    for (let l = 1; l <= 3; l++) {
        const btn = document.getElementById(`btn-line-${l}`);
        if (l === activeLines) {
            btn.classList.add('active');
            document.getElementById(`payline-${l}`).classList.add('active');
        } else {
            btn.classList.remove('active');
            document.getElementById(`payline-${l}`).classList.remove('active');
        }
    }
    
    // Update total bet display
    const totalBet = betPerLine * activeLines;
    document.getElementById('display-total-bet').textContent = `$${totalBet}`;
    
    // Disable/Enable spin button if balance is too low
    const btnSpin = document.getElementById('btn-spin');
    if (currentBalance < totalBet && !isSpinning) {
        btnSpin.title = 'Insufficient funds!';
    } else {
        btnSpin.title = 'Spin the slots!';
    }
}

// Core Game Logic (identical to python check_winnings & get_slot_machine_spin)
function getSlotMachineSpin() {
    const allSymbols = [];
    for (const [symbol, count] of Object.entries(symbolCount)) {
        for (let i = 0; i < count; i++) {
            allSymbols.push(symbol);
        }
    }
    
    const columns = [];
    for (let col = 0; col < COLS; col++) {
        const currentSymbols = [...allSymbols];
        const column = [];
        for (let row = 0; row < ROWS; row++) {
            const idx = Math.floor(Math.random() * currentSymbols.length);
            const value = currentSymbols[idx];
            currentSymbols.splice(idx, 1);
            column.push(value);
        }
        columns.push(column);
    }
    return columns;
}

function checkWinnings(columns, lines, bet) {
    let winnings = 0;
    const winningLines = [];
    for (let line = 0; line < lines; line++) {
        const symbol = columns[0][line];
        let allMatch = true;
        for (let col = 0; col < columns.length; col++) {
            if (columns[col][line] !== symbol) {
                allMatch = false;
                break;
            }
        }
        if (allMatch) {
            winnings += symbolValue[symbol] * bet;
            winningLines.push(line + 1);
        }
    }
    return { winnings, winningLines };
}

// Spin Routine
function executeSpin() {
    if (isSpinning) return;
    
    const totalBet = betPerLine * activeLines;
    if (currentBalance < totalBet) {
        showError('You do not have enough funds! Click 💵 Deposit to add more.');
        openDepositModal();
        return;
    }
    
    isSpinning = true;
    document.getElementById('btn-spin').disabled = true;
    document.getElementById('btn-logout').disabled = true;
    
    // Clear active payline pulses
    for (let l = 1; l <= 3; l++) {
        document.getElementById(`payline-${l}`).classList.remove('active');
    }
    
    // Deduct balance
    currentBalance -= totalBet;
    updateGameDashboard();
    
    // Update announcement board
    const announcement = document.getElementById('announcement-text');
    announcement.textContent = 'SPINNING THE REELS...';
    announcement.className = 'announcement-spin';
    
    playSound('spin');
    
    // Generate results
    const spinResults = getSlotMachineSpin();
    
    // Staggered reels stopping
    const reels = [
        document.getElementById('reel-0'),
        document.getElementById('reel-1'),
        document.getElementById('reel-2')
    ];
    
    reels.forEach((reel, idx) => {
        reel.classList.add('spinning');
        
        // Staggered stop delays: Reel 0 @ 1000ms, Reel 1 @ 1500ms, Reel 2 @ 2000ms
        const stopDelay = 800 + (idx * 500);
        
        setTimeout(() => {
            reel.classList.remove('spinning');
            
            // Lock results into visual elements
            const inner = reel.querySelector('.reel-inner');
            inner.innerHTML = '';
            for (let r = 0; r < ROWS; r++) {
                const cell = document.createElement('div');
                cell.className = 'slot-cell';
                cell.textContent = spinResults[idx][r];
                inner.appendChild(cell);
            }
            
            // Add a locking impact shake effect
            reel.classList.add('shaking');
            playSound('stop');
            setTimeout(() => {
                reel.classList.remove('shaking');
            }, 150);
            
            // Once the last reel stops, calculate and display outcome
            if (idx === reels.length - 1) {
                concludeSpin(spinResults, totalBet);
            }
        }, stopDelay);
    });
}

function concludeSpin(spinResults, totalBet) {
    const { winnings, winningLines } = checkWinnings(spinResults, activeLines, betPerLine);
    
    // Update balance and stats
    currentBalance += winnings;
    
    currentStats.total_spins += 1;
    currentStats.total_bet += totalBet;
    currentStats.total_won += winnings;
    if (winnings > currentStats.biggest_win) {
        currentStats.biggest_win = winnings;
    }
    
    const announcement = document.getElementById('announcement-text');
    
    if (winnings > 0) {
        currentStats.rounds_won += 1;
        
        announcement.textContent = `🎉 YOU WON $${winnings}! 🎉`;
        announcement.className = 'announcement-win';
        playSound('win');
        
        // Pulse only the winning lines
        winningLines.forEach(lineNum => {
            document.getElementById(`payline-${lineNum}`).classList.add('active');
        });
    } else {
        announcement.textContent = 'NO WINNING COMBINATIONS';
        announcement.className = 'announcement-lose';
        playSound('lose');
    }
    
    // Save state back to global structure
    allProfiles[currentProfileName].balance = currentBalance;
    allProfiles[currentProfileName].stats = { ...currentStats };
    
    // Save to file
    saveProfilesToServer();
    
    // Re-enable controls
    isSpinning = false;
    document.getElementById('btn-spin').disabled = false;
    document.getElementById('btn-logout').disabled = false;
    
    updateGameDashboard();
}

// Event Listeners Registration
document.addEventListener('DOMContentLoaded', () => {
    // Load initial profiles list from server
    loadProfilesFromServer();
    
    // Screen transitions - Load Profile
    document.getElementById('btn-load-profile').addEventListener('click', () => {
        const select = document.getElementById('select-profile-dropdown');
        const selectedName = select.value;
        if (!selectedName) {
            showError('Please choose a profile first.');
            return;
        }
        
        currentProfileName = selectedName;
        currentBalance = allProfiles[selectedName].balance;
        currentStats = allProfiles[selectedName].stats || { ...defaultStats };
        
        transitionToGame();
    });
    
    // Screen transitions - Create Profile
    document.getElementById('btn-create-profile').addEventListener('click', () => {
        const inputName = document.getElementById('input-new-profile-name').value.trim();
        const inputDeposit = parseInt(document.getElementById('input-initial-deposit').value);
        
        if (!inputName) {
            showError('Profile name cannot be empty.');
            return;
        }
        if (allProfiles[inputName]) {
            showError('A profile with that name already exists.');
            return;
        }
        if (isNaN(inputDeposit) || inputDeposit <= 0) {
            showError('Initial deposit must be a valid positive number.');
            return;
        }
        
        // Initialize locally
        allProfiles[inputName] = {
            balance: inputDeposit,
            stats: { ...defaultStats }
        };
        
        currentProfileName = inputName;
        currentBalance = inputDeposit;
        currentStats = { ...defaultStats };
        
        // Save to backend file, then switch screen
        saveProfilesToServer().then(() => {
            transitionToGame();
            // Reload dropdown behind the scenes
            loadProfilesFromServer();
        });
    });
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        if (isSpinning) return;
        currentProfileName = '';
        currentBalance = 0;
        currentStats = { ...defaultStats };
        
        document.getElementById('input-new-profile-name').value = '';
        document.getElementById('screen-game').classList.remove('active');
        document.getElementById('screen-landing').classList.add('active');
        loadProfilesFromServer();
    });
    
    // Spin trigger
    document.getElementById('btn-spin').addEventListener('click', executeSpin);
    
    // Line selector buttons
    [1, 2, 3].forEach(linesCount => {
        document.getElementById(`btn-line-${linesCount}`).addEventListener('click', () => {
            if (isSpinning) return;
            activeLines = linesCount;
            updateGameDashboard();
        });
    });
    
    // Bet increment / decrement
    document.getElementById('btn-bet-minus').addEventListener('click', () => {
        if (isSpinning) return;
        if (betPerLine > MIN_BET) {
            betPerLine--;
            document.getElementById('input-bet-amount').value = betPerLine;
            updateGameDashboard();
        }
    });
    
    document.getElementById('btn-bet-plus').addEventListener('click', () => {
        if (isSpinning) return;
        if (betPerLine < MAX_BET) {
            betPerLine++;
            document.getElementById('input-bet-amount').value = betPerLine;
            updateGameDashboard();
        }
    });
    
    document.getElementById('input-bet-amount').addEventListener('change', (e) => {
        if (isSpinning) return;
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < MIN_BET) val = MIN_BET;
        if (val > MAX_BET) val = MAX_BET;
        betPerLine = val;
        e.target.value = val;
        updateGameDashboard();
    });
    
    // Sound toggle
    document.getElementById('btn-toggle-sound').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const btn = document.getElementById('btn-toggle-sound');
        const text = btn.querySelector('.sound-text');
        
        if (soundEnabled) {
            btn.classList.remove('muted');
            text.textContent = 'Sound: ON';
            // Play a soft test chime to confirm audio is active and unblocked
            playSound('deposit');
        } else {
            btn.classList.add('muted');
            text.textContent = 'Sound: OFF';
        }
    });
    
    // Modals handling (Deposit)
    document.getElementById('btn-open-deposit').addEventListener('click', openDepositModal);
    document.getElementById('btn-close-deposit').addEventListener('click', closeDepositModal);
    document.getElementById('btn-submit-deposit').addEventListener('click', submitDeposit);
    
    // Preset deposit buttons
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = e.target.dataset.amount;
            document.getElementById('input-deposit-amount').value = amount;
        });
    });
});

// Helper Functions
function transitionToGame() {
    document.getElementById('landing-error').classList.add('hidden');
    document.getElementById('screen-landing').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    
    // Setup initial visuals on reels
    const innerReels = [
        document.getElementById('reel-0').querySelector('.reel-inner'),
        document.getElementById('reel-1').querySelector('.reel-inner'),
        document.getElementById('reel-2').querySelector('.reel-inner')
    ];
    
    const initialSymbols = ['🍒', '🍋', '🔔', '💎'];
    innerReels.forEach(inner => {
        inner.innerHTML = '';
        for (let r = 0; r < ROWS; r++) {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            // Random starter symbols
            cell.textContent = initialSymbols[Math.floor(Math.random() * initialSymbols.length)];
            inner.appendChild(cell);
        }
    });
    
    // Clear message board
    const announcement = document.getElementById('announcement-text');
    announcement.textContent = 'PLACE YOUR BET & SPIN!';
    announcement.className = 'announcement-idle';
    
    updateGameDashboard();
}

function openDepositModal() {
    document.getElementById('modal-deposit').classList.remove('hidden');
}

function closeDepositModal() {
    document.getElementById('modal-deposit').classList.add('hidden');
}

function submitDeposit() {
    const inputVal = parseInt(document.getElementById('input-deposit-amount').value);
    if (isNaN(inputVal) || inputVal <= 0) {
        alert('Please enter a valid deposit amount.');
        return;
    }
    
    currentBalance += inputVal;
    allProfiles[currentProfileName].balance = currentBalance;
    
    playSound('deposit');
    saveProfilesToServer();
    updateGameDashboard();
    closeDepositModal();
    
    // Reset deposit input field default
    document.getElementById('input-deposit-amount').value = 200;
}

function showError(msg) {
    const errorEl = document.getElementById('landing-error');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
    
    // Automatically hide after 4 seconds
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 4000);
}
