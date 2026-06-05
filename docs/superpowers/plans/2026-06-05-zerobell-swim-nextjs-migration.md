# zerobell-swim `/room` → Next.js 마이그레이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 Astro `/room` 앱을 동일 기능·동일 룩으로 Next.js(App Router)+shadcn+TanStack Query+jsonbin(서버측)으로 이식해 두 스택을 나란히 비교한다.

**Architecture:** RSC가 서버에서 jsonbin을 읽어 첫 화면을 데이터까지 렌더(깜빡임 0) → `dehydrate`/`HydrationBoundary`로 클라이언트 TanStack Query 캐시에 hydrate → 클라이언트는 GET Route Handler로 7초 폴링, 낙관적 mutation은 `'use server'` Server Action으로 커밋. 변경 로직(reducer)은 순수 함수로 분리해 클라 낙관적 업데이트와 서버 커밋이 **공유(DRY)**.

**Tech Stack:** Next.js(App Router) · TypeScript · Tailwind v4 · shadcn/ui · @tanstack/react-query · vitest · jsonbin REST API

**Spec:** `docs/superpowers/specs/2026-06-05-zerobell-swim-nextjs-migration-design.md`

**작업 위치:** 모든 경로는 `zerobell-swim-nextjs/` 하위. 기존 Astro 레포는 건드리지 않음(루트 `.gitignore`만 수정).

---

## File Structure (생성/수정 파일과 책임)

```
zerobell-swim-nextjs/
├─ next.config.ts                      # cacheComponents 미사용(기본), serverActions 기본
├─ .env.local                          # JSONBIN_BIN_ID / JSONBIN_MASTER_KEY (서버 전용)
├─ vitest.config.ts                    # 순수 로직 테스트
├─ app/
│  ├─ globals.css                      # 기존 global.css 포팅(브랜드 토큰·.sticker 등) + shadcn 토큰 매핑
│  ├─ layout.tsx                       # Pretendard 폰트, max-w-460 래퍼, Providers, Toaster
│  ├─ providers.tsx                    # 'use client' QueryClientProvider
│  ├─ api/db/route.ts                  # GET: jsonbin 읽기(클라 폴링용), force-dynamic
│  ├─ actions.ts                       # 'use server' 쓰기 액션들 (reducer 위임)
│  ├─ page.tsx                         # home: 로그인 + 메뉴 (RSC prefetch)
│  ├─ carpool/page.tsx                 # 카풀: 역할선택/운전자폼/탑승목록
│  ├─ shop/page.tsx                    # 장보기
│  └─ status/page.tsx                  # 현황 + 댓글
├─ lib/
│  ├─ db-types.ts                      # DB/User/Ride/Booking/Item/Comment 타입 + 상수
│  ├─ domain.ts                        # remaining/nextRideId/nextItemId/nextCommentId/normalize (순수)
│  ├─ reducers.ts                      # submitDriver/cancelDriver/pickRide/addItem/deleteItem/addComment/deleteComment (순수)
│  ├─ jsonbin.server.ts                # 'server-only' getData/putData/commitServer (키 사용)
│  ├─ get-db.ts                        # React.cache(getData) — RSC 프리페치용
│  └─ get-query-client.ts             # per-request(server)/singleton(browser) QueryClient (staleTime>0)
├─ components/
│  ├─ providers/RoomGuard.tsx          # 비로그인 시 / 로 리다이렉트(home 제외)
│  ├─ room/                            # 화면 컴포넌트(아래 UI 태스크에서 생성)
│  └─ ui/                              # shadcn 생성물(dialog/sonner/form/input/button…)
├─ hooks/
│  ├─ use-db.ts                        # useQuery(['db']) 폴링 + useRoomMutation(낙관적)
│  └─ use-session.ts                   # 이름/본인확인 세션(localStorage+메모리 폴백)
└─ test/
   ├─ domain.test.ts
   └─ reducers.test.ts
```

핵심 원칙: **reducer(순수 변경 함수)를 클라(onMutate)와 서버(Server Action)가 공유** → merge 로직 1곳.

---

## Task 1: Next 앱 스캐폴드 + 의존성 + gitignore

**Files:**
- Create: `zerobell-swim-nextjs/` (create-next-app 산출물 전체)
- Modify: `.gitignore` (루트)

- [ ] **Step 1: create-next-app 실행 (루트에서)**

Run:
```bash
cd /Users/gymcoding/Company/projects/zerobell-swim
npx create-next-app@latest zerobell-swim-nextjs \
  --ts --app --tailwind --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
```
Expected: `zerobell-swim-nextjs/`에 App Router + Tailwind 프로젝트 생성. (Tailwind v4가 기본 설치되는지 확인 — `package.json`에 `tailwindcss@^4`. 아니면 `npm i -D tailwindcss@^4 @tailwindcss/postcss@^4` 후 PostCSS 설정 v4식으로 교체.)

- [ ] **Step 2: 의존성 추가**

Run:
```bash
cd zerobell-swim-nextjs
npm i @tanstack/react-query
npm i -D @tanstack/eslint-plugin-query vitest @vitejs/plugin-react jsdom server-only
```

- [ ] **Step 3: shadcn 초기화 + 기본 컴포넌트**

Run:
```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label dialog sonner form
```
Expected: `components/ui/*`, `lib/utils.ts`(cn) 생성. 실패 시 Tailwind v4/React19 호환 메시지 따라 진행.

- [ ] **Step 4: 루트 .gitignore에 Next 산출물 추가**

루트 `.gitignore`에 아래 줄 추가:
```
zerobell-swim-nextjs/node_modules
zerobell-swim-nextjs/.next
zerobell-swim-nextjs/.env*.local
```

- [ ] **Step 5: .env.local 작성**

`zerobell-swim-nextjs/.env.local` 생성 (루트 `.env`의 jsonbin 마스터키 값을 그대로 복사, **PUBLIC_ 접두사 제거**):
```
JSONBIN_BIN_ID=6a22789bda38895dfe8ae248
JSONBIN_MASTER_KEY=<루트 .env의 PUBLIC_JSONBIN_MASTER_KEY 값>
```

- [ ] **Step 6: 빌드 확인 + 커밋**

Run:
```bash
npm run build
```
Expected: 기본 템플릿 빌드 성공.
```bash
cd /Users/gymcoding/Company/projects/zerobell-swim
git add .gitignore zerobell-swim-nextjs
git commit -m "feat(next): scaffold Next.js+Tailwind v4+shadcn 앱"
```

---

## Task 2: 타입 + 순수 도메인 로직 (TDD)

**Files:**
- Create: `zerobell-swim-nextjs/lib/db-types.ts`
- Create: `zerobell-swim-nextjs/lib/domain.ts`
- Create: `zerobell-swim-nextjs/vitest.config.ts`
- Test: `zerobell-swim-nextjs/test/domain.test.ts`

- [ ] **Step 1: vitest 설정 + package.json 스크립트**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true },
});
```
`package.json` scripts에 추가: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: 타입 정의**

Create `lib/db-types.ts` (기존 `src/lib/jsonbin.ts`의 인터페이스 그대로):
```ts
export interface User { name: string; salt: string; hash: string; }
export interface Ride { id: number; driver: string; seats: number; from: string; }
export interface Booking { rideId: number; rider: string; }
export interface Item { id: number; name: string; memo: string; done: boolean; addedBy: string; }
export interface Comment { id: number; by: string; text: string; at: number; }
export interface DB { users: User[]; rides: Ride[]; bookings: Booking[]; items: Item[]; comments: Comment[]; }

export const MAX_SEATS = 8;
export const POLL_MS = 7000;
export const EMPTY_DB: DB = { users: [], rides: [], bookings: [], items: [], comments: [] };
```

- [ ] **Step 3: 실패하는 테스트 작성**

Create `test/domain.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { remaining, nextRideId, nextItemId, nextCommentId, normalize } from '@/lib/domain';
import type { Ride, Booking } from '@/lib/db-types';

describe('domain', () => {
  it('remaining = seats - 예약수', () => {
    const ride: Ride = { id: 1, driver: 'A', seats: 3, from: 'x' };
    const bookings: Booking[] = [{ rideId: 1, rider: 'B' }, { rideId: 1, rider: 'C' }, { rideId: 2, rider: 'D' }];
    expect(remaining(ride, bookings)).toBe(1);
  });
  it('nextRideId: 빈 배열이면 1, 아니면 max+1', () => {
    expect(nextRideId([])).toBe(1);
    expect(nextRideId([{ id: 1, driver: 'A', seats: 2, from: 'x' }, { id: 5, driver: 'B', seats: 2, from: 'y' }])).toBe(6);
  });
  it('nextItemId / nextCommentId 동일 규칙', () => {
    expect(nextItemId([])).toBe(1);
    expect(nextCommentId([{ id: 3, by: 'A', text: 't', at: 1 }])).toBe(4);
  });
  it('normalize: 누락 배열을 빈 배열로 보정', () => {
    const db = normalize({ rides: [{ id: 1, driver: 'A', seats: 2, from: 'x' }] });
    expect(db.users).toEqual([]);
    expect(db.bookings).toEqual([]);
    expect(db.items).toEqual([]);
    expect(db.comments).toEqual([]);
    expect(db.rides).toHaveLength(1);
  });
});
```

- [ ] **Step 4: 실패 확인**

Run: `npm test`
Expected: FAIL — `domain.ts` 모듈 없음.

- [ ] **Step 5: domain.ts 구현**

Create `lib/domain.ts` (기존 `jsonbin.ts`의 순수 함수 + normalize 이식):
```ts
import type { DB, Ride, Booking, Item, Comment } from './db-types';

export function normalize(rec: any): DB {
  return {
    users: Array.isArray(rec?.users) ? rec.users : [],
    rides: Array.isArray(rec?.rides) ? rec.rides : [],
    bookings: Array.isArray(rec?.bookings) ? rec.bookings : [],
    items: Array.isArray(rec?.items) ? rec.items : [],
    comments: Array.isArray(rec?.comments) ? rec.comments : [],
  };
}
export function remaining(ride: Ride, bookings: Booking[]): number {
  return ride.seats - bookings.filter((b) => b.rideId === ride.id).length;
}
export function nextRideId(rides: Ride[]): number {
  return rides.length ? Math.max(...rides.map((r) => r.id)) + 1 : 1;
}
export function nextItemId(items: Item[]): number {
  return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}
export function nextCommentId(comments: Comment[]): number {
  return comments.length ? Math.max(...comments.map((c) => c.id)) + 1 : 1;
}
```

- [ ] **Step 6: 통과 확인 + 커밋**

Run: `npm test`
Expected: PASS (4 tests).
```bash
git add zerobell-swim-nextjs/lib zerobell-swim-nextjs/test/domain.test.ts zerobell-swim-nextjs/vitest.config.ts zerobell-swim-nextjs/package.json
git commit -m "feat(next): 타입+도메인 순수함수 (TDD)"
```

---

## Task 3: 변경 reducer (순수, 클라/서버 공유) (TDD)

**Files:**
- Create: `zerobell-swim-nextjs/lib/reducers.ts`
- Test: `zerobell-swim-nextjs/test/reducers.test.ts`

각 reducer는 `(db, actor, payload) => DB | null` 순수 함수. `null`이면 변경 없음/검증 실패. 호출자가 전달한 db를 직접 변형(호출 측에서 clone 책임). 로직은 기존 `room.ts`의 `apply((d)=>…)` 콜백을 그대로 옮긴 것.

- [ ] **Step 1: 실패 테스트 작성**

Create `test/reducers.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import * as R from '@/lib/reducers';
import { EMPTY_DB, type DB } from '@/lib/db-types';
const clone = (d: DB) => structuredClone(d);

describe('reducers', () => {
  it('submitDriver: 신규 등록 / 빈 출발지는 null', () => {
    expect(R.submitDriver(clone(EMPTY_DB), '철수', { seats: 3, from: '' })).toBeNull();
    const d = R.submitDriver(clone(EMPTY_DB), '철수', { seats: 3, from: '영종' })!;
    expect(d.rides).toHaveLength(1);
    expect(d.rides[0]).toMatchObject({ id: 1, driver: '철수', seats: 3, from: '영종' });
  });
  it('submitDriver: 기존 운전자는 좌석/출발지 갱신', () => {
    let d = R.submitDriver(clone(EMPTY_DB), '철수', { seats: 3, from: '영종' })!;
    d = R.submitDriver(d, '철수', { seats: 5, from: '운서' })!;
    expect(d.rides).toHaveLength(1);
    expect(d.rides[0]).toMatchObject({ seats: 5, from: '운서' });
  });
  it('submitDriver: seats는 1..MAX_SEATS로 클램프', () => {
    expect(R.submitDriver(clone(EMPTY_DB), 'A', { seats: 99, from: 'x' })!.rides[0].seats).toBe(8);
    expect(R.submitDriver(clone(EMPTY_DB), 'A', { seats: 0, from: 'x' })!.rides[0].seats).toBe(1);
  });
  it('cancelDriver: 내 ride + 그 ride의 예약 제거', () => {
    let d = R.submitDriver(clone(EMPTY_DB), 'A', { seats: 3, from: 'x' })!;
    d.bookings.push({ rideId: 1, rider: 'B' });
    d = R.cancelDriver(d, 'A')!;
    expect(d.rides).toHaveLength(0);
    expect(d.bookings).toHaveLength(0);
  });
  it('pickRide: 만석이면 null, 토글로 취소', () => {
    let d = R.submitDriver(clone(EMPTY_DB), 'A', { seats: 1, from: 'x' })!;
    d = R.pickRide(d, 'B', { rideId: 1 })!;          // 예약
    expect(d.bookings).toHaveLength(1);
    expect(R.pickRide(clone(d), 'C', { rideId: 1 })).toBeNull(); // 만석
    const toggled = R.pickRide(d, 'B', { rideId: 1 })!;          // 같은 ride 다시 → 취소
    expect(toggled.bookings).toHaveLength(0);
  });
  it('pickRide: 다른 ride 선택 시 기존 예약 이동', () => {
    let d = R.submitDriver(clone(EMPTY_DB), 'A', { seats: 2, from: 'x' })!;
    d = R.submitDriver(d, 'D', { seats: 2, from: 'y' })!;
    d = R.pickRide(d, 'B', { rideId: 1 })!;
    d = R.pickRide(d, 'B', { rideId: 2 })!;
    expect(d.bookings.filter((b) => b.rider === 'B')).toHaveLength(1);
    expect(d.bookings[0].rideId).toBe(2);
  });
  it('addItem / deleteItem(본인만)', () => {
    let d = R.addItem(clone(EMPTY_DB), 'A', { name: '숯' })!;
    expect(d.items[0]).toMatchObject({ id: 1, name: '숯', addedBy: 'A' });
    expect(R.addItem(clone(d), 'A', { name: '   ' })).toBeNull();
    expect(R.deleteItem(clone(d), 'B', { id: 1 })).toBeNull();  // 남의 항목
    expect(R.deleteItem(d, 'A', { id: 1 })!.items).toHaveLength(0);
  });
  it('addComment / deleteComment(본인만)', () => {
    let d = R.addComment(clone(EMPTY_DB), 'A', { text: '하이', at: 1000 })!;
    expect(d.comments[0]).toMatchObject({ id: 1, by: 'A', text: '하이', at: 1000 });
    expect(R.addComment(clone(d), 'A', { text: '  ', at: 2000 })).toBeNull();
    expect(R.deleteComment(clone(d), 'B', { id: 1 })).toBeNull();
    expect(R.deleteComment(d, 'A', { id: 1 })!.comments).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test`
Expected: FAIL — `reducers.ts` 없음.

- [ ] **Step 3: reducers.ts 구현**

Create `lib/reducers.ts`:
```ts
import type { DB } from './db-types';
import { MAX_SEATS } from './db-types';
import { remaining, nextRideId, nextItemId, nextCommentId } from './domain';

export function submitDriver(db: DB, actor: string, p: { seats: number; from: string }): DB | null {
  const from = p.from.trim();
  if (!from) return null;
  const seats = Math.max(1, Math.min(MAX_SEATS, Number(p.seats) || 0));
  const existing = db.rides.find((r) => r.driver === actor);
  if (existing) { existing.seats = seats; existing.from = from; }
  else db.rides.push({ id: nextRideId(db.rides), driver: actor, seats, from });
  return db;
}
export function cancelDriver(db: DB, actor: string): DB | null {
  const ride = db.rides.find((r) => r.driver === actor);
  if (!ride) return null;
  db.rides = db.rides.filter((r) => r.driver !== actor);
  db.bookings = db.bookings.filter((b) => b.rideId !== ride.id);
  return db;
}
export function pickRide(db: DB, actor: string, p: { rideId: number }): DB | null {
  const ex = db.bookings.find((b) => b.rider === actor);
  if (ex && ex.rideId === p.rideId) { // 토글 취소
    db.bookings = db.bookings.filter((b) => b.rider !== actor);
    return db;
  }
  const ride = db.rides.find((r) => r.id === p.rideId);
  if (!ride) return null;
  const left = remaining(ride, db.bookings.filter((b) => b.rider !== actor));
  if (left <= 0) return null;
  db.bookings = db.bookings.filter((b) => b.rider !== actor);
  db.bookings.push({ rideId: p.rideId, rider: actor });
  return db;
}
export function addItem(db: DB, actor: string, p: { name: string }): DB | null {
  const name = p.name.trim();
  if (!name) return null;
  db.items.push({ id: nextItemId(db.items), name, memo: '', done: false, addedBy: actor });
  return db;
}
export function deleteItem(db: DB, actor: string, p: { id: number }): DB | null {
  const it = db.items.find((x) => x.id === p.id);
  if (!it || it.addedBy !== actor) return null;
  db.items = db.items.filter((x) => x.id !== p.id);
  return db;
}
export function addComment(db: DB, actor: string, p: { text: string; at: number }): DB | null {
  const text = p.text.trim();
  if (!text) return null;
  db.comments.push({ id: nextCommentId(db.comments), by: actor, text, at: p.at });
  return db;
}
export function deleteComment(db: DB, actor: string, p: { id: number }): DB | null {
  const c = db.comments.find((x) => x.id === p.id);
  if (!c || c.by !== actor) return null;
  db.comments = db.comments.filter((x) => x.id !== p.id);
  return db;
}
```

- [ ] **Step 4: 통과 확인 + 커밋**

Run: `npm test`
Expected: PASS (전체).
```bash
git add zerobell-swim-nextjs/lib/reducers.ts zerobell-swim-nextjs/test/reducers.test.ts
git commit -m "feat(next): 공유 reducer (클라 낙관적+서버 커밋 DRY, TDD)"
```

---

## Task 4: jsonbin 서버 모듈 (키 사용, server-only)

**Files:**
- Create: `zerobell-swim-nextjs/lib/jsonbin.server.ts`

- [ ] **Step 1: 서버 전용 jsonbin 모듈 작성**

Create `lib/jsonbin.server.ts`:
```ts
import 'server-only';
import { normalize } from './domain';
import type { DB } from './db-types';

const BIN_ID = process.env.JSONBIN_BIN_ID;
const MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const API = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Master-Key': MASTER_KEY ?? '',
  'X-Bin-Meta': 'false',
};

export async function getData(): Promise<DB> {
  const res = await fetch(`${API}/latest`, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`jsonbin GET ${res.status}`);
  const json = await res.json();
  return normalize(json?.record ?? json);
}
export async function putData(next: DB): Promise<DB> {
  const res = await fetch(API, { method: 'PUT', headers: HEADERS, body: JSON.stringify(next), cache: 'no-store' });
  if (!res.ok) throw new Error(`jsonbin PUT ${res.status}`);
  return next;
}
/** 쓰기: GET → reducer(clone) → (null이면 그대로) → PUT. 서버에서 실행되어 키 노출 0. */
export async function commitServer(mutate: (fresh: DB) => DB | null): Promise<DB> {
  const fresh = await getData();
  const next = mutate(structuredClone(fresh));
  if (next === null) return fresh;
  return putData(next);
}
```

- [ ] **Step 2: 타입체크 + 커밋**

Run: `npx tsc --noEmit`
Expected: 에러 없음.
```bash
git add zerobell-swim-nextjs/lib/jsonbin.server.ts
git commit -m "feat(next): server-only jsonbin 모듈 (no-store, 키 서버측)"
```

---

## Task 5: 읽기 경로 — RSC 프리페치 + GET Route Handler

**Files:**
- Create: `zerobell-swim-nextjs/lib/get-db.ts`
- Create: `zerobell-swim-nextjs/app/api/db/route.ts`

- [ ] **Step 1: RSC 프리페치 헬퍼 (React.cache로 per-request 메모이즈)**

Create `lib/get-db.ts`:
```ts
import { cache } from 'react';
import { getData } from './jsonbin.server';
// 같은 요청 내 여러 RSC가 호출해도 jsonbin 1회만 — 'use server' 아님(일반 서버 함수).
export const getDB = cache(getData);
```

- [ ] **Step 2: 클라이언트 폴링용 GET Route Handler**

Create `app/api/db/route.ts`:
```ts
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
```

- [ ] **Step 3: 수동 확인 + 커밋**

Run: `npm run dev` 후 다른 터미널에서 `curl -s localhost:3000/api/db`
Expected: `{"users":[...],"rides":[...],...}` JSON (시드된 빈 구조 또는 데이터). 키 문자열은 응답·소스에 없음.
```bash
git add zerobell-swim-nextjs/lib/get-db.ts zerobell-swim-nextjs/app/api/db
git commit -m "feat(next): RSC 프리페치 헬퍼 + GET /api/db (force-dynamic)"
```

---

## Task 6: 쓰기 경로 — Server Actions

**Files:**
- Create: `zerobell-swim-nextjs/app/actions.ts`

각 액션은 `commitServer`로 GET→reducer→PUT. **actor(이름)를 인자로 받고 reducer 내부에서 소유권 검증** (Server Action은 공개 POST 엔드포인트 — 키 숨김만으론 불충분). 빈 결과/실패는 throw 또는 동일 DB 반환.

- [ ] **Step 1: 액션 작성**

Create `app/actions.ts`:
```ts
'use server';
import { commitServer } from '@/lib/jsonbin.server';
import * as R from '@/lib/reducers';
import type { DB } from '@/lib/db-types';

// actor는 클라가 전달(이름 기반·스푸핑 가능 — 신뢰그룹 전제, spec 9 한계).
export async function submitDriverAction(actor: string, p: { seats: number; from: string }): Promise<DB> {
  return commitServer((db) => R.submitDriver(db, actor, p));
}
export async function cancelDriverAction(actor: string): Promise<DB> {
  return commitServer((db) => R.cancelDriver(db, actor));
}
export async function pickRideAction(actor: string, p: { rideId: number }): Promise<DB> {
  return commitServer((db) => R.pickRide(db, actor, p));
}
export async function addItemAction(actor: string, p: { name: string }): Promise<DB> {
  return commitServer((db) => R.addItem(db, actor, p));
}
export async function deleteItemAction(actor: string, p: { id: number }): Promise<DB> {
  return commitServer((db) => R.deleteItem(db, actor, p));
}
export async function addCommentAction(actor: string, p: { text: string; at: number }): Promise<DB> {
  return commitServer((db) => R.addComment(db, actor, p));
}
export async function deleteCommentAction(actor: string, p: { id: number }): Promise<DB> {
  return commitServer((db) => R.deleteComment(db, actor, p));
}
```

- [ ] **Step 2: 타입체크 + 커밋**

Run: `npx tsc --noEmit`
Expected: 에러 없음.
```bash
git add zerobell-swim-nextjs/app/actions.ts
git commit -m "feat(next): 쓰기 Server Actions (reducer 위임, 소유권 서버 검증)"
```

---

## Task 7: TanStack Query 클라이언트/프로바이더 (staleTime>0, per-request)

**Files:**
- Create: `zerobell-swim-nextjs/lib/get-query-client.ts`
- Create: `zerobell-swim-nextjs/app/providers.tsx`

- [ ] **Step 1: QueryClient 팩토리 (서버 per-request / 브라우저 싱글톤)**

Create `lib/get-query-client.ts`:
```ts
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
```

- [ ] **Step 2: 'use client' 프로바이더**

Create `app/providers.tsx`:
```tsx
'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: 타입체크 + 커밋**

Run: `npx tsc --noEmit`
Expected: 에러 없음.
```bash
git add zerobell-swim-nextjs/lib/get-query-client.ts zerobell-swim-nextjs/app/providers.tsx
git commit -m "feat(next): QueryClient(staleTime=POLL_MS) + Providers"
```

---

## Task 8: useDB 훅 (폴링 + 낙관적 mutation)

**Files:**
- Create: `zerobell-swim-nextjs/hooks/use-db.ts`

- [ ] **Step 1: 훅 작성**

Create `hooks/use-db.ts`:
```ts
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
```

- [ ] **Step 2: 타입체크 + 커밋**

Run: `npx tsc --noEmit`
Expected: 에러 없음.
```bash
git add zerobell-swim-nextjs/hooks/use-db.ts
git commit -m "feat(next): useDB 폴링 + useRoomMutation 낙관적(cancelQueries)"
```

---

## Task 9: 세션 훅 (이름 + 본인확인, localStorage+메모리 폴백)

**Files:**
- Create: `zerobell-swim-nextjs/hooks/use-session.ts`

기존 `src/lib/session.ts` 로직을 React 훅으로 이식. 키 이름 그대로(`carpool_name`, `carpool_verified_name`) 유지. localStorage 차단 시 메모리 폴백(모듈 스코프 변수).

- [ ] **Step 1: 훅 작성**

Create `hooks/use-session.ts`:
```ts
'use client';
import { useCallback, useEffect, useState } from 'react';

const NAME_KEY = 'carpool_name';
const VERIFIED_KEY = 'carpool_verified_name';
let memName = '';
let memVerified = '';

const lsGet = (k: string) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* webview 차단 */ } };
const lsRemove = (k: string) => { try { localStorage.removeItem(k); } catch { /* 무시 */ } };

export function getSavedName() { return lsGet(NAME_KEY) || memName; }
export function verifiedName() { return lsGet(VERIFIED_KEY) || memVerified; }

export function useSession() {
  // SSR/CSR 불일치 방지: 마운트 후 읽기
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => { setName(verifiedName()); setReady(true); }, []);

  const login = useCallback((n: string) => {
    memName = n; memVerified = n;
    lsSet(NAME_KEY, n); lsSet(VERIFIED_KEY, n);
    setName(n);
  }, []);
  const logout = useCallback(() => {
    memVerified = ''; lsRemove(VERIFIED_KEY);
    setName('');
  }, []);

  return { name, isVerified: name.length > 0, ready, login, logout, getSavedName };
}
```

- [ ] **Step 2: 타입체크 + 커밋**

Run: `npx tsc --noEmit`
Expected: 에러 없음.
```bash
git add zerobell-swim-nextjs/hooks/use-session.ts
git commit -m "feat(next): useSession (localStorage+메모리 폴백)"
```

---

## Task 10: 루트 레이아웃 + 브랜드 스타일 포팅 + Toaster

**Files:**
- Create/Modify: `zerobell-swim-nextjs/app/globals.css`
- Modify: `zerobell-swim-nextjs/app/layout.tsx`

- [ ] **Step 1: global.css 포팅**

기존 `src/styles/global.css`의 **`:root` 변수부터 끝까지 전체를** `zerobell-swim-nextjs/app/globals.css`로 복사하되, 맨 위 `@import "tailwindcss";`는 create-next-app이 넣은 v4 임포트 형식과 합칠 것(중복 import 금지). shadcn이 추가한 `@theme`/`:root` 토큰 블록은 유지하고, 그 아래에 브랜드 `:root{ --ocean… }`와 `.sticker/.tag/.btn-3d/.field/.pool-bg/.marker` 등 전부 이어붙임.

- [ ] **Step 2: shadcn 토큰을 브랜드에 매핑**

`globals.css`의 shadcn 토큰 블록에서 핵심 매핑(무채색 디폴트 → 브랜드):
```css
:root {
  --primary: #ff5d73;            /* coral */
  --primary-foreground: #ffffff;
  --ring: #48cae4;               /* aqua */
  --radius: 1rem;                /* 스티커 라운드 느낌 */
}
```
(나머지 shadcn 토큰은 기본 유지. Dialog/Sonner가 이 토큰을 쓰게 됨.)

- [ ] **Step 3: layout.tsx — Pretendard + max-w-460 래퍼 + Providers + Toaster**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: '🌊 원정수영 준비방 · 카풀 & 장보기',
  description: '카풀 매칭 + 장보기 목록을 한 곳에서!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        <div className="relative mx-auto w-full max-w-[460px] min-h-[100dvh] overflow-hidden" style={{ background: 'var(--cream)' }}>
          <Providers>{children}</Providers>
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 확인 + 커밋**

Run: `npm run dev` → 루트 접속, 콘솔 에러 없음 + 배경 크림색·Pretendard 적용.
```bash
git add zerobell-swim-nextjs/app/globals.css zerobell-swim-nextjs/app/layout.tsx
git commit -m "feat(next): 브랜드 스타일 포팅 + 레이아웃/Toaster/Providers"
```

---

## Task 11: 공유 UI — ConfirmDialog (shadcn Dialog) + toast 래퍼

**Files:**
- Create: `zerobell-swim-nextjs/components/room/ConfirmDialog.tsx`

기존 `room.ts`의 `askConfirm(html, onYes)` 패턴(전역 단일 모달)을 React 상태로 대체. shadcn `Dialog` 사용(접근성 내장).

- [ ] **Step 1: 컨펌 다이얼로그 컴포넌트(컨텍스트 훅)**

Create `components/room/ConfirmDialog.tsx`:
```tsx
'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ConfirmFn = (message: ReactNode, onYes: () => void) => void;
const Ctx = createContext<ConfirmFn>(() => {});
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<ReactNode>(null);
  const [cb, setCb] = useState<{ fn: () => void }>({ fn: () => {} });
  const confirm = useCallback<ConfirmFn>((message, onYes) => {
    setMsg(message); setCb({ fn: onYes }); setOpen(true);
  }, []);
  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sticker max-w-[360px]">
          <DialogHeader><DialogTitle className="font-display text-xl">확인</DialogTitle></DialogHeader>
          <div className="font-round text-[16px]">{msg}</div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="font-round">취소</Button>
            <Button onClick={() => { setOpen(false); cb.fn(); }} className="font-round bg-[var(--coral)] text-white">네</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
```

- [ ] **Step 2: Providers에 ConfirmProvider 합성**

`app/providers.tsx`의 `QueryClientProvider` 안쪽을 `<ConfirmProvider>{children}</ConfirmProvider>`로 감싼다(import 추가).

- [ ] **Step 3: 타입체크 + 커밋**

Run: `npx tsc --noEmit`
Expected: 에러 없음.
```bash
git add zerobell-swim-nextjs/components/room/ConfirmDialog.tsx zerobell-swim-nextjs/app/providers.tsx
git commit -m "feat(next): ConfirmDialog(shadcn Dialog) + Provider 합성"
```

---

## Task 12: Home 페이지 (로그인 + 메뉴) + RSC 프리페치 배선

**Files:**
- Create: `zerobell-swim-nextjs/app/page.tsx`
- Create: `zerobell-swim-nextjs/components/room/PrefetchBoundary.tsx`
- Create: `zerobell-swim-nextjs/components/room/HomeScreen.tsx`
- Create: `zerobell-swim-nextjs/components/room/PoolBanner.tsx`

**참조 소스:** `src/pages/room.astro`(배너 마크업), `src/components/carpool/LoginCard.astro`, `HomeMenu.astro`, `room.ts`의 `doLogin/setupHome`.

- [ ] **Step 1: 공통 프리페치 바운더리(모든 페이지가 사용)**

Create `components/room/PrefetchBoundary.tsx`:
```tsx
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { getDB } from '@/lib/get-db';
import { DB_KEY } from '@/hooks/use-db';

export async function PrefetchBoundary({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: [...DB_KEY], queryFn: getDB });
  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
```
> 주의: `DB_KEY`는 `['db'] as const`이므로 `[...DB_KEY]`로 풀어 일반 배열로 전달. `prefetchQuery`의 `queryFn`은 RSC용 `getDB`(서버 직접 호출, HTTP 왕복 없음). 클라 `useDB`의 `queryFn`(fetch '/api/db')과 키가 동일해 hydrate가 이어짐.

- [ ] **Step 2: PoolBanner (배너 마크업 포팅)**

Create `components/room/PoolBanner.tsx` — `src/pages/room.astro`의 `<header slot="banner" class="pool-bg …">` 블록을 JSX로 변환(클래스 그대로, `class`→`className`, 자기닫힘 태그 정리). 정적 컴포넌트.

- [ ] **Step 3: HomeScreen (로그인 + 메뉴, 클라이언트)**

Create `components/room/HomeScreen.tsx` (`'use client'`):
- `useSession()`으로 `isVerified/ready/login/logout/name` 사용.
- 미로그인: `LoginCard.astro` 마크업을 JSX로 포팅 — 입력값 state, "들어가기" 클릭 시 `login(name.trim())`(빈값이면 경고 표시), 성공 토스트 `toast.success(\`👋 ${name}님 반가워요!\`)`.
- 로그인: `HomeMenu.astro` 마크업 포팅 — 인사말에 `name`, 카풀/장보기/현황 `next/link`(`/carpool`,`/shop`,`/status`), 로그아웃 버튼 `logout()`.
- `ready===false`면 깜빡임 방지용 빈 렌더(또는 로그인 카드 골격).
- Enter 키 처리: IME 조합 중(`e.nativeEvent.isComposing`) Enter 무시(기존 `enterKey` 동작 유지).

- [ ] **Step 4: page.tsx 조립**

Create `app/page.tsx`:
```tsx
import { PrefetchBoundary } from '@/components/room/PrefetchBoundary';
import { PoolBanner } from '@/components/room/PoolBanner';
import { HomeScreen } from '@/components/room/HomeScreen';

export const dynamic = 'force-dynamic'; // 초기 읽기 항상 최신

export default function HomePage() {
  return (
    <PrefetchBoundary>
      <PoolBanner />
      <main className="px-5 pb-24"><HomeScreen /></main>
    </PrefetchBoundary>
  );
}
```

- [ ] **Step 5: 확인 + 커밋**

Run: `npm run dev` → `/`에서 이름 입력→들어가기→메뉴 표시, 새로고침해도 로그인 유지(localStorage), 로그아웃 동작.
```bash
git add zerobell-swim-nextjs/app/page.tsx zerobell-swim-nextjs/components/room
git commit -m "feat(next): home(로그인+메뉴) + RSC 프리페치 배선"
```

---

## Task 13: 라우트 가드 (비로그인 차단)

**Files:**
- Create: `zerobell-swim-nextjs/components/room/RoomGuard.tsx`

기존 `room.ts mount()`의 "home 아닌 페이지에서 미인증이면 `/room`으로" 가드를 클라 컴포넌트로.

- [ ] **Step 1: 가드 컴포넌트**

Create `components/room/RoomGuard.tsx`:
```tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

export function RoomGuard({ children }: { children: React.ReactNode }) {
  const { isVerified, ready } = useSession();
  const router = useRouter();
  useEffect(() => { if (ready && !isVerified) router.replace('/'); }, [ready, isVerified, router]);
  if (!ready || !isVerified) return null; // 깜빡임 방지
  return <>{children}</>;
}
```

- [ ] **Step 2: 타입체크 + 커밋**

Run: `npx tsc --noEmit`
```bash
git add zerobell-swim-nextjs/components/room/RoomGuard.tsx
git commit -m "feat(next): RoomGuard 비로그인 차단"
```

---

## Task 14: Carpool 페이지 (역할 선택 / 운전자 폼 / 탑승 목록)

**Files:**
- Create: `zerobell-swim-nextjs/app/carpool/page.tsx`
- Create: `zerobell-swim-nextjs/components/room/AppHeader.tsx`
- Create: `zerobell-swim-nextjs/components/room/CarpoolScreen.tsx`

**참조 소스:** `src/pages/room/carpool.astro`, `src/components/carpool/{AppHeader,RoleChoice,DriverForm,RideList}.astro`, `room.ts`의 `renderDriver/renderRideList/submitDriver/cancelDriver/pickRide/showRoleSub`.

- [ ] **Step 1: AppHeader 포팅**

Create `components/room/AppHeader.tsx` — `AppHeader.astro` 마크업 포팅(`title`, `backHref` props, 뒤로가기 `next/link`).

- [ ] **Step 2: CarpoolScreen (클라이언트) — 대표 변환 패턴**

Create `components/room/CarpoolScreen.tsx` (`'use client'`). `useDB()`로 데이터, `useRoomMutation()`로 변경, `useSession()`으로 `me=name`. 역할 선택 sub-state(`'role'|'driver'|'rider'`)는 `useState`.

탑승 목록 렌더는 `room.ts renderRideList`를 JSX로 변환(대표 예시 — 나머지 화면도 동일 패턴):
```tsx
// 데이터
const { data: db } = useDB();
const mut = useRoomMutation();
const me = name;
const rides = db?.rides ?? [];
const bookings = db?.bookings ?? [];
const myBooking = bookings.find((b) => b.rider === me);

// 카풀 선택/취소
function pick(rideId: number) {
  mut.mutate({
    reduce: (d) => R.pickRide(d, me, { rideId }),
    run: () => pickRideAction(me, { rideId }),
  });
}

// 렌더 (escapeHtml 불필요 — React가 기본 이스케이프)
{rides.length === 0 ? (
  <div className="sticker p-6 text-center font-round text-[17px] text-[var(--ink)]/60">
    아직 등록된 카풀이 없어요 🥲<br />운전자분의 등록을 기다려요!
  </div>
) : rides.map((ride) => {
  const left = remaining(ride, bookings);
  const full = left <= 0;
  const mine = myBooking?.rideId === ride.id;
  const riders = bookings.filter((b) => b.rideId === ride.id).map((b) => b.rider);
  return (
    <div key={ride.id} className={`sticker p-5 ${mine ? 'ring-4 ring-[var(--aqua)]' : ''}`}>
      {/* ...DriverName/from/left/riders chips — RideList.astro+renderRideList 마크업 그대로... */}
      <button
        onClick={() => pick(ride.id)}
        disabled={full && !mine}
        className={`btn-3d w-full rounded-[16px] py-4 font-round text-xl ${
          mine ? 'bg-[var(--ink)] text-white' : full ? 'bg-white' : 'bg-[var(--coral)] text-white'
        }`}
      >
        {mine ? '✅ 선택됨 (취소)' : full ? '🈵 자리 다 참' : '이거 탈래요'}
      </button>
    </div>
  );
})}
```
운전자 폼: 좌석 +/- (1..MAX_SEATS 클램프), 출발지 입력, 등록=`submitDriverAction`/취소=`cancelDriverAction`(취소는 `useConfirm`로 확인). 내 ride 존재 시 `renderDriver`처럼 "기존 등록" 표시.

토스트 메시지는 기존 `room.ts` 문자열 그대로 사용(`🎉 카풀 등록 완료!` 등).

- [ ] **Step 3: page.tsx 조립**

Create `app/carpool/page.tsx`:
```tsx
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
```

- [ ] **Step 4: 확인 + 커밋**

Run: `/carpool`에서 운전자 등록·수정·취소, 좌석 선택·취소·만석 동작 + 낙관적 즉시 반영 확인.
```bash
git add zerobell-swim-nextjs/app/carpool zerobell-swim-nextjs/components/room/AppHeader.tsx zerobell-swim-nextjs/components/room/CarpoolScreen.tsx
git commit -m "feat(next): carpool 페이지(역할/운전자/탑승) 낙관적 연동"
```

---

## Task 15: Shop 페이지 (장보기)

**Files:**
- Create: `zerobell-swim-nextjs/app/shop/page.tsx`
- Create: `zerobell-swim-nextjs/components/room/ShopScreen.tsx`

**참조 소스:** `src/pages/room/shop.astro`, `ShopList.astro`, `room.ts`의 `renderShop/addItem/askDelete`.

- [ ] **Step 1: ShopScreen (클라이언트)**

Create `components/room/ShopScreen.tsx` — 입력(`quickName`) + 추가 버튼/Enter(IME 가드)로 `addItemAction`, 목록은 `db.items` 매핑(`ShopList.astro`+`renderShop` 마크업: 작성자 태그·본인 항목만 삭제 버튼). 삭제는 `useConfirm` 후 `deleteItemAction`. 낙관은 `R.addItem`/`R.deleteItem`.
```tsx
function add() {
  const v = name.trim(); if (!v) return;
  mut.mutate({ reduce: (d) => R.addItem(d, me, { name: v }), run: () => addItemAction(me, { name: v }) });
  setName('');
}
```

- [ ] **Step 2: page.tsx 조립**

`app/shop/page.tsx` — Task 14 Step 3과 동일 골격, `AppHeader title="장보기 목록"`, 본문에 `<ShopScreen />`.

- [ ] **Step 3: 확인 + 커밋**

Run: `/shop`에서 추가 + 본인 항목만 삭제 + 낙관적 반영.
```bash
git add zerobell-swim-nextjs/app/shop zerobell-swim-nextjs/components/room/ShopScreen.tsx
git commit -m "feat(next): shop 페이지(장보기) 연동"
```

---

## Task 16: Status 페이지 (현황 보드 + 댓글)

**Files:**
- Create: `zerobell-swim-nextjs/app/status/page.tsx`
- Create: `zerobell-swim-nextjs/components/room/StatusScreen.tsx`

**참조 소스:** `src/pages/room/status.astro`, `StatusBoard.astro`, `room.ts`의 `renderStatus/renderComments/addComment/askDeleteComment/timeAgo/updateStatusMeta`.

- [ ] **Step 1: StatusScreen (클라이언트)**

Create `components/room/StatusScreen.tsx`:
- 현황 보드: `db.rides` 매핑(`renderStatus` 마크업: 운전자·출발지·잔여/마감·탄 사람 칩).
- 댓글: 입력+버튼/Enter(IME 가드)로 `addCommentAction(me, { text, at: Date.now() })`(낙관 `R.addComment` 동일 `at`), 목록은 `db.comments` `at` 오름차순 정렬·`timeAgo()` 포팅·본인 댓글만 삭제(`useConfirm`→`deleteCommentAction`).
- "마지막 갱신 …" 메타: `useDB().dataUpdatedAt`를 `HH:MM:SS`로 표시 + "자동 갱신". 새로고침 버튼은 `useQueryClient().invalidateQueries({queryKey:DB_KEY})` + 아이콘 `.spin`.
- `timeAgo`는 `lib/format.ts`로 분리해도 됨(선택).

- [ ] **Step 2: page.tsx 조립**

`app/status/page.tsx` — 동일 골격, `AppHeader title="실시간 현황"`, 본문 `<StatusScreen />`.

- [ ] **Step 3: 확인 + 커밋**

Run: `/status`에서 현황 표시 + 댓글 추가/본인 삭제 + 7초 자동 갱신(다른 탭에서 변경 후 반영) 확인.
```bash
git add zerobell-swim-nextjs/app/status zerobell-swim-nextjs/components/room/StatusScreen.tsx
git commit -m "feat(next): status 페이지(현황+댓글) 연동"
```

---

## Task 17: 통합 검증 + 비교 메모

**Files:**
- Create: `zerobell-swim-nextjs/COMPARISON.md`

- [ ] **Step 1: 단위 테스트 + 타입체크 + 빌드**

Run:
```bash
cd zerobell-swim-nextjs
npm test && npx tsc --noEmit && npm run build
```
Expected: 테스트 PASS, 타입 에러 0, 빌드 성공.

- [ ] **Step 2: 키 노출 0 확인**

Run: `npm run build` 후
```bash
grep -rn "X-Master-Key\|JSONBIN_MASTER_KEY" .next/static 2>/dev/null || echo "OK: 클라 번들에 키 없음"
```
Expected: `OK: 클라 번들에 키 없음`. 브라우저 Network 탭에서도 jsonbin 직접 호출/키 헤더가 안 보여야 함(모든 호출이 `/api/db` 또는 Server Action POST).

- [ ] **Step 3: 기능 동등성 수동 체크리스트** (spec 10 기준, 두 앱 동시 구동: Astro 4321 / Next 3000)

- [ ] 로그인/로그아웃, 비로그인 시 `/carpool`·`/shop`·`/status` 접근 차단
- [ ] 카풀 등록·수정·취소
- [ ] 좌석 선택·취소·만석 처리
- [ ] 장보기 추가·본인만 삭제
- [ ] 댓글 추가·본인만 삭제
- [ ] 7초 폴링·포커스 재검증·수동 새로고침
- [ ] 낙관적 반영 + (네트워크 끊고) 실패 롤백 토스트
- [ ] 첫 화면 깜빡임(빈 목록 플래시): Astro=있음 / Next=없음(RSC 프리페치) 비교 기록

- [ ] **Step 4: 비교 메모 작성 + 커밋**

`COMPARISON.md`에 관찰 기록: (1) 동일 화면 코드량 — `room.ts`(약 400줄) vs 컴포넌트 분해, (2) 접근성(Dialog/Sonner 키보드·포커스), (3) 첫 화면 깜빡임 차이, (4) 키 노출 차이, (5) 체감 UX.
```bash
git add zerobell-swim-nextjs/COMPARISON.md
git commit -m "docs(next): 통합 검증 + Astro vs Next 비교 메모"
```

---

## Self-Review (작성자 점검 완료)

- **Spec 커버리지**: 범위(/room only)·위치(서브디렉토리)·스택·하이브리드 데이터(RSC 프리페치+TanStack+Server Action)·캐싱 가드레일(no-store/force-dynamic)·staleTime·cancelQueries·키 서버측·소유권 서버 검증·브랜드 동일 포팅·shadcn(Dialog/Sonner/Form)·페이지 매핑·세션·검증 체크리스트 → 모두 태스크에 매핑됨.
- **cacheComponents**: create-next-app 기본 비활성 전제(Task 1). 활성화 시 spec대로 `<Suspense>` 필요 — 본 계획은 비활성 기준.
- **타입 일관성**: `DB_KEY`(`['db']`), reducer 시그니처 `(db, actor, payload)`, 액션명 `*Action`, `useRoomMutation({reduce, run})` 계약이 Task 8/12/14/15/16에서 일치.
- **Server Action을 read에 미사용**: 초기 RSC=`getDB`(React.cache), 클라 폴링=`/api/db` Route Handler, 쓰기만 Server Action — 공식 문서 검증 반영.
- **알려진 잔여 리스크**: 7초 interval 틱 vs 낙관적 경합은 `onSettled` invalidate로 정합(완전 차단 아님, 기존 Astro와 동일 수준). jsonbin last-write-wins 동시성 한계는 범위 외(spec 9).
