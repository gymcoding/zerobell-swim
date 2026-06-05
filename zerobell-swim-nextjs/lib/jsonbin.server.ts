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
