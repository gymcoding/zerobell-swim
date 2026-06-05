'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ClipboardList, LogOut } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';

export function HomeScreen() {
  const { name, isVerified, ready, login, logout, getSavedName } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [warn, setWarn] = useState(false);

  // 마운트 후 저장된 이름 prefill
  useEffect(() => {
    if (!isVerified && inputRef.current) {
      inputRef.current.value = getSavedName();
    }
  }, [isVerified, getSavedName]);

  function doLogin() {
    const input = inputRef.current;
    if (!input) return;
    const trimmed = input.value.trim();
    if (!trimmed) {
      setWarn(true);
      input.focus();
      return;
    }
    setWarn(false);
    login(trimmed);
    toast.success(`👋 ${trimmed}님 반가워요!`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    // IME 조합 중 Enter 무시 (한글 등 조합 확정 Enter 중복 입력 방지)
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    e.preventDefault();
    doLogin();
  }

  // 마운트 전: 레이아웃 점프/깜빡임 방지
  if (!ready) return null;

  // 로그인 전: 로그인 카드
  if (!isVerified) {
    return (
      <section className="mt-6">
        <div className="sticker p-6">
          <h2 className="font-display text-3xl flex items-center gap-2">
            <span>🙋</span>
            <span className="marker">이름만 알려주세요</span>
          </h2>
          <p className="font-round text-[16px] text-ink/75 mt-3 leading-relaxed">
            누가 <span className="text-pool">운전</span>하고 누가 <span className="text-pool">탈지</span>,<br />
            <span className="text-pool">장보기 항목</span>은 뭘 살지 같이 정하려고요 😊
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="font-round text-[18px] ml-1" htmlFor="loginName">
                내 이름
              </label>
              <input
                ref={inputRef}
                id="loginName"
                className="field font-round mt-1.5"
                style={{ fontSize: '18px', padding: '16px 16px' }}
                type="text"
                inputMode="text"
                autoComplete="name"
                maxLength={12}
                placeholder="홍길동"
                onKeyDown={handleKeyDown}
                onChange={() => { if (warn) setWarn(false); }}
              />
            </div>
            {warn && (
              <p className="font-round text-[15px] text-coral ml-1">
                이름(별명)을 입력해 주세요!
              </p>
            )}
            <Button
              variant="sticker"
              type="button"
              className="w-full rounded-[20px] text-2xl"
              style={{ minHeight: '64px' }}
              onClick={doLogin}
            >
              들어가기 →
            </Button>
          </div>

          <p className="font-round text-[13px] text-ink/45 mt-4 text-center">
            이름만 입력하면 끝이에요 😊
          </p>
        </div>
      </section>
    );
  }

  // 로그인 후: 홈 메뉴
  return (
    <section className="mt-6">
      <div className="text-center">
        <p className="font-round text-2xl">
          <b className="text-ocean">{name}</b>님
        </p>
        <p className="font-round text-xl mt-1">안녕하세요! 👋 무엇을 할까요?</p>
      </div>

      <div className="mt-6 space-y-4">
        <Link
          href="/room/carpool"
          className="btn-3d w-full rounded-[24px] bg-sun font-round text-2xl flex items-center justify-center gap-3"
          style={{ minHeight: '104px' }}
        >
          <span className="text-4xl">🚗</span> 카풀 매칭
        </Link>
        <Link
          href="/room/shop"
          className="btn-3d w-full rounded-[24px] bg-aqua text-white font-round text-2xl flex items-center justify-center gap-3"
          style={{ minHeight: '104px' }}
        >
          <span className="text-4xl">🛒</span> 장보기 목록
        </Link>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <Link
          href="/room/status"
          className="tag bg-white px-4 py-2.5 min-h-[44px] font-round text-[16px] active:translate-y-0.5 transition flex items-center gap-1.5"
        >
          <ClipboardList className="w-5 h-5" /> 카풀 현황
        </Link>
        <button
          type="button"
          className="tag bg-white px-4 py-2.5 min-h-[44px] font-round text-[16px] active:translate-y-0.5 transition flex items-center gap-1.5"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" /> 로그아웃
        </button>
      </div>
    </section>
  );
}
