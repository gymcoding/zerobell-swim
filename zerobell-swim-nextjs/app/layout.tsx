import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: '🌊 원정수영 준비방 · 카풀 & 장보기',
  description: '카풀 매칭 + 장보기 목록을 한 곳에서!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        <div className="relative mx-auto w-full max-w-[460px] min-h-[100dvh] overflow-hidden bg-cream">
          <Providers>{children}</Providers>
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
