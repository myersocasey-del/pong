'use strict';

// ─── Canvas setup ────────────────────────────────────────────────────────────
const canvas  = document.getElementById('pong');
const ctx     = canvas.getContext('2d');
const W       = canvas.width;
const H       = canvas.height;

// ─── UI elements ─────────────────────────────────────────────────────────────
const scoreLeftEl  = document.getElementById('score-left');
const scoreRightEl = document.getElementById('score-right');
const messageEl    = document.getElementById('message');

// ─── Constants ───────────────────────────────────────────────────────────────
const PADDLE_W      = 12;
const PADDLE_H      = 90;
const PADDLE_SPEED  = 6;
const BALL_SIZE     = 12;
const BALL_SPEED    = 5;
const BALL_MAX_SPD  = 14;
const WIN_SCORE     = 7;
const WALL_MARGIN   = 20;

// ─── State ───────────────────────────────────────────────────────────────────
let leftScore  = 0;
let rightScore = 0;
let running    = false;
let gameOver   = false;

const keys = {};

// ─── Paddle factory ──────────────────────────────────────────────────────────
function makePaddle(x) {
  return { x, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H, dy: 0 };
}

const leftPaddle  = makePaddle(WALL_MARGIN);
const rightPaddle = makePaddle(W - WALL_MARGIN - PADDLE_W);

// ─── Ball ────────────────────────────────────────────────────────────────────
const ball = { x: 0, y: 0, size: BALL_SIZE, vx: 0, vy: 0 };

function resetBall(direction = 1) {
  ball.x  = W / 2;
  ball.y  = H / 2;
  const angle = (Math.random() * Math.PI / 3) - Math.PI / 6; // ±30°
  ball.vx = direction * BALL_SPEED * Math.cos(angle);
  ball.vy = BALL_SPEED * Math.sin(angle);
}

// ─── Input ───────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  keys[e.code] = true;

  if (e.code === 'Space') {
    e.preventDefault();
    if (gameOver) {
      restartGame();
    } else if (!running) {
      startRound();
    }
  }

  if (['ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
});

document.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ─── Game flow ───────────────────────────────────────────────────────────────
function showMessage(html) {
  messageEl.innerHTML = html;
  messageEl.classList.remove('hidden');
}

function hideMessage() {
  messageEl.classList.add('hidden');
}

function startRound() {
  running = true;
  hideMessage();
}

function restartGame() {
  leftScore  = 0;
  rightScore = 0;
  gameOver   = false;
  updateScore();
  leftPaddle.y  = H / 2 - PADDLE_H / 2;
  rightPaddle.y = H / 2 - PADDLE_H / 2;
  resetBall(Math.random() < 0.5 ? 1 : -1);
  showMessage('Press <strong>Space</strong> to start');
  running = false;
}

function updateScore() {
  scoreLeftEl.textContent  = leftScore;
  scoreRightEl.textContent = rightScore;
}

// ─── Update ──────────────────────────────────────────────────────────────────
function update() {
  if (!running) return;

  if (keys['KeyW'])     leftPaddle.y  -= PADDLE_SPEED;
  if (keys['KeyS'])     leftPaddle.y  += PADDLE_SPEED;
  if (keys['ArrowUp'])  rightPaddle.y -= PADDLE_SPEED;
  if (keys['ArrowDown'])rightPaddle.y += PADDLE_SPEED;

  leftPaddle.y  = clamp(leftPaddle.y,  0, H - PADDLE_H);
  rightPaddle.y = clamp(rightPaddle.y, 0, H - PADDLE_H);

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y <= 0) {
    ball.y  = 0;
    ball.vy = Math.abs(ball.vy);
  }
  if (ball.y + ball.size >= H) {
    ball.y  = H - ball.size;
    ball.vy = -Math.abs(ball.vy);
  }

  function handlePaddleHit(paddle, side) {
    if (!rectOverlap(ball.x, ball.y, ball.size, ball.size,
                     paddle.x, paddle.y, paddle.w, paddle.h)) return;

    ball.vx = side * Math.abs(ball.vx);

    const hitPos      = (ball.y + ball.size / 2) - (paddle.y + paddle.h / 2);
    const normalized  = hitPos / (paddle.h / 2);
    const angle       = normalized * (Math.PI / 3);
    const speed       = Math.min(Math.hypot(ball.vx, ball.vy) * 1.05, BALL_MAX_SPD);
    ball.vx = side * speed * Math.cos(angle);
    ball.vy = speed * Math.sin(angle);

    if (side > 0) ball.x = paddle.x + paddle.w;
    else          ball.x = paddle.x - ball.size;
  }

  handlePaddleHit(leftPaddle,   1);
  handlePaddleHit(rightPaddle, -1);

  if (ball.x + ball.size < 0) {
    rightScore++;
    updateScore();
    afterPoint(-1);
  } else if (ball.x > W) {
    leftScore++;
    updateScore();
    afterPoint(1);
  }
}

function afterPoint(nextDir) {
  running = false;
  if (leftScore >= WIN_SCORE || rightScore >= WIN_SCORE) {
    gameOver = true;
    const winner = leftScore >= WIN_SCORE ? 'Left' : 'Right';
    showMessage(`<strong>${winner} player wins!</strong><br>Press <strong>Space</strong> to play again`);
    return;
  }
  resetBall(nextDir);
  showMessage('Press <strong>Space</strong> to continue');
}

// ─── Draw ────────────────────────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  ctx.setLineDash([10, 14]);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.roundRect(leftPaddle.x, leftPaddle.y, leftPaddle.w, leftPaddle.h, 4);
  ctx.fill();

  ctx.fillStyle = '#ef9a9a';
  ctx.beginPath();
  ctx.roundRect(rightPaddle.x, rightPaddle.y, rightPaddle.w, rightPaddle.h, 4);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(ball.x, ball.y, ball.size, ball.size, 3);
  ctx.fill();
}

// ─── Loop ────────────────────────────────────────────────────────────────────
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ─── Init ────────────────────────────────────────────────────────────────────
resetBall(Math.random() < 0.5 ? 1 : -1);
showMessage('Press <strong>Space</strong> to start');
loop();
