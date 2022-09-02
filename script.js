const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let raf;

ctx.fillStyle = "rgb(255, 255, 255)";
ctx.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.25;

const ball = {
  x: Math.floor(canvas.width / 2),
  y: 100,
  vx: 0,
  vy: 0,
  radius: 25,
  color: "red",
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  },
};

function clear() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

let lastHeight = ball.y;

function calBallPos() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.vy <= 0 && ball.vy > 0.0001) ball.vy = 0;
  else {
    ball.vy *= 0.99;
    ball.vy += gravity;
  }

  if (Math.abs(ball.vx) < 0.0001) ball.vx = 0;
  else ball.vx *= 0.99;

  if (
    ball.y + ball.radius + ball.vy > canvas.height ||
    ball.y - ball.radius + ball.vy < 0
  ) {
    // the ball just has a contact with the floor => constraint force
    if (ball.vy > 0) ball.vy -= gravity;

    ball.vy = -ball.vy;
  }
  if (
    ball.x + ball.radius + ball.vx > canvas.width ||
    ball.x - ball.radius + ball.vx < 0
  ) {
    ball.vx = -ball.vx;
  }

  ball.vy += (ball.y - lastHeight) * 0.005;
  lastHeight = ball.y;
}

function draw() {
  clear();
  ball.draw();
  calBallPos();

  raf = window.requestAnimationFrame(draw);
}

let offsetX = 0;
let offsetY = 0;
let isHolding = false;

canvas.addEventListener("mousedown", e => {
  const [offX, offY, distance] = calDistance(
    ball.x,
    ball.y,
    e.clientX - canvas.offsetLeft,
    e.clientY - canvas.offsetTop
  );
  offsetX = offX;
  offsetY = offY;

  if (distance <= ball.radius) {
    isHolding = true;
    ball.vx = 0;
    ball.vy = 0;
    window.cancelAnimationFrame(raf);
  }
});

let moveTime = 0;
let mouseMoveSamples = [];

canvas.addEventListener("mouseup", e => {
  if (isHolding) {
    const startPos = mouseMoveSamples[moveTime % 10] || mouseMoveSamples[0];
    const endPos = mouseMoveSamples[(moveTime - 1) % 10];
    const timeDelta = startPos?.[2] - performance.now();

    ball.vx = ((startPos?.[0] - endPos?.[0]) / timeDelta) * 10;
    if (Number.isNaN(ball.vx)) ball.vx = 0;
    ball.vy = ((startPos?.[1] - endPos?.[1]) / timeDelta) * 10 + gravity;
    if (Number.isNaN(ball.vy)) ball.vy = gravity;

    lastHeight = ball.y;
    isHolding = false;
    moveTime = 0;
    mouseMoveSamples = [];

    raf = window.requestAnimationFrame(draw);
  }
});

canvas.addEventListener("mousemove", e => {
  if (isHolding) {
    clear();
    ball.x = e.clientX - canvas.offsetLeft + offsetX;
    ball.y = e.clientY - canvas.offsetTop + offsetY;
    ball.draw();
    mouseMoveSamples[moveTime % 10] = [ball.x, ball.y, performance.now()];
    moveTime++;
  }
});

ball.draw();

function calDistance(x1, y1, x2, y2) {
  const a = x1 - x2;
  const b = y1 - y2;

  return [a, b, Math.sqrt(a * a + b * b)];
}
