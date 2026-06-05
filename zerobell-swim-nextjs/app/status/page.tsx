import { PrefetchBoundary } from '@/components/room/PrefetchBoundary';
import { RoomGuard } from '@/components/room/RoomGuard';
import { AppHeader } from '@/components/room/AppHeader';
import { StatusScreen } from '@/components/room/StatusScreen';

export const dynamic = 'force-dynamic';

export default function StatusPage() {
  return (
    <PrefetchBoundary>
      <RoomGuard>
        <AppHeader title="실시간 현황" backHref="/" />
        <main className="px-5 pb-24" style={{ paddingTop: 'calc(64px + env(safe-area-inset-top))' }}>
          <StatusScreen />
        </main>
      </RoomGuard>
    </PrefetchBoundary>
  );
}
