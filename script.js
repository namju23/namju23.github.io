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

  const mineBoard = document.querySelector("#minesweeper-board");
  const mineStatus = document.querySelector("#minesweeper-status");
  const mineRestart = document.querySelector("#minesweeper-restart");
  const flagToggle = document.querySelector("#minesweeper-flag");
  const mineSize = 9;
  const mineCount = 10;
  let mineCells = [];
  let mineState = "ready";
  let flagMode = false;

  function neighbors(index) {
    const row = Math.floor(index / mineSize);
    const column = index % mineSize;
    const result = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (!rowOffset && !columnOffset) continue;
      const nextRow = row + rowOffset; const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < mineSize && nextColumn >= 0 && nextColumn < mineSize) result.push(nextRow * mineSize + nextColumn);
    }
    return result;
  }

  function startMinesweeper() {
    mineState = "playing"; mineCells = Array.from({ length: mineSize * mineSize }, (_, index) => ({ index, mine: false, revealed: false, flagged: false, number: 0 }));
    const positions = [...mineCells.keys()];
    for (let index = positions.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [positions[index], positions[swap]] = [positions[swap], positions[index]]; }
    positions.slice(0, mineCount).forEach((index) => { mineCells[index].mine = true; });
    mineCells.forEach((cell) => { if (!cell.mine) cell.number = neighbors(cell.index).filter((neighbor) => mineCells[neighbor].mine).length; });
    mineStatus.textContent = "플레이 중 · 안전한 칸을 찾으세요."; renderMinesweeper();
  }

  function finishMinesweeper(won) { mineState = won ? "won" : "lost"; mineCells.forEach((cell) => { if (cell.mine) cell.revealed = true; }); mineStatus.textContent = won ? "성공! 모든 안전한 칸을 열었습니다." : "게임 오버 · 지뢰를 밟았습니다."; renderMinesweeper(); }
  function revealMine(index) {
    const cell = mineCells[index]; if (!cell || cell.revealed || cell.flagged || mineState !== "playing") return;
    cell.revealed = true; if (cell.mine) { finishMinesweeper(false); return; }
    if (cell.number === 0) neighbors(index).forEach((neighbor) => revealMine(neighbor));
    if (mineCells.filter((item) => !item.mine && item.revealed).length === mineCells.length - mineCount) finishMinesweeper(true); else renderMinesweeper();
  }
  function renderMinesweeper() { mineBoard.replaceChildren(); mineCells.forEach((cell) => { const button = document.createElement("button"); button.type = "button"; button.className = `mine-cell${cell.revealed ? " revealed" : ""}${cell.mine && cell.revealed ? " mine" : ""}`; button.setAttribute("role", "gridcell"); button.setAttribute("aria-label", cell.flagged ? "깃발 표시" : cell.revealed ? (cell.mine ? "지뢰" : `${cell.number}개 인접 지뢰`) : "닫힌 칸"); if (cell.revealed && !cell.mine && cell.number) { button.textContent = cell.number; button.dataset.number = cell.number; } if (cell.flagged && !cell.revealed) button.textContent = "⚑"; button.addEventListener("click", () => { if (flagMode && !cell.revealed) { cell.flagged = !cell.flagged; renderMinesweeper(); } else revealMine(cell.index); }); mineBoard.append(button); }); }
  flagToggle.addEventListener("click", () => { flagMode = !flagMode; flagToggle.setAttribute("aria-pressed", String(flagMode)); flagToggle.textContent = `깃발 모드: ${flagMode ? "켜짐" : "꺼짐"}`; });
  mineRestart.addEventListener("click", startMinesweeper);
  startMinesweeper();

  const planeCanvas = document.querySelector("#plane-canvas");
  const planeContext = planeCanvas.getContext("2d");
  const planeStatus = document.querySelector("#plane-status");
  const planeScoreElement = document.querySelector("#plane-score");
  const planeStart = document.querySelector("#plane-start");
  const planeRestart = document.querySelector("#plane-restart");
  const plane = { width: planeCanvas.width, height: planeCanvas.height };
  let planePlayer; let planeBullets; let planeEnemies; let planeScore; let planeState = "idle"; let planeFrame = null; let planeLastTime = 0; let planeSpawnTime = 0; let planeKeys = {};
  const planeHit = (first, second) => first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
  function resetPlane() { planePlayer = { x: plane.width / 2 - 16, y: plane.height - 42, width: 32, height: 22 }; planeBullets = []; planeEnemies = []; planeScore = 0; planeScoreElement.textContent = "0"; planeStatus.textContent = "준비"; drawPlane(); }
  function spawnPlaneEnemy() { planeEnemies.push({ x: 18 + Math.random() * (plane.width - 52), y: -24, width: 34, height: 20, speed: 42 + Math.random() * 18 }); }
  function startPlane() { if (planeState === "running") return; if (planeState === "idle" || planeState === "over") resetPlane(); planeState = "running"; planeStatus.textContent = "플레이 중"; cancelAnimationFrame(planeFrame); planeLastTime = performance.now(); planeSpawnTime = planeLastTime; planeFrame = requestAnimationFrame(planeLoop); }
  function endPlane() { planeState = "over"; cancelAnimationFrame(planeFrame); planeFrame = null; planeStatus.textContent = "게임 오버 · 재시작으로 다시 도전하세요."; drawPlane(); }
  function updatePlane(time) { const delta = Math.min((time - planeLastTime) / 1000, .05); planeLastTime = time; if (planeKeys.left) planePlayer.x -= 190 * delta; if (planeKeys.right) planePlayer.x += 190 * delta; planePlayer.x = Math.max(0, Math.min(plane.width - planePlayer.width, planePlayer.x)); planeBullets = planeBullets.filter((bullet) => { bullet.y -= 300 * delta; return bullet.y > -10; }); planeEnemies.forEach((enemy) => { enemy.y += enemy.speed * delta; }); if (time - planeSpawnTime > 900) { spawnPlaneEnemy(); planeSpawnTime = time; } planeBullets.forEach((bullet) => planeEnemies.forEach((enemy) => { if (!enemy.hit && planeHit(bullet, enemy)) { bullet.hit = true; enemy.hit = true; planeScore += 10; planeScoreElement.textContent = planeScore; } })); planeBullets = planeBullets.filter((bullet) => !bullet.hit); planeEnemies = planeEnemies.filter((enemy) => !enemy.hit && enemy.y < plane.height + 30); if (planeEnemies.some((enemy) => planeHit(planePlayer, enemy) || enemy.y > plane.height)) endPlane(); }
  function drawPlane() { planeContext.fillStyle = "#090d1b"; planeContext.fillRect(0, 0, plane.width, plane.height); planeContext.fillStyle = "#26304b"; for (let y = 20; y < plane.height; y += 44) planeContext.fillRect((y * 7) % plane.width, y, 2, 2); planeContext.fillStyle = "#b9f25a"; planeContext.beginPath(); planeContext.moveTo(planePlayer.x + 16, planePlayer.y); planeContext.lineTo(planePlayer.x, planePlayer.y + 22); planeContext.lineTo(planePlayer.x + 32, planePlayer.y + 22); planeContext.closePath(); planeContext.fill(); planeContext.fillStyle = "#f3f5f6"; planeBullets.forEach((bullet) => planeContext.fillRect(bullet.x, bullet.y, 3, 10)); planeEnemies.forEach((enemy) => { planeContext.fillStyle = "#ff8b5c"; planeContext.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); planeContext.fillStyle = "#090d1b"; planeContext.fillRect(enemy.x + 8, enemy.y + 5, 5, 5); planeContext.fillRect(enemy.x + 21, enemy.y + 5, 5, 5); }); }
  function planeLoop(time) { if (planeState !== "running") return; updatePlane(time); drawPlane(); if (planeState === "running") planeFrame = requestAnimationFrame(planeLoop); }
  function firePlane() { if (planeState === "running") planeBullets.push({ x: planePlayer.x + 14, y: planePlayer.y - 10 }); }
  document.addEventListener("keydown", (event) => { if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D", " "].includes(event.key)) { if (event.key === " ") firePlane(); else { planeKeys.left = event.key === "ArrowLeft" || event.key.toLowerCase() === "a"; planeKeys.right = event.key === "ArrowRight" || event.key.toLowerCase() === "d"; } } });
  document.addEventListener("keyup", (event) => { if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(event.key)) { if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") planeKeys.left = false; if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") planeKeys.right = false; } });
  document.querySelectorAll("[data-plane-control]").forEach((button) => { button.addEventListener("pointerdown", () => { if (button.dataset.planeControl === "fire") firePlane(); else planeKeys[button.dataset.planeControl] = true; }); button.addEventListener("pointerup", () => { if (button.dataset.planeControl !== "fire") planeKeys[button.dataset.planeControl] = false; }); button.addEventListener("pointerleave", () => { if (button.dataset.planeControl !== "fire") planeKeys[button.dataset.planeControl] = false; }); });
  planeStart.addEventListener("click", startPlane); planeRestart.addEventListener("click", () => { planeState = "idle"; cancelAnimationFrame(planeFrame); planeFrame = null; resetPlane(); }); resetPlane();
});
