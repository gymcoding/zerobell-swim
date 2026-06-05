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
