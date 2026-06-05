/* ============================================================
 *  jsonbin 데이터 계층 — GET → merge → PUT 패턴
 *
 *  ⚠️ MASTER_KEY는 PUBLIC_ 환경변수라 클라이언트 번들에 inline됩니다.
 *     = 브라우저에서 노출됨. 보안 개선이 아니라 위생/로테이션 목적.
 *     신뢰 그룹(단톡방) 한정 + 행사(6/19) 후 jsonbin에서 bin 삭제 전제.
 * ============================================================ */

export interface User {
  name: string;
  salt: string;
  hash: string;
}
export interface Ride {
  id: number;
  driver: string;
  seats: number;
  from: string;
}
export interface Booking {
  rideId: number;
  rider: string;
}
export interface Item {
  id: number;
  name: string;
  memo: string;
  done: boolean;
  addedBy: string; // 추가한 사람(화면 표시 X, 본인 항목 삭제 권한에만 사용)
}
export interface Comment {
  id: number;
  by: string;
  text: string;
  at: number; // epoch ms
}
export interface DB {
  users: User[];
  rides: Ride[];
  bookings: Booking[];
  items: Item[];
  comments: Comment[];
}

export const MAX_SEATS = 8;
export const POLL_MS = 7000;

const BIN_ID = import.meta.env.PUBLIC_JSONBIN_BIN_ID;
const MASTER_KEY = import.meta.env.PUBLIC_JSONBIN_MASTER_KEY;

const API = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Master-Key': MASTER_KEY,
  'X-Bin-Meta': 'false', // 응답에서 record 본문만 받기
};

export function configReady(): boolean {
  return (
    !!BIN_ID &&
    !BIN_ID.includes('붙여넣기') &&
    !!MASTER_KEY &&
    !MASTER_KEY.includes('붙여넣기')
  );
}

/** 빈 DB (하위호환: 과거 bin에는 users가 없을 수 있음) */
function normalize(rec: any): DB {
  return {
    users: Array.isArray(rec?.users) ? rec.users : [],
    rides: Array.isArray(rec?.rides) ? rec.rides : [],
    bookings: Array.isArray(rec?.bookings) ? rec.bookings : [],
    items: Array.isArray(rec?.items) ? rec.items : [],
    comments: Array.isArray(rec?.comments) ? rec.comments : [],
  };
}

export async function getData(): Promise<DB> {
  const res = await fetch(API + '/latest', { headers: HEADERS });
  if (!res.ok) throw new Error('GET ' + res.status);
  const json = await res.json();
  const rec = json && json.record ? json.record : json;
  return normalize(rec);
}

export async function putData(next: DB): Promise<DB> {
  const res = await fetch(API, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(next),
  });
  if (!res.ok) throw new Error('PUT ' + res.status);
  return next;
}

/**
 * 쓰기는 반드시 GET → merge → PUT.
 * mutate(fresh)는 최신 데이터를 받아 "내 항목만" 추가/수정한 새 DB를 반환.
 * null을 반환하면 쓰기를 건너뜀(검증 실패 등).
 */
export async function commit(mutate: (fresh: DB) => DB | null): Promise<DB> {
  const fresh = await getData();
  const next = mutate(structuredClone(fresh));
  if (next === null) return fresh;
  await putData(next);
  return next;
}

/** 남은 좌석 = seats − 해당 ride 예약 수 */
export function remaining(ride: Ride, bookings: Booking[]): number {
  const taken = bookings.filter((b) => b.rideId === ride.id).length;
  return ride.seats - taken;
}

/** rides 배열에서 다음 id 계산 */
export function nextRideId(rides: Ride[]): number {
  return rides.length ? Math.max(...rides.map((r) => r.id)) + 1 : 1;
}

/** items 배열에서 다음 id 계산 */
export function nextItemId(items: Item[]): number {
  return items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

/** comments 배열에서 다음 id 계산 */
export function nextCommentId(comments: Comment[]): number {
  return comments.length ? Math.max(...comments.map((c) => c.id)) + 1 : 1;
}
