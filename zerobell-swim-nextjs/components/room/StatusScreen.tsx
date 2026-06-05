'use client';

import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDB, DB_KEY } from '@/hooks/use-db';
import { remaining } from '@/lib/domain';
import { cn } from '@/lib/utils';

/* ---------- updateStatusMeta (ported from room.ts) ---------- */
function formatMeta(ts: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const t = new Date(ts);
  return `마지막 갱신 ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())} · 자동 갱신`;
}

export function StatusScreen() {
  const { data: db, dataUpdatedAt, isFetching } = useDB();
  const qc = useQueryClient();

  const rides = db?.rides ?? [];
  const bookings = db?.bookings ?? [];

  /* ---------- 새로고침 ---------- */
  function handleRefresh() {
    qc.invalidateQueries({ queryKey: DB_KEY });
  }

  return (
    <section id="step-status" className="mt-6">
      {/* 새로고침 버튼 + 메타 */}
      <div className="flex items-center justify-end">
        <button
          id="refreshBtn"
          type="button"
          onClick={handleRefresh}
          className="tag bg-white px-4 py-2.5 min-h-[44px] font-round text-[15px] active:translate-y-0.5 transition flex items-center gap-1.5 shrink-0"
        >
          <span id="refreshIcon" className={cn('inline-flex', isFetching && 'spin')}>
            <RefreshCw className="w-4 h-4" />
          </span>{' '}
          새로고침
        </button>
      </div>
      <p id="statusMeta" className="font-round text-[13px] text-ink/50 mt-1 ml-1">
        {dataUpdatedAt ? formatMeta(dataUpdatedAt) : '불러오는 중…'}
      </p>

      {/* 현황 목록 (renderStatus) */}
      <div id="statusList" className="mt-3 space-y-3">
        {rides.length === 0 ? (
          <div className="sticker p-4 text-center font-round text-[15px] text-ink/50">
            등록된 카풀이 없어요
          </div>
        ) : (
          rides.map((ride) => {
            const riders = bookings.filter((b) => b.rideId === ride.id).map((b) => b.rider);
            const left = remaining(ride, bookings);
            return (
              <div key={ride.id} className="sticker p-4">
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg">
                    🚗 {ride.driver}{' '}
                    <span className="font-round text-[13px] text-pool">· {ride.from}</span>
                  </div>
                  <div
                    className={cn(
                      'font-round text-sm',
                      left <= 0 ? 'text-coral font-bold' : 'text-pool',
                    )}
                  >
                    {left <= 0 ? '마감' : `잔여 ${left}`}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="font-round text-[14px] text-ink/60">
                    🙋 {riders.length}/{ride.seats}
                  </span>
                  {riders.length ? (
                    riders.map((r) => (
                      <span key={r} className="tag bg-foam px-2.5 py-0.5 text-[14px] font-round">
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="font-round text-[14px] text-ink/40">아직 없음</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
