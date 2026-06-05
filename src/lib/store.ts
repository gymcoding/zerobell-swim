/* ============================================================
 *  데이터 스토어 — @nanostores/query 기반
 *
 *  목적: 저장/삭제/체크를 "즉시" 보이게(낙관적 업데이트) + 서버 저장은 백그라운드.
 *  - jsonbin은 문서 1개를 통째로 GET/PUT 하므로 키는 단일.
 *  - 낙관적: getCacheUpdater 로 캐시를 먼저 바꿔 화면 즉시 반영(실패 시 자동 롤백).
 *  - 저장: 누적된 "현재 캐시 전체"를 직렬화 큐로 PUT → 빠른 연속 동작도 유실 없음.
 *  - 동기화: 쓰기 중이 아닐 때만 revalidate (낙관적 상태를 서버가 덮어쓰지 않게).
 * ============================================================ */
import { nanoquery } from '@nanostores/query';
import { getData, putData, type DB } from './jsonbin';

export const DB_KEY = 'zbswim-db';

const [createFetcherStore, createMutatorStore] = nanoquery({
  fetcher: async () => getData(),
  dedupeTime: 1500,
  revalidateOnFocus: false, // 아래에서 직접 제어(쓰기 중 덮어쓰기 방지)
  revalidateInterval: 0,
});

export const $db = createFetcherStore<DB>([DB_KEY]);

let pendingWrites = 0;
export const hasPendingWrites = () => pendingWrites > 0;

// 쓰기 직렬화 (동시 PUT로 인한 유실 방지)
let chain: Promise<unknown> = Promise.resolve();

/**
 * apply(db): 변경 함수. 변경된 db를 반환, null이면 변경 없음(검증 실패 등).
 * 호출 즉시 캐시가 바뀌어 화면에 반영되고, 서버 저장은 백그라운드로 진행됨.
 */
export const $apply = createMutatorStore<(db: DB) => DB | null>(
  async ({ data: apply, getCacheUpdater }) => {
    const [updateCache, current] = getCacheUpdater(DB_KEY);
    if (!current) return;
    const next = apply(structuredClone(current) as DB);
    if (!next) return; // no-op
    updateCache(next); // 즉시 화면 반영

    pendingWrites++;
    const task = chain.then(() => {
      const latest = ($db.get() as { data?: DB }).data;
      return latest ? putData(latest) : undefined; // 누적된 최신 캐시 저장
    });
    chain = task.catch(() => {}); // 체인 유지(다음 저장 계속)
    try {
      await task; // 실패 시 throw → getCacheUpdater 롤백
    } finally {
      pendingWrites--;
    }
  },
  { throttleCalls: false },
);

/** 쓰기 중이 아닐 때만 서버와 동기화 (폴링/포커스용) */
export function syncIfIdle() {
  if (!hasPendingWrites()) $db.revalidate();
}
