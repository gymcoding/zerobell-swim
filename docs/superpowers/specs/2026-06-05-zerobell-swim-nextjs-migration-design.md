# zerobell-swim → Next.js 마이그레이션 (비교용) — 설계

- 날짜: 2026-06-05
- 상태: 승인됨 (구현 계획 대기)
- 작성: 짐코딩 + Claude

## 1. 목표 / 비목표

**목표**
- 현재 Astro `/room` 앱의 기능을 **그대로** Next.js로 이식해, 두 스택을 나란히 비교한다.
- 비교 기준은 **최고의 사용자경험(UX)** (강의/콘텐츠 아님).
- 룩(브랜드)을 동일하게 고정해 **코드·DX·UX 차이만** 분리해 본다.

**비목표 (이번 범위 아님)**
- 랜딩 `/` 페이지 이식 (정적이라 프레임워크 차이가 안 드러남).
- 멀티테넌트 SaaS 모델, 실제 인증/조직, Postgres 전환.
- 행사(6/19) 실데이터 사용 — 비교는 별도 테스트 bin에서만.

## 2. 범위

이식 대상은 `/room` 앱 한정:
- 로그인/로그아웃(이름 기반 본인확인)
- 카풀: 운전자 등록·수정·취소, 좌석 선택·취소·만석 처리
- 장보기: 추가, 본인 항목만 삭제
- 현황 보드, 댓글: 추가/본인 삭제
- 7초 폴링 동기화, focus 재검증, 수동 새로고침

## 3. 위치 / 구조

```
zerobell-swim/                 ← 현재 Astro 레포 (그대로 유지)
└─ zerobell-swim-nextjs/        ← 신규 Next 앱 (독립 package.json·node_modules)
   ├─ app/
   ├─ components/
   ├─ lib/
   └─ .env.local               ← jsonbin 키 (서버 전용)
```
- 서브디렉토리로 격리. 모노레포 워크스페이스는 **안 함**(비교용이라 과함).
- 두 앱을 각자 dev 서버로 동시 구동(Astro 4321 / Next 3000)해 나란히 비교.
- 루트 `.gitignore`에 `zerobell-swim-nextjs/node_modules`, `zerobell-swim-nextjs/.next` 추가.

## 4. 스택

Next.js(App Router) + TypeScript · Tailwind **v4** · shadcn/ui · jsonbin(서버측 호출).

## 5. 데이터 아키텍처 — 하이브리드 (핵심)

UX 요소별로 가장 잘하는 도구를 조합한다(배타 아님):

```
RSC 프리페치(plain async 서버함수 + React.cache) → 첫 화면을 데이터까지 렌더 (깜빡임 0)
   ↓ dehydrate / <HydrationBoundary>
TanStack Query (클라이언트 캐시, 'use client' 프로바이더, per-request QueryClient)
   ├─ useQuery : queryFn = GET Route Handler(/api/db), 7초 refetchInterval + refetchOnWindowFocus
   │             defaultOptions.staleTime > 0  ← hydrate 직후 즉시 refetch 방지(핵심)
   └─ useMutation : onMutate(낙관적 + cancelQueries) → onError(롤백) → onSettled(invalidate)
        mutationFn = 쓰기 Server Action → 서버에서 GET→merge→PUT, 키 숨김 + 소유권 재검증
```

**경로 분리 (공식 문서 권장 — 4개 doc 검증 반영):**
- **초기 RSC 읽기**: `'use server'` 아님. 평범한 async 서버 함수를 `React.cache`로 감싸 per-request 메모이즈 + 전역 `fetch(url, { cache: 'no-store' })`. (Server Action을 read에 쓰는 건 비관용 — POST 왕복.)
- **클라이언트 폴링 읽기**: **GET Route Handler `/api/db`** — 브라우저에서 호출하되 키는 서버에 유지. (`queryFn`이 호출할 클라이언트-접근 엔드포인트 필요.)
- **쓰기**: `'use server'` Server Action(`mutationFn`). **POST 공개 엔드포인트이므로 액션 내부에서 소유권/검증을 다시 수행**(키 숨김만으론 불충분 — Server Action은 UI 밖에서도 직접 호출 가능).

세부 동작:
- **첫 화면**: RSC가 서버에서 데이터까지 렌더 → 현재 Astro의 "빈 화면 후 JS로 채움(깜빡임)" 제거. 단 **blocking render라 jsonbin 첫 응답이 느리면 내비가 지연됨** → jsonbin 응답이 빠르다는 전제, 느려지면 `<Suspense>`/`loading.js` 스트리밍으로 전환(대신 로딩 상태 재등장 = 트레이드오프).
- **즉각 반응**: `onMutate` 낙관적 + `onError` 롤백. `onMutate` 안에서 **반드시 `await cancelQueries`**(진행 중 refetch가 낙관적 값 덮어쓰는 것 방지 — 공식 패턴).
- **신선도 vs 낙관적 경합**: `cancelQueries`는 *진행 중* refetch만 취소하고 **7초 interval 틱은 못 막음**. 필요 시 `refetchInterval`을 `useIsMutating()`으로 게이팅(문서 보장 아님, 커스텀) + `onSettled` invalidate로 최종 정합.
- **유실 완화**: merge를 서버에서 수행 → 클라 merge보다 경합 창 축소. 단 **jsonbin은 트랜잭션 없어 "원자적"이 아님**(9번 한계 참고).
- **계약**: `queryFn`/`mutationFn`은 `undefined` 반환 금지 — 빈 결과는 `null` 반환, 실패는 **throw**(안 그러면 `onError` 미발동).
- **보안**: 서버→클라 직렬화 payload(props/dehydrate state)에 **마스터키가 절대 포함되지 않도록** — 문서 데이터만 반환.

데이터 모델은 현재와 동일 유지(호환):
`DB = { users, rides, bookings, items, comments }` (`lib/jsonbin.ts`의 타입 그대로 이식).

## 6. jsonbin 설정

- **테스트 bin ID**: `6a22789bda38895dfe8ae248` (행사 실데이터와 분리).
- 마스터키는 루트 `.env`의 기존 키 재사용, **서버 전용** 환경변수로 저장:
  - `JSONBIN_BIN_ID` (PUBLIC_ 접두사 제거 — 브라우저 노출 안 됨)
  - `JSONBIN_MASTER_KEY`
- 모든 jsonbin 호출은 서버측(RSC 서버함수 / Route Handler / Server Action)에서만 — 클라이언트 번들에 키 0노출.
- 비교 시작 전 테스트 bin을 `{ "users": [], "rides": [], "bookings": [], "items": [], "comments": [] }`로 시드.

**캐싱 가드레일 (Next 캐싱이 "항상 최신"을 조용히 깨지 않도록):**
- 모든 jsonbin `fetch`에 `{ cache: 'no-store' }` 명시 (기본도 uncached지만 의도 명시·future-proof).
- 초기 RSC 읽기 라우트에 `export const dynamic = 'force-dynamic'`(또는 `revalidate = 0`) — `fetchCache` 기본 정렬로 인한 정적 최적화 방지.
- `force-cache`/`use cache`는 읽기 경로에 **절대 적용 안 함**.
- `next.config`의 `cacheComponents` 활성 여부 확인 — 활성이면 라이브 데이터 RSC를 `<Suspense>`로 감싸고 `use cache` 미적용(미준수 시 빌드 에러), `dynamic`/`revalidate` 세그먼트 설정은 이 모델에선 무효.
- TanStack의 7초 폴링은 Next 서버 캐시와 무관 — 서버 캐시는 **초기 SSR payload에만** 영향. 가드레일을 초기 읽기에만 한정(과설계 금지).
- 표시 데이터는 hydrate 후 클라이언트 TanStack 캐시가 주도하므로 `revalidatePath`/`revalidateTag`는 **의도적으로 생략**(Next Data Cache를 채우지 않음). 전체 새로고침 시 RSC가 다시 fresh로 실행되어 무방.

## 7. UI / shadcn / 브랜드

- **룩은 "아주 똑같이"** — `src/styles/global.css`의 `--ocean/--coral/...` 변수, `.sticker`, Pretendard, 풀 배경·파도 SVG를 그대로 포팅. 룩을 고정해 비교 변수를 코드/UX로 한정.
- **shadcn은 동작·접근성이 필요한 곳에 투입**:
  - 손으로 만든 `ConfirmModal` → shadcn `Dialog` (포커스 트랩·키보드·ARIA)
  - `Toast` → `Sonner`
  - 좌석/폼 입력 → shadcn `Form` (+ react-hook-form + zod)
- shadcn 테마 토큰(`--primary` 등)을 브랜드 색에 매핑 — 디폴트 무채색 그대로 쓰지 않는다.
- 비교 관찰 포인트: 같은 화면을 손코딩(Astro `room.ts` innerHTML) vs 컴포넌트+shadcn(Next)으로 만들 때 코드량·접근성·유지보수성 차이.

## 8. 페이지 매핑

| Astro | Next |
|---|---|
| `/room` (home) | `app/page.tsx` (로그인/메뉴) |
| `/room/carpool` | `app/carpool/page.tsx` |
| `/room/shop` | `app/shop/page.tsx` |
| `/room/status` | `app/status/page.tsx` |
| `room.ts` 렌더 함수들 | 개별 React 컴포넌트로 분해 |
| `session.ts` | 동일 로직(localStorage + 메모리 폴백) 클라이언트 훅으로 이식 |

비로그인 시 기능 페이지 접근 차단(현재 `mount()` 가드와 동일) — 클라이언트 가드 + 홈 리다이렉트.

## 9. 알려진 한계 (정직하게 기록)

- **jsonbin이 UX 천장**: 단일 문서 last-write-wins → 마지막 좌석 동시 예약 시 한 명 유실 가능. 트랜잭션/락 없어 서버 merge로도 완전 방지 불가.
- 무료 API 레이트리밋·폴링 지연이 신선도 상한.
- **진짜 best UX 잠금해제는 Postgres(제약·트랜잭션)+실시간** — 이번 비교 범위 밖, 다음 단계 과제로 분리.
- **인증 한계**: 쓰기 Server Action은 UI 밖에서도 직접 호출 가능한 공개 POST 엔드포인트. 소유권 검증(본인 항목만 수정/삭제)은 **액션 내부 서버측에서** 재수행하지만, "누구인가"가 이름 기반이라 **스푸핑 가능**(현재 Astro와 동일한 신뢰그룹 전제). 진짜 인증은 SaaS 단계 과제.

## 10. 검증 체크리스트

기능 동등성:
- [ ] 로그인/로그아웃, 비로그인 페이지 가드
- [ ] 카풀 등록·수정·취소
- [ ] 좌석 선택·취소·만석 처리
- [ ] 장보기 추가·본인만 삭제
- [ ] 댓글 추가·본인만 삭제
- [ ] 7초 폴링·포커스 재검증·수동 새로고침
- [ ] 낙관적 반영 + 실패 롤백
- [ ] 키 브라우저 노출 0 (네트워크 탭/번들 확인)

UX 비교 관찰:
- [ ] 첫 화면 깜빡임(빈 목록 플래시) 유무 — Astro vs Next
- [ ] 페이지 전환 매끄러움
- [ ] 동작 코드량·접근성 차이 정성 기록

## 11. 다음 단계 (이 spec 밖)

- 결과 비교 후 Postgres+실시간 기반 SaaS 설계 별도 진행 여부 결정.
