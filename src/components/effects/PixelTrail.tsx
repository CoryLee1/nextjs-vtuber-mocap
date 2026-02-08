"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';

import cursorStar from '@/app/v1/assets/ECHUU V1 UX_img/db13c5aa82b66b348df53b3b1ab7faa2 1.png';

const MAX_AGE_MS = 250;
const INTERPOLATE = 5;
const MAX_POINTS = 60;

interface TrailPoint {
  x: number;
  y: number;
  t: number;
  id: number;
}

export function PixelTrail() {
  const [points, setPoints] = useState<TrailPoint[]>([]);
  const [tickTime, setTickTime] = useState(() => Date.now());
  const rafRef = useRef<number>(0);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const idRef = useRef(0);

  const cursorUrl = typeof cursorStar === 'string' ? cursorStar : (cursorStar as { src: string }).src;

  const pushPoint = useCallback((x: number, y: number) => {
    const now = Date.now();
    setPoints((prev) => {
      const next = [...prev, { x, y, t: now, id: idRef.current++ }];
      const cutoff = now - MAX_AGE_MS;
      return next.filter((p) => p.t > cutoff).slice(-MAX_POINTS);
    });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const last = lastRef.current;
      if (last !== null) {
        const dx = clientX - last.x;
        const dy = clientY - last.y;
        const steps = Math.max(1, Math.floor(Math.sqrt(dx * dx + dy * dy) / INTERPOLATE));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          pushPoint(last.x + dx * t, last.y + dy * t);
        }
      } else {
        pushPoint(clientX, clientY);
      }
      lastRef.current = { x: clientX, y: clientY };
    };

    const onLeave = () => {
      lastRef.current = null;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    const tick = () => {
      const now = Date.now();
      setPoints((prev) => {
        const cutoff = now - MAX_AGE_MS;
        if (prev.length === 0) return prev;
        const next = prev.filter((p) => p.t > cutoff);
        return next.length === prev.length ? prev : next;
      });
      setTickTime(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [pushPoint]);

  useEffect(() => {
    const prev = document.body.style.cursor;
    document.body.style.cursor = `url(${cursorUrl}) 12 12, auto`;
    return () => {
      document.body.style.cursor = prev;
    };
  }, [cursorUrl]);

  return (
    <div
      className="fixed inset-0 z-[99] pointer-events-none overflow-hidden"
      aria-hidden
    >
      {points.map((p) => {
        const age = tickTime - p.t;
        const opacity = Math.max(0, 1 - age / MAX_AGE_MS);
        const size = 8 + 16 * (1 - age / MAX_AGE_MS);
        return (
          <div
            key={p.id}
            className="absolute will-change-transform"
            style={{
              left: p.x,
              top: p.y,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              opacity,
              transition: 'none',
              pointerEvents: 'none',
            }}
          >
            <img
              src={cursorUrl}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}
