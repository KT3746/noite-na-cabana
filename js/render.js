import { TILE, hash2, lerp, WEAPONS } from "./data.js?v=1.0.1";
import { T } from "./world.js?v=1.0.1";
import { MODE } from "./game.js?v=1.0.1";

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.game = game;
    this.light = document.createElement("canvas");
    this.lctx = this.light.getContext("2d");
    this.t = 0;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.light.width = this.canvas.width;
    this.light.height = this.canvas.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.game.viewW = w;
    this.game.viewH = h;
  }

  draw(dt = 0.016) {
    this.t += dt;
    const g = this.game;
    const ctx = this.ctx;
    const w = g.viewW;
    const h = g.viewH;
    ctx.clearRect(0, 0, w, h);

    let sx = 0;
    let sy = 0;
    if (g.shake > 0) {
      sx = (Math.random() - 0.5) * g.shake;
      sy = (Math.random() - 0.5) * g.shake;
    }

    ctx.save();
    ctx.translate(-g.cam.x + sx, -g.cam.y + sy);
    this._world();
    this._plots();
    this._resources();
    this._buildings();
    this._cabin();
    ctx.restore();

    this._lighting(sx, sy);

    ctx.save();
    ctx.translate(-g.cam.x + sx, -g.cam.y + sy);
    this._zombies();
    this._player();
    this._arrows();
    this._particles();
    this._floaters();
    ctx.restore();

    if (g.flash > 0) {
      ctx.fillStyle = `rgba(180,20,20,${g.flash * 0.35})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (g.mode === MODE.MENU) this._menuBackdrop();
  }

  _world() {
    const { world, cam, viewW, viewH } = this.game;
    const ctx = this.ctx;
    const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
    const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
    const x1 = Math.min(world.cols - 1, Math.floor((cam.x + viewW) / TILE) + 1);
    const y1 = Math.min(world.rows - 1, Math.floor((cam.y + viewH) / TILE) + 1);

    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = world.at(tx, ty);
        const x = tx * TILE;
        const y = ty * TILE;
        const n = hash2(tx, ty);
        if (t === T.WATER) {
          const wob = Math.sin(this.t * 2 + tx * 0.4 + ty * 0.3) * 6;
          ctx.fillStyle = `rgb(${30 + wob},${80 + n * 20},${110 + n * 30})`;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = "rgba(180,220,230,0.15)";
          ctx.fillRect(x + 6, y + 8 + Math.sin(this.t + tx) * 2, 10, 3);
        } else if (t === T.DIRT) {
          ctx.fillStyle = n > 0.5 ? "#7a5a3a" : "#6d5134";
          ctx.fillRect(x, y, TILE, TILE);
        } else if (t === T.SOIL) {
          ctx.fillStyle = "#5a3d24";
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = "#3d2918";
          ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
        } else if (t === T.FLOOR) {
          ctx.fillStyle = "#8b5e3c";
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = "#7a4e30";
          ctx.fillRect(x + 1, y + 14, TILE - 2, 2);
        } else if (t === T.WALL || t === T.DOOR) {
          ctx.fillStyle = "#4a3324";
          ctx.fillRect(x, y, TILE, TILE);
        } else {
          const g1 = 92 + n * 28;
          ctx.fillStyle = `rgb(${48 + n * 16},${g1},${42 + n * 14})`;
          ctx.fillRect(x, y, TILE, TILE);
          if (n > 0.86) {
            ctx.fillStyle = n > 0.93 ? "#d4a0c0" : "#e8d36a";
            ctx.beginPath();
            ctx.arc(x + 8 + n * 16, y + 10 + n * 12, 1.6, 0, 7);
            ctx.fill();
          }
        }
      }
    }
  }

  _plots() {
    const ctx = this.ctx;
    for (const p of this.game.world.plots) {
      const x = p.tx * TILE;
      const y = p.ty * TILE;
      if (p.state === "growing") {
        ctx.fillStyle = "#6aa84f";
        const h = 6 + p.grow * 10;
        ctx.fillRect(x + 13, y + 20 - h, 5, h);
        ctx.fillRect(x + 8, y + 22 - h * 0.7, 4, h * 0.7);
      } else if (p.state === "ready") {
        ctx.fillStyle = "#4c8c38";
        ctx.beginPath();
        ctx.ellipse(x + 16, y + 18, 10, 8, 0, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#e07a5f";
        ctx.fillRect(x + 12, y + 12, 4, 4);
        ctx.fillRect(x + 18, y + 16, 4, 4);
      }
    }
  }

  _resources() {
    const ctx = this.ctx;
    for (const t of this.game.world.trees) {
      if (t.stump) {
        ctx.fillStyle = "#5c4030";
        ctx.beginPath();
        ctx.ellipse(t.x, t.y + 4, 8, 5, 0, 0, 7);
        ctx.fill();
        continue;
      }
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(t.x, t.y + 10, 12, 5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(t.x - 4, t.y - 4, 8, 14);
      ctx.fillStyle = "#2f6b32";
      blob(ctx, t.x, t.y - 14, 16);
      ctx.fillStyle = "#3d8b40";
      blob(ctx, t.x - 6, t.y - 10, 11);
      ctx.fillStyle = "#6bb36a";
      blob(ctx, t.x + 5, t.y - 16, 8);
    }
    for (const r of this.game.world.rocks) {
      if (r.gone) continue;
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.beginPath();
      ctx.ellipse(r.x, r.y + 6, 11, 5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#8d97a1";
      ctx.beginPath();
      ctx.moveTo(r.x - 12, r.y + 6);
      ctx.lineTo(r.x - 6, r.y - 8);
      ctx.lineTo(r.x + 8, r.y - 6);
      ctx.lineTo(r.x + 12, r.y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#b0b8c0";
      ctx.fillRect(r.x - 2, r.y - 4, 6, 4);
    }
    for (const v of this.game.world.veins) {
      if (v.gone) continue;
      ctx.fillStyle = "#5d6670";
      ctx.beginPath();
      ctx.moveTo(v.x - 13, v.y + 7);
      ctx.lineTo(v.x - 4, v.y - 10);
      ctx.lineTo(v.x + 10, v.y - 7);
      ctx.lineTo(v.x + 13, v.y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c5d0d8";
      ctx.fillRect(v.x - 3, v.y - 2, 5, 5);
      ctx.fillRect(v.x + 3, v.y + 1, 4, 4);
    }
  }

  _buildings() {
    const ctx = this.ctx;
    for (const f of this.game.world.fences) {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(f.x - 12, f.y - 8, 6, 18);
      ctx.fillRect(f.x + 6, f.y - 8, 6, 18);
      ctx.fillRect(f.x - 14, f.y - 4, 28, 5);
      ctx.fillRect(f.x - 14, f.y + 4, 28, 5);
      if (f.hp < f.max * 0.4) {
        ctx.fillStyle = "#3a2414";
        ctx.fillRect(f.x - 2, f.y - 6, 3, 14);
      }
    }
    for (const t of this.game.world.torches) {
      ctx.fillStyle = "#5c4030";
      ctx.fillRect(t.x - 2, t.y - 4, 4, 14);
      const flick = 0.7 + Math.sin(this.t * 12 + t.x) * 0.3;
      ctx.fillStyle = `rgba(255,160,40,${0.35 * flick})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y - 8, 10, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#ffcc66";
      ctx.beginPath();
      ctx.arc(t.x, t.y - 8, 4, 0, 7);
      ctx.fill();
    }
    for (const t of this.game.world.traps) {
      ctx.fillStyle = "#4a3324";
      ctx.fillRect(t.x - 12, t.y - 8, 24, 16);
      ctx.fillStyle = "#c4a574";
      ctx.beginPath();
      ctx.moveTo(t.x - 8, t.y + 6);
      ctx.lineTo(t.x - 5, t.y - 8);
      ctx.lineTo(t.x - 2, t.y + 6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(t.x + 2, t.y + 6);
      ctx.lineTo(t.x + 6, t.y - 9);
      ctx.lineTo(t.x + 9, t.y + 6);
      ctx.fill();
    }
  }

  _cabin() {
    const c = this.game.world.cabin;
    const ctx = this.ctx;
    const x = c.tx * TILE;
    const y = c.ty * TILE;
    const night = this.game.nightLight;

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(x + 80, y + 168, 70, 16, 0, 0, 7);
    ctx.fill();

    ctx.fillStyle = "#6b4423";
    ctx.fillRect(x, y + 24, 160, 136);
    ctx.fillStyle = "#5a3820";
    ctx.fillRect(x + 6, y + 30, 148, 124);

    ctx.fillStyle = "#7a2f24";
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 36);
    ctx.lineTo(x + 80, y - 18);
    ctx.lineTo(x + 170, y + 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8d3b2e";
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 32);
    ctx.lineTo(x + 80, y - 8);
    ctx.lineTo(x + 152, y + 32);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4a3324";
    ctx.fillRect(x + 118, y - 8, 16, 28);

    const door = "#3d2918";
    ctx.fillStyle = door;
    ctx.fillRect(x + 64, y + 108, 32, 52);
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(x + 88, y + 132, 4, 4);

    ctx.fillStyle = lerpColor("#5d4037", "#ffe082", night * 0.9);
    ctx.fillRect(x + 22, y + 56, 26, 22);
    ctx.fillRect(x + 112, y + 56, 26, 22);
    ctx.strokeStyle = "#3d2918";
    ctx.strokeRect(x + 22, y + 56, 26, 22);
    ctx.strokeRect(x + 112, y + 56, 26, 22);

    const ratio = clamp01(c.hp / c.maxHp);
    ctx.fillStyle = "#00000066";
    ctx.fillRect(x + 20, y + 8, 120, 7);
    ctx.fillStyle = ratio > 0.35 ? "#f2cc8f" : "#e85d4c";
    ctx.fillRect(x + 20, y + 8, 120 * ratio, 7);
  }

  _player() {
    const p = this.game.player;
    const ctx = this.ctx;
    const bob = Math.sin(p.walk * 2) * 1.5;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.hurt > 0) ctx.globalAlpha = 0.55 + Math.sin(this.t * 40) * 0.2;

    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 8, 3.5, 0, 0, 7);
    ctx.fill();

    ctx.fillStyle = "#3e6b6a";
    ctx.fillRect(-9, -6 + bob, 18, 14);
    ctx.fillStyle = "#4a3728";
    ctx.fillRect(-8, 7 + bob, 6, 8);
    ctx.fillRect(2, 7 + bob, 6, 8);
    ctx.fillStyle = "#f0c8a0";
    ctx.fillRect(-7, -16 + bob, 14, 11);
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(-9, -20 + bob, 18, 6);
    ctx.fillRect(-11, -16 + bob, 5, 5);

    if (p.swinging > 0) {
      const w = WEAPONS[this.game.equipped];
      ctx.save();
      ctx.rotate((p.aim || p.facing) + 0.6 - p.swinging * 4);
      ctx.fillStyle = "#c4a574";
      ctx.fillRect(6, -2, w.id === "lanca" ? 28 : 18, 4);
      ctx.restore();
    } else if (this.game.equipped === "arco") {
      ctx.save();
      ctx.rotate(p.aim || p.facing);
      ctx.strokeStyle = "#6b4423";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, 7, -1.2, 1.2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  _zombies() {
    const ctx = this.ctx;
    for (const z of this.game.zombies) {
      const brute = z.kind === "bruto";
      const run = z.kind === "corredor";
      const bob = Math.sin(z.walk * 2) * 1.4;
      const w = brute ? 26 : run ? 18 : 20;
      const h = brute ? 30 : 24;
      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.filter = "none";
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 12, w * 0.55, 5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#f8ffe8";
      ctx.fillRect(-w / 2 - 3, -h / 2 - 4 + bob, w + 6, h + 8);
      ctx.fillStyle = brute ? "#8fb85a" : run ? "#c6e878" : "#a8d45c";
      ctx.fillRect(-w / 2, -h / 2 + bob, w, h);
      ctx.fillStyle = "#d7f29a";
      ctx.fillRect(-w / 2 + 2, -h / 2 + 2 + bob, w - 4, 10);
      ctx.fillStyle = "#ffef9a";
      ctx.fillRect(-5, -h / 2 - 2 + bob, 10, 5);
      ctx.fillStyle = "#ff3b30";
      ctx.fillRect(-6, -h / 2 + 5 + bob, 5, 5);
      ctx.fillRect(2, -h / 2 + 5 + bob, 5, 5);
      ctx.fillStyle = "#1a1208";
      ctx.fillRect(-5, -h / 2 + 7 + bob, 2, 2);
      ctx.fillRect(3, -h / 2 + 7 + bob, 2, 2);
      if (z.hurt > 0) {
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#fff";
        ctx.fillRect(-w / 2, -h / 2 + bob, w, h);
      }
      ctx.restore();
    }
  }

  _arrows() {
    const ctx = this.ctx;
    ctx.strokeStyle = "#5c4030";
    ctx.lineWidth = 2;
    for (const a of this.game.arrows) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x - a.vx * 0.04, a.y - a.vy * 0.04);
      ctx.stroke();
    }
  }

  _particles() {
    const ctx = this.ctx;
    for (const p of this.game.particles) {
      ctx.globalAlpha = clamp01(p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  _floaters() {
    const ctx = this.ctx;
    ctx.font = "800 13px Nunito, sans-serif";
    ctx.textAlign = "center";
    for (const f of this.game.floaters) {
      ctx.globalAlpha = clamp01(f.t);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  _lighting(sx, sy) {
    const g = this.game;
    const amt = g.nightLight;
    if (amt < 0.02) return;
    const ctx = this.lctx;
    const w = g.viewW;
    const h = g.viewH;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.light.width, this.light.height);
    const dpr = this.canvas.width / w;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgba(6, 10, 28, ${0.58 * amt})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
    const lights = [];
    lights.push({ x: g.player.x, y: g.player.y, r: 168, p: 0.88 });
    const c = g.world.cabin;
    lights.push({ x: c.x, y: c.y + 10, r: 175, p: 0.9 });
    for (const t of g.world.torches) lights.push({ x: t.x, y: t.y, r: 140, p: 0.96 });
    for (const z of g.zombies) lights.push({ x: z.x, y: z.y, r: 52, p: 0.7 });

    for (const L of lights) {
      const gx = L.x - g.cam.x + sx;
      const gy = L.y - g.cam.y + sy;
      const rad = ctx.createRadialGradient(gx, gy, 6, gx, gy, L.r);
      rad.addColorStop(0, `rgba(255,255,255,${L.p})`);
      rad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.arc(gx, gy, L.r, 0, 7);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    this.ctx.drawImage(this.light, 0, 0, w, h);
  }

  _menuBackdrop() {
    const ctx = this.ctx;
    const w = this.game.viewW;
    const h = this.game.viewH;
    ctx.fillStyle = "rgba(8,10,16,0.28)";
    ctx.fillRect(0, 0, w, h);
  }
}

function blob(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 7);
  ctx.fill();
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function lerpColor(a, b, t) {
  t = clamp01(t);
  const pa = hex(a);
  const pb = hex(b);
  const r = (lerp(pa[0], pb[0], t)) | 0;
  const g = (lerp(pa[1], pb[1], t)) | 0;
  const bl = (lerp(pa[2], pb[2], t)) | 0;
  return `rgb(${r},${g},${bl})`;
}

function hex(h) {
  const n = h.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
