export function BbqParty() {
  return (
    <section className="reveal mt-10">
      <div className="flex items-center gap-2">
        <span className="text-3xl wobble inline-block">🎉</span>
        <h2 className="font-display text-3xl">
          <span className="marker">통일로 이벤트</span>
        </h2>
      </div>

      {/* ⭐ 메인 이벤트: 고기파티 */}
      <div
        className="grill-glow relative mt-4 overflow-hidden rounded-[28px] border-[3px] border-[var(--color-ink)] text-white"
        style={{
          background:
            'radial-gradient(130% 95% at 78% -5%, rgba(255,214,10,.9), transparent 52%), linear-gradient(155deg,#ff9e00 0%,#ff5d73 100%)',
        }}
      >
        {/* 불씨 */}
        <span className="ember" style={{ left: '22%', animationDuration: '3.2s' }} />
        <span className="ember" style={{ left: '48%', animationDuration: '2.6s', animationDelay: '.6s' }} />
        <span className="ember" style={{ left: '70%', animationDuration: '3.6s', animationDelay: '1.1s' }} />
        <span className="ember" style={{ left: '86%', animationDuration: '2.9s', animationDelay: '.3s' }} />

        {/* 메인 배지 */}
        <div className="absolute top-3 right-3 z-10 tag bg-[var(--color-ink)] text-[var(--color-sun)] px-3 py-1 text-xs font-extrabold rotate-3 wobble">
          ⭐ 오늘의 메인
        </div>

        <div className="relative z-10 p-5">
          <div className="text-6xl sizzle inline-block drop-shadow-[2px_4px_0_rgba(6,48,71,.45)]">🥩</div>
          <h3 className="font-display text-[40px] leading-none mt-1 drop-shadow-[2px_3px_0_rgba(6,48,71,.4)]">
            고기파티 🔥
          </h3>
          <p className="font-round text-lg mt-2 text-white/95 leading-snug">
            현장에서 <b>지글지글</b> 직접 구워 먹는
            <br />
            이게 진짜 오늘의 <b>하이라이트!</b> 🤤
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 bg-white text-[var(--color-ink)] rounded-2xl p-3 shadow-[2px_2px_0_rgba(6,48,71,.25)]">
              <span className="text-xl">🛒</span>
              <p className="font-round text-[15px] leading-snug">
                <b>장보기는 전날 미리!</b> <b>장보기 멤버</b> 꾸려서 장볼 예정이에요. 먹고 싶은{' '}
                <b>먹거리</b>는 <b className="text-[var(--color-coral)]">단톡방에서</b> 취합해요 🛒
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white text-[var(--color-ink)] rounded-2xl p-3 shadow-[2px_2px_0_rgba(6,48,71,.25)]">
              <span className="text-xl">🍻</span>
              <p className="font-round text-[15px] leading-snug">
                간단한 <b>주류</b> 한잔 생각 있으면 <b className="text-[var(--color-coral)]">단톡방에 말씀</b>해주세요~
              </p>
            </div>
          </div>

          <div className="mt-4 text-center bg-[var(--color-ink)]/90 rounded-2xl py-3 px-4">
            <p className="font-round text-lg text-white leading-snug">
              7시 강습 식구들 <b className="text-[var(--color-sun)]">다 같이 모여</b>
              <br />
              고기 굽고 단합! <b className="text-[var(--color-sun)]">아자아자 🙌🔥</b>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
