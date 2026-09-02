/**
 * Teclado, mouse e toque (joystick + botões).
 */
export class Input {
  constructor() {
    this.moveX = 0;
    this.moveY = 0;
    this.aimX = 0;
    this.aimY = 0;
    this.screenX = 0;
    this.screenY = 0;
    this.worldX = 0;
    this.worldY = 0;
    this.hasPointer = false;
    this.pointerDown = false;
    this.attackHeld = false;
    this.attackPressed = false;
    this.actionHeld = false;
    this.actionPressed = false;
    this.eatPressed = false;
    this.craftPressed = false;
    this.pausePressed = false;
    this.skipPressed = false;
    this.hotbarKey = -1;

    this._keys = new Set();
    this._just = new Set();
    this._stick = { active: false, x: 0, y: 0, id: null };
    this._atkBtn = false;
    this._actBtn = false;
    this.touchEnabled = false;

    window.addEventListener("keydown", (e) => this._down(e));
    window.addEventListener("keyup", (e) => this._up(e));

    const canvas = () => document.getElementById("game");
    const onPtr = (e) => {
      const c = canvas();
      if (!c) return;
      const r = c.getBoundingClientRect();
      this.screenX = e.clientX - r.left;
      this.screenY = e.clientY - r.top;
      this.hasPointer = true;
    };
    window.addEventListener("pointermove", onPtr);
    window.addEventListener("pointerdown", (e) => {
      onPtr(e);
      if (e.target && e.target.id === "game") {
        this.pointerDown = true;
        this.actionPressed = true;
        this.actionHeld = true;
      }
    });
    window.addEventListener("pointerup", () => {
      this.pointerDown = false;
      this.actionHeld = this._actBtn || this._keys.has("KeyE");
    });
    window.addEventListener("contextmenu", (e) => {
      if (e.target && (e.target.id === "game" || e.target.closest(".touch"))) e.preventDefault();
    });

    this._bindTouch();
  }

  _down(e) {
    if (e.repeat) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    this._keys.add(e.code);
    this._just.add(e.code);
    if (e.code === "Space") this.attackPressed = true;
    if (e.code === "KeyE") this.actionPressed = true;
    if (e.code === "KeyC") this.craftPressed = true;
    if (e.code === "KeyF" || e.code === "KeyQ") this.eatPressed = true;
    if (e.code === "Escape" || e.code === "KeyP") this.pausePressed = true;
    if (e.code === "KeyN") this.skipPressed = true;
    const nums = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"];
    const i = nums.indexOf(e.code);
    if (i >= 0) this.hotbarKey = i;
  }

  _up(e) {
    this._keys.delete(e.code);
  }

  _bindTouch() {
    const stick = document.getElementById("stick");
    const knob = document.getElementById("stick-knob");
    if (!stick) return;

    const setFrom = (clientX, clientY) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = r.width * 0.38;
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      this._stick.x = dx / max;
      this._stick.y = dy / max;
      if (knob) {
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };

    const endStick = () => {
      this._stick.active = false;
      this._stick.x = 0;
      this._stick.y = 0;
      this._stick.id = null;
      if (knob) knob.style.transform = "translate(0,0)";
    };

    stick.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      stick.setPointerCapture(e.pointerId);
      this._stick.active = true;
      this._stick.id = e.pointerId;
      this.touchEnabled = true;
      setFrom(e.clientX, e.clientY);
    });
    stick.addEventListener("pointermove", (e) => {
      if (!this._stick.active || e.pointerId !== this._stick.id) return;
      setFrom(e.clientX, e.clientY);
    });
    stick.addEventListener("pointerup", endStick);
    stick.addEventListener("pointercancel", endStick);

    const hold = (id, propHeld, propPress) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => {
        e.preventDefault();
        this.touchEnabled = true;
        this[propHeld] = true;
        if (propPress) this[propPress] = true;
        if (id === "btn-atk") this._atkBtn = true;
        if (id === "btn-act") this._actBtn = true;
      };
      const end = () => {
        this[propHeld] = false;
        if (id === "btn-atk") this._atkBtn = false;
        if (id === "btn-act") this._actBtn = false;
      };
      el.addEventListener("pointerdown", start);
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      el.addEventListener("pointerleave", end);
    };
    hold("btn-atk", "attackHeld", "attackPressed");
    hold("btn-act", "actionHeld", "actionPressed");

    const tap = (id, prop) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.touchEnabled = true;
        this[prop] = true;
      });
    };
    tap("btn-eat", "eatPressed");
    tap("btn-pause-touch", "pausePressed");
    tap("btn-noite-touch", "skipPressed");
  }

  update() {
    let kx = 0;
    let ky = 0;
    if (this._keys.has("KeyA") || this._keys.has("ArrowLeft")) kx -= 1;
    if (this._keys.has("KeyD") || this._keys.has("ArrowRight")) kx += 1;
    if (this._keys.has("KeyW") || this._keys.has("ArrowUp")) ky -= 1;
    if (this._keys.has("KeyS") || this._keys.has("ArrowDown")) ky += 1;
    if (this._stick.active) {
      this.moveX = this._stick.x;
      this.moveY = this._stick.y;
    } else {
      const len = Math.hypot(kx, ky) || 1;
      this.moveX = kx / len;
      this.moveY = ky / len;
    }
    this.attackHeld = this._atkBtn || this._keys.has("Space");
    this.actionHeld = this._actBtn || this._keys.has("KeyE") || this.pointerDown;
  }

  consumePresses() {
    this.attackPressed = false;
    this.actionPressed = false;
    this.eatPressed = false;
    this.craftPressed = false;
    this.pausePressed = false;
    this.skipPressed = false;
    this.hotbarKey = -1;
    this._just.clear();
  }
}
