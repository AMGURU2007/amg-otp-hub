'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import './ShatterType.css';

interface Shard {
  // Triangle vertices in target text coordinates
  x0: number; y0: number;
  x1: number; y1: number;
  x2: number; y2: number;
  // Centroid
  cx: number; cy: number;
  // Current animated transform offset & rotation
  ox: number; oy: number;
  vx: number; vy: number;
  angle: number; va: number;
  scale: number;
  alpha: number;
  crackGlow: number;
  shattered: boolean;
}

export interface ShatterTypeProps {
  text?: string;
  subtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  bgColor?: string;
  autoCompleteMs?: number;
  onCrossFadeStart?: () => void;
  onComplete?: () => void;
}

export default function ShatterType({
  text = 'AMG',
  subtitle = 'ONE CODEBASE · ALL ACCOUNTS · ONE INBOX',
  primaryColor = '#22e5ff',
  secondaryColor = '#ffffff',
  bgColor = '#040b18',
  autoCompleteMs = 4800,
  onCrossFadeStart,
  onComplete
}: ShatterTypeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.min(window.innerWidth, 920);
    const height = Math.min(window.innerHeight * 0.62, 420);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Offscreen text rasterizer to slice headline into Voronoi/Delaunay-style glass shards
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const octx = off.getContext('2d')!;

    const fontSize = Math.round(Math.min(width * 0.34, height * 0.68) * dpr);
    octx.clearRect(0, 0, off.width, off.height);
    octx.font = `900 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';

    const grad = octx.createLinearGradient(0, off.height * 0.2, off.width, off.height * 0.8);
    grad.addColorStop(0, secondaryColor);
    grad.addColorStop(0.5, primaryColor);
    grad.addColorStop(1, secondaryColor);
    octx.fillStyle = grad;
    octx.fillText(text, off.width / 2, off.height / 2);

    // Slice into crystalline triangular glass shards
    const shards: Shard[] = [];
    const cols = 26;
    const rows = 12;
    const cellW = off.width / cols;
    const cellH = off.height / rows;

    // Jittered grid vertices for organic glass fracture lines
    const pts: { x: number; y: number }[][] = [];
    for (let r = 0; r <= rows; r++) {
      pts[r] = [];
      for (let c = 0; c <= cols; c++) {
        const jx = (r > 0 && r < rows && c > 0 && c < cols) ? (Math.random() - 0.5) * cellW * 0.68 : 0;
        const jy = (r > 0 && r < rows && c > 0 && c < cols) ? (Math.random() - 0.5) * cellH * 0.68 : 0;
        pts[r][c] = { x: c * cellW + jx, y: r * cellH + jy };
      }
    }

    const imgData = octx.getImageData(0, 0, off.width, off.height).data;
    const hasInk = (x: number, y: number) => {
      const ix = Math.max(0, Math.min(off.width - 1, Math.round(x)));
      const iy = Math.max(0, Math.min(off.height - 1, Math.round(y)));
      return imgData[(iy * off.width + ix) * 4 + 3] > 28;
    };

    const addTri = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      const cx = (p0.x + p1.x + p2.x) / 3;
      const cy = (p0.y + p1.y + p2.y) / 3;
      if (!hasInk(cx, cy) && !hasInk(p0.x, p0.y) && !hasInk(p1.x, p1.y) && !hasInk(p2.x, p2.y)) return;
      const angleFromCenter = Math.atan2(cy - off.height / 2, cx - off.width / 2);
      const dist = 180 + Math.random() * 420;
      shards.push({
        x0: p0.x, y0: p0.y,
        x1: p1.x, y1: p1.y,
        x2: p2.x, y2: p2.y,
        cx, cy,
        ox: Math.cos(angleFromCenter) * dist * dpr,
        oy: Math.sin(angleFromCenter) * dist * dpr,
        vx: 0, vy: 0,
        angle: (Math.random() - 0.5) * 4.2,
        va: 0,
        scale: 0.2 + Math.random() * 0.6,
        alpha: 0,
        crackGlow: 0,
        shattered: false
      });
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p00 = pts[r][c];
        const p10 = pts[r][c + 1];
        const p01 = pts[r + 1][c];
        const p11 = pts[r + 1][c + 1];
        if ((r + c) % 2 === 0) {
          addTri(p00, p10, p11);
          addTri(p00, p11, p01);
        } else {
          addTri(p00, p10, p01);
          addTri(p10, p11, p01);
        }
      }
    }

    const pointer = { x: -9999, y: -9999 };
    let isShattering = false;
    let raf = 0;
    const startTime = performance.now();

    const triggerShatter = (originX = off.width / 2, originY = off.height / 2) => {
      if (isShattering) return;
      isShattering = true;
      for (const s of shards) {
        s.shattered = true;
        const dx = s.cx - originX;
        const dy = s.cy - originY;
        const d = Math.max(18, Math.hypot(dx, dy));
        const force = (14 + Math.random() * 22) * dpr;
        s.vx = (dx / d) * force + (Math.random() - 0.5) * 8 * dpr;
        s.vy = (dy / d) * force - Math.random() * 6 * dpr;
        s.va = (Math.random() - 0.5) * 0.26;
        s.crackGlow = 1;
      }
      setTimeout(() => {
        setExiting(true);
        onCrossFadeStart?.();
      }, 400);
      setTimeout(() => onComplete?.(), 800);
    };

    const autoTimer = setTimeout(() => {
      triggerShatter(off.width / 2, off.height / 2);
    }, Math.max(100, autoCompleteMs - 800));

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) * dpr;
      pointer.y = (e.clientY - rect.top) * dpr;
    };

    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;
      triggerShatter(px, py);
    };

    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerdown', onDown);

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of shards) {
        if (!s.shattered) {
          // 0.0s – 1.6s: Glass shards fly in smoothly and assemble into "AMG" (unhurried 0.065 factor)
          s.ox += (0 - s.ox) * 0.065;
          s.oy += (0 - s.oy) * 0.065;
          s.angle += (0 - s.angle) * 0.07;
          s.scale += (1 - s.scale) * 0.07;
          s.alpha = Math.min(1, elapsed / 700);

          // Crack under cursor proximity
          const distToCursor = Math.hypot(s.cx - pointer.x, s.cy - pointer.y);
          const crackRadius = 85 * dpr;
          if (distToCursor < crackRadius) {
            const push = (1 - distToCursor / crackRadius) * 9 * dpr;
            const ang = Math.atan2(s.cy - pointer.y, s.cx - pointer.x);
            s.ox += Math.cos(ang) * push * 0.35;
            s.oy += Math.sin(ang) * push * 0.35;
            s.angle += (Math.random() - 0.5) * 0.06;
            s.crackGlow = Math.min(1, s.crackGlow + 0.25);
          } else {
            s.crackGlow *= 0.9;
          }
        } else {
          // Shatter explosion physics
          s.ox += s.vx;
          s.oy += s.vy;
          s.vy += 0.48 * dpr; // gravity
          s.angle += s.va;
          s.alpha = Math.max(0, s.alpha - 0.028);
        }

        if (s.alpha <= 0.01) continue;

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.cx + s.ox, s.cy + s.oy);
        ctx.rotate(s.angle);
        ctx.scale(s.scale, s.scale);
        ctx.translate(-s.cx, -s.cy);

        ctx.beginPath();
        ctx.moveTo(s.x0, s.y0);
        ctx.lineTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(off, 0, 0);

        // Glass fracture edge highlight
        if (s.crackGlow > 0.05 || Math.abs(s.ox) > 1.5 || s.shattered) {
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = (1.1 + s.crackGlow * 1.6) * dpr;
          ctx.stroke();
        }
        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      clearTimeout(autoTimer);
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    };
  }, [text, primaryColor, secondaryColor, autoCompleteMs, onComplete]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <div className={`shatter-stage${exiting ? ' shatter-stage--exiting' : ''}`} style={{ backgroundColor: bgColor }}>
      <canvas ref={canvasRef} className="shatter-canvas" title="Click or hover to shatter glass" />
      <div className="shatter-sub" style={{ color: primaryColor }}>
        {subtitle}
      </div>
    </div>
  );
}
export { ShatterType };
