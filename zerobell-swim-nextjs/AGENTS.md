<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## 프로젝트 규칙 (zerobell-swim-nextjs)
- UI는 구현계획의 "UI 코딩 규칙" 준수: 브랜드 팔레트=@theme, shadcn 시맨틱=:root+@theme inline, shadcn 제자리 리스타일(cva)·일회성/동작은 wrapper, cn()은 기본형.
- 읽기=RSC(getDB)/Route Handler, 쓰기=Server Action. jsonbin 키는 서버 전용.
