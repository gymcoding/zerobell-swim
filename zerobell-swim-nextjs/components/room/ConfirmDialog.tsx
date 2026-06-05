'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConfirmFn = (message: ReactNode, onYes: () => void) => void;
const Ctx = createContext<ConfirmFn>(() => {});
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<ReactNode>(null);
  const [cb, setCb] = useState<{ fn: () => void }>({ fn: () => {} });
  const confirm = useCallback<ConfirmFn>((message, onYes) => {
    setMsg(message); setCb({ fn: onYes }); setOpen(true);
  }, []);
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        {/* 브랜드 스티커 룩: base-nova DialogContent의 기본 유틸을 이기도록 유틸로 override
            (color는 토큰 유틸 border-ink/bg-white, 모양·그림자는 1회성 arbitrary — 정당) */}
        <DialogContent className={cn('max-w-[360px] border-[3px] border-ink rounded-[26px] bg-white shadow-[5px_6px_0_var(--color-ink)]')}>
          <DialogHeader><DialogTitle className="font-display text-xl">확인</DialogTitle></DialogHeader>
          <div className="font-round text-base">{msg}</div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="font-round">취소</Button>
            <Button variant="sticker" onClick={() => { setOpen(false); cb.fn(); }}>네</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
