export function FinalCta() {
  return (
    <section className="reveal mt-12 text-center">
      <h2 className="font-display text-3xl leading-tight">
        같이 가면 <span className="text-[var(--color-coral)]">10배</span>
        <br />
        재밌는 거 알죠? 😎
      </h2>
      <p className="font-round text-[15px] text-[var(--color-ink)]/70 mt-3">
        하실 분은 지금 바로 오픈채팅으로 고고!
      </p>
      <a
        href="https://open.kakao.com/o/g188H7vi"
        rel="noopener"
        className="mt-5 inline-block w-full"
      >
        <span className="block w-full font-round text-xl text-white pool-bg border-[3px] border-[var(--color-ink)] rounded-[20px] py-4 shadow-[4px_5px_0_var(--color-ink)] active:translate-y-1 active:shadow-[2px_2px_0_var(--color-ink)] transition-all">
          💬 오픈채팅방 입장하기
        </span>
      </a>

      {/* 오픈채팅 입장코드 */}
      <div className="sticker mt-4 p-4" style={{ background: 'linear-gradient(180deg,#fff7e6,#fff)' }}>
        <p className="font-round text-sm text-[var(--color-ink)]/70">
          🔑 입장코드 <span className="text-[var(--color-coral)] font-bold">(7시 강습이니까 럭키세븐!)</span>
        </p>
        <div className="font-display text-4xl tracking-[0.25em] text-[var(--color-ocean)] mt-1">7️⃣7️⃣7️⃣7️⃣</div>
        <p className="font-round text-sm text-[var(--color-ink)]/60 mt-1">
          입장 시 <b className="text-[var(--color-ink)]">7777</b> 입력하면 끝! 🎉
        </p>
      </div>
    </section>
  );
}
