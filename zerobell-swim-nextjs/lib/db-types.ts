export interface User { name: string; salt: string; hash: string; }
export interface Ride { id: number; driver: string; seats: number; from: string; }
export interface Booking { rideId: number; rider: string; }
export interface Item { id: number; name: string; memo: string; done: boolean; addedBy: string; }
export interface Comment { id: number; by: string; text: string; at: number; }
export interface DB { users: User[]; rides: Ride[]; bookings: Booking[]; items: Item[]; comments: Comment[]; }

export const MAX_SEATS = 8;
export const POLL_MS = 7000;
export const EMPTY_DB: DB = { users: [], rides: [], bookings: [], items: [], comments: [] };

/** TanStack Query 키 — 서버(RSC 프리페치)·클라(useDB) 공용 단일 출처 */
export const DB_KEY = ['db'] as const;
