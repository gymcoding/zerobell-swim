import type { Metadata } from 'next';
import { Hero } from '@/components/landing/Hero';
import { AtAGlance } from '@/components/landing/AtAGlance';
import { Timeline } from '@/components/landing/Timeline';
import { Pricing } from '@/components/landing/Pricing';
import { BbqParty } from '@/components/landing/BbqParty';
import { Checklist } from '@/components/landing/Checklist';
import { Faq } from '@/components/landing/Faq';
import { Directions } from '@/components/landing/Directions';
import { FinalCta } from '@/components/landing/FinalCta';
import { LandingEffects } from '@/components/landing/LandingEffects';

export const metadata: Metadata = {
  title: '제로벨 7시 강습 ⚡ 통일로 원정수영 (6/19 금)',
  description: '고기 굽고 🥩 다 같이 단합! 하실 분은 오픈채팅으로 고고~',
  openGraph: {
    title: '제로벨 7시반 통일로 원정수영 · 초·중·상급 단합 데이 (6/19 금)',
    description: '고기 굽고 🥩 다 같이 단합! 하실 분은 오픈채팅으로 고고~',
    images: ['/og.png'],
  },
};

export default function LandingPage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <Hero />

      <main className="px-5 pb-40 -mt-2">
        {/* ============ 한눈에 보기 ============ */}
        <AtAGlance />

        {/* ============ 당일 일정 타임라인 ============ */}
        <Timeline />

        {/* ============ 요금 & 정산 ============ */}
        <Pricing />

        {/* ============ 이벤트 ============ */}
        <BbqParty />

        {/* ============ 준비물 ============ */}
        <Checklist />

        {/* ============ FAQ ============ */}
        <Faq />

        {/* ============ 오시는 길 / 카풀 ============ */}
        <Directions />

        {/* ============ 최종 CTA ============ */}
        <FinalCta />

        <footer className="text-center mt-12 font-hand text-[var(--color-pool)] text-lg">
          제로벨 7시 강습 · 통일로 원정수영 🌊
          <br />
          <span className="text-sm text-[var(--color-ink)]/50 font-round">2026. 6. 19 (금)</span>
        </footer>
      </main>

      {/* ============ STICKY 하단 CTA ============ */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 z-50 w-full max-w-[460px] px-4 pt-2 safe-bottom bg-gradient-to-t from-[var(--color-cream)] via-[var(--color-cream)] to-transparent">
        <a
          href="https://open.kakao.com/o/g188H7vi"
          rel="noopener"
          className="cta-pulse flex items-center justify-center gap-2 w-full font-round text-lg text-white bg-[var(--color-coral)] border-[3px] border-[var(--color-ink)] rounded-full py-3.5 shadow-[3px_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-[1px_1px_0_var(--color-ink)] transition-all"
        >
          <span className="text-xl">💬</span> 나도 갈래! 오픈채팅 입장
        </a>
      </div>

      <LandingEffects />
    </>
  );
}
