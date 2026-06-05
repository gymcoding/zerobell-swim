import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// OG 이미지 등 절대 URL 기준 origin.
// 배포 시 Vercel 환경변수 SITE_URL 에 실제 도메인을 넣으면 OG 미리보기가 정확해집니다.
// (미설정 시 아래 기본값으로 빌드됨 — 배포 후 꼭 실제 도메인으로 교체)
const SITE = process.env.SITE_URL || 'https://zerobell-swim.vercel.app';

// 두 페이지(index/carpool) 모두 클라이언트에서 jsonbin과 통신하는 정적 SPA.
// SSR/adapter 불필요 → 기본 static 출력 유지.
export default defineConfig({
  site: SITE,
  integrations: [icon()],
  // 기존에 공유된 /carpool 링크가 깨지지 않도록 /room 으로 리다이렉트
  redirects: {
    '/carpool': '/room',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
