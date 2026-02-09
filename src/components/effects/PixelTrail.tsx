"use client";

import React, { useEffect, useRef } from 'react';

import cursorStar from '@/app/v1/assets/ECHUU V1 UX_img/db13c5aa82b66b348df53b3b1ab7faa2 1.png';

/**
 * 仅保留星星自定义光标；R3F Pixel Trail 在双 Canvas + pointer-events-none 下难以稳定显示，已移除。
 */
export function PixelTrail() {
  const cursorUrl = typeof cursorStar === 'string' ? cursorStar : (cursorStar as { src: string }).src;

  useEffect(() => {
    const prev = document.body.style.cursor;
    document.body.style.cursor = `url(${cursorUrl}) 12 12, auto`;
    return () => {
      document.body.style.cursor = prev;
    };
  }, [cursorUrl]);

  return null;
}
