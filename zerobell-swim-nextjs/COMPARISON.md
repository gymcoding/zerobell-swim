# Astro vs Next.js 마이그레이션 비교 메모

> 같은 앱(통일로 원정수영 준비방)을 **Astro 5**(원본, 상위 디렉토리)와 **Next.js 16**(이 디렉토리)으로 각각 구현해 나란히 비교한 기록.
> 작성: 2026-06-05 · 브랜치 `feat/nextjs-migration`

## 목표

- 동일 기능·동일 룩을 두 스택으로 만들어 **코드·DX·UX 차이를 코드로** 확인.
- 데이터 백엔드(jsonbin)는 동일하게 유지해 **프레임워크 변수만** 비교.
- 룩(브랜드)을 고정해 차이를 코드/구조로 한정.

## 라우트 구조 (원본과 동일)

| URL | 내용 | 렌더 |
|---|---|---|
| `/` | 랜딩(행사 안내 9섹션 + 버블·스크롤등장 + 스티키 CTA) | 정적 `○` |
| `/room` | 준비방 홈(이름 로그인 + 메뉴) | 동적 `ƒ` |
| `/room/carpool` | 카풀(역할선택·운전자폼·탑승목록) | 동적 |
| `/room/shop` | 장보기 + 의견 남기기(댓글) | 동적 |
| `/room/status` | 실시간 현황 보드 | 동적 |
| `/api/db` | jsonbin 읽기(클라 폴링용) | 동적 |

## 스택 매핑

| 레이어 | Astro(원본) | Next(이번) |
|---|---|---|
| 프레임워크 | Astro 5 static + ClientRouter | Next 16 App Router |
| UI | `.astro` + 순수 JS island | React 컴포넌트 + shadcn(base-nova) |
| 데이터 | jsonbin GET→merge→PUT, **마스터키 클라 노출** | 동일 jsonbin, **키 서버 전용** |
| 상태/동기화 | nanostores `@nanostores/query` | TanStack Query |
| 변경 처리 | `room.ts` `apply()` 낙관적 + innerHTML 렌더 | Server Action + `useRoomMutation` 낙관적 |
| 스타일 | Tailwind v4 전역 CSS | Tailwind v4 `@theme` 토큰 + `@layer` |

## 핵심 아키텍처 차이

### 1. 데이터 계층 — 키 노출이 사라짐
- **Astro**: 정적 사이트라 `PUBLIC_JSONBIN_MASTER_KEY`가 클라이언트 번들에 inline → 브라우저 노출(위생/로테이션 목적의 신뢰그룹 전제).
- **Next**: 서버가 있어 키가 `jsonbin.server.ts`(`import 'server-only'`)에만 존재. 읽기=GET Route Handler/RSC, 쓰기=Server Action. **빌드 산출물(`.next/static`)에 마스터키 0건** 확인.

### 2. 변경 로직 DRY — reducer 공유
- 순수 reducer `(db, actor, payload) => DB | null` 7종을 **클라 낙관적 업데이트와 서버 커밋이 공유**. Astro에선 `room.ts`의 `apply()` 콜백이 클라에만 존재했고 서버 검증이 없었음(정적). Next는 같은 reducer를 Server Action에서 재실행해 **소유권을 서버에서 재검증**(이름 기반이라 스푸핑 가능 — 신뢰그룹 한계는 동일).

### 3. 첫 화면 깜빡임
- **Astro**: room 페이지는 빈 HTML → `room.ts mount()`가 fetch 후 `innerHTML`로 채움 → "카풀 없어요" 깜빡임 존재.
- **Next**: RSC가 `getDB`로 서버에서 데이터까지 렌더 → `HydrationBoundary`로 TanStack 캐시에 hydrate. `staleTime=7s`로 hydrate 직후 즉시 refetch 방지 → **깜빡임 제거.**

### 4. 코드량/가독성
- **Astro**: `room.ts` 약 400줄 — `innerHTML` 문자열 렌더 + `astro:page-load`마다 수동 DOM 배선 + 인라인 SVG 아이콘(astro-icon는 .astro 전용).
- **Next**: 화면별 React 컴포넌트로 분해(`CarpoolScreen`/`ShopScreen`/`StatusScreen`/`Comments` 등). `rides.map(r => <RideCard/>)` + `onClick`, 상태는 훅, 아이콘은 `lucide-react`. 수동 DOM 배선 레이어가 사라짐.

### 5. 폴링·동기화
- 둘 다 7초 폴링 + 포커스 재검증. Next는 `useQuery({refetchInterval})` + `onMutate`에서 `cancelQueries`로 진행 중 refetch가 낙관적 값을 덮어쓰지 않게 함(공식 패턴). 7초 틱 vs 낙관적 경합은 `onSettled` invalidate로 최종 정합(Astro와 동일 수준의 잔여 리스크).

## UI 커스터마이징 (시니어 표준 — 공식문서 검증)

- **브랜드 팔레트** → Tailwind `@theme`(`--color-coral` 등) → 실제 `bg-coral` 유틸 생성. arbitrary `bg-[var(--coral)]` 미사용.
- **shadcn 시맨틱 토큰**(`--primary/--ring/--radius`) → `:root` + `@theme inline`로 브랜드 매핑.
- **shadcn 컴포넌트는 제자리 리스타일** → `button.tsx` cva에 `sticker` 변형 추가(wrapper 남용 X).
- **재사용 룩**(`.sticker/.field/.tag`) → `@layer components`. `cn()`은 shadcn 기본형(extendTailwindMerge 불필요).
- **동작/접근성은 shadcn**(Dialog/Sonner), **정체성은 브랜드**.

## 검증 결과

- 단위 테스트(도메인+reducer): **12/12 통과**.
- 타입체크: 클린. 프로덕션 빌드: 성공.
- **마스터키 클라이언트 번들 노출: 0건.**
- 페이지별 기능: Playwright로 라이브 검증(로그인·카풀 등록/탑승/만석/토글·장보기 추가/삭제·댓글 추가/삭제·현황 폴링).
- 시각 충실도: 원본 Vercel과 4페이지 나란히 비교 — 폰트·브랜드색·스티커 카드·레이아웃·정적 카피 일치(데이터 목록 내용은 서로 다른 jsonbin bin이라 다름).

## 한계 (범위 밖, 다음 단계)

- jsonbin 단일 문서 last-write-wins → 동시 마지막 좌석 예약 시 유실 가능(트랜잭션 없음). **진짜 해결은 Postgres(제약·트랜잭션)+실시간**.
- 인증은 여전히 이름 기반(스푸핑 가능) — 신뢰그룹 전제. SaaS화 시 실제 인증 필요.

## 결론

- 현재 기능(폼·리스트 중심)에서 **두 스택 모두 동일 UX 달성 가능**. Next는 키 은닉·서버 검증·첫화면 깜빡임 제거·코드 가독성에서 우위, 대신 인프라(서버) 비용.
- "앱(로그인·상호작용·확장)"이 무게중심이면 Next가 자연스럽고, shadcn·생태계·강의 자산까지 이어짐. 마케팅/정적 비중이 크면 Astro도 충분.
