import { QueryClient, isServer } from '@tanstack/react-query';
import { POLL_MS } from './db-types';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // hydrate 직후 즉시 refetch 방지(깜빡임 0 유지). refetchInterval과 독립.
        staleTime: POLL_MS,
        refetchOnWindowFocus: true,
      },
    },
  });
}
let browserClient: QueryClient | undefined;
export function getQueryClient() {
  if (isServer) return makeQueryClient();      // 요청마다 새로(요청 간 데이터 누수 방지)
  return (browserClient ??= makeQueryClient()); // 브라우저는 싱글톤
}
