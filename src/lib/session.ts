/* ============================================================
 *  세션 — 이름 + 본인확인 플래그
 *  저장은 localStorage 우선, 실패 시 in-memory 폴백.
 *  (카카오톡 인앱 브라우저/iOS WKWebView에서 localStorage 쓰기가
 *   막히는 경우 "로그인 후 메뉴 누르면 첫 화면으로 튕김" 무한루프 방지.
 *   ClientRouter SPA 네비는 같은 JS 컨텍스트라 메모리 폴백이 유지됨.)
 * ============================================================ */
const NAME_KEY = 'carpool_name'; // 기존 키 재사용(돌아온 사용자 호환)
const VERIFIED_KEY = 'carpool_verified_name';

// localStorage 불가 시 폴백 (같은 탭/세션 동안 유지)
let memName = '';
let memVerified = '';

function lsGet(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}
function lsSet(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {
    /* private mode / webview 차단 — 메모리 폴백 사용 */
  }
}
function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* 무시 */
  }
}

export function getSavedName(): string {
  return lsGet(NAME_KEY) || memName;
}

/** 로그인 성공 시: 이름 기억 + 본인확인 표시 */
export function setSession(name: string): void {
  memName = name;
  memVerified = name;
  lsSet(NAME_KEY, name);
  lsSet(VERIFIED_KEY, name);
}

/** 현재 세션에서 본인확인된 이름 (없으면 빈 문자열) */
export function verifiedName(): string {
  return lsGet(VERIFIED_KEY) || memVerified;
}

export function isVerified(): boolean {
  return verifiedName().length > 0;
}

/** 로그아웃 / 이름 바꾸기 — 본인확인만 해제(이름은 입력 편의로 유지) */
export function clearSession(): void {
  memVerified = '';
  lsRemove(VERIFIED_KEY);
}
