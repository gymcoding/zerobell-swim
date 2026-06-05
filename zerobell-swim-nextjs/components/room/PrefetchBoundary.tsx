import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { getDB } from '@/lib/get-db';

// DB_KEY을 직접 정의 — use-db.ts는 'use client' 파일이라 RSC에서 import 불가
const DB_KEY = ['db'] as const;

export async function PrefetchBoundary({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: [...DB_KEY], queryFn: getDB });
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
