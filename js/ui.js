import { VERSION } from "./version.js?v=1.0.1";
import { RECIPES, HOTBAR, WEAPONS, canPay } from "./data.js?v=1.0.1";
import { MODE, PHASE } from "./game.js?v=1.0.1";

export function bindUI(game, audio) {
  const $ = (id) => document.getElementById(id);

  $("ver").textContent = `v${VERSION}`;
  $("best-menu").textContent = String(game.best);

  $("btn-start").onclick = () => {
    audio.unlock();
    audio.ui();
    game.start();
    syncScreens(game);
  };
  $("btn-resume").onclick = () => {
    game.mode = MODE.PLAY;
    audio.ui();
  };
  $("btn-restart").onclick = () => {
    audio.unlock();
    audio.ui();
    game.restart();
  };
  $("btn-restart-over").onclick = () => {
    audio.unlock();
    audio.ui();
    game.restart();
  };
  $("btn-menu").onclick = () => {
    game.mode = MODE.MENU;
    audio.ui();
    game.loadBest();
  };
  $("btn-menu-over").onclick = () => {
    game.mode = MODE.MENU;
    audio.ui();
    game.loadBest();
  };
  $("btn-craft").onclick = () => {
    game.showCraft = !game.showCraft;
    audio.ui();
  };
  $("btn-craft-close").onclick = () => {
    game.showCraft = false;
    audio.ui();
  };
  $("btn-pause").onclick = () => {
    if (game.mode === MODE.PLAY) game.mode = MODE.PAUSE;
    else if (game.mode === MODE.PAUSE) game.mode = MODE.PLAY;
    audio.ui();
  };
  $("btn-noite").onclick = () => game.skipToNight();
  $("btn-eat-hud").onclick = () => game.eat();
  $("btn-mute").onclick = () => {
    audio.unlock();
    const m = audio.toggleMute();
    $("btn-mute").textContent = m ? "Som off" : "Som on";
    $("btn-mute").classList.toggle("muted-icon", m);
  };
  $("btn-mute").textContent = audio.muted ? "Som off" : "Som on";
  $("btn-ok-tut").onclick = () => {
    audio.unlock();
    audio.ui();
    game.dismissTutorial();
  };

  const unlock = () => audio.unlock();
  window.addEventListener("pointerdown", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });

  const recipes = $("recipes");
  recipes.innerHTML = "";
  for (const rec of RECIPES) {
    const b = document.createElement("button");
    b.className = "recipe";
    b.dataset.id = rec.id;
    b.onclick = () => game.craft(rec.id);
    recipes.appendChild(b);
  }

  const hot = $("hotbar");
  hot.innerHTML = "";
  HOTBAR.forEach((slot, i) => {
    const b = document.createElement("button");
    b.className = "slot";
    b.dataset.i = String(i);
    b.onclick = () => {
      game.hot = i;
      audio.ui();
    };
    hot.appendChild(b);
  });

  return () => sync(game, audio);
}

function syncScreens(game) {
  const hide = (id, on) => document.getElementById(id).classList.toggle("hidden", !on);
  hide("screen-start", game.mode === MODE.MENU);
  hide("screen-pause", game.mode === MODE.PAUSE);
  hide("screen-over", game.mode === MODE.OVER);
  hide("screen-tut", game.mode === MODE.PLAY && game.showTutorial);
  hide("hud", game.mode === MODE.PLAY || game.mode === MODE.PAUSE);
  hide("craft", game.showCraft && game.mode === MODE.PLAY);
  const coarse = matchMedia("(pointer: coarse)").matches || matchMedia("(max-width: 900px)").matches;
  hide("touch", (game.mode === MODE.PLAY) && (coarse || window.innerWidth <= 900));
}

function sync(game, audio) {
  syncScreens(game);
  const $ = (id) => document.getElementById(id);
  $("ver").textContent = `v${VERSION}`;
  $("best-menu").textContent = String(game.best);
  $("btn-mute").textContent = audio.muted ? "Som off" : "Som on";

  if (game.mode === MODE.OVER) {
    const reason = game.player.hp <= 0 ? "Você foi derrubado." : "A cabana foi destruída.";
    $("over-reason").textContent = reason;
    $("over-nights").textContent = String(game.nightsSurvived);
    $("over-best").textContent = String(game.best);
    $("over-kills").textContent = String(game.kills);
  }

  if (game.mode !== MODE.PLAY && game.mode !== MODE.PAUSE) return;

  const nightNum = game.phase === PHASE.DAY || game.phase === PHASE.DAWN
    ? game.nightsSurvived
    : game.nightsSurvived + 1;
  const phaseName = {
    [PHASE.DAY]: "Dia",
    [PHASE.DUSK]: "Entardecer",
    [PHASE.NIGHT]: "Noite",
    [PHASE.DAWN]: "Amanhecer",
  }[game.phase];
  const t = Math.max(0, Math.ceil(game.phaseT));
  $("phase-chip").textContent = `${phaseName} ${nightNum || 1} · ${fmt(t)}`;
  $("phase-chip").className = "chip " + (game.nightLight > 0.45 ? "phase-night" : "phase-day");

  setBar("hp-bar", game.player.hp / game.player.maxHp);
  setBar("cabin-bar", game.world.cabin.hp / game.world.cabin.maxHp);
  $("hp-txt").textContent = `${Math.ceil(game.player.hp)}`;
  $("cabin-txt").textContent = `${Math.ceil(game.world.cabin.hp)}`;

  $("res-madeira").textContent = game.inv.madeira;
  $("res-pedra").textContent = game.inv.pedra;
  $("res-comida").textContent = game.inv.comida;
  $("res-ferro").textContent = game.inv.ferro;
  $("res-sementes").textContent = game.inv.sementes;

  $("btn-noite").classList.toggle("hidden", game.phase !== PHASE.DAY);

  const banner = $("banner");
  banner.classList.toggle("hidden", game.bannerT <= 0);
  banner.textContent = game.banner;

  const toasts = $("toasts");
  toasts.innerHTML = game.toasts.map((t) => `<div class="toast">${esc(t.msg)}</div>`).join("");

  const slots = document.querySelectorAll("#hotbar .slot");
  slots.forEach((el, i) => {
    el.classList.toggle("on", game.hot === i);
    if (i === 0) {
      const w = WEAPONS[game.equipped];
      el.innerHTML = `<span>${w.nome.split(" ")[0]}</span><small>arma</small>`;
      el.onclick = () => {
        game.hot = 0;
        game.cycleWeapon();
        audio.ui();
      };
    } else {
      const meta = HOTBAR[i];
      const n = game.inv[meta.inv] || 0;
      el.innerHTML = `<span>${meta.nome}</span><small>${n}</small>`;
    }
  });

  for (const rec of RECIPES) {
    const el = document.querySelector(`#recipes .recipe[data-id="${rec.id}"]`);
    if (!el) continue;
    const custo = Object.entries(rec.custo)
      .map(([k, v]) => `${v} ${k}`)
      .join(" · ");
    const owned = rec.tipo === "arma" && game.weapons[rec.id];
    el.innerHTML = `<strong>${rec.nome}${owned ? " ✓" : ""}</strong><span class="sub">${rec.desc} — ${custo}</span>`;
    el.disabled = owned ? false : !canPay(game.inv, rec.custo);
    if (owned) {
      el.onclick = () => game.equip(rec.id);
    } else {
      el.onclick = () => game.craft(rec.id);
    }
  }
}

function setBar(id, ratio) {
  const el = document.getElementById(id);
  el.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
}

function fmt(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}
