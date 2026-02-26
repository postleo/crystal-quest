import { GameData, Player, Enemy, Bullet, Particle, StarFragment, Star } from './types';

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[]) {
  stars.forEach(s => {
    ctx.fillStyle = `rgba(255,255,255,${s.brightness})`;
    ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
  });
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player) {
  if (!p.active) return;
  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer * 10) % 2 === 0) return;

  const x = Math.floor(p.x);
  const y = Math.floor(p.y);

  // Body
  ctx.fillStyle = '#00aaff';
  ctx.fillRect(x + 4, y + 8, 24, 12);
  // Cockpit
  ctx.fillStyle = '#66ddff';
  ctx.fillRect(x + 20, y + 10, 8, 8);
  // Wings
  ctx.fillStyle = '#0066cc';
  ctx.fillRect(x + 2, y + 2, 16, 6);
  ctx.fillRect(x + 2, y + 20, 16, 6);
  // Engine glow
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(x - 4, y + 11, 8, 6);
  ctx.fillStyle = '#ffaa00';
  ctx.fillRect(x - 2, y + 12, 4, 4);
  // Wing tips
  ctx.fillStyle = '#ff3300';
  ctx.fillRect(x, y, 4, 4);
  ctx.fillRect(x, y + 24, 4, 4);
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  if (!e.active) return;
  const x = Math.floor(e.x);
  const y = Math.floor(e.y);

  if (e.type === 'scout') {
    // Green UFO
    ctx.fillStyle = '#00cc44';
    ctx.fillRect(x + 4, y + 8, 20, 10);
    ctx.fillStyle = '#00ff55';
    ctx.fillRect(x + 8, y + 4, 12, 6);
    // Eyes
    ctx.fillStyle = '#ff3300';
    ctx.fillRect(x + 8, y + 10, 3, 3);
    ctx.fillRect(x + 16, y + 10, 3, 3);
    // Legs
    ctx.fillStyle = '#009933';
    ctx.fillRect(x + 4, y + 18, 3, 6);
    ctx.fillRect(x + 12, y + 18, 3, 6);
    ctx.fillRect(x + 20, y + 18, 3, 6);
  } else if (e.type === 'mine') {
    // Red pulsing mine
    const pulse = Math.sin(e.moveTimer * 5) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(200,50,30,${pulse})`;
    ctx.fillRect(x + 4, y + 4, 20, 20);
    ctx.fillStyle = `rgba(255,100,50,${pulse})`;
    ctx.fillRect(x + 8, y + 8, 12, 12);
    ctx.fillStyle = '#ff6633';
    ctx.fillRect(x + 11, y + 11, 6, 6);
    // Spikes
    ctx.fillStyle = '#cc3322';
    ctx.fillRect(x + 12, y, 4, 4);
    ctx.fillRect(x + 12, y + 24, 4, 4);
    ctx.fillRect(x, y + 12, 4, 4);
    ctx.fillRect(x + 24, y + 12, 4, 4);
  } else if (e.type === 'boss') {
    // Large armored cruiser
    const w = e.w;
    const h = e.h;
    ctx.fillStyle = '#444466';
    ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
    ctx.fillStyle = '#555588';
    ctx.fillRect(x + 20, y + 5, w - 40, h - 10);
    // Armor plates
    ctx.fillStyle = '#333355';
    ctx.fillRect(x + 5, y + 20, 15, h - 40);
    ctx.fillRect(x + w - 20, y + 20, 15, h - 40);
    // Core
    const blink = Math.sin(e.moveTimer * 3) > 0 ? '#ff0044' : '#ff4488';
    ctx.fillStyle = blink;
    ctx.fillRect(x + w / 2 - 8, y + h / 2 - 8, 16, 16);
    // Cannons
    ctx.fillStyle = '#666699';
    ctx.fillRect(x, y + 15, 10, 8);
    ctx.fillRect(x, y + h - 23, 10, 8);
    // Health bar
    const hpRatio = e.hp / e.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y - 10, w, 5);
    ctx.fillStyle = hpRatio > 0.5 ? '#00ff66' : hpRatio > 0.25 ? '#ffaa00' : '#ff3300';
    ctx.fillRect(x, y - 10, w * hpRatio, 5);
  }
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  if (!b.active) return;
  ctx.fillStyle = b.color;
  ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.w, b.h);
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  if (!p.active) return;
  const alpha = p.life / p.maxLife;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
  ctx.globalAlpha = 1;
}

export function drawFragment(ctx: CanvasRenderingContext2D, f: StarFragment) {
  if (!f.active) return;
  const x = Math.floor(f.x);
  const y = Math.floor(f.y);
  ctx.fillStyle = '#ffdd00';
  ctx.fillRect(x + 2, y, 4, 8);
  ctx.fillRect(x, y + 2, 8, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 3, y + 3, 2, 2);
}

export function drawHUD(ctx: CanvasRenderingContext2D, game: GameData, width: number) {
  // HUD background
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, width, 32);
  ctx.strokeStyle = '#446688';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, 32);

  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';

  ctx.fillText(`SCORE: ${game.score}`, 10, 17);
  ctx.fillText(`LIVES: ${game.player.lives}`, width / 2 - 50, 17);
  ctx.fillText(`LVL ${game.level + 1}`, width - 80, 17);

  // Time
  const mins = Math.floor(game.timeLeft / 60);
  const secs = Math.floor(game.timeLeft % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  ctx.fillStyle = game.timeLeft < 10 ? '#ff3300' : '#00ffaa';
  ctx.fillText(timeStr, width - 170, 17);

  // Nova charge bar
  const barX = width / 2 + 50;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, 10, 60, 12);
  ctx.fillStyle = '#ff66ff';
  ctx.fillRect(barX, 10, 60 * (game.player.novaCharge / 100), 12);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(barX, 10, 60, 12);

  // Weapon indicator
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillText(game.player.weapon.toUpperCase(), barX + 65, 17);
}
