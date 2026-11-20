'use strict';

// =====================================================================
// DADOS DOS VEÍCULOS
// =====================================================================
const VEHICLES = {
  m4: {
    id: 'm4', make: 'BMW M', model: 'M4 Competition', short: 'BMW M4', cls: 'Coupé', type: 'car', sound: 'm4',
    tags: ['Coupé', 'Biturbo L6', 'Tração traseira'],
    specs: [['Potência', '530', 'cv'], ['Binário', '650', 'Nm'], ['0–100 km/h', '3,9', 's'], ['Vel. máxima', '290', 'km/h'], ['Motor', '3.0 L6', ''], ['Peso', '1 725', 'kg']],
    stats: { 'Velocidade': .94, 'Aceleração': .88, 'Manejo': .76, 'Nitro': .86 },
    game: { speedMult: 1.25, handlingMult: 1.0, nitroMult: 1.2, topKmh: 290 },
    paints: [
      { n: 'Verde Isle of Man', c: 0x0f6b55 }, { n: 'Amarelo São Paulo', c: 0xd8b01c }, { n: 'Cinza Brooklyn', c: 0x84898e },
      { n: 'Azul Portimão', c: 0x1d4c9c }, { n: 'Vermelho Toronto', c: 0x99141e }, { n: 'Preto Safira', c: 0x16181b }
    ],
    cam: { radius: 7.4, ty: .62 }
  },
  civic: {
    id: 'civic', make: 'Honda', model: 'Civic Type R', short: 'Civic Type R', cls: 'Hot Hatch', type: 'car', sound: 'civic',
    tags: ['Hot hatch', 'VTEC Turbo', 'Tração dianteira'],
    specs: [['Potência', '329', 'cv'], ['Binário', '420', 'Nm'], ['0–100 km/h', '5,4', 's'], ['Vel. máxima', '275', 'km/h'], ['Motor', '2.0 L4 T', ''], ['Peso', '1 429', 'kg']],
    stats: { 'Velocidade': .86, 'Aceleração': .74, 'Manejo': .92, 'Nitro': .8 },
    game: { speedMult: 1.15, handlingMult: 1.25, nitroMult: 1.15, topKmh: 275 },
    paints: [
      { n: 'Cinza Meteoro', c: 0x3a4047 }, { n: 'Branco Championship', c: 0xececE8 }, { n: 'Vermelho Rallye', c: 0xbb111c },
      { n: 'Azul Boost', c: 0x23479a }, { n: 'Preto Cristal', c: 0x0f1013 }
    ],
    cam: { radius: 7.2, ty: .62 }
  },
  mt07: {
    id: 'mt07', make: 'Yamaha', model: 'MT-07', short: 'Yamaha MT-07', cls: 'Naked', type: 'bike', sound: 'mt07',
    tags: ['Naked', 'Motor CP2', 'Leve e ágil'],
    specs: [['Potência', '73', 'cv'], ['Binário', '67', 'Nm'], ['0–100 km/h', '3,9', 's'], ['Vel. máxima', '214', 'km/h'], ['Motor', '689 cc 2 cil.', ''], ['Peso', '183', 'kg']],
    stats: { 'Velocidade': .72, 'Aceleração': .86, 'Manejo': 1.0, 'Nitro': .74 },
    game: { speedMult: 1.05, handlingMult: 1.45, nitroMult: 1.1, topKmh: 214 },
    paints: [
      { n: 'Cinza Storm', c: 0x8f969d, a: 0x1d9be8 }, { n: 'Azul Icon', c: 0x1e46b6, a: 0x1e46b6 },
      { n: 'Preto Tech', c: 0x25282c, a: 0x34383d }, { n: 'Branco Ice', c: 0xd9dde2, a: 0xe0662a }
    ],
    cam: { radius: 4.0, ty: .6 }
  }
};
const VEHICLE_ORDER = ['m4', 'civic', 'mt07'];

const DIFFICULTIES = {
  facil:   { name: 'Fácil',   speed: 30, spawn: 1.25, mult: 1.0, obstacleSpeed: 0, doubleChance: 0 },
  medio:   { name: 'Médio',   speed: 44, spawn: 0.92, mult: 1.5, obstacleSpeed: 0, doubleChance: .2 },
  dificil: { name: 'Difícil', speed: 60, spawn: 0.68, mult: 2.5, obstacleSpeed: 3, doubleChance: .35 },
  extremo: { name: 'Extremo', speed: 80, spawn: 0.46, mult: 4.0, obstacleSpeed: 8, doubleChance: .45, storm: true }
};

// Estrada: tudo o que está fora destas linhas é berma (zebra) e depois rail
const ROAD = { width: 14, tileLen: 60, tiles: 8, kerbW: 0.9 };
ROAD.edge = ROAD.width / 2;                 // 7.0 – linha branca exterior
ROAD.railInner = ROAD.edge + ROAD.kerbW + 0.3; // 8.2 – face interior do rail
// Converte a velocidade do jogo em km/h realistas (aproxima-se da velocidade máxima de cada veículo)
const speedKmh = (s, g) => g.topKmh * 1.08 * (1 - Math.exp(-s / (40 * g.speedMult)));
