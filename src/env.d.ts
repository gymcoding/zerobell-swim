/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** jsonbin Bin ID (클라이언트 번들에 inline됨 — 의도된 동작) */
  readonly PUBLIC_JSONBIN_BIN_ID: string;
  /** jsonbin Master Key (클라이언트 번들에 inline됨 — 신뢰 그룹·이벤트 후 bin 삭제 전제) */
  readonly PUBLIC_JSONBIN_MASTER_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
