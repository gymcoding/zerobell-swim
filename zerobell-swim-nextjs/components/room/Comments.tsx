'use client';

import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDB, useRoomMutation } from '@/hooks/use-db';
import { useSession } from '@/hooks/use-session';
import * as R from '@/lib/reducers';
import { addCommentAction, deleteCommentAction } from '@/app/actions';
import { useConfirm } from '@/components/room/ConfirmDialog';

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

export function Comments() {
  const { data: db } = useDB();
  const mut = useRoomMutation();
  const { name: me } = useSession();
  const confirm = useConfirm();

  const [commentText, setCommentText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  /* ---------- 정렬된 댓글 ---------- */
  const sortedComments = [...comments].sort((a, b) => a.at - b.at);

  return (
    <div className="mt-9">
      <div className="flex items-center gap-2">
        <span className="text-2xl">💬</span>
        <h2 className="font-display text-2xl">
          <span className="marker">의견 남기기</span>
        </h2>
      </div>
      <p className="font-round text-[14px] text-pool mt-1 ml-1">하고 싶은 말·질문을 자유롭게!</p>

      {/* 목록 */}
      <div id="commentList" className="mt-3 space-y-2">
        {sortedComments.map((c) => {
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
        })}
      </div>

      {/* 입력 */}
      <div className="sticker p-3 mt-3">
        <div className="flex gap-2 items-stretch">
          <input
            ref={inputRef}
            id="commentInput"
            className="field font-round"
            style={{ fontSize: '18px', padding: '14px' }}
            type="text"
            maxLength={100}
            placeholder="의견을 적어주세요"
            aria-label="의견 입력"
            autoComplete="off"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            id="commentBtn"
            type="button"
            onClick={addComment}
            className="btn-3d rounded-[16px] bg-aqua text-white font-round text-lg px-4 shrink-0"
          >
            남기기
          </button>
        </div>
      </div>
    </div>
  );
}
