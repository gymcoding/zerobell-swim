import { cache } from 'react';
import { getData } from './jsonbin.server';
// 같은 요청 내 여러 RSC가 호출해도 jsonbin 1회만 — 'use server' 아님(일반 서버 함수).
export const getDB = cache(getData);
