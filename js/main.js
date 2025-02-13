
let currentLanguage = "en";
const savedLang = localStorage.getItem("snakeLang");
if (savedLang) {
  currentLanguage = savedLang;
}

const loadingScreen = document.getElementById("loadingScreen");
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const languageSelect = document.getElementById("languageSelect");

const settingsIcon = document.getElementById("settingsIcon");
const settingsPanel = document.getElementById("settingsPanel");
const difficultySelect = document.getElementById("difficultySelect");
const themeSelect = document.getElementById("themeSelect");
const wallsCheck = document.getElementById("wallsCheck");
const obstaclesCheck = document.getElementById("obstaclesCheck");
const obstacleCountGroup = document.getElementById("obstacleCountGroup");
const obstacleCountInput = document.getElementById("obstacleCountInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

let gameSettings = {
  difficulty: "normal",
  theme: "classic",
  walls: true,
  obstacles: false,
  obstacleCount: 3
};

let highScore = 0;

const gridSize = 20;
const tileCount = 20;
let snakeX = 10;
let snakeY = 10;
let velocityX = 0;
let velocityY = 0;
let snakeBody = [];
let snakeLength = 3;
let appleX = 5;
let appleY = 5;
let score = 0;
let gameLoopInterval = null;
let obstacles = [];

window.onload = () => {
  loadFromLocalStorage();
  updateSettingsUI();
  updateHighScoreDisplay();
  toggleObstacleCountVisibility();

  languageSelect.value = currentLanguage;
  switchLanguage(currentLanguage);

  setTimeout(() => {
    loadingScreen.style.display = "none";
    startScreen.style.display = "flex";
  }, 2000);
};

function loadFromLocalStorage() {
  let savedSettings = localStorage.getItem("snakeGameSettings");
  if (savedSettings) {
    try {
      let parsed = JSON.parse(savedSettings);
      gameSettings.difficulty = parsed.difficulty ?? "normal";
      gameSettings.theme = parsed.theme ?? "classic";
      gameSettings.walls = parsed.walls ?? true;
      gameSettings.obstacles = parsed.obstacles ?? false;
      gameSettings.obstacleCount = parsed.obstacleCount ?? 3;
    } catch (e) {
      console.warn("Ayarları okurken hata:", e);
    }
  }
  let savedHighScore = localStorage.getItem("snakeHighScore");
  if (savedHighScore) {
    highScore = parseInt(savedHighScore, 10) || 0;
  } else {
    highScore = 0;
  }
}

function saveSettingsToLocalStorage() {
  localStorage.setItem("snakeGameSettings", JSON.stringify(gameSettings));
}

function saveHighScoreToLocalStorage() {
  localStorage.setItem("snakeHighScore", highScore.toString());
}

document.addEventListener("keydown", startGameTransition);

function startGameTransition() {
  if (startScreen.style.display === "flex") {
    startScreen.classList.add("hide");
    startScreen.addEventListener("transitionend", onStartScreenHidden);
    document.removeEventListener("keydown", startGameTransition);
  }
}

function onStartScreenHidden() {
  startScreen.style.display = "none";
  gameScreen.style.display = "block";
  startGame();
  startScreen.removeEventListener("transitionend", onStartScreenHidden);
}

settingsIcon.addEventListener("click", () => {
  if (settingsPanel.style.display === "none") {
    settingsPanel.style.display = "flex";
  } else {
    settingsPanel.style.display = "none";
  }
});

obstaclesCheck.addEventListener("change", toggleObstacleCountVisibility);

function toggleObstacleCountVisibility() {
  if (obstaclesCheck.checked) {
    obstacleCountGroup.style.display = "block";
  } else {
    obstacleCountGroup.style.display = "none";
  }
}

saveSettingsBtn.addEventListener("click", () => {
  gameSettings.difficulty = difficultySelect.value;
  gameSettings.theme = themeSelect.value;
  gameSettings.walls = wallsCheck.checked;
  gameSettings.obstacles = obstaclesCheck.checked;

  let cnt = parseInt(obstacleCountInput.value, 10);
  if (isNaN(cnt) || cnt < 1) cnt = 1;
  if (cnt > 10) cnt = 10;
  gameSettings.obstacleCount = cnt;

  applySettings();
  saveSettingsToLocalStorage();
  settingsPanel.style.display = "none";
});

function applySettings() {
  if (gameSettings.theme === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }

  if (gameSettings.obstacles) {
    obstacles = [];
    for (let i = 0; i < gameSettings.obstacleCount; i++) {
      let rx = Math.floor(Math.random() * tileCount);
      let ry = Math.floor(Math.random() * tileCount);
      obstacles.push({ x: rx, y: ry });
    }
  } else {
    obstacles = [];
  }

  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
  }
  let speedMs = 100;
  switch (gameSettings.difficulty) {
    case "easy": speedMs = 150; break;
    case "hard": speedMs = 70;  break;
    default:     speedMs = 100; break;
  }
  gameLoopInterval = setInterval(gameLoop, speedMs);
}

function updateSettingsUI() {
  difficultySelect.value = gameSettings.difficulty;
  themeSelect.value = gameSettings.theme;
  wallsCheck.checked = gameSettings.walls;
  obstaclesCheck.checked = gameSettings.obstacles;
  obstacleCountInput.value = gameSettings.obstacleCount;
}

function startGame() {
  applySettings();
  document.addEventListener("keydown", keyPush);
  updateHighScoreDisplay();
}

function gameLoop() {
  updateSnakePosition();
  checkAppleCollision();
  drawGame();
  checkCollision();
}

function updateSnakePosition() {
  snakeX += velocityX;
  snakeY += velocityY;
  snakeBody.push({ x: snakeX, y: snakeY });
  while (snakeBody.length > snakeLength) {
    snakeBody.shift();
  }
}

function checkAppleCollision() {
  if (snakeX === appleX && snakeY === appleY) {
    snakeLength++;
    score++;
    scoreDisplay.textContent = "Skor: " + score;
    appleX = Math.floor(Math.random() * tileCount);
    appleY = Math.floor(Math.random() * tileCount);
  }
}

function drawGame() {
  ctx.fillStyle = (gameSettings.theme === "dark") ? "#555" : "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "green";
  for (let part of snakeBody) {
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
  }

  ctx.fillStyle = "red";
  ctx.fillRect(appleX * gridSize, appleY * gridSize, gridSize, gridSize);

  if (gameSettings.obstacles) {
    ctx.fillStyle = "gray";
    for (let obs of obstacles) {
      ctx.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize, gridSize);
    }
  }
}

function checkCollision() {
  if (gameSettings.walls) {
    if (snakeX < 0 || snakeX >= tileCount || snakeY < 0 || snakeY >= tileCount) {
      resetGame();
      return;
    }
  } else {
    if (snakeX < 0) snakeX = tileCount - 1;
    else if (snakeX >= tileCount) snakeX = 0;
    if (snakeY < 0) snakeY = tileCount - 1;
    else if (snakeY >= tileCount) snakeY = 0;
  }

  for (let i = 0; i < snakeBody.length - 1; i++) {
    if (snakeBody[i].x === snakeX && snakeBody[i].y === snakeY) {
      resetGame();
      return;
    }
  }

  if (gameSettings.obstacles) {
    for (let obs of obstacles) {
      if (obs.x === snakeX && obs.y === snakeY) {
        resetGame();
        return;
      }
    }
  }
}

function keyPush(event) {
  if ((velocityX === 0 && velocityY === 0)) {
    hideSettingsIconOnMovement();
  }

  switch (event.key) {
    case "ArrowLeft":
      if (velocityX !== 1) {
        velocityX = -1;
        velocityY = 0;
      }
      break;
    case "ArrowUp":
      if (velocityY !== 1) {
        velocityX = 0;
        velocityY = -1;
      }
      break;
    case "ArrowRight":
      if (velocityX !== -1) {
        velocityX = 1;
        velocityY = 0;
      }
      break;
    case "ArrowDown":
      if (velocityY !== -1) {
        velocityX = 0;
        velocityY = 1;
      }
      break;
  }
}

function hideSettingsIconOnMovement() {
  // Buton hala görünürse kapat
  if (settingsIcon.style.display !== "none") {
    settingsIcon.style.display = "none";
    settingsPanel.style.display = "none";
  }
}

function resetGame() {
  if (score > highScore) {
    highScore = score;
    saveHighScoreToLocalStorage();
    updateHighScoreDisplay();
  }

  clearInterval(gameLoopInterval);
  score = 0;
  scoreDisplay.textContent = "Skor: 0";
  snakeX = 10;
  snakeY = 10;
  velocityX = 0;
  velocityY = 0;
  snakeBody = [];
  snakeLength = 3;
  appleX = Math.floor(Math.random() * tileCount);
  appleY = Math.floor(Math.random() * tileCount);

  settingsIcon.style.display = "block";

  let speedMs = 100;
  switch (gameSettings.difficulty) {
    case "easy": speedMs = 150; break;
    case "hard": speedMs = 70;  break;
    default:     speedMs = 100; break;
  }
  gameLoopInterval = setInterval(gameLoop, speedMs);
}

function updateHighScoreDisplay() {
  highScoreDisplay.textContent = "En Yüksek Skor: " + highScore;
}
languageSelect.addEventListener("change", () => {
  currentLanguage = languageSelect.value;
  localStorage.setItem("snakeLang", currentLanguage);
  switchLanguage(currentLanguage);
});

function switchLanguage(lang) {
  const t = window.translations[lang];
  document.getElementById("loadingText").textContent = t.loadingText;
  document.getElementById("startText").textContent = t.startText;
  document.getElementById("titleText").textContent = t.title;
  scoreDisplay.textContent = t.score + score;
  highScoreDisplay.textContent = t.highScore + highScore;
  document.getElementById("settingsTitle").textContent = t.settingsTitle;
  document.getElementById("difficultyLabel").textContent = t.difficultyLabel;
  document.getElementById("themeLabel").textContent = t.themeLabel;
  document.getElementById("wallsLabel").textContent = t.wallsLabel;
  document.getElementById("obstaclesLabel").textContent = t.obstaclesLabel;
  document.getElementById("obstacleCountLabel").textContent = t.obstacleCountLabel;
  document.getElementById("saveSettingsBtn").textContent = t.saveSettings;
  document.getElementById("easyOption").textContent = t.easy;
  document.getElementById("normalOption").textContent = t.normal;
  document.getElementById("hardOption").textContent = t.hard;
  document.getElementById("classicOption").textContent = t.classic;
  document.getElementById("darkOption").textContent = t.dark;
}
