export function Pricing() {
  return (
    <section className="reveal mt-10">
      <div className="flex items-center gap-2">
        <span className="text-3xl">💸</span>
        <h2 className="font-display text-3xl">
          <span className="marker">요금은 어떻게?</span>
        </h2>
      </div>

      {/* 핵심: 모든 비용 1/N */}
      <div className="sticker mt-4 p-5 text-center" style={{ background: 'linear-gradient(180deg,#e8fbff,#fff)' }}>
        <p className="font-round text-[15px]">
          아래 비용을 <b>전부 합쳐서</b>
        </p>
        <div className="font-display text-5xl text-[var(--color-coral)] my-1">1 / N</div>
        <p className="font-round text-[15px] leading-relaxed">
          총비용을 <b>똑같이 나눠 내요!</b>
        </p>
        <div className="mt-4 font-round text-[15px] leading-relaxed bg-[var(--color-foam)] rounded-2xl p-3">
          🎟️ 입장료 ＋ 🏖️ 평상 ＋ 🛒 장보기(고기 등)
          <br />
          <b className="text-[var(--color-ocean)]">= 총비용 ÷ 인원</b>
        </div>
      </div>

      {/* 확정 단가 (6월 평일) */}
      <p className="font-round text-sm text-[var(--color-pool)] mt-5 ml-1">
        💡 통일워터파크 <b>6월 평일 확정 요금</b>이에요 (6/19은 금요일!)
      </p>
      <div className="sticker mt-2 p-5 space-y-3 font-round text-[15px]">
        <div className="flex justify-between items-center">
          <span>🎟️ 입장권 (성인·소인)</span>
          <b className="font-display text-lg">1만원</b>
        </div>
        <div className="h-px bg-[var(--color-ink)]/10" />
        <div className="flex justify-between items-center">
          <span>🏖️ 방갈로 (대)</span>
          <b className="font-display text-lg">3만원</b>
        </div>
        <div className="h-px bg-[var(--color-ink)]/10" />
        <div className="flex justify-between items-center">
          <span>🏖️ 방갈로 (중)</span>
          <b className="font-display text-lg">2만원</b>
        </div>
        <div className="h-px bg-[var(--color-ink)]/10" />
        <div className="flex justify-between items-center">
          <span>🪵 평상·테이블</span>
          <b className="font-display text-lg">1만원</b>
        </div>
        <div className="h-px bg-[var(--color-ink)]/10" />
        <div className="flex justify-between items-center">
          <span>🛒 장보기 (고기·식재료 등)</span>
          <b>현장 정산</b>
        </div>
        <p className="text-sm font-bold text-[var(--color-pool)] pt-1">
          * 소인 = 12개월~초등학생, 중학생부터는 대인 요금
        </p>
      </div>
    </section>
  );
}
