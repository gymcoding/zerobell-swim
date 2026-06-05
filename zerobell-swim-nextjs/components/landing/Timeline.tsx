export function Timeline() {
  return (
    <section className="reveal mt-10">
      <div className="flex items-center gap-2">
        <span className="text-3xl">🗓️</span>
        <h2 className="font-display text-3xl">
          <span className="marker">당일 일정</span>
        </h2>
      </div>
      <p className="font-round text-sm text-[var(--color-pool)] mt-1">
        6/19(금) · 상황에 따라 살짝 변동될 수 있어요 😉
      </p>

      <ol className="mt-4 relative border-l-[3px] border-dashed border-[var(--color-aqua)] ml-3 space-y-4">
        <li className="relative pl-5">
          <span className="absolute -left-[11px] top-1 w-4 h-4 rounded-full bg-[var(--color-coral)] border-2 border-[var(--color-ink)]" />
          <div className="sticker p-3" style={{ background: 'linear-gradient(180deg,#fff,#fff3f4)' }}>
            <div className="font-display text-lg text-[var(--color-coral)]">07:40~50 🚗 영종 출발</div>
            <p className="font-round text-sm text-[var(--color-ink)]/70">영종에서 약 50분 소요돼요</p>
          </div>
        </li>
        <li className="relative pl-5">
          <span className="absolute -left-[10px] top-1.5 w-3 h-3 rounded-full bg-[var(--color-pool)] border-2 border-[var(--color-ink)]" />
          <div className="font-round text-[15px]">
            <b className="font-display">08:40</b> 📍 통일워터파크 도착 & 티켓팅{' '}
            <span className="block text-sm text-[var(--color-pool)]">
              예약 없이 선착순! 일찍 오면 평상 좋은 자리 맡아요 🏖️
            </span>
          </div>
        </li>
        <li className="relative pl-5">
          <span className="absolute -left-[11px] top-1 w-4 h-4 rounded-full bg-[var(--color-pink)] border-2 border-[var(--color-ink)]" />
          <div className="sticker p-3" style={{ background: 'linear-gradient(180deg,#fff,#ffeef5)' }}>
            <div className="font-display text-lg">09:00 👕 입장 및 환복</div>
            <p className="font-round text-sm text-[var(--color-ink)]/70">락커에 짐 넣고 가볍게 준비운동 💪</p>
          </div>
        </li>
        <li className="relative pl-5">
          <span className="absolute -left-[10px] top-1.5 w-3 h-3 rounded-full bg-[var(--color-pool)] border-2 border-[var(--color-ink)]" />
          <div className="font-round text-[15px]">
            <b className="font-display">09:30</b> 🏊 입수 & 자유수영
          </div>
        </li>
        <li className="relative pl-5">
          <span className="absolute -left-[11px] top-1 w-4 h-4 rounded-full bg-[var(--color-mango)] border-2 border-[var(--color-ink)]" />
          <div className="sticker p-3" style={{ background: 'linear-gradient(180deg,#fff,#fff7e6)' }}>
            <div className="font-display text-lg text-[var(--color-mango)]">11:30 🥩 고기파티</div>
            <p className="font-round text-sm text-[var(--color-ink)]/70">
              지글지글 직접 구워 먹는 오늘의 하이라이트 🔥
            </p>
          </div>
        </li>
        <li className="relative pl-5">
          <span className="absolute -left-[10px] top-1.5 w-3 h-3 rounded-full bg-[var(--color-pool)] border-2 border-[var(--color-ink)]" />
          <div className="font-round text-[15px]">
            🏖️ 이후 <b>자유 수영 · 갬성 촬영 · 수영 꿀팁 물어보기</b>!
          </div>
        </li>
        <li className="relative pl-5">
          <span className="absolute -left-[10px] top-1.5 w-3 h-3 rounded-full bg-[var(--color-pool)] border-2 border-[var(--color-ink)]" />
          <div className="font-round text-[15px]">
            <b className="font-display">15:00</b> 🧹 청소 ~ 퇴수
          </div>
        </li>
        <li className="relative pl-5">
          <span className="absolute -left-[11px] top-1 w-4 h-4 rounded-full bg-[var(--color-sun)] border-2 border-[var(--color-ink)]" />
          <div className="sticker p-3" style={{ background: 'linear-gradient(180deg,#fff,#fff7e6)' }}>
            <div className="font-display text-lg text-[var(--color-mango)]">🍻 영종 도착 후 뒷풀이</div>
            <p className="font-round text-sm text-[var(--color-ink)]/70">
              단, 참석하실 분들에 한하여 자유롭게~ 🙌
            </p>
          </div>
        </li>
      </ol>
    </section>
  );
}
