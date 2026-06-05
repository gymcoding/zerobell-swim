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
        <DialogContent className={cn('max-w-[360px]')}>
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
