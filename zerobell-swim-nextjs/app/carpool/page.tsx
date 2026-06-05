import { PrefetchBoundary } from '@/components/room/PrefetchBoundary';
import { RoomGuard } from '@/components/room/RoomGuard';
import { AppHeader } from '@/components/room/AppHeader';
import { CarpoolScreen } from '@/components/room/CarpoolScreen';

export const dynamic = 'force-dynamic';

export default function CarpoolPage() {
  return (
    <PrefetchBoundary>
      <RoomGuard>
        <AppHeader title="카풀 매칭" backHref="/" />
        <main className="px-5 pb-24" style={{ paddingTop: 'calc(64px + env(safe-area-inset-top))' }}>
          <CarpoolScreen />
        </main>
      </RoomGuard>
    </PrefetchBoundary>
  );
}
