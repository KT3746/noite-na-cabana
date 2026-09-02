import { VERSION } from "./version.js?v=1.0.3";
import { RECIPES, HOTBAR, WEAPONS, canPay } from "./data.js?v=1.0.3";
import { MODE, PHASE } from "./game.js?v=1.0.3";

export function bindUI(game, audio) {
  const $ = (id) => document.getElementById(id);

  $("ver").textContent = `v${VERSION}`;
  $("best-menu").textContent = String(game.best);

  const blur = () => {
    try {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    } catch (_) { /* ok */ }
  };

  const safe = (fn) => (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (game.uiLock > 0 && e && e.type === "click") {
      /* ainda deixa Jogar de novo / Menu / Entendi / Começar passarem se o lock já passou */
    }
    try { audio.unlock(); } catch (_) { /* ok */ }
    try { fn(e); } catch (err) { console.error(err); }
    try { audio.ui(); } catch (_) { /* ok */ }
    blur();
    syncScreens(game);
  };

  $("btn-start").onclick = safe(() => {
    game.start();
  });
  $("btn-resume").onclick = safe(() => {
    game.setMode(MODE.PLAY);
  });
  $("btn-restart").onclick = safe(() => {
    game.restart();
  });
  $("btn-restart-over").onclick = safe(() => {
    game.restart();
  });
  $("btn-menu").onclick = safe(() => {
    game.goMenu();
  });
  $("btn-menu-over").onclick = safe(() => {
    game.goMenu();
  });
  $("btn-craft").onclick = safe(() => {
    if (game.mode !== MODE.PLAY || game.showTutorial) return;
    game.showCraft = !game.showCraft;
  });
  $("btn-craft-close").onclick = safe(() => {
    game.showCraft = false;
  });
  $("btn-pause").onclick = safe(() => {
    if (game.mode === MODE.PLAY) game.setMode(MODE.PAUSE);
    else if (game.mode === MODE.PAUSE) game.setMode(MODE.PLAY);
  });
  $("btn-noite").onclick = safe(() => game.skipToNight());
  $("btn-eat-hud").onclick = safe(() => game.eat());
  $("btn-mute").onclick = safe(() => {
    audio.unlock();
    const m = audio.toggleMute();
    $("btn-mute").textContent = m ? "Som off" : "Som on";
    $("btn-mute").classList.toggle("muted-icon", m);
  });
  $("btn-mute").textContent = audio.muted ? "Som off" : "Som on";
  $("btn-ok-tut").onclick = safe(() => {
    if (game.uiLock > 0) return;
    game.dismissTutorial();
  });

  const unlock = () => { try { audio.unlock(); } catch (_) {} };
  window.addEventListener("pointerdown", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });

  const craft = $("craft");
  const stop = (e) => e.stopPropagation();
  craft.addEventListener("pointerdown", stop);
  craft.addEventListener("pointerup", stop);
  craft.addEventListener("click", stop);
  craft.addEventListener("touchstart", stop, { passive: true });

  const recipes = $("recipes");
  recipes.innerHTML = "";
  for (const rec of RECIPES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "recipe";
    b.dataset.id = rec.id;
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (game.uiLock > 0 || game.mode !== MODE.PLAY) return;
      try { audio.unlock(); } catch (_) {}
      if (rec.tipo === "arma" && game.weapons[rec.id]) game.equip(rec.id);
      else game.craft(rec.id);
      try { audio.ui(); } catch (_) {}
    });
    recipes.appendChild(b);
  }

  const hot = $("hotbar");
  hot.innerHTML = "";
  HOTBAR.forEach((slot, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "slot";
    b.dataset.i = String(i);
    b.addEventListener("pointerdown", (e) => e.stopPropagation());
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (game.uiLock > 0) return;
      game.hot = i;
      if (i === 0) game.cycleWeapon();
      try { audio.ui(); } catch (_) {}
    });
    hot.appendChild(b);
  });

  return () => sync(game, audio);
}

function setInert(el, on) {
  if (!el) return;
  if (on) el.setAttribute("inert", "");
  else el.removeAttribute("inert");
}

function syncScreens(game) {
  const hide = (id, on) => {
    const el = document.getElementById(id);
    el.classList.toggle("hidden", !on);
    setInert(el, !on);
  };
  hide("screen-start", game.mode === MODE.MENU);
  hide("screen-pause", game.mode === MODE.PAUSE);
  hide("screen-tut", game.mode === MODE.PLAY && game.showTutorial);
  hide("screen-over", game.mode === MODE.OVER);
  hide("hud", game.mode === MODE.PLAY || game.mode === MODE.PAUSE);
  hide("craft", game.showCraft && game.mode === MODE.PLAY && !game.showTutorial);
  const coarse = matchMedia("(pointer: coarse)").matches || matchMedia("(max-width: 900px)").matches;
  const touchOn = game.mode === MODE.PLAY && !game.showTutorial && !game.showCraft && (coarse || window.innerWidth <= 900);
  hide("touch", touchOn);
  document.getElementById("app").classList.toggle("craft-open", !!(game.showCraft && game.mode === MODE.PLAY));
}

function sync(game, audio) {
  syncScreens(game);
  const $ = (id) => document.getElementById(id);
  $("ver").textContent = `v${VERSION}`;
  $("best-menu").textContent = String(game.best);
  $("btn-mute").textContent = audio.muted ? "Som off" : "Som on";

  if (game.mode === MODE.OVER) {
    const snap = game.overSnap || {};
    $("over-reason").textContent = snap.reason || (game.player.hp <= 0 ? "Você foi derrubado." : "A cabana foi destruída.");
    $("over-nights").textContent = String(snap.nights ?? game.nightsSurvived);
    $("over-best").textContent = String(game.best);
    $("over-kills").textContent = String(snap.kills ?? game.kills);
    const extra = $("over-extra");
    if (extra) extra.textContent = snap.detail || "";
  }

  if (game.mode !== MODE.PLAY && game.mode !== MODE.PAUSE) return;

  const nightNum = game.phase === PHASE.DAY || game.phase === PHASE.DAWN
    ? Math.max(1, game.nightsSurvived)
    : game.nightsSurvived + 1;
  const phaseName = {
    [PHASE.DAY]: "Dia",
    [PHASE.DUSK]: "Entardecer",
    [PHASE.NIGHT]: "Noite",
    [PHASE.DAWN]: "Amanhecer",
  }[game.phase];
  const t = Math.max(0, Math.ceil(game.phaseT));
  let phaseTxt = `${phaseName} ${nightNum || 1} · ${fmt(t)}`;
  if (game.phase === PHASE.NIGHT && game.wave > 0) phaseTxt += ` · onda ${game.wave}`;
  $("phase-chip").textContent = phaseTxt;
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

  $("btn-noite").classList.toggle("hidden", game.phase !== PHASE.DAY || game.showCraft);

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
      const html = `<span>${w.nome.split(" ")[0]}</span><small>arma</small>`;
      if (el.innerHTML !== html) el.innerHTML = html;
    } else {
      const meta = HOTBAR[i];
      const n = game.inv[meta.inv] || 0;
      const html = `<span>${meta.nome}</span><small>${n}</small>`;
      if (el.innerHTML !== html) el.innerHTML = html;
    }
  });

  for (const rec of RECIPES) {
    const el = document.querySelector(`#recipes .recipe[data-id="${rec.id}"]`);
    if (!el) continue;
    const custo = Object.entries(rec.custo)
      .map(([k, v]) => `${v} ${k}`)
      .join(" · ");
    const owned = rec.tipo === "arma" && game.weapons[rec.id];
    const html = `<strong>${rec.nome}${owned ? " ✓" : ""}</strong><span class="sub">${rec.desc} — ${custo}</span>`;
    if (el.dataset.html !== html) {
      el.innerHTML = html;
      el.dataset.html = html;
    }
    el.disabled = owned ? false : !canPay(game.inv, rec.custo);
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
