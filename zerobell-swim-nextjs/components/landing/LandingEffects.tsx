'use client';

import { useEffect } from 'react';

export function LandingEffects() {
  useEffect(() => {
    // 버블 생성 (중복 방지)
    const wrap = document.getElementById('bubbles') as HTMLElement | null;
    if (wrap && !wrap.dataset.bubbled) {
      wrap.dataset.bubbled = '1';
      const N = 14;
      for (let i = 0; i < N; i++) {
        const b = document.createElement('span');
        b.className = 'bubble';
        const size = 6 + Math.random() * 22;
        b.style.width = b.style.height = size + 'px';
        b.style.left = Math.random() * 100 + '%';
        b.style.animationDuration = 6 + Math.random() * 7 + 's';
        b.style.animationDelay = Math.random() * 6 + 's';
        wrap.appendChild(b);
      }
    }

    // 스크롤 등장
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => {
      if (el.closest('header')) {
        el.classList.add('in');
        return;
      }
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  return null;
}
