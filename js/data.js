export const TILE = 32;

export const COL = {
  wood: "#c4a574",
  stone: "#9aa3ad",
  food: "#e07a5f",
  iron: "#b8c4ce",
  seed: "#8bc34a",
  hp: "#e85d4c",
  cabin: "#f2cc8f",
  gold: "#f4d35e",
};

export const RES_META = {
  madeira: { nome: "Madeira", cor: COL.wood },
  pedra: { nome: "Pedra", cor: COL.stone },
  comida: { nome: "Comida", cor: COL.food },
  ferro: { nome: "Ferro", cor: COL.iron },
  sementes: { nome: "Sementes", cor: COL.seed },
};

export const WEAPONS = {
  estaca: {
    id: "estaca",
    nome: "Estaca tosca",
    tipo: "melee",
    dano: 20,
    alcance: 46,
    cooldown: 0.42,
    knock: 90,
  },
  arco: {
    id: "arco",
    nome: "Arco de galho",
    tipo: "ranged",
    dano: 16,
    alcance: 320,
    cooldown: 0.5,
    projSpeed: 340,
  },
  lanca: {
    id: "lanca",
    nome: "Lança de ferro",
    tipo: "melee",
    dano: 32,
    alcance: 54,
    cooldown: 0.48,
    knock: 120,
  },
};

export const RECIPES = [
  {
    id: "estaca",
    nome: "Estaca tosca",
    desc: "Arma corpo a corpo simples.",
    custo: { madeira: 3 },
    tipo: "arma",
  },
  {
    id: "arco",
    nome: "Arco de galho",
    desc: "Dispara farpas à distância.",
    custo: { madeira: 5, pedra: 2 },
    tipo: "arma",
  },
  {
    id: "lanca",
    nome: "Lança de ferro",
    desc: "Mais dano e alcance no corpo a corpo.",
    custo: { madeira: 4, ferro: 3 },
    tipo: "arma",
  },
  {
    id: "tocha",
    nome: "Tocha",
    desc: "Ilumina a clareira à noite.",
    custo: { madeira: 2 },
    tipo: "item",
    ganha: { tochas: 1 },
  },
  {
    id: "cerca",
    nome: "Cerca rústica",
    desc: "Barreira que atrasa os zumbis.",
    custo: { madeira: 4 },
    tipo: "item",
    ganha: { cercas: 1 },
  },
  {
    id: "armadilha",
    nome: "Armadilha de estacas",
    desc: "Fere quem pisa em cima (3 usos).",
    custo: { madeira: 3, pedra: 2 },
    tipo: "item",
    ganha: { armadilhas: 1 },
  },
  {
    id: "kit",
    nome: "Kit de reparo",
    desc: "Repara a cabana (+45 de vida).",
    custo: { madeira: 4, pedra: 3 },
    tipo: "item",
    ganha: { kits: 1 },
  },
];

export const HOTBAR = [
  { id: "arma", nome: "Arma" },
  { id: "tocha", nome: "Tocha", inv: "tochas" },
  { id: "cerca", nome: "Cerca", inv: "cercas" },
  { id: "armadilha", nome: "Armadilha", inv: "armadilhas" },
  { id: "kit", nome: "Reparo", inv: "kits" },
];

export const ZOMBIE_KINDS = {
  andarilho: {
    nome: "Andarilho",
    hp: 30,
    speed: 36,
    dmg: 9,
    cabinDmg: 7,
    r: 11,
    color: "#6b7a4b",
    shade: "#4a5534",
  },
  corredor: {
    nome: "Corredor",
    hp: 20,
    speed: 74,
    dmg: 7,
    cabinDmg: 5,
    r: 10,
    color: "#7d8b5c",
    shade: "#3e4a2e",
  },
  bruto: {
    nome: "Bruto",
    hp: 90,
    speed: 24,
    dmg: 18,
    cabinDmg: 16,
    r: 15,
    color: "#4e5a3a",
    shade: "#2c3320",
  },
};

export function canPay(inv, custo) {
  return Object.entries(custo).every(([k, v]) => (inv[k] || 0) >= v);
}

export function pay(inv, custo) {
  for (const [k, v] of Object.entries(custo)) inv[k] -= v;
}

export function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function rand(a, b) {
  return a + Math.random() * (b - a);
}

export function irand(a, b) {
  return (a + Math.floor(Math.random() * (b - a + 1))) | 0;
}

export function hash2(x, y) {
  let n = x * 374761393 + y * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}
