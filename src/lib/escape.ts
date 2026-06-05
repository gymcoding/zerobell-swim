/** HTML 이스케이프 — 사용자 입력을 DOM에 넣기 전 반드시 통과 (XSS 방지) */
export function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
