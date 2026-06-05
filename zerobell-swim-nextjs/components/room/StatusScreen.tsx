'use client';

import { useRef, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDB, useRoomMutation, DB_KEY } from '@/hooks/use-db';
import { useSession } from '@/hooks/use-session';
import { remaining } from '@/lib/domain';
import * as R from '@/lib/reducers';
import { addCommentAction, deleteCommentAction } from '@/app/actions';
import { useConfirm } from '@/components/room/ConfirmDialog';
import { cn } from '@/lib/utils';

/* ---------- timeAgo (ported from room.ts) ---------- */
function timeAgo(at: number): string {
  if (!at) return '';
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return '방금';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

/* ---------- updateStatusMeta (ported from room.ts) ---------- */
function formatMeta(ts: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const t = new Date(ts);
  return `마지막 갱신 ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())} · 자동 갱신`;
}

export function StatusScreen() {
  const { data: db, dataUpdatedAt, isFetching } = useDB();
  const mut = useRoomMutation();
  const { name: me } = useSession();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const rides = db?.rides ?? [];
  const bookings = db?.bookings ?? [];
  const comments = db?.comments ?? [];

  /* ---------- 댓글 추가 ---------- */
  function addComment() {
    const text = commentText.trim();
    if (!text) {
      inputRef.current?.focus();
      return;
    }
    const at = Date.now();
    mut.mutate({
      reduce: (d) => R.addComment(d, me, { text, at }),
      run: () => addCommentAction(me, { text, at }),
    });
    setCommentText('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    addComment();
  }

  /* ---------- 댓글 삭제 ---------- */
  function askDeleteComment(id: number) {
    confirm('이 댓글을 지울까요?', () => {
      mut.mutate({
        reduce: (d) => R.deleteComment(d, me, { id }),
        run: () => deleteCommentAction(me, { id }),
      });
    });
  }

  /* ---------- 새로고침 ---------- */
  function handleRefresh() {
    qc.invalidateQueries({ queryKey: DB_KEY });
  }

  /* ---------- 정렬된 댓글 ---------- */
  const sortedComments = [...comments].sort((a, b) => a.at - b.at);

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

      {/* 댓글 섹션 (renderComments + addComment) */}
      <div className="mt-8">
        <h2 className="font-display text-xl ml-1 mb-3">💬 자유 게시판</h2>

        {/* 입력 */}
        <div className="sticker p-3">
          <div className="flex gap-2 items-stretch">
            <input
              ref={inputRef}
              id="commentInput"
              className="field font-round"
              style={{ fontSize: '16px', padding: '12px 14px' }}
              type="text"
              maxLength={200}
              placeholder="의견을 남겨보세요"
              aria-label="댓글 입력"
              autoComplete="off"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              id="commentBtn"
              type="button"
              onClick={addComment}
              className="btn-3d rounded-[16px] bg-coral text-white px-5 shrink-0 grid place-items-center font-round text-[15px]"
            >
              등록
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div id="commentList" className="mt-3 space-y-2">
          {sortedComments.length === 0 ? (
            <div className="font-round text-[14px] text-ink/45 ml-1">
              아직 의견이 없어요. 첫 의견을 남겨보세요!
            </div>
          ) : (
            sortedComments.map((c) => {
              const mineC = !!me && c.by === me;
              return (
                <div key={c.id} className="sticker p-3 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-round text-[15px]">
                      <b className="text-ocean">{c.by}</b>{' '}
                      <span className="text-[12px] text-ink/40">{timeAgo(c.at)}</span>
                    </div>
                    <div className="font-round text-[16px] mt-0.5 break-words whitespace-pre-wrap">
                      {c.text}
                    </div>
                  </div>
                  {mineC && (
                    <button
                      type="button"
                      aria-label="삭제"
                      onClick={() => askDeleteComment(c.id)}
                      className="shrink-0 text-coral grid place-items-center"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
