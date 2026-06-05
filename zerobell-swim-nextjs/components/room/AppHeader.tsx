import Link from 'next/link';
import { ArrowLeft, House } from 'lucide-react';

/**
 * 공통 모바일 앱 헤더 (고정 상단 바)
 * - 뒤로/홈은 next/link 링크 → 클라이언트 네비게이션.
 * - 래퍼가 overflow-hidden이라 sticky 대신 fixed + 중앙정렬.
 */
const pill =
  'shrink-0 grid place-items-center w-11 h-11 rounded-full bg-white border-[2.5px] border-ink shadow-[2px_2px_0_var(--color-ink)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-ink)] transition';

export function AppHeader({ title, backHref = '/room' }: { title: string; backHref?: string }) {
  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[460px] pool-bg text-white border-b-[3px] border-ink shadow-[0_4px_0_rgba(6,48,71,.18)]">
      <div className="flex items-center gap-2 px-3" style={{ minHeight: '56px', paddingTop: 'env(safe-area-inset-top)' }}>
        <Link href={backHref} aria-label="뒤로" className={`${pill} text-ink`}>
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="flex-1 text-center font-display text-xl leading-none truncate drop-shadow-[2px_2px_0_rgba(6,48,71,.35)]">
          {title}
        </h1>
        <Link href="/room" aria-label="처음으로" className={`${pill} text-ink`}>
          <House className="w-6 h-6" />
        </Link>
      </div>
    </header>
  );
}
