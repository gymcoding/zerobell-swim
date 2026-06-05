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
