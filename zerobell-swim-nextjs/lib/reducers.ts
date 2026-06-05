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
  if (ex && ex.rideId === p.rideId) {
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
