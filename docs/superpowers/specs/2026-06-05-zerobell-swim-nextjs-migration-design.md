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
RSC 프리페치 → 첫 화면을 데이터까지 렌더해 전송 (로딩 깜빡임 0)
   ↓ hydrate
TanStack Query (클라이언트 캐시)
   ├─ useQuery : queryFn = 읽기 Server Action, 7초 refetchInterval + refetchOnWindowFocus (신선도)
   └─ useMutation : onMutate 낙관적 즉시반영 + onError 롤백
        mutationFn = 쓰기 Server Action  → 서버에서 jsonbin GET→merge→PUT 원자적, 키 숨김
```

읽기·쓰기 모두 **Server Action(서버 함수)**로 처리한다. 서버 함수는 클라이언트에서 호출 가능하므로 별도 Route Handler는 두지 않는다(필요 시에만 추가).

- **첫 화면**: RSC가 서버에서 데이터까지 렌더 → 현재 Astro의 "빈 화면 후 JS로 채움(카풀 없어요 깜빡임)" 제거.
- **즉각 반응**: TanStack Query `onMutate` 낙관적 + 실패 시 자동 롤백 (현재 nanostores 동작과 동일 UX).
- **신선도**: `refetchInterval` 7초 폴링 + 포커스 재검증.
- **쓰기 중 덮어쓰기 방지**: mutation in-flight 동안 해당 쿼리 invalidate를 보류(현재 `syncIfIdle` 대응).
- **유실 완화**: merge를 서버(Server Action)에서 원자적으로 수행 → 클라 merge보다 경합 창 축소.

데이터 모델은 현재와 동일 유지(호환):
`DB = { users, rides, bookings, items, comments }` (`lib/jsonbin.ts`의 타입 그대로 이식).

## 6. jsonbin 설정

- **테스트 bin ID**: `6a22789bda38895dfe8ae248` (행사 실데이터와 분리).
- 마스터키는 루트 `.env`의 기존 키 재사용, **서버 전용** 환경변수로 저장:
  - `JSONBIN_BIN_ID` (PUBLIC_ 접두사 제거 — 브라우저 노출 안 됨)
  - `JSONBIN_MASTER_KEY`
- 모든 jsonbin 호출은 Server Action(서버 함수)을 통해서만 — 클라이언트 번들에 키 0노출.
- 비교 시작 전 테스트 bin을 `{ "users": [], "rides": [], "bookings": [], "items": [], "comments": [] }`로 시드.

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
