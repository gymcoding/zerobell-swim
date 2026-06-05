# 통일로 원정수영 (zerobell-swim)

제로벨 7시 강습 단합 이벤트(2026-06-19) 안내 + 카풀 매칭 사이트.
**Astro 5 + Tailwind v4** 정적 사이트.

## 페이지
- `/` — 행사 안내 랜딩 (`src/pages/index.astro` + `src/components/landing/*`)
- `/room` — 원정수영 준비방: 카풀 매칭 + 장보기 목록 + 의견 (`src/pages/room.astro` + `src/components/carpool/*`). `/carpool` 은 `/room` 으로 리다이렉트(기존 공유 링크 호환).

## 개발
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # dist/ 정적 빌드
npm run preview    # 빌드 결과 미리보기
npx astro check    # 타입 체크
```

## 환경변수 (`.env`)
```
PUBLIC_JSONBIN_BIN_ID="..."        # jsonbin Bin ID
PUBLIC_JSONBIN_MASTER_KEY="..."    # jsonbin Master Key
```
> ⚠️ `PUBLIC_` 변수는 빌드 시 클라이언트 번들에 inline됩니다(브라우저 노출).
> 보안 개선이 아니라 코드 위생/로테이션 목적. **신뢰 그룹(단톡방) 한정 + 행사 후 jsonbin bin 삭제** 전제.

## 카풀 로그인 / 인증
- 회원가입 없음 — 이름 + 비밀번호로 "본인 확인"만.
- 비밀번호는 **SHA-256 + 랜덤 salt** 해시로만 jsonbin에 저장 (`src/lib/auth.ts`). 평문은 저장/전송하지 않음.
- 본인만 자기 카풀 등록/예약을 수정·취소 (이름 일치 + 본인확인 세션 기준).
- 데이터 모델: `{ users:[{name,salt,hash}], rides:[{id,driver,seats,from}], bookings:[{rideId,rider}] }`

## 배포 (Vercel)
1. GitHub repo 연결 → Framework: **Astro** (자동 감지)
2. Build: `astro build` / Output: `dist` / Install: `npm install`
3. Environment Variables 등록:
   - `PUBLIC_JSONBIN_BIN_ID`, `PUBLIC_JSONBIN_MASTER_KEY`
   - `SITE_URL` = 실제 배포 도메인 (예: `https://swim.gymcoding.co`) — OG 공유 미리보기에 사용
4. `git push` 시 자동 배포.

## 행사 전 체크
- jsonbin bin을 `{ "users": [], "rides": [], "bookings": [] }` 로 재시드 권장.
  (기존 데이터의 rides/bookings는 구버전 무인증으로 만들어져 비밀번호가 없음 →
   재시드하면 모두 새 방식으로 로그인·등록하게 됨)
- 행사 종료 후 jsonbin bin 삭제 (노출된 키 무효화).
