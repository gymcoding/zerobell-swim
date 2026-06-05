export function PoolBanner() {
  return (
    <header className="pool-bg relative overflow-hidden text-white pt-9 pb-16 px-5">
      <div className="relative z-10 text-center">
        <a
          href="/"
          className="tag inline-flex items-center gap-1 bg-white/95 text-ocean px-3 py-1 text-xs font-extrabold active:translate-y-0.5 transition"
        >
          ← 행사 안내로
        </a>
        <h1 className="font-display leading-[0.95] mt-4 drop-shadow-[3px_4px_0_rgba(6,48,71,.35)]">
          <span className="block text-[clamp(34px,11vw,52px)] text-sun">🌊 원정수영 준비방</span>
        </h1>
        <p className="font-round text-base mt-3 text-white/95">
          영종 → 통일워터파크 · 6/19(금)<br />🚗 카풀 매칭 · 🛒 장보기 목록
        </p>
      </div>
      <svg
        className="absolute -bottom-1 left-0 w-full"
        viewBox="0 0 460 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,20 C90,40 150,3 230,16 C320,32 380,5 460,18 L460,40 L0,40 Z" fill="var(--color-cream)" />
      </svg>
    </header>
  );
}
