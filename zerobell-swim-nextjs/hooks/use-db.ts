'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { POLL_MS, type DB } from '@/lib/db-types';
import { toast } from 'sonner';

export const DB_KEY = ['db'] as const;

async function fetchDB(): Promise<DB> {
  const res = await fetch('/api/db', { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

export function useDB() {
  return useQuery({ queryKey: DB_KEY, queryFn: fetchDB, refetchInterval: POLL_MS });
}

/**
 * 낙관적 변경: reduce(현재 캐시 clone)로 즉시 반영, run()으로 서버 커밋.
 * onMutate에서 cancelQueries로 진행중 refetch가 낙관적 값을 덮어쓰지 않게 함(공식 패턴).
 * (7초 interval 틱 경합은 onSettled invalidate로 최종 정합 — spec 5 참고.)
 */
export function useRoomMutation() {
  const qc = useQueryClient();
  return useMutation<DB, Error, { reduce: (db: DB) => DB | null; run: () => Promise<DB> }, { prev?: DB }>({
    mutationFn: (m) => m.run(),
    onMutate: async (m) => {
      await qc.cancelQueries({ queryKey: DB_KEY });
      const prev = qc.getQueryData<DB>(DB_KEY);
      if (prev) {
        const next = m.reduce(structuredClone(prev));
        if (next) qc.setQueryData(DB_KEY, next);
      }
      return { prev };
    },
    onError: (_e, _m, ctx) => {
      if (ctx?.prev) qc.setQueryData(DB_KEY, ctx.prev);
      toast.error('⚠️ 저장에 실패했어요. 다시 시도해 주세요');
    },
    onSuccess: (server) => qc.setQueryData(DB_KEY, server), // 서버 권위값 반영
    onSettled: () => qc.invalidateQueries({ queryKey: DB_KEY }),
  });
}
