export function AtAGlance() {
  return (
    <section className="reveal grid grid-cols-2 gap-3 mt-6">
      <div className="sticker p-4 floaty">
        <div className="text-3xl">📅</div>
        <div className="font-round text-sm text-[var(--color-pool)] mt-1">언제</div>
        <div className="font-display text-xl">6/19 (금)</div>
      </div>
      <div className="sticker p-4 floaty" style={{ animationDelay: '.2s' }}>
        <div className="text-3xl">⏰</div>
        <div className="font-round text-sm text-[var(--color-pool)] mt-1">몇 시</div>
        <div className="font-display text-xl">9시~15시</div>
      </div>
      <div className="sticker p-4 floaty" style={{ animationDelay: '.4s' }}>
        <div className="text-3xl">📍</div>
        <div className="font-round text-sm text-[var(--color-pool)] mt-1">어디서</div>
        <div className="font-display text-lg leading-tight">통일워터파크</div>
      </div>
      <div className="sticker p-4 floaty" style={{ animationDelay: '.6s' }}>
        <div className="text-3xl">🧮</div>
        <div className="font-round text-sm text-[var(--color-pool)] mt-1">비용</div>
        <div className="font-display text-xl">다 같이 1/N</div>
      </div>
    </section>
  );
}
