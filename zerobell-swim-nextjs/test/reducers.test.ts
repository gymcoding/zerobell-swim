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
    d = R.pickRide(d, 'B', { rideId: 1 })!;
    expect(d.bookings).toHaveLength(1);
    expect(R.pickRide(clone(d), 'C', { rideId: 1 })).toBeNull();
    const toggled = R.pickRide(d, 'B', { rideId: 1 })!;
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
    expect(R.deleteItem(clone(d), 'B', { id: 1 })).toBeNull();
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
