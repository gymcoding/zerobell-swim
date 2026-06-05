'use client';

import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDB, useRoomMutation } from '@/hooks/use-db';
import { useSession } from '@/hooks/use-session';
import * as R from '@/lib/reducers';
import { addItemAction, deleteItemAction } from '@/app/actions';
import { useConfirm } from '@/components/room/ConfirmDialog';
import { Comments } from '@/components/room/Comments';
import { cn } from '@/lib/utils';

export function ShopScreen() {
  const { data: db } = useDB();
  const mut = useRoomMutation();
  const { name: me } = useSession();
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const items = db?.items ?? [];

  function add() {
    const v = name.trim();
    if (!v) {
      inputRef.current?.focus();
      return;
    }
    mut.mutate({
      reduce: (d) => R.addItem(d, me, { name: v }),
      run: () => addItemAction(me, { name: v }),
    });
    setName('');
    // refocus after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    // IME 조합 중(한글 등) Enter 무시
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    add();
  }

  function askDelete(id: number, label: string) {
    confirm(
      <span>
        <b>{label}</b>
        <br />
        이 항목을 목록에서 지울까요?
      </span>,
      () => {
        mut.mutate({
          reduce: (d) => R.deleteItem(d, me, { id }),
          run: () => deleteItemAction(me, { id }),
        });
        toast('삭제했어요');
      },
    );
  }

  return (
    <section id="step-shop" className="mt-6">
      {/* 빠른 추가 */}
      <div className="sticker p-3 mt-3">
        <div className="flex gap-2 items-stretch">
          <input
            ref={inputRef}
            id="quickName"
            className="field font-round"
            style={{ fontSize: '18px', padding: '14px' }}
            type="text"
            maxLength={30}
            placeholder="살 거 입력 (예: 삼겹살)"
            aria-label="살 거 입력"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            id="quickAdd"
            type="button"
            aria-label="추가"
            onClick={add}
            className="btn-3d rounded-[16px] bg-coral text-white px-5 shrink-0 grid place-items-center"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div id="shopList" className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="sticker p-6 text-center font-round text-[17px] text-ink/60">
            아직 추가된 항목이 없어요 🛒
            <br />
            위 칸에 살 거를 적어주세요!
          </div>
        ) : (
          items.map((it) => {
            const mineItem = !!me && it.addedBy === me;
            return (
              <div key={it.id} className="sticker p-4 flex items-center gap-3">
                {it.addedBy ? (
                  <span
                    className={cn(
                      'shrink-0 tag px-2.5 py-1 font-round text-[13px] max-w-[84px] truncate',
                      mineItem ? 'bg-sun' : 'bg-foam',
                    )}
                  >
                    {it.addedBy}
                  </span>
                ) : (
                  <span className="shrink-0 w-[52px]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl truncate">{it.name}</div>
                </div>
                {mineItem && (
                  <button
                    type="button"
                    aria-label="삭제"
                    onClick={() => askDelete(it.id, it.name)}
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

      {/* 의견(댓글) */}
      <Comments />
    </section>
  );
}
