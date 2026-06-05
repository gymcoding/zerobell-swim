export function Checklist() {
  return (
    <section className="reveal mt-10">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🎒</span>
        <h2 className="font-display text-3xl">
          <span className="marker">준비물 체크</span>
        </h2>
      </div>
      <div className="sticker mt-4 p-5 space-y-2.5 font-round text-[15px]">
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 accent-[var(--color-coral)]" />
          <span>
            🩴 <b>맨발 or 아쿠아슈즈</b>{' '}
            <span className="text-[var(--color-coral)] text-sm">(안에선 신발 못 신어요!)</span>
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 accent-[var(--color-coral)]" />
          <span>👙 수영복 · 수모 · 수건</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 accent-[var(--color-coral)]" />
          <span>
            🧴 <b className="text-[var(--color-coral)]">선크림</b>{' '}
            <span className="text-[var(--color-coral)] text-sm font-bold">(매우 필수!! ☀️)</span>
          </span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 accent-[var(--color-coral)]" />
          <span>🧖 판초타월 또는 비치타월</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="w-5 h-5 accent-[var(--color-coral)]" />
          <span>
            🩱 숏핀 <span className="text-[var(--color-pool)] text-sm">(선택 · 롱핀❌ 숏핀만 OK)</span>
          </span>
        </label>
      </div>
    </section>
  );
}
