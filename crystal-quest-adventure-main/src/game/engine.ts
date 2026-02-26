import { GameData, Player, Enemy, Bullet, Particle, Star, StarFragment, EnemyType, WeaponType } from './types';
import { LEVELS } from './levels';

const PLAYER_SPEED = 4;
const SHOOT_COOLDOWN = 150;
const CANVAS_W = 800;
const CANVAS_H = 500;

export function createInitialState(): GameData {
  return {
    state: 'title',
    score: 0,
    level: 0,
    timeLeft: LEVELS[0].duration,
    player: createPlayer(),
    bullets: [],
    enemies: [],
    particles: [],
    stars: createStars(),
    fragments: [],
    keys: new Set(),
    lastSpawn: 0,
    lastShot: 0,
  };
}

function createPlayer(): Player {
  return {
    x: 60, y: CANVAS_H / 2 - 14, w: 32, h: 28,
    active: true, lives: 3, weaponLevel: 1,
    weapon: 'pulse', novaCharge: 0, invincibleTimer: 0, speed: PLAYER_SPEED,
  };
}

function createStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      speed: 0.5 + Math.random() * 2,
      size: Math.random() > 0.7 ? 2 : 1,
      brightness: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

export function startGame(game: GameData) {
  game.state = 'playing';
  game.score = 0;
  game.level = 0;
  game.timeLeft = LEVELS[0].duration;
  game.player = createPlayer();
  game.bullets = [];
  game.enemies = [];
  game.particles = [];
  game.fragments = [];
  game.lastSpawn = 0;
  game.lastShot = 0;
}

export function startLevel(game: GameData, level: number) {
  game.level = level;
  game.timeLeft = LEVELS[level].duration;
  game.bullets = [];
  game.enemies = [];
  game.fragments = [];
  game.player.x = 60;
  game.player.y = CANVAS_H / 2 - 14;
  game.player.invincibleTimer = 2;
  game.lastSpawn = 0;
  game.state = 'playing';
}

export function update(game: GameData, dt: number, now: number) {
  if (game.state !== 'playing') return;

  const level = LEVELS[game.level];

  // Timer
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    // Spawn boss if no boss exists
    const hasBoss = game.enemies.some(e => e.type === 'boss' && e.active);
    if (!hasBoss) {
      spawnBoss(game);
      game.timeLeft = 0;
    }
  }

  // Update stars
  game.stars.forEach(s => {
    s.x -= s.speed;
    if (s.x < 0) { s.x = CANVAS_W; s.y = Math.random() * CANVAS_H; }
  });

  // Player movement
  const p = game.player;
  if (p.active) {
    if (game.keys.has('ArrowUp') || game.keys.has('w')) p.y -= p.speed;
    if (game.keys.has('ArrowDown') || game.keys.has('s')) p.y += p.speed;
    if (game.keys.has('ArrowLeft') || game.keys.has('a')) p.x -= p.speed;
    if (game.keys.has('ArrowRight') || game.keys.has('d')) p.x += p.speed;
    p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));
    p.y = Math.max(34, Math.min(CANVAS_H - p.h, p.y));

    if (p.invincibleTimer > 0) p.invincibleTimer -= dt;

    // Shooting
    if (game.keys.has(' ') && now - game.lastShot > SHOOT_COOLDOWN) {
      shoot(game, now);
      game.lastShot = now;
    }

    // Nova
    if (game.keys.has('x') && p.novaCharge >= 100) {
      fireNova(game);
    }
  }

  // Spawn enemies
  if (game.timeLeft > 0 && now - game.lastSpawn > level.spawnRate) {
    spawnEnemy(game, level);
    game.lastSpawn = now;
  }

  // Update bullets
  game.bullets.forEach(b => {
    if (!b.active) return;
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < -10 || b.x > CANVAS_W + 10 || b.y < -10 || b.y > CANVAS_H + 10) b.active = false;
  });

  // Update enemies
  game.enemies.forEach(e => {
    if (!e.active) return;
    e.moveTimer += dt;

    if (e.type === 'scout') {
      e.x += e.dx;
      e.y += Math.sin(e.moveTimer * 3 + e.movePattern) * 1.5 * level.enemySpeedMult;
      if (e.x < -40) e.active = false;
      // Shoot occasionally
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        game.bullets.push({
          x: e.x, y: e.y + e.h / 2 - 2, w: 6, h: 3,
          dx: -4, dy: 0, damage: 1, isEnemy: true, color: '#ff4444', active: true,
        });
        e.shootTimer = 2 + Math.random() * 2;
      }
    } else if (e.type === 'mine') {
      e.x += e.dx;
      if (e.x < -40) e.active = false;
      // Check proximity to player for explosion
      const dist = Math.hypot(e.x + e.w / 2 - p.x - p.w / 2, e.y + e.h / 2 - p.y - p.h / 2);
      if (dist < 60) {
        // Explode into shrapnel
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          game.bullets.push({
            x: e.x + e.w / 2, y: e.y + e.h / 2, w: 4, h: 4,
            dx: Math.cos(angle) * 3, dy: Math.sin(angle) * 3,
            damage: 1, isEnemy: true, color: '#ff6633', active: true,
          });
        }
        spawnExplosion(game, e.x + e.w / 2, e.y + e.h / 2, '#ff4400');
        e.active = false;
      }
    } else if (e.type === 'boss') {
      // Boss movement pattern
      e.y += Math.sin(e.moveTimer * 1.5) * 2;
      e.x = Math.max(CANVAS_W - 160, e.x + e.dx);
      if (e.x > CANVAS_W - 120) e.dx = -0.5;
      // Boss shooting
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        for (let i = -2; i <= 2; i++) {
          game.bullets.push({
            x: e.x, y: e.y + e.h / 2 + i * 15, w: 8, h: 4,
            dx: -5, dy: i * 0.8, damage: 1, isEnemy: true, color: '#ff0066', active: true,
          });
        }
        e.shootTimer = 1.2;
      }
    }
  });

  // Update particles
  game.particles.forEach(part => {
    if (!part.active) return;
    part.x += part.dx;
    part.y += part.dy;
    part.life -= dt;
    if (part.life <= 0) part.active = false;
  });

  // Update fragments
  game.fragments.forEach(f => {
    if (!f.active) return;
    f.x += f.dx;
    f.y += f.dy;
    if (f.x < -20) f.active = false;
  });

  // Collision: player bullets vs enemies
  game.bullets.filter(b => b.active && !b.isEnemy).forEach(b => {
    game.enemies.filter(e => e.active).forEach(e => {
      if (collides(b, e)) {
        b.active = false;
        e.hp -= b.damage;
        spawnExplosion(game, b.x, b.y, '#00ccff', 3);
        if (e.hp <= 0) {
          e.active = false;
          game.score += e.points;
          spawnExplosion(game, e.x + e.w / 2, e.y + e.h / 2, e.type === 'boss' ? '#ff6600' : '#00ff44', e.type === 'boss' ? 30 : 10);
          // Drop fragment
          if (Math.random() < 0.3 || e.type === 'boss') {
            game.fragments.push({
              x: e.x + e.w / 2, y: e.y + e.h / 2, w: 8, h: 8,
              dx: -1.5, dy: (Math.random() - 0.5) * 2, active: true,
            });
          }
          // Boss killed = level complete
          if (e.type === 'boss') {
            game.score += 1000 * (game.level + 1);
            if (game.level >= LEVELS.length - 1) {
              game.state = 'victory';
            } else {
              game.state = 'levelComplete';
            }
          }
        }
      }
    });
  });

  // Collision: enemy bullets vs player
  if (p.active && p.invincibleTimer <= 0) {
    game.bullets.filter(b => b.active && b.isEnemy).forEach(b => {
      if (collides(b, p)) {
        b.active = false;
        hitPlayer(game);
      }
    });

    // Collision: enemies vs player
    game.enemies.filter(e => e.active).forEach(e => {
      if (collides(e, p)) {
        hitPlayer(game);
        if (e.type !== 'boss') {
          e.active = false;
          spawnExplosion(game, e.x + e.w / 2, e.y + e.h / 2, '#ff4400');
        }
      }
    });
  }

  // Collect fragments
  game.fragments.filter(f => f.active).forEach(f => {
    if (collides(f, p)) {
      f.active = false;
      p.novaCharge = Math.min(100, p.novaCharge + 25);
      game.score += 50;
      spawnExplosion(game, f.x, f.y, '#ffdd00', 5);
    }
  });

  // Cleanup
  game.bullets = game.bullets.filter(b => b.active);
  game.enemies = game.enemies.filter(e => e.active);
  game.particles = game.particles.filter(p => p.active);
  game.fragments = game.fragments.filter(f => f.active);
}

function shoot(game: GameData, _now: number) {
  const p = game.player;
  const baseX = p.x + p.w;
  const baseY = p.y + p.h / 2;

  if (p.weapon === 'pulse') {
    const dmg = p.weaponLevel;
    game.bullets.push({
      x: baseX, y: baseY - 2, w: 12, h: 4,
      dx: 8, dy: 0, damage: dmg, isEnemy: false, color: '#00ddff', active: true,
    });
  } else if (p.weapon === 'spread') {
    const dmg = Math.max(1, p.weaponLevel - 1);
    for (let i = -1; i <= 1; i++) {
      game.bullets.push({
        x: baseX, y: baseY - 2, w: 8, h: 3,
        dx: 7, dy: i * 2.5, damage: dmg, isEnemy: false, color: '#44ffaa', active: true,
      });
    }
  }
}

function fireNova(game: GameData) {
  const p = game.player;
  p.novaCharge = 0;
  // Destroy all enemies on screen (except boss, just damage)
  game.enemies.filter(e => e.active).forEach(e => {
    if (e.type === 'boss') {
      e.hp -= 20;
      if (e.hp <= 0) {
        e.active = false;
        game.score += e.points + 1000 * (game.level + 1);
        spawnExplosion(game, e.x + e.w / 2, e.y + e.h / 2, '#ff6600', 30);
        if (game.level >= LEVELS.length - 1) {
          game.state = 'victory';
        } else {
          game.state = 'levelComplete';
        }
      }
    } else {
      e.active = false;
      game.score += e.points;
      spawnExplosion(game, e.x + e.w / 2, e.y + e.h / 2, '#ff66ff', 8);
    }
  });
  // Clear enemy bullets
  game.bullets.filter(b => b.isEnemy).forEach(b => { b.active = false; });
  // Screen flash effect
  for (let i = 0; i < 40; i++) {
    game.particles.push({
      x: p.x + p.w / 2, y: p.y + p.h / 2, w: 4, h: 4,
      dx: (Math.random() - 0.5) * 12, dy: (Math.random() - 0.5) * 12,
      life: 0.8, maxLife: 0.8, color: '#ff88ff', size: 3 + Math.random() * 4, active: true,
    });
  }
}

function hitPlayer(game: GameData) {
  const p = game.player;
  spawnExplosion(game, p.x + p.w / 2, p.y + p.h / 2, '#ff4400', 15);
  p.lives--;
  p.weaponLevel = 1;
  p.weapon = 'pulse';
  if (p.lives <= 0) {
    p.active = false;
    game.state = 'gameover';
  } else {
    p.invincibleTimer = 2;
    p.x = 60;
    p.y = CANVAS_H / 2 - 14;
  }
}

function spawnEnemy(game: GameData, level: typeof LEVELS[0]) {
  const type = level.enemyTypes[Math.floor(Math.random() * level.enemyTypes.length)];
  const y = 40 + Math.random() * (CANVAS_H - 80);

  if (type === 'scout') {
    game.enemies.push({
      x: CANVAS_W + 10, y, w: 28, h: 28, active: true,
      type: 'scout', hp: Math.ceil(2 * level.enemyHpMult), maxHp: Math.ceil(2 * level.enemyHpMult),
      points: 100, moveTimer: Math.random() * 6, movePattern: Math.random() * 6,
      shootTimer: 1 + Math.random() * 3, dx: -2 * level.enemySpeedMult, dy: 0,
    });
  } else if (type === 'mine') {
    game.enemies.push({
      x: CANVAS_W + 10, y, w: 28, h: 28, active: true,
      type: 'mine', hp: Math.ceil(3 * level.enemyHpMult), maxHp: Math.ceil(3 * level.enemyHpMult),
      points: 150, moveTimer: Math.random() * 6, movePattern: 0,
      shootTimer: 999, dx: -1 * level.enemySpeedMult, dy: 0,
    });
  }
}

function spawnBoss(game: GameData) {
  const level = LEVELS[game.level];
  game.enemies.push({
    x: CANVAS_W + 20, y: CANVAS_H / 2 - 50, w: 100, h: 80, active: true,
    type: 'boss', hp: level.bossHp, maxHp: level.bossHp,
    points: 500 * (game.level + 1), moveTimer: 0, movePattern: 0,
    shootTimer: 2, dx: -1, dy: 0,
  });
}

function spawnExplosion(game: GameData, x: number, y: number, color: string, count = 8) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y, w: 3, h: 3,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      life: 0.3 + Math.random() * 0.4,
      maxLife: 0.6,
      color,
      size: 2 + Math.random() * 3,
      active: true,
    });
  }
}

function collides(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function handleWeaponSwitch(game: GameData) {
  const weapons: WeaponType[] = ['pulse', 'spread'];
  const idx = weapons.indexOf(game.player.weapon);
  game.player.weapon = weapons[(idx + 1) % weapons.length];
}
