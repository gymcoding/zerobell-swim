# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 회사 공통 지침은 상위 `Company/CLAUDE.md` 참조. 이 파일은 zerobell-swim 전용.

## 프로젝트 개요
제로벨 7시 강습 단합 이벤트(2026-06-19) 안내 + 카풀/장보기 매칭 사이트.
**Astro 5 (static) + Tailwind v4** 모바일 전용 정적 사이트. SSR/adapter 없음.
신뢰 그룹(단톡방) 한정 단발성 행사용 — 행사 후 jsonbin bin 삭제 전제.

## 명령어
```bash
npm run dev        # astro dev — http://localhost:4321
npm run build      # dist/ 정적 빌드
npm run preview    # 빌드 결과 미리보기
npx astro check    # 타입 체크 (테스트 러너 없음 — 이게 유일한 검증)
```

## 두 영역
- `/` 랜딩 — `src/pages/index.astro` + `src/components/landing/*`. 순수 정적, 클라이언트 JS 거의 없음.
- `/room` 준비방 — 카풀/장보기/현황 멀티 페이지 SPA. `/carpool` → `/room` 리다이렉트(astro.config.mjs, 구 링크 호환).

## /room 아키텍처 (핵심)
멀티 페이지지만 **ClientRouter(View Transitions)로 같은 JS 컨텍스트 유지** → Next.js처럼 스토어 캐시가 페이지 전환에도 살아있음.

- **데이터 계층** `src/lib/jsonbin.ts` — jsonbin 문서 1개를 통째로 GET/PUT. `DB = {users, rides, bookings, items, comments}`. 쓰기는 항상 `commit(mutate)` = GET→merge→PUT. `normalize()`로 누락 필드 하위호환.
- **스토어** `src/lib/store.ts` — `@nanostores/query`. `$apply.mutate(fn)`로 **낙관적 업데이트**(캐시 먼저 바꿔 화면 즉시 반영) + 백그라운드 PUT. 쓰기는 직렬 체인으로 큐잉(연속 동작 유실 방지). 실패 시 자동 롤백.
- **컨트롤러** `src/lib/room.ts` — 모든 페이지 공용. `mount()`가 `astro:page-load`마다 호출되어 `<main data-room-page="...">` 마커로 현재 페이지를 식별해 DOM 배선 + 렌더. `setupGlobalsOnce()`는 스토어 구독/폴링을 1회만 등록.
- **동기화** 7초 폴링 + focus. **단, `syncIfIdle()`로 쓰기 중일 때는 revalidate 안 함**(낙관적 상태를 서버가 덮어쓰지 않게).
- **세션** `src/lib/session.ts` — 이름 기반 "본인 확인"만(회원가입/비밀번호 없음). localStorage 우선, 차단 시(카톡 인앱 브라우저) in-memory 폴백.

## 페이지 추가/수정 규칙
- `/room` 하위 페이지는 `RoomLayout`을 쓰고 `page` prop(`'home'|'carpool'|'shop'|'status'`)을 반드시 지정. room.ts가 이 값으로 분기.
- `.astro` 정적 마크업은 `src/components/carpool/*` 컴포넌트로, 동적 렌더는 `room.ts`의 `render*()` 함수가 `innerHTML`로 주입.
- 새 동적 페이지를 추가하면 room.ts의 `mount()`/`wire()`/`renderAll()`에 배선 추가 필요.

## 반드시 지킬 것
- **사용자 입력을 innerHTML에 넣기 전 `escapeHtml()`(`src/lib/escape.ts`) 필수** — XSS 방지. render 함수들이 모두 이 패턴을 따름.
- **전역 CSS는 `src/styles/global.css`에만** — 컴포넌트 scoped `<style>`에 넣으면 다른 컴포넌트의 클래스/CSS 변수 참조가 깨짐. 색상은 `:root`의 `--ocean/--coral/...` CSS 변수 사용.
- astro-icon `<Icon>`은 `.astro` 전용 — `room.ts`의 동적 렌더에서는 인라인 SVG 문자열 사용(`ICON_TRASH` 등).
- jsonbin id는 `Math.max(...)+1`로 계산(`nextRideId/nextItemId/nextCommentId`).

## 환경변수 (`.env`, 모두 `PUBLIC_`)
- `PUBLIC_JSONBIN_BIN_ID`, `PUBLIC_JSONBIN_MASTER_KEY` — **빌드 시 클라이언트 번들에 inline(브라우저 노출)**. 보안 개선이 아니라 위생/로테이션 목적. 신뢰 그룹 한정 전제.
- `SITE_URL`(Vercel) — OG 절대 URL origin. 배포 후 실제 도메인으로 교체.

## 배포
Vercel, framework `astro`(자동 감지). `git push` 시 자동 배포. `vercel.json`에 build/output 명시.

## 주의 (문서 불일치)
README의 "SHA-256 + salt 비밀번호 해시 / `src/lib/auth.ts`" 설명은 **현재 코드와 다름**. auth.ts는 없고 로그인은 이름만으로 동작. `User`의 `salt/hash` 필드는 잔재로 남아있으나 미사용.
