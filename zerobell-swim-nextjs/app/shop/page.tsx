import { PrefetchBoundary } from '@/components/room/PrefetchBoundary';
import { RoomGuard } from '@/components/room/RoomGuard';
import { AppHeader } from '@/components/room/AppHeader';
import { ShopScreen } from '@/components/room/ShopScreen';

export const dynamic = 'force-dynamic';

export default function ShopPage() {
  return (
    <PrefetchBoundary>
      <RoomGuard>
        <AppHeader title="장보기 목록" backHref="/" />
        <main className="px-5 pb-24" style={{ paddingTop: 'calc(64px + env(safe-area-inset-top))' }}>
          <ShopScreen />
        </main>
      </RoomGuard>
    </PrefetchBoundary>
  );
}
