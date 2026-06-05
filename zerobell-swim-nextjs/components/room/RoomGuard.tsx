'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

export function RoomGuard({ children }: { children: React.ReactNode }) {
  const { isVerified, ready } = useSession();
  const router = useRouter();
  useEffect(() => { if (ready && !isVerified) router.replace('/room'); }, [ready, isVerified, router]);
  if (!ready || !isVerified) return null; // 깜빡임 방지
  return <>{children}</>;
}
