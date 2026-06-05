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
