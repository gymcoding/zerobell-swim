import { NextResponse } from 'next/server';
import { getData } from '@/lib/jsonbin.server';

export const dynamic = 'force-dynamic'; // 항상 최신(정적 최적화 금지)

export async function GET() {
  try {
    const db = await getData();
    return NextResponse.json(db, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
  }
}
