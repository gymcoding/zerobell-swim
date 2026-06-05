export function Faq() {
  return (
    <section className="reveal mt-10">
      <div className="flex items-center gap-2">
        <span className="text-3xl">💬</span>
        <h2 className="font-display text-3xl">
          <span className="marker">자주 묻는 질문</span>
        </h2>
      </div>
      <div className="mt-4 space-y-2.5">
        <details className="sticker p-4 group">
          <summary className="font-round font-bold text-[15px] flex justify-between items-center cursor-pointer list-none">
            수영 못해도 가도 되나요?
            <span className="transition-transform group-open:rotate-45 text-[var(--color-coral)] text-xl">+</span>
          </summary>
          <p className="font-round text-[14px] text-[var(--color-ink)]/80 mt-2">
            당연하죠! 초·중·상급 <b>다 같이</b> 노는 자리예요. 못해도 자유수영·물놀이만 즐겨도 충분히 재밌어요 🤙
          </p>
        </details>
        <details className="sticker p-4 group">
          <summary className="font-round font-bold text-[15px] flex justify-between items-center cursor-pointer list-none">
            혼자 가도 어색하지 않을까요?
            <span className="transition-transform group-open:rotate-45 text-[var(--color-coral)] text-xl">+</span>
          </summary>
          <p className="font-round text-[14px] text-[var(--color-ink)]/80 mt-2">
            카풀·자리·고기 다 <b>같이</b> 하는 단합 데이라 금방 친해져요! 강습 식구들이니 부담 갖지 말고 와요 🙌
          </p>
        </details>
        <details className="sticker p-4 group">
          <summary className="font-round font-bold text-[15px] flex justify-between items-center cursor-pointer list-none">
            중간에 합류하거나 먼저 가도 되나요?
            <span className="transition-transform group-open:rotate-45 text-[var(--color-coral)] text-xl">+</span>
          </summary>
          <p className="font-round text-[14px] text-[var(--color-ink)]/80 mt-2">
            자유롭게 OK! 다만 <b>카풀</b> 타는 분은 출발·귀가 시간을 <b>단톡방</b>에서 미리 맞춰주세요 🚗
          </p>
        </details>
        <details className="sticker p-4 group">
          <summary className="font-round font-bold text-[15px] flex justify-between items-center cursor-pointer list-none">
            비 오면 어떻게 되나요?
            <span className="transition-transform group-open:rotate-45 text-[var(--color-coral)] text-xl">+</span>
          </summary>
          <p className="font-round text-[14px] text-[var(--color-ink)]/80 mt-2">
            날씨 상황 보고 진행 여부를 <b>단톡방에서 같이 의논</b>해요! 출발 전 단톡방에서 의견 나눠요 ☔
          </p>
        </details>
        <details className="sticker p-4 group">
          <summary className="font-round font-bold text-[15px] flex justify-between items-center cursor-pointer list-none">
            비용은 언제 정산해요?
            <span className="transition-transform group-open:rotate-45 text-[var(--color-coral)] text-xl">+</span>
          </summary>
          <p className="font-round text-[14px] text-[var(--color-ink)]/80 mt-2">
            입장료·자리·장보기 <b>모두 합쳐 1/N</b>! 현장에서 쓴 만큼 모아서 <b>단톡방으로 깔끔하게</b> 정산해요 🧮
          </p>
        </details>
        <details className="sticker p-4 group">
          <summary className="font-round font-bold text-[15px] flex justify-between items-center cursor-pointer list-none">
            상급반만 가는 모임인가요?
            <span className="transition-transform group-open:rotate-45 text-[var(--color-coral)] text-xl">+</span>
          </summary>
          <p className="font-round text-[14px] text-[var(--color-ink)]/80 mt-2">
            전혀 아니에요! <b>초급·중급·상급 누구나</b> 참여 가능한 자리예요 🙆 혹시 <b>초·중급반 단톡방</b>에 계신 분들 있으면 이 링크 <b>꼭 공유</b>해 주세요. 다 같이 가면 더 재밌으니까요! 🔗
          </p>
        </details>
      </div>
    </section>
  );
}
