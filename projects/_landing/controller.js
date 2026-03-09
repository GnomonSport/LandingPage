/**
 * Zweck: Steuerung des Pixelrasters im Canvas.
 * Hält den Zustand und führt iterative Updates für die Animation aus.
 */

const DOT_GAP = 0;
const DEBUG_VEC = false;
const TWO_PI = Math.PI * 2;

export function createRasterController({ canvas, pixelSize }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context unavailable.');
  }

  const dotSize = Math.max(1, Number(pixelSize) || 1);
  const cell = dotSize + DOT_GAP;
  const radius = Math.max(1, dotSize * 0.35);

  // --- PARAMETERS ---
  let dir = { x: 1, y: 0.5 };
  let noiseInf = 0.2;
  let turb = 0.01;
  const smooth = 1.0;
  let windStrength = 600;
  const coherenceFactor = 0.5;
  const noiseScale = 0.05;
  let transfer = 0.003;
  let pixelSmooth = 0.1;
  const vecOff = 0.5 * cell;
  const vecStep = 14 * cell;
  const vecLen = 10 * cell;

  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let pixels = [];
  let vecGrid = [];
  let vecCols = 0;
  let vecRows = 0;
  let gridW = 0;
  let gridH = 0;
  let isRunning = false;
  let animationFrameId = null;
  let simTime = 0;

  function fade(t) {
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hash3(ix, iy, iz) {
    const s = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7) * 43758.5453123;
    return s - Math.floor(s);
  }

  function noise3(x, y, z) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const z1 = z0 + 1;

    const tx = fade(x - x0);
    const ty = fade(y - y0);
    const tz = fade(z - z0);

    const n000 = hash3(x0, y0, z0);
    const n100 = hash3(x1, y0, z0);
    const n010 = hash3(x0, y1, z0);
    const n110 = hash3(x1, y1, z0);
    const n001 = hash3(x0, y0, z1);
    const n101 = hash3(x1, y0, z1);
    const n011 = hash3(x0, y1, z1);
    const n111 = hash3(x1, y1, z1);

    const nx00 = lerp(n000, n100, tx);
    const nx10 = lerp(n010, n110, tx);
    const nx01 = lerp(n001, n101, tx);
    const nx11 = lerp(n011, n111, tx);
    const nxy0 = lerp(nx00, nx10, ty);
    const nxy1 = lerp(nx01, nx11, ty);
    return lerp(nxy0, nxy1, tz);
  }

  function buildPixelField() {
    pixels = [];
    cols = Math.ceil(width / cell);
    rows = Math.ceil(height / cell);

    for (let r = 0; r < rows; r += 1) {
      const y = r * cell;
      for (let c = 0; c < cols; c += 1) {
        const x = c * cell;
        pixels.push({
          x,
          y,
          h: 0.1 + Math.random() * 0.8,
        });
      }
    }
  }

  function buildVecGrid() {
    vecGrid = [];
    const ledMaxX = cols * cell;
    const ledMaxY = rows * cell;
    const maxNeedX = ledMaxX + vecOff;
    const maxNeedY = ledMaxY + vecOff;

    const xs = [];
    let vx = -vecOff;
    while (vx < maxNeedX) {
      xs.push(vx);
      vx += vecStep;
    }
    xs.push(maxNeedX);

    const ys = [];
    let vy = -vecOff;
    while (vy < maxNeedY) {
      ys.push(vy);
      vy += vecStep;
    }
    ys.push(maxNeedY);

    for (let yi = 0; yi < ys.length; yi += 1) {
      const vy = ys[yi];
      for (let xi = 0; xi < xs.length; xi += 1) {
        const vx = xs[xi];
        vecGrid.push({
          x: vx,
          y: vy,
          dir: { x: dir.x * windStrength, y: dir.y * windStrength },
        });
      }
    }
    vecCols = xs.length;
    vecRows = ys.length;
    gridW = Math.max(1, vecCols - 1);
    gridH = Math.max(1, vecRows - 1);

    if (DEBUG_VEC && vecGrid.length > 0) {
      const sampleX = xs.filter((x) => x >= vecOff).slice(0, 3).map((x) => x / cell);
      const sampleY = ys.filter((y) => y >= vecOff).slice(0, 3).map((y) => y / cell);

      const hasHalf = (value) => {
        const frac = value % 1;
        return Math.abs(frac - 0.5) < 1e-9 || Math.abs(frac + 0.5) < 1e-9;
      };

      const sampleOk = sampleX.every(hasHalf) && sampleY.every(hasHalf);
      const minX = xs[0];
      const minY = ys[0];
      const maxX = xs[xs.length - 1];
      const maxY = ys[ys.length - 1];
      const boundsOk = (
        minX <= -vecOff &&
        minY <= -vecOff &&
        maxX >= ledMaxX + vecOff &&
        maxY >= ledMaxY + vecOff
      );

      console.log('[vec] sample x/cell:', sampleX, 'y/cell:', sampleY, 'allHalf:', sampleOk);
      console.log('[vec] bounds:', {
        minX,
        minY,
        maxX,
        maxY,
        ledMinX: 0,
        ledMinY: 0,
        ledMaxX,
        ledMaxY,
        minNeededX: -vecOff,
        minNeededY: -vecOff,
        maxNeededX: ledMaxX + vecOff,
        maxNeededY: ledMaxY + vecOff,
        extendsOutside: boundsOk,
      });
    }
  }

  function draw() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    for (let index = 0; index < pixels.length; index += 1) {
      const pixel = pixels[index];
      const h = Math.max(0, Math.min(1, pixel.h));
      const g = Math.round(h * 255);
      ctx.fillStyle = `rgb(${g}, ${g}, ${g})`;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (DEBUG_VEC) {
      ctx.strokeStyle = '#00ffff';
      for (let index = 0; index < vecGrid.length; index += 1) {
        const vec = vecGrid[index];
        ctx.beginPath();
        ctx.moveTo(vec.x, vec.y);
        ctx.lineTo(vec.x + vec.dir.x * vecLen, vec.y + vec.dir.y * vecLen);
        ctx.stroke();
      }
    }
  }

  function wrapI(i, n) {
    return (i % n + n) % n;
  }

  function sampleVec(x, y) {
    const fx = (x + vecOff) / vecStep;
    const fy = (y + vecOff) / vecStep;
    const ix0f = Math.floor(fx);
    const iy0f = Math.floor(fy);
    const tx = fx - ix0f;
    const ty = fy - iy0f;
    const ix0 = wrapI(ix0f, gridW);
    const iy0 = wrapI(iy0f, gridH);
    const ix1 = (ix0 + 1) % gridW;
    const iy1 = (iy0 + 1) % gridH;

    const v00 = vecGrid[iy0 * vecCols + ix0].dir;
    const v10 = vecGrid[iy0 * vecCols + ix1].dir;
    const v01 = vecGrid[iy1 * vecCols + ix0].dir;
    const v11 = vecGrid[iy1 * vecCols + ix1].dir;

    const vx0 = v00.x + (v10.x - v00.x) * tx;
    const vx1 = v01.x + (v11.x - v01.x) * tx;
    const vy0 = v00.y + (v10.y - v00.y) * tx;
    const vy1 = v01.y + (v11.y - v01.y) * tx;

    return {
      x: vx0 + (vx1 - vx0) * ty,
      y: vy0 + (vy1 - vy0) * ty,
    };
  }

  function stepLed() {
    const curr = pixels;
    const vBuf = new Array(curr.length);
    const qBuf = new Array(curr.length);
    const tBuf = new Array(curr.length);

    // PHASE 1 — local vectors
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * cols + x;
        const px = x * cell;
        const py = y * cell;
        vBuf[i] = sampleVec(px, py);
      }
    }

    // PHASE 2 — transfer amount
    for (let i = 0; i < curr.length; i += 1) {
      qBuf[i] = transfer * curr[i].h;
    }

    // PHASE 3 — landing positions
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * cols + x;
        const px = x * cell;
        const py = y * cell;
        const hPrev = curr[i].h;
        const v = vBuf[i];
        const m = Math.hypot(v.x, v.y);
        const nx = m ? v.x / m : 0;
        const ny = m ? v.y / m : 0;
        const L = m + transfer * hPrev;
        const tx = px + nx * L;
        const ty = py + ny * L;
        const tc = wrapI(Math.round(tx / cell), cols);
        const tr = wrapI(Math.round(ty / cell), rows);
        tBuf[i] = tr * cols + tc;
      }
    }

    // PHASE 4 — apply transfers
    const next = new Array(curr.length);
    for (let i = 0; i < curr.length; i += 1) {
      const p = curr[i];
      next[i] = { x: p.x, y: p.y, h: p.h };
    }
    for (let i = 0; i < curr.length; i += 1) {
      const q = qBuf[i];
      next[i].h -= q;
      next[tBuf[i]].h += q;
    }

    // PHASE 4.5 — pixel smoothing
    const sBuf = new Array(curr.length);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * cols + x;
        const l = y * cols + wrapI(x - 1, cols);
        const r = y * cols + wrapI(x + 1, cols);
        const u = wrapI(y - 1, rows) * cols + x;
        const d = wrapI(y + 1, rows) * cols + x;
        const hSelf = next[i].h;
        const hMean = (next[l].h + next[r].h + next[u].h + next[d].h) * 0.25;
        sBuf[i] = (1 - pixelSmooth) * hSelf + pixelSmooth * hMean;
      }
    }
    for (let i = 0; i < curr.length; i += 1) {
      next[i].h = sBuf[i];
    }

    // PHASE 5 — finalize
    pixels = next;
  }

  function stepSim() {
    simTime += turb;

    const next = new Array(vecGrid.length);

    for (let yi = 1; yi < vecRows - 1; yi += 1) {
      for (let xi = 1; xi < vecCols - 1; xi += 1) {
        const base = vecGrid[yi * vecCols + xi];
        const nAng = noise3(
          base.x * noiseScale,
          base.y * noiseScale,
          simTime
        ) * TWO_PI;
        const nx = Math.cos(nAng);
        const ny = Math.sin(nAng);
        let vx = dir.x * (1 - noiseInf) + nx * noiseInf;
        let vy = dir.y * (1 - noiseInf) + ny * noiseInf;
        const m = Math.hypot(vx, vy) || 1;
        vx /= m;
        vy /= m;
        vx *= windStrength;
        vy *= windStrength;
        next[yi * vecCols + xi] = { x: vx, y: vy };
      }
    }

    for (let yi = 1; yi < vecRows - 1; yi += 1) {
      for (let xi = 1; xi < vecCols - 1; xi += 1) {
        const i = yi * vecCols + xi;
        const v = next[i] || vecGrid[i].dir;
        const l = next[i - 1] || vecGrid[i - 1].dir;
        const r = next[i + 1] || vecGrid[i + 1].dir;
        const u = next[(yi - 1) * vecCols + xi] || vecGrid[(yi - 1) * vecCols + xi].dir;
        const d = next[(yi + 1) * vecCols + xi] || vecGrid[(yi + 1) * vecCols + xi].dir;
        const ax = (l.x + r.x + u.x + d.x) * 0.25;
        const ay = (l.y + r.y + u.y + d.y) * 0.25;
        let vx = (1 - smooth) * v.x + smooth * ax;
        let vy = (1 - smooth) * v.y + smooth * ay;
        const vm = Math.hypot(vx, vy) || 1;
        const vxn = vx / vm;
        const vyn = vy / vm;
        const lm = Math.hypot(l.x, l.y) || 1;
        const lx = l.x / lm;
        const ly = l.y / lm;
        const rm = Math.hypot(r.x, r.y) || 1;
        const rx = r.x / rm;
        const ry = r.y / rm;
        const um = Math.hypot(u.x, u.y) || 1;
        const ux = u.x / um;
        const uy = u.y / um;
        const dm = Math.hypot(d.x, d.y) || 1;
        const dx = d.x / dm;
        const dy = d.y / dm;
        const align = (
          vxn * lx + vyn * ly +
          vxn * rx + vyn * ry +
          vxn * ux + vyn * uy +
          vxn * dx + vyn * dy
        ) * 0.25;
        let strength = windStrength * (1 + coherenceFactor * align);
        strength = Math.max(0.1, strength);
        const m = Math.hypot(vx, vy) || 1;
        vx = (vx / m) * strength;
        vy = (vy / m) * strength;
        next[i] = { x: vx, y: vy };
      }
    }

    for (let yi = 1; yi < vecRows - 1; yi += 1) {
      next[yi * vecCols + 0] = next[yi * vecCols + (vecCols - 2)];
      next[yi * vecCols + (vecCols - 1)] = next[yi * vecCols + 1];
    }

    for (let xi = 0; xi < vecCols; xi += 1) {
      next[xi] = next[(vecRows - 2) * vecCols + xi];
      next[(vecRows - 1) * vecCols + xi] = next[vecCols + xi];
    }

    for (let i = 0; i < vecGrid.length; i += 1) {
      const v = next[i] || vecGrid[i].dir;
      vecGrid[i].dir.x = v.x;
      vecGrid[i].dir.y = v.y;
    }

    stepLed();
  }

  function tick() {
    if (!isRunning) {
      return;
    }

    stepSim();
    draw();
    animationFrameId = window.requestAnimationFrame(tick);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    buildPixelField();
    buildVecGrid();
    draw();
  }

  function start() {
    if (isRunning) {
      return;
    }
    isRunning = true;
    tick();
  }

  function pause() {
    isRunning = false;
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function destroy() {
    pause();
  }

  function setWindDirection(angleDeg) {
    if (!Number.isFinite(angleDeg)) {
      return;
    }
    const rad = (angleDeg * Math.PI) / 180;
    dir = {
      x: Math.cos(rad),
      y: Math.sin(rad),
    };
  }

  function setNoiseInfluence(value) {
    if (Number.isFinite(value)) {
      noiseInf = value;
    }
  }

  function setTurbulence(value) {
    if (Number.isFinite(value)) {
      turb = value;
    }
  }

  function setWindStrength(value) {
    if (Number.isFinite(value)) {
      windStrength = value;
    }
  }

  function setTransferRate(value) {
    if (Number.isFinite(value)) {
      transfer = value;
    }
  }

  function setPixelSmooth(value) {
    if (Number.isFinite(value)) {
      pixelSmooth = value;
    }
  }

  return {
    resize,
    start,
    pause,
    destroy,
    setWindDirection,
    setNoiseInfluence,
    setTurbulence,
    setWindStrength,
    setTransferRate,
    setPixelSmooth,
  };
}
