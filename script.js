const canvas = document.getElementById("simCanvas");
const ctx    = canvas.getContext("2d");

/* ---------- resize ---------- */
function resizeCanvas() {
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ---------- constants ---------- */
const G            = 1;      // scaled grav-constant
const sunRadius    = 50;     // half of 100 px Sun GIF
const safeGap      = sunRadius + 20;   // min. Sun-approach
const bodies       = [];

/* ---------- body class ---------- */
class Body {
  constructor(x, y, vx, vy, m, col, isSun = false) {
    Object.assign(this, { x, y, vx, vy, m, col, isSun });
    this.trail = [];
    this.name  = null;
  }

  updateForce(others) {
    if (this.isSun) return;
    let fx = 0, fy = 0;
    for (const o of others) {
      if (o === this) continue;
      let dx = o.x - this.x,
          dy = o.y - this.y,
          r  = Math.hypot(dx, dy);

      if (o.isSun && r < safeGap) r = safeGap; // Sun safety

      const f = G * this.m * o.m / (r * r + 1e-6);
      fx += f * dx / r;
      fy += f * dy / r;
    }
    this.vx += fx / this.m;
    this.vy += fy / this.m;
  }

  move() {
    if (!this.isSun) {
      this.x += this.vx;
      this.y += this.vy;
      this.trail.push([this.x, this.y]);
      if (this.trail.length > 120) this.trail.shift();
    }

    /* loop ʻOumuamua */
    if (this.name === "ʻOumuamua" &&
        (this.x < -300 || this.x > canvas.width + 300 ||
         this.y < -300 || this.y > canvas.height + 300)) {
      const cx = canvas.width / 2, cy = canvas.height / 2;
      this.x  = cx + 1100;
      this.y  = cy - 600;
      this.vx = -2.4;
      this.vy =  0.25;
      this.trail = [];
    }
  }

  draw(ctx) {
    if (this.isSun) return;

    /* trail */
    ctx.strokeStyle = this.col;
    ctx.beginPath();
    this.trail.forEach((p, i) => i ? ctx.lineTo(p[0], p[1])
                                   : ctx.moveTo(p[0], p[1]));
    ctx.stroke();

    /* body */
    ctx.fillStyle = this.col;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(3, Math.log(this.m)), 0, 2 * Math.PI);
    ctx.fill();

    /* label */
    if (this.name) {
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#ffcccc";
      ctx.fillText(this.name, this.x + 10, this.y - 10);
    }
  }
}

/* ---------- initialise system ---------- */
function initBodies() {
  bodies.length = 0;

  const cx = canvas.width / 2,
        cy = canvas.height / 2;

  /* Sun (GIF drawn in HTML) */
  bodies.push(new Body(cx, cy, 0, 0, 1e4, null, true));

  /* Planet 1  – radius 200, counter-clockwise */
  const r1 = 200,
        v1 = Math.sqrt(G * bodies[0].m / r1);
  bodies.push(new Body(cx + r1, cy, 0,  v1, 10, "white"));     // vy +v1 ⇒ CCW

  /* Planet 2  – radius 300, counter-clockwise */
  const r2 = 300,
        v2 = Math.sqrt(G * bodies[0].m / r2);
  bodies.push(new Body(cx - r2, cy, 0, -v2, 5,  "lightblue")); // vy −v2 ⇒ CCW

  /* ʻOumuamua – fast hyperbolic fly-by */
  const ou = new Body(cx + 1100, cy - 600, -2.4, 0.25, 2, "red");
  ou.name = "ʻOumuamua";
  bodies.push(ou);
}
initBodies();

/* ---------- animate ---------- */
function animate() {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  bodies.forEach(b => b.updateForce(bodies));
  bodies.forEach(b => { b.move(); b.draw(ctx); });

  requestAnimationFrame(animate);
}
animate();
