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
