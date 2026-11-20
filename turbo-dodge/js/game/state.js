'use strict';

// =====================================================================
// ESTADO DO JOGO
// =====================================================================
let gameState = 'LOADING';
let selectedId = 'm4', difficulty = 'medio', sensitivity = 2.5;
let paintIdx = {};
let score = 0, distance = 0, currentSpeed = 0, nitro = 100, boosting = false, topKmh = 0, nearMisses = 0;
let playerX = 0, playerVX = 0, yaw = 0, roll = 0, pitch = 0, spawnTimer = 0, countdownT = 0, crashT = 0, spinVel = 0, crashLean = 0;
let shake = 0, lightningT = 0, offroadT = 0, toastT = 0;
let highScore = parseInt(store.get('turbo_dodge_3d_highscore', 0)) || 0;
let obstacles = [], pickups = [];
const keys = { left: false, right: false, accelerate: false, brake: false, boost: false };
