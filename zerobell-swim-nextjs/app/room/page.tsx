import { PrefetchBoundary } from '@/components/room/PrefetchBoundary';
import { PoolBanner } from '@/components/room/PoolBanner';
import { HomeScreen } from '@/components/room/HomeScreen';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <PrefetchBoundary>
      <PoolBanner />
      <main className="px-5 pb-24">
        <HomeScreen />
      </main>
    </PrefetchBoundary>
  );
}
