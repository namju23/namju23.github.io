"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("#year");
  const canvas = document.querySelector("#game-canvas");
  const context = canvas.getContext("2d");
  const statusElement = document.querySelector("#game-status");
  const scoreElement = document.querySelector("#score");
  const highScoreElement = document.querySelector("#high-score");
  const startButton = document.querySelector("#start-game");
  const pauseButton = document.querySelector("#pause-game");
  const restartButton = document.querySelector("#restart-game");
  const grid = { columns: 24, rows: 18, cell: 20 };
  const directions = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
  };
  const keyDirections = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
  const tickMs = 160;
  let snake = [];
  let food = null;
  let enemies = [];
  let direction = directions.right;
  let nextDirection = directions.right;
  let score = 0;
  let highScore = Number(localStorage.getItem("nj-gogo-high-score") || 0);
  let gameTimer = null;
  let state = "idle";

  year.textContent = new Date().getFullYear();
  highScoreElement.textContent = highScore;

  const samePosition = (first, second) => Boolean(first && second && first.x === second.x && first.y === second.y);
  const randomCell = () => ({ x: Math.floor(Math.random() * grid.columns), y: Math.floor(Math.random() * grid.rows) });
  const occupied = (cell) => snake.some((part) => samePosition(part, cell)) || enemies.some((enemy) => samePosition(enemy, cell));

  function placeFood() {
    let candidate = randomCell();
    while (occupied(candidate)) candidate = randomCell();
    food = candidate;
  }

  function resetGame() {
    snake = [{ x: 5, y: 9 }, { x: 4, y: 9 }, { x: 3, y: 9 }];
    enemies = [{ x: 18, y: 5 }];
    direction = directions.right;
    nextDirection = direction;
    score = 0;
    food = null;
    placeFood();
    scoreElement.textContent = score;
    statusElement.textContent = "준비";
    draw();
  }

  function setDirection(name) {
    const requested = directions[name];
    if (!requested || (requested.x + direction.x === 0 && requested.y + direction.y === 0)) return;
    nextDirection = requested;
  }

  function startGame() {
    if (state === "running") return;
    if (state === "idle" || state === "over") resetGame();
    state = "running";
    statusElement.textContent = "플레이 중";
    startButton.disabled = true;
    pauseButton.disabled = false;
    pauseButton.textContent = "일시정지";
    clearInterval(gameTimer);
    gameTimer = setInterval(move, tickMs);
  }

  function pauseGame() {
    if (state !== "running") return;
    state = "paused";
    clearInterval(gameTimer);
    gameTimer = null;
    statusElement.textContent = "일시정지";
    startButton.disabled = false;
    startButton.textContent = "계속하기";
    pauseButton.disabled = true;
  }

  function endGame() {
    state = "over";
    clearInterval(gameTimer);
    gameTimer = null;
    statusElement.textContent = "게임 오버";
    startButton.disabled = false;
    startButton.textContent = "다시 시작";
    pauseButton.disabled = true;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("nj-gogo-high-score", String(highScore));
      highScoreElement.textContent = highScore;
    }
  }

  function move() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const hitWall = head.x < 0 || head.x >= grid.columns || head.y < 0 || head.y >= grid.rows;
    const hitSelf = snake.some((part) => samePosition(part, head));
    const hitEnemy = enemies.some((enemy) => samePosition(enemy, head));
    if (hitWall || hitSelf || hitEnemy) { endGame(); draw(); return; }
    snake.unshift(head);
    if (samePosition(head, food)) {
      score += 10;
      scoreElement.textContent = score;
      placeFood();
    } else snake.pop();
    moveEnemies();
    if (enemies.some((enemy) => samePosition(enemy, snake[0]))) endGame();
    draw();
  }

  function moveEnemies() {
    enemies = enemies.map((enemy) => {
      const options = Object.values(directions).filter((step) => {
        const next = { x: enemy.x + step.x, y: enemy.y + step.y };
        return next.x >= 0 && next.x < grid.columns && next.y >= 0 && next.y < grid.rows && !samePosition(next, snake[0]);
      });
      if (!options.length) return enemy;
      const step = options[Math.floor(Math.random() * options.length)];
      return { x: enemy.x + step.x, y: enemy.y + step.y };
    });
  }

  function drawCell(cell, color, radius = 3) {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(cell.x * grid.cell + 2, cell.y * grid.cell + 2, grid.cell - 4, grid.cell - 4, radius);
    context.fill();
  }

  function draw() {
    context.fillStyle = "#07100b";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#14221a";
    context.lineWidth = 1;
    for (let x = 0; x <= grid.columns; x += 1) { context.beginPath(); context.moveTo(x * grid.cell, 0); context.lineTo(x * grid.cell, canvas.height); context.stroke(); }
    for (let y = 0; y <= grid.rows; y += 1) { context.beginPath(); context.moveTo(0, y * grid.cell); context.lineTo(canvas.width, y * grid.cell); context.stroke(); }
    if (food) drawCell(food, "#b9f25a", 10);
    enemies.forEach((enemy) => drawCell(enemy, "#ff8b5c", 8));
    snake.forEach((part, index) => drawCell(part, index === 0 ? "#f3f5f6" : "#6b9b40", 5));
  }

  document.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === "p") { event.preventDefault(); state === "running" ? pauseGame() : startGame(); return; }
    if (keyDirections[key]) { event.preventDefault(); setDirection(keyDirections[key]); }
  });
  document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => setDirection(button.dataset.direction)));
  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", pauseGame);
  restartButton.addEventListener("click", () => { clearInterval(gameTimer); gameTimer = null; state = "idle"; startButton.disabled = false; startButton.textContent = "시작"; pauseButton.disabled = true; resetGame(); });
  resetGame();
});
