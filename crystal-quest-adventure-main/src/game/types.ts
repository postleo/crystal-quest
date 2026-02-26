export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
}

export interface Player extends Entity {
  lives: number;
  weaponLevel: number;
  weapon: WeaponType;
  novaCharge: number;
  invincibleTimer: number;
  speed: number;
}

export type WeaponType = 'pulse' | 'spread' | 'nova';

export interface Bullet extends Entity {
  dx: number;
  dy: number;
  damage: number;
  isEnemy: boolean;
  color: string;
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  points: number;
  moveTimer: number;
  movePattern: number;
  shootTimer: number;
  dx: number;
  dy: number;
}

export type EnemyType = 'scout' | 'mine' | 'boss';

export interface Particle extends Entity {
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface StarFragment extends Entity {
  dx: number;
  dy: number;
}

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

export interface LevelConfig {
  name: string;
  duration: number; // seconds
  spawnRate: number; // ms between spawns
  enemyTypes: EnemyType[];
  enemyHpMult: number;
  enemySpeedMult: number;
  bossHp: number;
  bgColor: string;
}

export type GameState = 'title' | 'playing' | 'gameover' | 'levelComplete' | 'victory';

export interface GameData {
  state: GameState;
  score: number;
  level: number;
  timeLeft: number;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  stars: Star[];
  fragments: StarFragment[];
  keys: Set<string>;
  lastSpawn: number;
  lastShot: number;
}
