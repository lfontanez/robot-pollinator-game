/**
 * Robot Pollinator Game
 * 
 * Description: JavaScript (JS)
 *
 * @author: Leamsi Fontánez - lfontanez@r1software.com
 * R1 Software - The soul is in the software
 * https://r1software.com
 */

let canvasMargin = 80;
let pauseStart;
let pausedTime = 0;
let pointerCorrection = 80;
// Mouse position tracking
let mouseX = 0;
let mouseY = 0;
let touch;

// Check if the user is on a mobile device
const isMobile = isMobileDevice();

if (isMobile) {
  console.log("You're on a mobile device!");
  canvasMargin = 150;
} else {
  console.log("You're on a desktop or laptop!");
}

// Elements
const canvas = document.getElementById('gameCanvas');
const gameControls = document.getElementById('gameControls');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const currentColorElement = document.getElementById('currentColor');
const timerElement = document.getElementById('timer');
const gameOverElement = document.getElementById('gameOver');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - canvasMargin;
}

// Auto resize game canvas
window.addEventListener('resize', resizeCanvas);

// Game state
let gameActive = false;
let score = 0;
let isPaused = false;
const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
let currentPollenColor = null;
let currentPollenColors = new Map(); // Map of color -> count
let isMovingTowardsMouse = false;

// Game settings with defaults
let gameSettings = {
  speed: 3,
  duration: 90000,
  pointsToWin: 1000,
  pointsPerMatch: 100,
  penaltyPoints: 100,
  bgImage: '',
  titleBgImage: '',
  bgMusic: '',
  winSound: '',
  gameOverSound: ''
};

// Timer management
let gameStartTime = Date.now();

// Show Settings
function showSettings() {
  document.getElementById('settingsScreen').style.display = 'flex';
  document.getElementById('introScreen').style.display = 'none';
  loadSettings();
}

// Close Settings
function closeSettings() {
  loadSettings();
  document.getElementById('settingsScreen').style.display = 'none';
  document.getElementById('introScreen').style.display = 'flex';
}

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('robotPollinatorSettings');
  if (saved) {
    gameSettings = JSON.parse(saved);
  }  
  // Update form values
  if (!gameSettings.speed) gameSettings.speed = 3;
  document.getElementById('gameSpeed').value = gameSettings.speed;
  document.getElementById('gameDuration').value = gameSettings.duration / 1000;
  const minutes = Math.floor(gameSettings.duration / 60000000);
  const seconds = Math.floor((gameSettings.duration  % 60000000) / 1000);
  timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('pointsToWin').value = gameSettings.pointsToWin;
  document.getElementById('pointsPerMatch').value = gameSettings.pointsPerMatch;
  document.getElementById('penaltyPoints').value = gameSettings.penaltyPoints;
  if (gameSettings.bgImage) document.getElementById('gameCanvas').style.backgroundImage = `url('${gameSettings.bgImage}')`; 
  if (gameSettings.titleBgImage) document.getElementById('introScreen').style.backgroundImage = `url('${gameSettings.titleBgImage}')`;
  if (gameSettings.bgMusic) document.getElementById('bgMusic').src = gameSettings.bgMusic;
  if (gameSettings.winSound) document.getElementById('winSound').src= gameSettings.winSound;
  if (gameSettings.gameOverSound) document.getElementById('gameOverSound').src = gameSettings.gameOverSound;

  // Update instructions when settings load
  updateInstructions(); 
}

// Save Settings
function saveSettings() {
  form = document.getElementById('settings');
  
  if (form.checkValidity()) {
      // Get base game settings
      gameSettings = {
        speed: document.getElementById('gameSpeed').value,
        duration: document.getElementById('gameDuration').value * 1000,
        pointsToWin: parseInt(document.getElementById('pointsToWin').value),
        pointsPerMatch: parseInt(document.getElementById('pointsPerMatch').value),
        penaltyPoints: parseInt(document.getElementById('penaltyPoints').value),
        bgMusic: document.getElementById('bgMusic').src,
        winSound: document.getElementById('winSound').src,
        gameOverSound: document.getElementById('gameOverSound').src,
        bgImage: gameSettings.bgImage, // Preserve the current bgImage URL
        titleBgImage: gameSettings.titleBgImage // Preserve the current bgImage URL
      };
 
      // Apply visual settings
      if (gameSettings.bgImage) {
        document.getElementById('gameCanvas').style.backgroundImage = `url(${gameSettings.bgImage})`;
      }
    
      // Apply title background if set
      if (gameSettings.titleBgImage) {
        document.getElementById('introScreen').style.backgroundImage = `url(${gameSettings.titleBgImage})`;
      }

      // Apply audio settings immediately
      const bgMusic = document.getElementById('bgMusic');
      const winSound = document.getElementById('winSound');
      const gameOverSound = document.getElementById('gameOverSound');
    
      // If new files were selected, their URLs would already be set via the change event handlers
      // Just make sure to apply any new background music right away
      if (bgMusic.src !== gameSettings.bgMusic) {
        bgMusic.src = gameSettings.bgMusic;
      }
      if (winSound.src !== gameSettings.winSound) {
        winSound.src = gameSettings.winSound;
      }
      if (gameOverSound.src !== gameSettings.gameOverSound) {
        gameOverSound.src = gameSettings.gameOverSound;
      }
      
      // Update local storage
      localStorage.setItem('robotPollinatorSettings', JSON.stringify(gameSettings));

      // Update Instructions
      updateInstructions();

      // Close Overlay
      closeSettings();
  }
}

// Handle file uploads
document.getElementById('bgImageUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    gameSettings.bgImage = url;
    document.getElementById('gameCanvas').style.backgroundImage = `url(${url})`;
  }
});

document.getElementById('titleBgImageUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    gameSettings.titleBgImage = url;
    document.getElementById('introScreen').style.backgroundImage = `url(${url})`;
  }
});

document.getElementById('bgMusicUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    gameSettings.bgMusic = url;
    document.getElementById('bgMusic').src = url;
  }
});

document.getElementById('winSoundUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    document.getElementById('winSound').src = url;
  }
});

document.getElementById('loseSoundUpload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    document.getElementById('gameOverSound').src = url;
  }
});

// Show Quit
function showQuitOverlay() {
  document.getElementById('quitOverlay').style.display = 'flex';
  isPaused = true;
  document.getElementById('bgMusic').pause();
}

// Hide Quit
function hideQuitOverlay() {
  document.getElementById('quitOverlay').style.display = 'none';
  isPaused = false;
  if (gameActive) document.getElementById('bgMusic').play();
}

// Quit
function quitToTitle() {
  gameOverElement.style.display = 'none';
  hideQuitOverlay();
  gameActive = false;
  document.getElementById('introScreen').style.display = 'flex';
  
  const bgMusic = document.getElementById('bgMusic');
  const playPromise = bgMusic.play();
  
  if (playPromise !== undefined) {
    playPromise.then(() => {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }).catch(error => {
      console.log("Audio pause prevented:", error);
    });
  }
}

// Update pollen display
function updatePollenDisplay() {

    if (currentPollenColors.size == 0) {
        currentColorElement.textContent = 'Current Pollen: None';
        currentPollenColors.clear();
    } else {
        currentColorElement.innerHTML = 'Current Pollen: ' + 
            Array.from(currentPollenColors.entries())
                .map(([color, count]) => 
                    `<span class="color-ball" style="background-color: ${color}"></span>${count}`)
                .join(' ');
    }
}

function updateTimer() {
    if (!gameActive) return;
    const now = Date.now();
    let elapsed = now - gameStartTime;
    if (pausedTime > 0) { 
      gameStartTime = gameStartTime + pausedTime;
      elapsed = 0;
      pausedTime = 0;
    }
    const remaining = Math.max(0, gameSettings.duration - elapsed);
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (remaining <= 0 || score >= gameSettings.pointsToWin) {
        endGame();
    }
}

function endGame() {
    gameControls.style.display = 'hidden';
    gameActive = false;
    gameOverElement.style.display = 'block';
    const finalMessage = document.getElementById('finalMessage');
    const storyMessage = document.getElementById('storyMessage');
    const title = document.getElementById('gameOverTitle');
    
    if (score >= gameSettings.pointsToWin) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        document.getElementById('winSound').play();
        title.textContent = 'YOU WIN!';
        finalMessage.textContent = `Congratulations! You saved the harvest with ${score} points!`;
        storyMessage.textContent = 'Thanks to your expert pollination skills, the farm produced a bountiful harvest. The community will thrive for another season!';
        createFireworks();
    } else {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        document.getElementById('gameOverSound').play();
        title.textContent = 'GAME OVER';
        finalMessage.textContent = `Time's up! You only scored ${score} points.`;
        storyMessage.textContent = 'Without proper pollination, the crops failed to produce. The bank has foreclosed on the farm. Better luck next season...';
    }
}

function startNewGame() {
    loadSettings();
    showGameControls();
    document.getElementById('bgMusic').currentTime = 0;
    score = 0;
    scoreElement.textContent = 'Score: 0';
    gameActive = true;
    gameStartTime = Date.now();
    gameOverElement.style.display = 'none';
    flowers = [];
    pollenBalls = [];
    currentPollenColor = null;
    currentPollenColors.clear();
    updatePollenDisplay();
}

// Robot
const robot = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speed: gameSettings.speed,
    direction: { x: 0, y: 0 }
};

// Flowers and pollen balls
let flowers = [];
let pollenBalls = [];

class Flower {
    constructor(type) {
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = Math.random() * (canvas.height - 60) + 30;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.type = type; // 'male' or 'female'
        this.size = 30;
        this.lifetime = Math.random() * 5000 + 5000; // 5-10 seconds
        this.born = Date.now();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw petals
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.rotate(Math.PI / 3);
            ctx.fillStyle = this.color;
            if (this.type === 'male') {
                ctx.ellipse(0, -this.size/2, 8, 15, 0, 0, Math.PI * 2);
            } else {
                ctx.ellipse(-this.size/2, 0, 15, 8, 0, 0, Math.PI * 2);
            }
            ctx.fill();
        }

        // Draw center
        ctx.beginPath();
        ctx.fillStyle = this.type === 'male' ? '#FFE5B4' : '#4A4A4A';
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class PollenBall {
    constructor(x, y, dx, dy, color) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.size = 8;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}


// Update robot drawing to show quadcopter appearance and current color
function drawRobot() {
    ctx.save();
    ctx.translate(robot.x, robot.y);
    
    // Calculate angle to mouse
    const angle = Math.atan2(mouseY - robot.y, mouseX - robot.x);
    ctx.rotate(angle);

    // Draw tank tracks
    const time = Date.now() / 100;
    ctx.strokeStyle = '#555555';
    ctx.fillStyle = '#333333';
    ctx.lineWidth = 3;

    // Left track
    ctx.fillRect(-30, -25, 60, 15);
    for (let i = 0; i < 6; i++) {
        const offset = (time % 20) - 10;
        ctx.beginPath();
        ctx.moveTo(-30 + (i * 10) + offset, -25);
        ctx.lineTo(-30 + (i * 10) + offset, -10);
        ctx.stroke();
    }

    // Right track
    ctx.fillRect(-30, 10, 60, 15);
    for (let i = 0; i < 6; i++) {
        const offset = (time % 20) - 10;
        ctx.beginPath();
        ctx.moveTo(-30 + (i * 10) + offset, 10);
        ctx.lineTo(-30 + (i * 10) + offset, 25);
        ctx.stroke();
    }

    // Draw body
    ctx.fillStyle = '#666666';
    ctx.fillRect(-20, -10, 40, 20);

    // Draw cannon
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, -5, 35, 10); // Main cannon body
    ctx.beginPath();
    ctx.arc(35, 0, 5, 0, Math.PI * 2); // Cannon tip
    ctx.fill();

    // Draw pollen storage behind cannon
    if (currentPollenColor) {
        ctx.fillStyle = currentPollenColor;
        ctx.beginPath();
        ctx.arc(-5, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function updateInstructions() {
  const instructionsList = document.querySelector('#instructions ul');
  let collectInstructions = 'Aproach male flowers to collect their pollen';

  if (isMobile === true) {
    instructionsList.innerHTML = `
    <li><i class="fas fa-pause"></i> to PAUSE,  <i class="fas fa-play"></i> RESUME</li>
    <li><i class="fas fa-sign-out-alt exit-icon"></i> to QUIT</li>
    <li>Move your robot pollinator by tapping screen - it will follow!</li>
    <li>${collectInstructions}</li>
    <li><i class="fas fa-fire"></i> to shoot pollen at female flowers</li>
    <li><i class="fas fa-recycle switch-icon"></i> to switch between collected pollen colors</li>
    <li>Match pollen color to female flower color for +${gameSettings.pointsPerMatch} points</li>
    <li>Wrong color match will subtract ${gameSettings.penaltyPoints} points</li>
    <li>Reach ${gameSettings.pointsToWin} points within ${gameSettings.duration/1000} seconds to win!</li>
  `;
  } else {
  instructionsList.innerHTML = `
    <li>Press [P] to PAUSE / RESUME</li>
    <li>Press [Q] to QUIT</li>
    <li>Move your robot pollinator by moving your mouse cursor - it will follow!</li>
    <li>${collectInstructions}</li>
    <li>Left-click to shoot pollen at female flowers</li>
    <li>Right-click to switch between collected pollen colors</li>
    <li>Match pollen color to female flower color for +${gameSettings.pointsPerMatch} points</li>
    <li>Wrong color matches will subtract ${gameSettings.penaltyPoints} points</li>
    <li>Reach ${gameSettings.pointsToWin} points within ${gameSettings.duration/1000} seconds to win!</li>
  `;
  }
}

function showInstructions() {
  document.getElementById('instructions').style.display = 'block';
  document.getElementById('introScreen').style.display = 'none';
}

function hideInstructions() {
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('introScreen').style.display = 'flex';
}

function startGame() {
  document.getElementById('introScreen').style.display = 'none';
  // Make sure we have user interaction before playing
  try {
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.5; // Lower volume a bit
    const playPromise = bgMusic.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Playback prevented. Resuming...");
      });
    }
  } catch (e) {
    console.log("Audio play failed:", e);
  }

  startNewGame();
}

function createFireworks() {
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const firework = document.createElement('div');
      firework.className = 'firework';
      firework.style.left = Math.random() * window.innerWidth + 'px';
      firework.style.top = Math.random() * window.innerHeight + 'px';
      firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(firework);
      setTimeout(() => {
        document.body.removeChild(firework);
      }, 1000);
    }, i * 200);
  }
}

// Add tab switching functions
function openTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  // Show selected tab content
  document.getElementById(tabName).classList.add('active');
  
  // Add active class to clicked button
  event.target.classList.add('active');
}

// Game loop
function gameLoop() {
    if (!gameActive || isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Move robot towards mouse
    const dx = mouseX - robot.x;
    const dy = mouseY - robot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
        robot.x += (dx / dist) * robot.speed;
        robot.y += (dy / dist) * robot.speed;
    }
    
    // Spawn flowers
    if (Math.random() < 0.02 && flowers.length < 10) {
        flowers.push(new Flower(Math.random() < 0.5 ? 'male' : 'female'));
    }
    
    // Update and draw flowers
    flowers = flowers.filter(flower => {
        flower.draw();
        return Date.now() - flower.born < flower.lifetime;
    });
    
    // Update and draw pollen balls
    pollenBalls = pollenBalls.filter(ball => {
        ball.update();
        ball.draw();
        return ball.x > 0 && ball.x < canvas.width && 
               ball.y > 0 && ball.y < canvas.height;
    });
    
    drawRobot();
    updateTimer();
    requestAnimationFrame(gameLoop);
}

// Event listeners
if (isMobile === true) {

  // Add event listeners for touch events
  canvas.addEventListener('touchstart', handleTouchStart, false);
  canvas.addEventListener('touchend', handleTouchEnd, false);

  function handleTouchStart(e) {
    //console.log('Touch start');
    // Get the touch point coordinates
    touch = e.touches[0]; // Get the first touch point
  }

  function handleTouchEnd(e) {
    //console.log('Touch End');
    // Follow tap
    mouseX = touch.clientX;
    mouseY = touch.clientY - pointerCorrection;
  }

  const pauseIcon = document.getElementById('pauseIcon');
  const quitIcon = document.getElementById('quitIcon');
  const switchIcon = document.getElementById('switchIcon');
  const fireIcon = document.getElementById('fireIcon');

  // Pause
  pauseIcon.addEventListener('touchend', (e) => {

    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    
    // Handle background music with promise
    const bgMusic = document.getElementById('bgMusic');
    if (isPaused) {
      quitIcon.style.display = 'none';
      pauseStart = Date.now();
        console.log('Paused Game!');
        pauseIcon.classList.remove('fa-pause');
        pauseIcon.classList.add('fa-play');
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                bgMusic.pause();
            }).catch(error => {
                console.log("Audio pause prevented:", error);
            });
        }
    } else {
        quitIcon.style.display = 'inline-block';
        pausedTime = Date.now() - pauseStart;
        console.log('Resumed Game!');
        pauseIcon.classList.remove('fa-play');
        pauseIcon.classList.add('fa-pause');
        try {
            bgMusic.play().catch(error => {
                console.log("Playback prevented:", error);
            });
        } catch (e) {
            console.log("Audio play failed:", e);
        }
    }
  });

  // Quit
  quitIcon.addEventListener('touchend', showQuitOverlay);

  // Switch
  switchIcon.addEventListener('touchend', (e) => {
    e.preventDefault();
    console.log('Switched pollen!');
    if (currentPollenColors.size > 0) {
      const colors = Array.from(currentPollenColors.keys());
      const currentIndex = colors.indexOf(currentPollenColor);
      currentPollenColor = colors[(currentIndex + 1) % colors.length];
    }else{
      currentPollenColors.clear();
    }
  });

  // Fire
  fireIcon.addEventListener('touchend', (e) => {
    if (currentPollenColor) { 
      document.getElementById('shootSound').play();
      const angle = Math.atan2(mouseY - robot.y, mouseX - robot.x);
      const speed = 10;
      const count = currentPollenColors.get(currentPollenColor);
      if (count > 0) {
        pollenBalls.push(new PollenBall(
          robot.x, robot.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          currentPollenColor
        ));
        currentPollenColors.set(currentPollenColor, count - 1);
        if (count === 1) {
          currentPollenColors.delete(currentPollenColor);
          const colors = Array.from(currentPollenColors.keys());
          currentPollenColor = colors.length > 1 ? colors[0] : null;
        }
        if (currentPollenColors.get(currentPollenColor) == 0) {
          currentPollenColors.delete(currentPollenColor);
          if (currentPollenColors.size > 0) {
              currentPollenColor = Array.from(currentPollenColors.keys())[0];
          } else {
              currentPollenColor = null;
          }
      } 
      }       
    updatePollenDisplay();  
    }
  });
} else {

  // Follow mouse
  window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY - pointerCorrection;
  });

  // Right-click (Switch)
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (currentPollenColors.size > 0) {
      const colors = Array.from(currentPollenColors.keys());
      const currentIndex = colors.indexOf(currentPollenColor);
      currentPollenColor = colors[(currentIndex + 1) % colors.length];
    }else{
      currentPollenColors.clear();
    }
  });

  // Left click
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && currentPollenColor) { 
      document.getElementById('shootSound').play();
      const angle = Math.atan2(mouseY - robot.y, mouseX - robot.x);
      const speed = 10;
      const count = currentPollenColors.get(currentPollenColor);
      if (count > 0) {
        pollenBalls.push(new PollenBall(
          robot.x, robot.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          currentPollenColor
        ));
        currentPollenColors.set(currentPollenColor, count - 1);
        if (count === 1) {
          currentPollenColors.delete(currentPollenColor);
          const colors = Array.from(currentPollenColors.keys());
          currentPollenColor = colors.length > 1 ? colors[0] : null;
        }
        if (currentPollenColors.get(currentPollenColor) == 0) {
          currentPollenColors.delete(currentPollenColor);
          if (currentPollenColors.size > 0) {
              currentPollenColor = Array.from(currentPollenColors.keys())[0];
          } else {
              currentPollenColor = null;
          }
      } 
      }       
    updatePollenDisplay();  
    }
  });
}
  // Key Press Events
  window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' && gameActive) {
        isPaused = !isPaused;
        const pauseOverlay = document.getElementById('pauseOverlay');
        pauseOverlay.style.display = isPaused ? 'flex' : 'none';
        
        // Handle background music with promise
        const bgMusic = document.getElementById('bgMusic');
        if (isPaused) {
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    bgMusic.pause();
                }).catch(error => {
                    console.log("Audio pause prevented:", error);
                });
            }
        } else {
            try {
                bgMusic.play().catch(error => {
                    console.log("Playback prevented:", error);
                });
            } catch (e) {
                console.log("Audio play failed:", e);
            }
        }
      }
      if (e.code === 'KeyQ' && gameActive) {
        showQuitOverlay();
      }

  });

// Check for pollen collection approach
setInterval(() => {
  if (!gameActive) return;
  
  pollenBalls.forEach((ball, index) => {
    flowers.forEach((flower, flowerIndex) => {
        if (flower.type === 'female' &&
            Math.hypot(ball.x - flower.x, ball.y - flower.y) < flower.size) {
            if (ball.color === flower.color) {
                document.getElementById('successSound').play();
                score += gameSettings.pointsPerMatch;
            } else {
                document.getElementById('failureSound').play();
                score = Math.max(0, score - gameSettings.penaltyPoints);
            }
            scoreElement.textContent = `Score: ${score}`;
            pollenBalls.splice(index, 1);
            flowers.splice(flowerIndex, 1);
        }
    });
  });

  // Check for approach to male flowers
  const nearbyMaleFlowers = flowers.filter(f =>
      f.type === 'male' &&
      Math.hypot(f.x - robot.x, f.y - robot.y) < f.size + robot.size
  );

  if (nearbyMaleFlowers.length > 0) {
      document.getElementById('pollenCollectSound').play();
      // Get just the first flower and collect 1 pollen
      const flower = nearbyMaleFlowers[0];
      const count = currentPollenColors.get(flower.color) || 0;
      currentPollenColors.set(flower.color, count + 1);
      if (!currentPollenColor) currentPollenColor = flower.color;

      // Remove the collected flower
      flowers = flowers.filter(f => f !== flower);

      updatePollenDisplay();
  }
}, 16);

// Function to get the screen width
function getScreenWidth() {
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}

// Function to detect mobile devices
function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    /android/i.test(userAgent) ||
    /webos/i.test(userAgent) ||
    /iphone/i.test(userAgent) ||
    /ipad/i.test(userAgent) ||
    /ipod/i.test(userAgent) ||
    /blackberry/i.test(userAgent) ||
    /windows phone/i.test(userAgent)
  );
}

// Replace footer with game controls
function showGameControls() {
  gameControls.style.display = 'block';
}

resizeCanvas();

// Load Settings
loadSettings();

// Start game loop
gameLoop();