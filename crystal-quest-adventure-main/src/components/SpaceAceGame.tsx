import { useRef, useEffect, useCallback, useState } from 'react';
import { createInitialState, startGame, startLevel, update, handleWeaponSwitch } from '@/game/engine';
import { drawStars, drawPlayer, drawEnemy, drawBullet, drawParticle, drawFragment, drawHUD } from '@/game/renderer';
import { LEVELS } from '@/game/levels';
import { GameData } from '@/game/types';
import titleImg from '@/assets/space-ace-title.png';

const W = 800;
const H = 500;

export default function SpaceAceGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(createInitialState());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [, setTick] = useState(0); // force re-render for overlays

  const game = gameRef.current;

  const handleKey = useCallback((e: KeyboardEvent, down: boolean) => {
    const g = gameRef.current;
    const key = e.key.toLowerCase();
    
    if (down) {
      g.keys.add(key);
      if (key === 'enter') {
        if (g.state === 'title') { startGame(g); setTick(t => t + 1); }
        else if (g.state === 'gameover') { startGame(g); setTick(t => t + 1); }
        else if (g.state === 'levelComplete') { startLevel(g, g.level + 1); setTick(t => t + 1); }
        else if (g.state === 'victory') { gameRef.current = createInitialState(); setTick(t => t + 1); }
      }
      if (key === 'q' && g.state === 'playing') {
        handleWeaponSwitch(g);
      }
    } else {
      g.keys.delete(key);
    }
    e.preventDefault();
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => handleKey(e, true);
    const ku = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [handleKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = (timestamp: number) => {
      const g = gameRef.current;
      const dt = Math.min((timestamp - (lastTimeRef.current || timestamp)) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const prevState = g.state;
      update(g, dt, timestamp);
      if (g.state !== prevState) setTick(t => t + 1);

      // Draw
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, W, H);

      drawStars(ctx, g.stars);
      
      // Update stars even on non-playing states
      if (g.state !== 'playing') {
        g.stars.forEach(s => {
          s.x -= s.speed * 0.3;
          if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
        });
      }

      if (g.state === 'playing') {
        g.fragments.forEach(f => drawFragment(ctx, f));
        g.enemies.forEach(e => drawEnemy(ctx, e));
        g.bullets.forEach(b => drawBullet(ctx, b));
        drawPlayer(ctx, g.player);
        g.particles.forEach(p => drawParticle(ctx, p));
        drawHUD(ctx, g, W);
      }

      // Scanline overlay
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      for (let y = 0; y < H; y += 3) {
        ctx.fillRect(0, y, W, 1);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const state = game.state;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="relative crt-border rounded-sm overflow-hidden" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} className="block" />

        {/* Title Screen Overlay */}
        {state === 'title' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60">
            <img src={titleImg} alt="Space Ace" className="w-[600px] mb-4 pixelated" style={{ imageRendering: 'pixelated' }} />
            <p className="font-pixel text-primary text-sm animate-blink mt-4">PRESS ENTER TO START</p>
            <div className="mt-6 font-pixel text-muted-foreground text-[8px] space-y-2 text-center">
              <p>ARROWS/WASD: MOVE | SPACE: SHOOT</p>
              <p>Q: SWITCH WEAPON | X: NOVA BLAST</p>
            </div>
          </div>
        )}

        {/* Level Complete Overlay */}
        {state === 'levelComplete' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
            <h2 className="font-pixel text-accent text-xl text-glow-cyan mb-2">LEVEL COMPLETE!</h2>
            <p className="font-pixel text-foreground text-sm mb-1">SCORE: {game.score}</p>
            <p className="font-pixel text-muted-foreground text-xs mb-4">
              NEXT: {LEVELS[game.level + 1]?.name ?? '???'}
            </p>
            <p className="font-pixel text-primary text-xs animate-blink">PRESS ENTER TO CONTINUE</p>
          </div>
        )}

        {/* Game Over Overlay */}
        {state === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85">
            <h2 className="font-pixel text-destructive text-2xl text-glow-orange mb-4">GAME OVER</h2>
            <p className="font-pixel text-foreground text-sm mb-6">FINAL SCORE: {game.score}</p>
            <p className="font-pixel text-primary text-xs animate-blink">PRESS ENTER TO RETRY</p>
          </div>
        )}

        {/* Victory Overlay */}
        {state === 'victory' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
            <h2 className="font-pixel text-star-gold text-xl text-glow-orange mb-2">🌟 VICTORY! 🌟</h2>
            <p className="font-pixel text-accent text-sm mb-1">THE ZOG EMPIRE HAS FALLEN!</p>
            <p className="font-pixel text-foreground text-sm mb-4">FINAL SCORE: {game.score}</p>
            <p className="font-pixel text-primary text-xs animate-blink">PRESS ENTER FOR TITLE</p>
          </div>
        )}
      </div>
      <p className="font-pixel text-muted-foreground text-[7px] mt-3">© 20XX ACE SQUADRON — ALL RIGHTS RESERVED</p>
    </div>
  );
}
