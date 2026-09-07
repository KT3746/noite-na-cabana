/**
 * Confirma o contrato do contador de kills (v1.0.5):
 * - morte no sol conta 1 vez
 * - zumbi já morto não toma dano nem gera kill extra
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(new URL("./strip-query-hooks.mjs", import.meta.url));

globalThis.localStorage = {
  getItem() {
    return null;
  },
  setItem() {},
};

const { Game } = await import("../js/game.js");

const silentAudio = {
  setNight() {},
  hit() {},
  trap() {},
  groan() {},
  swing() {},
  shoot() {},
  hurt() {},
  cabin() {},
  ui() {},
};

function game() {
  const g = new Game(silentAudio);
  g.kills = 0;
  g.zombies = [];
  g.arrows = [];
  g.world.traps = [];
  g.world.fences = [];
  return g;
}

function zombie(hp, x = 200, y = 200) {
  return { kind: "andarilho", x, y, hp, max: hp, hurt: 0, atk: 0, stun: 0 };
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FALHOU:", msg);
  } else {
    console.log("OK:", msg);
  }
}

{
  const g = game();
  g.zombies = [zombie(20)];
  g._burnZombies(0.1);
  assert(g.kills === 0, "sol com HP ainda > 0 não conta kill");
  assert(g.zombies.length === 1, "zumbi ferido pelo sol continua na lista");
}

{
  const g = game();
  g.zombies = [zombie(5)];
  g._burnZombies(0.2); // 40 * 0.2 = 8 → HP -3
  assert(g.kills === 1, "sol no cruzamento letal conta 1 kill");
  assert(g.zombies.length === 0, "zumbi queimado é removido");
}

{
  const g = game();
  g.zombies = [zombie(30)];
  for (let i = 0; i < 20; i++) g._burnZombies(0.05); // 20 * 2 = 40 dano
  assert(g.kills === 1, "vários frames de sol no mesmo zumbi contam só 1 kill");
  assert(g.zombies.length === 0, "depois do cruzamento o zumbi some");
}

{
  const g = game();
  g.zombies = [zombie(0)];
  g._burnZombies(1);
  assert(g.kills === 0, "zumbi já morto no sol não gera crédito");
}

{
  const g = game();
  const z = zombie(10);
  g.zombies = [z];
  g._hurtZombie(z, 12, 0, 0);
  assert(g.kills === 1, "golpe letal conta 1 kill");
  g._hurtZombie(z, 12, 0, 0);
  g._hurtZombie(z, 99, 0, 0);
  assert(g.kills === 1, "_hurtZombie em zumbi morto não conta de novo");
  assert(z.hp <= 0, "HP do morto não muda (sem dano extra)");
}

{
  const g = game();
  const z = zombie(8, 100, 100);
  g.zombies = [z];
  g.arrows = [
    { x: 100, y: 100, vx: 0, vy: 0, life: 1, dmg: 20 },
    { x: 100, y: 100, vx: 0, vy: 0, life: 1, dmg: 20 },
  ];
  g._updateArrows(0.016);
  assert(g.kills === 1, "duas flechas no mesmo frame no mesmo alvo = 1 kill");
}

{
  const g = game();
  const z = zombie(0, 50, 50);
  g.zombies = [z];
  g.world.traps = [{ x: 50, y: 50, cd: 0, uses: 2 }];
  g._updateTraps(0.016);
  assert(g.kills === 0, "armadilha ignora zumbi já morto");
  assert(g.world.traps[0].uses === 2, "armadilha não gasta uso em morto");
}

{
  const g = game();
  const z = zombie(10, 50, 50);
  g.zombies = [z];
  g.world.traps = [{ x: 50, y: 50, cd: 0, uses: 2 }];
  g._updateTraps(0.016);
  assert(g.kills === 1, "armadilha letal conta 1 kill");
  g.world.traps[0].cd = 0;
  g._updateTraps(0.016);
  assert(g.kills === 1, "segunda armadilha no mesmo morto não conta de novo");
}

if (failed) {
  console.error(`\n${failed} teste(s) falharam.`);
  process.exit(1);
}
console.log("\nTodos os testes do contador de kills passaram.");
