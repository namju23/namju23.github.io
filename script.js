(() => {
  "use strict";

  const canvas = document.querySelector("#game-canvas");
  const context = canvas.getContext("2d");
  const scoreElement = document.querySelector("#score");
  const statusElement = document.querySelector("#game-status");
  const messageElement = document.querySelector("#game-message");
  const startButton = document.querySelector("#start-button");
  const grid = { columns: 24, rows: 18, cell: 20 };
  const directions = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
  };
  const easySettings = { tickMs: 165, enemyTickMs: 495, enemyCount: 1 };
  let snake, food, enemies, direction, nextDirection, score, gameTimer, enemyTimer, playing;

  function samePosition(a, b) { return a.x === b.x && a.y === b.y; }
  function randomCell() { return { x: Math.floor(Math.random() * grid.columns), y: Math.floor(Math.random() * grid.rows) }; }
  function occupied(cell) { return snake.some((part) => samePosition(part, cell)) || enemies.some((enemy) => samePosition(enemy, cell)) || (food && samePosition(food, cell)); }
  function placeFood() { let candidate = randomCell(); while (occupied(candidate)) candidate = randomCell(); food = candidate; }
  function resetGame() {
    snake = [{ x: 5, y: 9 }, { x: 4, y: 9 }, { x: 3, y: 9 }];
    direction = directions.right; nextDirection = direction; score = 0; playing = false;
    enemies = [{ x: 18, y: 5 }];
    placeFood(); scoreElement.textContent = score; statusElement.textContent = "시작 버튼을 눌러보세요"; draw();
  }
  function setDirection(name) {
    const requested = directions[name];
    if (!requested || (requested.x + direction.x === 0 && requested.y + direction.y === 0)) return;
    nextDirection = requested;
  }
  function startGame() {
    clearInterval(gameTimer); clearInterval(enemyTimer); resetGame(); playing = true;
    messageElement.classList.add("is-hidden"); statusElement.textContent = "플레이 중";
    gameTimer = setInterval(moveSnake, easySettings.tickMs); enemyTimer = setInterval(moveEnemies, easySettings.enemyTickMs); draw();
  }
  function endGame() {
    playing = false; clearInterval(gameTimer); clearInterval(enemyTimer); statusElement.textContent = `게임 오버 · ${score}점`;
    messageElement.querySelector("strong").textContent = "게임 오버"; messageElement.querySelector("span").textContent = `최종 점수 ${score}점 · 다시 도전해보세요.`; startButton.textContent = "다시 시작"; messageElement.classList.remove("is-hidden");
  }
  function moveSnake() {
    direction = nextDirection; const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const hitWall = head.x < 0 || head.x >= grid.columns || head.y < 0 || head.y >= grid.rows;
    const hitSelf = snake.some((part) => samePosition(part, head)); const hitEnemy = enemies.some((enemy) => samePosition(enemy, head));
    if (hitWall || hitSelf || hitEnemy) { endGame(); return; }
    snake.unshift(head);
    if (samePosition(head, food)) { score += 10; scoreElement.textContent = score; placeFood(); } else snake.pop();
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
    if (enemies.some((enemy) => samePosition(enemy, snake[0]))) endGame(); else draw();
  }
  function drawCell(cell, color, radius = 3) { context.fillStyle = color; context.beginPath(); context.roundRect(cell.x * grid.cell + 2, cell.y * grid.cell + 2, grid.cell - 4, grid.cell - 4, radius); context.fill(); }
  function draw() {
    context.fillStyle = "#0c1110"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#18221d"; context.lineWidth = 1;
    for (let x = 0; x <= grid.columns; x++) { context.beginPath(); context.moveTo(x * grid.cell, 0); context.lineTo(x * grid.cell, canvas.height); context.stroke(); }
    for (let y = 0; y <= grid.rows; y++) { context.beginPath(); context.moveTo(0, y * grid.cell); context.lineTo(canvas.width, y * grid.cell); context.stroke(); }
    drawCell(food, "#b9f25a", 10); enemies.forEach((enemy) => drawCell(enemy, "#ff796d", 10));
    snake.forEach((part, index) => drawCell(part, index === 0 ? "#f5f7f8" : "#6b9b40", 5));
  }
  document.addEventListener("keydown", (event) => { const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" }; if (map[event.key]) { event.preventDefault(); setDirection(map[event.key]); } if (event.key === "Enter" && !playing) startGame(); });
  document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => setDirection(button.dataset.direction)));
  startButton.addEventListener("click", startGame);
  resetGame();
})();
