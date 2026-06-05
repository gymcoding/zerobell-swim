export function Hero() {
  return (
    <header className="pool-bg relative overflow-hidden text-white pt-12 pb-24 px-5">
      <div className="caustics absolute inset-0 opacity-60 mix-blend-overlay" />
      {/* bubbles */}
      <div id="bubbles" className="absolute inset-0" />

      <div className="relative z-10 text-center">
        <div
          className="reveal inline-flex items-center gap-1.5 tag bg-white text-[var(--color-ocean)] px-4 py-1.5 text-sm font-extrabold"
          style={{ animationDelay: '.05s' }}
        >
          🤝 제로벨 7시 강습 단합 데이
        </div>

        <h1
          className="reveal font-display leading-[0.95] mt-5 drop-shadow-[3px_4px_0_rgba(6,48,71,.35)]"
          style={{ animationDelay: '.15s' }}
        >
          <span className="block text-[clamp(44px,15vw,72px)] text-[var(--color-sun)]">통일로</span>
          <span className="block text-[clamp(48px,16vw,80px)] text-white">원정수영</span>
        </h1>

        <p
          className="reveal font-round text-lg mt-4 text-white/95"
          style={{ animationDelay: '.28s' }}
        >
          다 같이 놀러 가자! 안 가면 진짜 후회각 🤙
        </p>

        {/* D-day plate */}
        <div className="reveal mt-7 flex justify-center" style={{ animationDelay: '.4s' }}>
          <div className="sticker wobble text-[var(--color-ink)] px-6 py-3 inline-flex items-end gap-3">
            <div className="text-left">
              <div className="font-hand text-base leading-none text-[var(--color-coral)] font-bold">D-DAY</div>
              <div className="font-display text-4xl leading-none">6.19</div>
            </div>
            <div className="font-round text-lg pb-0.5">
              금요일
              <br />
              <span className="text-sm text-[var(--color-pool)]">통일워터파크</span>
            </div>
          </div>
        </div>

        <a
          href="https://open.kakao.com/o/g188H7vi"
          rel="noopener"
          className="reveal mt-8 inline-block w-full"
          style={{ animationDelay: '.52s' }}
        >
          <span className="cta-pulse block w-full font-round text-xl text-white bg-[var(--color-coral)] border-[3px] border-[var(--color-ink)] rounded-[20px] py-4 shadow-[4px_5px_0_var(--color-ink)] active:translate-y-1 active:shadow-[2px_2px_0_var(--color-ink)] transition-all">
            👉 나도 갈래! 오픈채팅 들어가기
          </span>
        </a>
        <p
          className="reveal text-white/80 text-xs mt-2 font-round"
          style={{ animationDelay: '.6s' }}
        >
          제로벨 7시 강습 멤버라면 누구나 환영 🙌
        </p>
      </div>

      {/* wave divider */}
      <svg
        className="absolute -bottom-1 left-0 w-full"
        viewBox="0 0 460 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,30 C90,60 150,5 230,25 C320,48 380,8 460,28 L460,60 L0,60 Z"
          fill="var(--color-cream)"
        />
      </svg>
    </header>
  );
}
