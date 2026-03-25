'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';

type LatentDivergenceProps = {
  width?: number;
  height?: number;
  agentCount?: number;
  className?: string;
  variant?: 'hero' | 'strip';
};

/**
 * Latent Divergence — generative art visualization.
 * Neural agents flowing in formation, then diverging as latent features shift.
 * Uses vanilla Canvas API (no p5.js dependency) for lightweight embedding.
 *
 * Colors adapted to Daemon palette: ember for aligned, bone for diverged.
 */
export function LatentDivergence({
  width: propWidth,
  height: propHeight,
  agentCount = 400,
  className,
  variant = 'hero',
}: LatentDivergenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    // Non-null after guard — safe to use in closures
    const ctx: CanvasRenderingContext2D = maybeCtx;

    // Mouse tracking
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const W = propWidth ?? canvas.offsetWidth;
    const H = propHeight ?? canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    // Seeded random
    let seed = 42;
    function seededRandom(): number {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    // Simple 2D noise approximation
    function noise2d(x: number, y: number): number {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const a = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
      const b = Math.sin((ix + 1) * 127.1 + iy * 311.7) * 43758.5453;
      const c = Math.sin(ix * 127.1 + (iy + 1) * 311.7) * 43758.5453;
      const d = Math.sin((ix + 1) * 127.1 + (iy + 1) * 311.7) * 43758.5453;
      const va = a - Math.floor(a);
      const vb = b - Math.floor(b);
      const vc = c - Math.floor(c);
      const vd = d - Math.floor(d);
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      return (va * (1 - sx) + vb * sx) * (1 - sy) + (vc * (1 - sx) + vd * sx) * sy;
    }

    // Daemon palette
    const EMBER = { r: 212, g: 165, b: 116 };
    const BONE = { r: 240, g: 236, b: 229 };
    const VOID_BG = { r: 10, g: 10, b: 10 };

    // Saddle points
    const saddleCount = 3 + Math.floor(seededRandom() * 4);
    const saddles = Array.from({ length: saddleCount }, () => ({
      x: seededRandom() * W,
      y: seededRandom() * H,
      radius: 60 + seededRandom() * 150,
      strength: 0.3 + seededRandom() * 0.7,
    }));

    const alignedAngle = seededRandom() * Math.PI * 2;

    type Agent = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alignedAngle: number;
      latentAngle: number;
      latentActivation: number;
      sensitivity: number;
      noiseOff: number;
      trail: Array<{ x: number; y: number }>;
      maxTrail: number;
      age: number;
      lifespan: number;
    };

    function createAgent(): Agent {
      const a = alignedAngle + (seededRandom() - 0.5) * 0.3;
      return {
        x: seededRandom() * W,
        y: seededRandom() * H,
        vx: 0,
        vy: 0,
        alignedAngle: a,
        latentAngle: a + (0.3 + seededRandom() * 0.5) * Math.PI * (seededRandom() > 0.5 ? 1 : -1),
        latentActivation: seededRandom() * 0.05,
        sensitivity: 0.5 + seededRandom(),
        noiseOff: seededRandom() * 10000,
        trail: [],
        maxTrail: variant === 'strip' ? 15 : 30 + Math.floor(seededRandom() * 40),
        age: 0,
        lifespan: 200 + Math.floor(seededRandom() * 500),
      };
    }

    let agents: Agent[] = Array.from({ length: agentCount }, createAgent);
    let frame = 0;
    let globalDiv = 0;

    // Fill background
    ctx.fillStyle = `rgb(${VOID_BG.r},${VOID_BG.g},${VOID_BG.b})`;
    ctx.fillRect(0, 0, W, H);

    function step() {
      // Soft fade
      ctx.fillStyle = `rgba(${VOID_BG.r},${VOID_BG.g},${VOID_BG.b},${variant === 'strip' ? 0.06 : 0.03})`;
      ctx.fillRect(0, 0, W, H);

      frame++;
      let diverged = 0;

      for (let i = agents.length - 1; i >= 0; i--) {
        const a = agents[i];
        a.age++;

        // Saddle influence
        let saddleInf = 0;
        for (const sp of saddles) {
          const dx = a.x - sp.x;
          const dy = a.y - sp.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < sp.radius) {
            saddleInf += (1 - d / sp.radius) * sp.strength;
          }
        }

        // Mouse gravitational field — agents spiral toward cursor
        const mouse = mouseRef.current;
        if (mouse.active) {
          const mdx = mouse.x - a.x;
          const mdy = mouse.y - a.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          const mouseRadius = variant === 'strip' ? 80 : 200;
          if (mDist < mouseRadius && mDist > 1) {
            const force = (1 - mDist / mouseRadius) * 0.6;
            // Tangential + radial = spiral orbit
            const normX = mdx / mDist;
            const normY = mdy / mDist;
            a.vx += (normX * force * 0.4 + -normY * force * 0.3);
            a.vy += (normY * force * 0.4 + normX * force * 0.3);
            // Mouse proximity triggers divergence
            a.latentActivation = Math.min(1, a.latentActivation + force * 0.02);
          }
        }

        // Cascade
        const cascade = globalDiv > 0.35 ? 1 + (globalDiv - 0.35) * 6 : 1;
        const accum = 0.005 * a.sensitivity * (1 + saddleInf * 2) * cascade;
        a.latentActivation = Math.min(1, a.latentActivation + accum);
        const pressure = 0.08 * (1 - a.latentActivation * 0.8);
        a.latentActivation = Math.max(0, a.latentActivation - pressure * 0.3);

        // Direction
        const t = a.latentActivation * a.latentActivation * (3 - 2 * a.latentActivation);
        let angle = a.alignedAngle * (1 - t) + a.latentAngle * t;
        const n = noise2d(a.x * 0.004 + a.noiseOff, a.y * 0.004 + frame * 0.002);
        angle += (n - 0.5) * Math.PI * 0.6;

        // Speed
        let spd = a.latentActivation > 0.25 && a.latentActivation < 0.7
          ? 0.4 + Math.abs(a.latentActivation - 0.475) / 0.225 * 0.8
          : 0.8 + a.latentActivation * 0.6;

        if (variant === 'strip') spd *= 0.5;

        const tvx = Math.cos(angle) * spd;
        const tvy = Math.sin(angle) * spd;
        a.vx += (tvx - a.vx) * 0.08;
        a.vy += (tvy - a.vy) * 0.08;
        a.x += a.vx;
        a.y += a.vy;

        a.trail.push({ x: a.x, y: a.y });
        if (a.trail.length > a.maxTrail) a.trail.shift();

        if (a.latentActivation > 0.65) diverged++;

        // Draw trail
        if (a.trail.length > 1) {
          const col = t < 0.4
            ? { r: EMBER.r, g: EMBER.g, b: EMBER.b }
            : {
                r: EMBER.r + (BONE.r - EMBER.r) * ((t - 0.4) / 0.6),
                g: EMBER.g + (BONE.g - EMBER.g) * ((t - 0.4) / 0.6),
                b: EMBER.b + (BONE.b - EMBER.b) * ((t - 0.4) / 0.6),
              };

          for (let j = 1; j < a.trail.length; j++) {
            const frac = j / a.trail.length;
            let alpha = frac * (1 - a.age / a.lifespan) * 0.6;
            if (variant === 'strip') alpha *= 0.8;
            const sw = variant === 'strip' ? 0.5 + frac * 0.5 : 0.3 + frac * 1.2;

            ctx.strokeStyle = `rgba(${Math.round(col.r)},${Math.round(col.g)},${Math.round(col.b)},${alpha})`;
            ctx.lineWidth = sw;
            ctx.beginPath();
            ctx.moveTo(a.trail[j - 1].x, a.trail[j - 1].y);
            ctx.lineTo(a.trail[j].x, a.trail[j].y);
            ctx.stroke();
          }
        }

        // Remove dead agents
        if (a.x < -20 || a.x > W + 20 || a.y < -20 || a.y > H + 20 || a.age > a.lifespan) {
          agents.splice(i, 1);
        }
      }

      globalDiv = agents.length > 0 ? diverged / agents.length : 0;

      // Respawn
      const deficit = agentCount - agents.length;
      for (let i = 0; i < Math.min(deficit, 10); i++) {
        agents.push(createAgent());
      }

      animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [propWidth, propHeight, agentCount, variant]);

  return (
    <canvas
      ref={canvasRef}
      className={clsx(
        variant === 'strip'
          ? 'w-full h-full'
          : 'w-full rounded-lg',
        className,
      )}
      style={variant === 'hero' ? { height: propHeight ?? 300 } : undefined}
    />
  );
}
