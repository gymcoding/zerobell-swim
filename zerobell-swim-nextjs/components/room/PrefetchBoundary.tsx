import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { getDB } from '@/lib/get-db';
import { DB_KEY } from '@/lib/db-types';

export async function PrefetchBoundary({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: [...DB_KEY], queryFn: getDB });
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
