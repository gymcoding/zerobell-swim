/* ============================================================
 *  /room 멀티 페이지 공용 컨트롤러
 *
 *  - 각 페이지(home/carpool/shop/status)는 RoomLayout을 쓰고
 *    `<main data-room-page="...">` 마커를 가진다.
 *  - ClientRouter(View Transitions)로 페이지 전환 → 같은 JS 컨텍스트라
 *    스토어(store.ts) 캐시가 유지됨(Next.js처럼). DOM은 매 전환마다 새로
 *    교체되므로 mount()를 astro:page-load 에서 매번 호출해 현재 페이지를 배선.
 *  - 데이터 변경은 $apply.mutate(낙관적) → 즉시 화면, 백그라운드 저장.
 * ============================================================ */
import {
  remaining, nextRideId, nextItemId, nextCommentId, configReady, MAX_SEATS, type DB,
} from './jsonbin';
import { $db, $apply, syncIfIdle } from './store';
import { getSavedName, setSession, verifiedName, isVerified, clearSession } from './session';
import { escapeHtml } from './escape';

const q = (id: string) => document.getElementById(id);
const qi = (id: string) => document.getElementById(id) as HTMLInputElement | null;
const me = () => verifiedName();

/* 동적 렌더에 쓰는 Lucide 인라인 SVG (astro-icon <Icon>는 .astro 전용이라 문자열로 인라인) */
const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const ICON_TRASH = `${SVG.replace('<svg ', '<svg width="18" height="18" ')}<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;

let DATA: DB = { users: [], rides: [], bookings: [], items: [], comments: [] };
let pendingConfirm: (() => void) | null = null;
let toastT: number | undefined;
let globalsReady = false;

/* ---------- toast ---------- */
function toast(msg: string, kind: 'info' | 'ok' | 'err' | 'warn' = 'info') {
  const wrap = q('toast'); const box = q('toastBox');
  if (!wrap || !box) return;
  const colors: Record<string, string> = { info: '#fff', ok: '#e8fff1', err: '#fff0f2', warn: '#fff8e6' };
  box.style.background = colors[kind] || '#fff';
  box.innerHTML = msg;
  wrap.hidden = false;
  wrap.classList.remove('pop'); void wrap.offsetWidth; wrap.classList.add('pop');
  clearTimeout(toastT);
  toastT = window.setTimeout(() => { wrap.hidden = true; }, 2800);
}

function ensureConfig(): boolean {
  if (configReady()) return true;
  toast('⚙️ 설정 필요: .env에 jsonbin 값을 채워주세요', 'warn');
  return false;
}

/** 낙관적 변경 + 백그라운드 저장 */
function apply(fn: (d: DB) => DB | null) { $apply.mutate(fn); }

/* ---------- 확인 모달 ---------- */
function askConfirm(html: string, onYes: () => void) {
  const modal = q('confirmModal'); const text = q('confirmText');
  if (!modal || !text) return;
  text.innerHTML = html;
  pendingConfirm = onYes;
  modal.hidden = false;
}
function closeConfirm() {
  const modal = q('confirmModal');
  if (modal) modal.hidden = true;
  pendingConfirm = null;
}

/* ---------- 렌더 ---------- */
function renderDriver(data: DB) {
  const exist = q('driverExisting'); const formBody = q('driverFormBody'); const body = q('driverMineBody');
  if (!exist || !formBody) return;
  const mine = data.rides.find((r) => r.driver === me());
  if (mine) {
    exist.hidden = false;
    formBody.hidden = true;
    const left = remaining(mine, data.bookings);
    if (body) body.innerHTML =
      `📍 <b>${escapeHtml(mine.from)}</b><br>🚪 ${mine.seats}자리 중 <b class="text-[var(--coral)]">${left}자리</b> 남음`;
  } else {
    exist.hidden = true;
    formBody.hidden = false;
  }
}

function renderRideList(data: DB) {
  const list = q('rideList');
  if (!list) return;
  const meName = me();
  if (data.rides.length === 0) {
    list.innerHTML =
      `<div class="sticker p-6 text-center font-round text-[17px] text-[var(--ink)]/60">아직 등록된 카풀이 없어요 🥲<br>운전자분의 등록을 기다려요!</div>`;
    return;
  }
  const myBooking = data.bookings.find((b) => b.rider === meName);
  list.innerHTML = data.rides.map((ride) => {
    const left = remaining(ride, data.bookings);
    const full = left <= 0;
    const mine = !!myBooking && myBooking.rideId === ride.id;
    const isMyOwnRide = !!meName && ride.driver === meName;
    const riders = data.bookings.filter((b) => b.rideId === ride.id).map((b) => b.rider);
    const chips = riders.length
      ? riders.map((rname) =>
          `<span class="tag bg-[var(--foam)] px-2.5 py-1 text-[14px] font-round">${escapeHtml(rname)}${rname === meName ? ' (나)' : ''}</span>`,
        ).join(' ')
      : `<span class="font-round text-[14px] text-[var(--ink)]/40">아직 아무도 안 탔어요</span>`;
    const btn = mine
      ? `<button data-pick="${ride.id}" class="btn-3d w-full rounded-[16px] py-4 bg-[var(--ink)] text-white font-round text-xl">✅ 선택됨 (취소)</button>`
      : full
        ? `<button disabled class="btn-3d w-full rounded-[16px] py-4 bg-white font-round text-xl">🈵 자리 다 참</button>`
        : `<button data-pick="${ride.id}" class="btn-3d w-full rounded-[16px] py-4 bg-[var(--coral)] text-white font-round text-xl">이거 탈래요</button>`;
    return `
      <div class="sticker p-5 ${mine ? 'ring-4 ring-[var(--aqua)]' : ''}">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-display text-2xl truncate">🧑‍✈️ ${escapeHtml(ride.driver)}${isMyOwnRide ? ' <span class="font-round text-sm text-[var(--pool)]">(내 차)</span>' : ''}</div>
            <div class="font-round text-[16px] text-[var(--ink)]/80 mt-1">📍 ${escapeHtml(ride.from)}</div>
          </div>
          <div class="text-right shrink-0">
            <div class="font-display text-3xl ${full ? 'text-[var(--ink)]/40' : 'text-[var(--coral)]'}">${full ? 0 : left}</div>
            <div class="font-round text-sm text-[var(--pool)]">남은자리</div>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-[var(--ink)]/10">
          <div class="font-round text-[14px] text-[var(--ink)]/60 mb-1.5">🙋 탄 사람 ${riders.length}/${ride.seats}명</div>
          <div class="flex flex-wrap gap-1.5 items-center">${chips}</div>
        </div>
        <div class="mt-3">${btn}</div>
      </div>`;
  }).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => {
    b.addEventListener('click', () => pickRide(Number(b.dataset.pick)));
  });
}

function renderStatus(data: DB) {
  const list = q('statusList');
  if (!list) return;
  if (data.rides.length === 0) {
    list.innerHTML =
      `<div class="sticker p-4 text-center font-round text-[15px] text-[var(--ink)]/50">등록된 카풀이 없어요</div>`;
    return;
  }
  list.innerHTML = data.rides.map((ride) => {
    const riders = data.bookings.filter((b) => b.rideId === ride.id).map((b) => b.rider);
    const left = remaining(ride, data.bookings);
    const chips = riders.length
      ? riders.map((r) => `<span class="tag bg-[var(--foam)] px-2.5 py-0.5 text-[14px] font-round">${escapeHtml(r)}</span>`).join(' ')
      : `<span class="font-round text-[14px] text-[var(--ink)]/40">아직 없음</span>`;
    return `
      <div class="sticker p-4">
        <div class="flex items-center justify-between">
          <div class="font-display text-lg">🚗 ${escapeHtml(ride.driver)} <span class="font-round text-[13px] text-[var(--pool)]">· ${escapeHtml(ride.from)}</span></div>
          <div class="font-round text-sm ${left <= 0 ? 'text-[var(--coral)] font-bold' : 'text-[var(--pool)]'}">${left <= 0 ? '마감' : '잔여 ' + left}</div>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5 items-center">
          <span class="font-round text-[14px] text-[var(--ink)]/60">🙋 ${riders.length}/${ride.seats}</span>
          ${chips}
        </div>
      </div>`;
  }).join('');
}

function timeAgo(at: number): string {
  if (!at) return '';
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return '방금';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function renderComments(data: DB) {
  const list = q('commentList');
  if (!list) return;
  const meName = me();
  if (data.comments.length === 0) {
    list.innerHTML =
      `<div class="font-round text-[14px] text-[var(--ink)]/45 ml-1">아직 의견이 없어요. 첫 의견을 남겨보세요!</div>`;
    return;
  }
  const sorted = [...data.comments].sort((a, b) => a.at - b.at);
  list.innerHTML = sorted.map((c) => {
    const mineC = !!meName && c.by === meName;
    const del = mineC
      ? `<button data-delc="${c.id}" aria-label="삭제" class="shrink-0 text-[var(--coral)] px-2 py-1">${ICON_TRASH}</button>`
      : '';
    return `
      <div class="sticker p-3 flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <div class="font-round text-[15px]"><b class="text-[var(--ocean)]">${escapeHtml(c.by)}</b> <span class="text-[12px] text-[var(--ink)]/40">${timeAgo(c.at)}</span></div>
          <div class="font-round text-[16px] mt-0.5 break-words whitespace-pre-wrap">${escapeHtml(c.text)}</div>
        </div>
        ${del}
      </div>`;
  }).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-delc]').forEach((b) => {
    b.addEventListener('click', () => askDeleteComment(Number(b.dataset.delc)));
  });
}

function renderShop(data: DB) {
  const list = q('shopList');
  if (!list) return;
  const meName = me();
  if (data.items.length === 0) {
    list.innerHTML =
      `<div class="sticker p-6 text-center font-round text-[17px] text-[var(--ink)]/60">아직 추가된 항목이 없어요 🛒<br>위 칸에 살 거를 적어주세요!</div>`;
    return;
  }
  list.innerHTML = data.items.map((it) => {
    const mineItem = !!meName && it.addedBy === meName;
    // 체크박스 자리에 작성자 표시 (항목 높이 단축)
    const author = it.addedBy
      ? `<span class="shrink-0 tag ${mineItem ? 'bg-[var(--sun)]' : 'bg-[var(--foam)]'} px-2.5 py-1 font-round text-[13px] max-w-[84px] truncate">${escapeHtml(it.addedBy)}</span>`
      : `<span class="shrink-0 w-[52px]"></span>`;
    const trash = mineItem
      ? `<button data-del="${it.id}" aria-label="삭제" class="shrink-0 text-[var(--coral)] px-2 py-2">${ICON_TRASH}</button>`
      : '';
    return `
      <div class="sticker p-4 flex items-center gap-3">
        ${author}
        <div class="min-w-0 flex-1">
          <div class="font-display text-xl truncate">${escapeHtml(it.name)}</div>
        </div>
        ${trash}
      </div>`;
  }).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) => {
    b.addEventListener('click', () => askDelete(Number(b.dataset.del)));
  });
}

function updateStatusMeta() {
  const meta = q('statusMeta');
  if (!meta) return;
  const pad = (n: number) => String(n).padStart(2, '0');
  const t = new Date();
  meta.textContent = `마지막 갱신 ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())} · 자동 갱신`;
}

function renderAll() {
  renderDriver(DATA);
  renderRideList(DATA);
  renderStatus(DATA);
  renderShop(DATA);
  renderComments(DATA);
  updateStatusMeta();
}

/* ---------- 액션 ---------- */
function doLogin() {
  if (!ensureConfig()) return;
  const input = qi('loginName'); const warn = q('loginWarn');
  if (!input) return;
  const name = input.value.trim();
  if (warn) warn.hidden = true;
  if (!name) { if (warn) { warn.textContent = '이름(별명)을 입력해 주세요!'; warn.hidden = false; } input.focus(); return; }
  setSession(name);
  toast(`👋 ${escapeHtml(name)}님 반가워요!`, 'ok');
  setupHome();
  syncIfIdle();
}

function submitDriver() {
  if (!ensureConfig() || !isVerified()) return;
  const meName = me();
  const seatEl = qi('seatCount'); const fromEl = qi('driverFrom');
  if (!seatEl || !fromEl) return;
  const seats = Math.max(1, Math.min(MAX_SEATS, Number(seatEl.value) || 0));
  const from = fromEl.value.trim();
  if (!from) { toast('출발 장소를 입력해 주세요 📍', 'err'); fromEl.focus(); return; }
  apply((d) => {
    const existing = d.rides.find((r) => r.driver === meName);
    if (existing) { existing.seats = seats; existing.from = from; }
    else d.rides.push({ id: nextRideId(d.rides), driver: meName, seats, from });
    return d;
  });
  fromEl.value = '';
  toast('🎉 카풀 등록 완료! 탑승자를 기다려요', 'ok');
}

function cancelDriver() {
  if (!ensureConfig() || !isVerified()) return;
  const meName = me();
  if (!DATA.rides.some((r) => r.driver === meName)) return;
  apply((d) => {
    const ride = d.rides.find((r) => r.driver === meName);
    if (!ride) return null;
    d.rides = d.rides.filter((r) => r.driver !== meName);
    d.bookings = d.bookings.filter((b) => b.rideId !== ride.id);
    return d;
  });
  toast('내 카풀 등록을 취소했어요', 'info');
}

function pickRide(rideId: number) {
  if (!ensureConfig() || !isVerified()) return;
  const meName = me();
  const existing = DATA.bookings.find((b) => b.rider === meName);
  const isCancel = !!existing && existing.rideId === rideId;
  if (isCancel) {
    toast('예약을 취소했어요', 'info');
  } else {
    const ride = DATA.rides.find((r) => r.id === rideId);
    if (!ride) return;
    const left = remaining(ride, DATA.bookings.filter((b) => b.rider !== meName));
    if (left <= 0) { toast('😢 자리가 다 찼어요! 다른 카풀을 골라주세요', 'err'); return; }
    toast(`✅ '${escapeHtml(ride.driver)}'님 카풀에 탔어요!`, 'ok');
  }
  apply((d) => {
    const ex = d.bookings.find((b) => b.rider === meName);
    if (ex && ex.rideId === rideId) { d.bookings = d.bookings.filter((b) => b.rider !== meName); return d; }
    const ride = d.rides.find((r) => r.id === rideId);
    if (!ride) return null;
    const left = remaining(ride, d.bookings.filter((b) => b.rider !== meName));
    if (left <= 0) return null;
    d.bookings = d.bookings.filter((b) => b.rider !== meName);
    d.bookings.push({ rideId, rider: meName });
    return d;
  });
}

function addItem() {
  if (!ensureConfig() || !isVerified()) return;
  const meName = me();
  const nameEl = qi('quickName');
  if (!nameEl) return;
  const name = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }
  apply((d) => { d.items.push({ id: nextItemId(d.items), name, memo: '', done: false, addedBy: meName }); return d; });
  nameEl.value = '';
  nameEl.focus();
}

function askDelete(id: number) {
  const it = DATA.items.find((x) => x.id === id);
  if (!it) return;
  askConfirm(`<b>${escapeHtml(it.name)}</b><br>이 항목을 목록에서 지울까요?`, () => {
    if (!ensureConfig() || !isVerified()) return;
    const meName = me();
    apply((d) => {
      const t = d.items.find((x) => x.id === id);
      if (!t || t.addedBy !== meName) return null;
      d.items = d.items.filter((x) => x.id !== id);
      return d;
    });
    toast('삭제했어요', 'info');
  });
}

function addComment() {
  if (!ensureConfig() || !isVerified()) return;
  const meName = me();
  const input = qi('commentInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  const at = Date.now();
  apply((d) => { d.comments.push({ id: nextCommentId(d.comments), by: meName, text, at }); return d; });
  input.value = '';
  input.focus();
}

function askDeleteComment(id: number) {
  askConfirm('이 댓글을 지울까요?', () => {
    if (!isVerified()) return;
    const meName = me();
    apply((d) => {
      const c = d.comments.find((x) => x.id === id);
      if (!c || c.by !== meName) return null;
      d.comments = d.comments.filter((x) => x.id !== id);
      return d;
    });
  });
}

/* ---------- 페이지 배선 ---------- */
function on(id: string, ev: string, fn: (e: Event) => void) {
  const elx = q(id);
  if (elx) elx.addEventListener(ev, fn);
}
function enterKey(id: string, fn: () => void) {
  const elx = qi(id);
  if (!elx) return;
  elx.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    if (ev.key !== 'Enter') return;
    // 한글 등 IME 조합 중에 들어온 Enter는 무시 (조합 확정 Enter + 실제 Enter 중복 입력 방지)
    if (ev.isComposing || (ev as { keyCode?: number }).keyCode === 229) return;
    ev.preventDefault();
    fn();
  });
}

function setupHome() {
  const verified = isVerified();
  const login = q('step-login'); const home = q('step-home'); const greet = q('homeGreet');
  const nameEl = qi('loginName');
  if (nameEl && !verified) nameEl.value = getSavedName();
  if (login) login.hidden = verified;
  if (home) home.hidden = !verified;
  if (verified && greet) greet.textContent = me();
}

function resetCarpool() {
  const role = q('step-role'); const driver = q('step-driver'); const rider = q('step-rider');
  if (role) role.hidden = false;
  if (driver) driver.hidden = true;
  if (rider) rider.hidden = true;
}
function showRoleSub(which: 'role' | 'driver' | 'rider') {
  const role = q('step-role'); const driver = q('step-driver'); const rider = q('step-rider');
  if (role) role.hidden = which !== 'role';
  if (driver) driver.hidden = which !== 'driver';
  if (rider) rider.hidden = which !== 'rider';
  if (which === 'driver') renderDriver(DATA);
  if (which === 'rider') renderRideList(DATA);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wire() {
  // home
  on('loginBtn', 'click', doLogin);
  enterKey('loginName', doLogin);
  on('logoutBtn', 'click', () => { clearSession(); setupHome(); });
  // carpool
  on('roleDriverBtn', 'click', () => showRoleSub('driver'));
  on('roleRiderBtn', 'click', () => showRoleSub('rider'));
  document.querySelectorAll<HTMLElement>('[data-role-back]').forEach((b) =>
    b.addEventListener('click', () => showRoleSub('role')),
  );
  on('seatMinus', 'click', () => { const s = qi('seatCount'); if (s) s.value = String(Math.max(1, (Number(s.value) || 1) - 1)); });
  on('seatPlus', 'click', () => { const s = qi('seatCount'); if (s) s.value = String(Math.min(MAX_SEATS, (Number(s.value) || 1) + 1)); });
  on('submitDriver', 'click', submitDriver);
  on('cancelDriver', 'click', cancelDriver);
  // shop
  on('quickAdd', 'click', addItem);
  enterKey('quickName', addItem);
  on('commentBtn', 'click', addComment);
  enterKey('commentInput', addComment);
  // status
  on('refreshBtn', 'click', () => { const ic = q('refreshIcon'); if (ic) ic.classList.add('spin'); $db.revalidate(); });
  // confirm modal (모든 페이지 공통)
  on('confirmYes', 'click', () => { const cb = pendingConfirm; closeConfirm(); cb?.(); });
  on('confirmNo', 'click', closeConfirm);
  on('confirmBackdrop', 'click', closeConfirm);
}

function setupGlobalsOnce() {
  if (globalsReady) return;
  globalsReady = true;
  // 캐시 변화 → 현재 페이지 즉시 렌더
  $db.subscribe((raw) => {
    const v = raw as { data?: DB; error?: unknown };
    if (v.data) { DATA = v.data; renderAll(); }
    else if (v.error) { const meta = q('statusMeta'); if (meta) meta.textContent = '⚠️ 불러오기 실패 — 새로고침을 눌러주세요'; }
    const ic = q('refreshIcon'); if (ic) ic.classList.remove('spin');
  });
  // 저장 실패 알림(낙관적 변경 자동 롤백)
  $apply.subscribe((raw) => {
    if ((raw as { error?: unknown }).error) toast('⚠️ 저장에 실패했어요. 다시 시도해 주세요', 'err');
  });
  // 쓰기 중 아닐 때만 동기화
  window.setInterval(() => { if (!document.hidden) syncIfIdle(); }, 7000);
  window.addEventListener('focus', syncIfIdle);
}

/** astro:page-load 마다 호출 — 현재 페이지 DOM 배선 + 렌더 */
export function mount() {
  const root = document.querySelector('[data-room-page]');
  if (!root) return;
  const page = root.getAttribute('data-room-page') || '';

  // 로그인 안 했으면 기능 페이지 접근 차단
  if (page !== 'home' && !isVerified()) { window.location.href = '/room'; return; }

  if (page === 'home') setupHome();
  if (page === 'carpool') resetCarpool();

  wire();
  setupGlobalsOnce();

  const v = $db.get() as { data?: DB };
  if (v.data) DATA = v.data;
  renderAll();
}
