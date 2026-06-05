'use client';

import { useRef, useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDB, useRoomMutation } from '@/hooks/use-db';
import { useSession } from '@/hooks/use-session';
import { remaining } from '@/lib/domain';
import { MAX_SEATS } from '@/lib/db-types';
import * as R from '@/lib/reducers';
import { submitDriverAction, cancelDriverAction, pickRideAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Sub = 'role' | 'driver' | 'rider';

export function CarpoolScreen() {
  const { data: db } = useDB();
  const mut = useRoomMutation();
  const { name: me } = useSession();
  const [sub, setSub] = useState<Sub>('role');

  // showRoleSub: 하위 뷰 전환 시 맨 위로 스크롤
  function showRoleSub(which: Sub) {
    setSub(which);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (sub === 'role') return <RoleChoice onChoose={showRoleSub} />;
  if (sub === 'driver')
    return <DriverView db={db} me={me} mut={mut} onBack={() => showRoleSub('role')} />;
  return <RiderView db={db} me={me} mut={mut} onBack={() => showRoleSub('role')} />;
}

/* ---------- 역할 선택 ---------- */
function RoleChoice({ onChoose }: { onChoose: (s: Sub) => void }) {
  return (
    <section className="mt-6">
      <p className="font-round text-[17px] text-center text-ink/70">운전할지, 탈지 골라주세요!</p>
      <div className="mt-5 space-y-4">
        <button
          type="button"
          onClick={() => onChoose('driver')}
          className="btn-3d w-full rounded-[24px] bg-sun font-round text-2xl flex items-center justify-center gap-3"
          style={{ minHeight: '92px' }}
        >
          <span className="text-4xl">🧑‍✈️</span> 내가 운전해요
        </button>
        <button
          type="button"
          onClick={() => onChoose('rider')}
          className="btn-3d w-full rounded-[24px] bg-aqua text-white font-round text-2xl flex items-center justify-center gap-3"
          style={{ minHeight: '92px' }}
        >
          <span className="text-4xl">🙋</span> 카풀 타고 싶어요
        </button>
      </div>
    </section>
  );
}

/* ---------- 역할 다시 (뒤로) ---------- */
function RoleBack({ onBack, className }: { onBack: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        'inline-flex items-center min-h-[44px] font-round text-[16px] text-ink/60 px-2 active:translate-y-0.5 transition',
        className,
      )}
    >
      ← 역할 다시
    </button>
  );
}

/* ---------- 운전자 등록 (renderDriver + DriverForm) ---------- */
function DriverView({
  db,
  me,
  mut,
  onBack,
}: {
  db: ReturnType<typeof useDB>['data'];
  me: string;
  mut: ReturnType<typeof useRoomMutation>;
  onBack: () => void;
}) {
  const rides = db?.rides ?? [];
  const bookings = db?.bookings ?? [];
  const mine = rides.find((r) => r.driver === me);

  const [seats, setSeats] = useState(3);
  const fromRef = useRef<HTMLInputElement>(null);

  function dec() {
    setSeats((s) => Math.max(1, s - 1));
  }
  function inc() {
    setSeats((s) => Math.min(MAX_SEATS, s + 1));
  }

  function submit() {
    const from = (fromRef.current?.value ?? '').trim();
    if (!from) {
      toast.error('출발 장소를 입력해 주세요 📍');
      fromRef.current?.focus();
      return;
    }
    const clamped = Math.max(1, Math.min(MAX_SEATS, Number(seats) || 0));
    mut.mutate({
      reduce: (d) => R.submitDriver(d, me, { seats: clamped, from }),
      run: () => submitDriverAction(me, { seats: clamped, from }),
    });
    if (fromRef.current) fromRef.current.value = '';
    toast.success('🎉 카풀 등록 완료! 탑승자를 기다려요');
  }

  function cancel() {
    if (!mine) return;
    mut.mutate({
      reduce: (d) => R.cancelDriver(d, me),
      run: () => cancelDriverAction(me),
    });
    toast('내 카풀 등록을 취소했어요');
  }

  return (
    <section className="mt-6">
      <RoleBack onBack={onBack} />
      {mine ? (
        <div className="mt-2">
          <div className="sticker p-6" style={{ background: 'linear-gradient(180deg,#e8fff1,#fff)' }}>
            <h2 className="font-display text-2xl flex items-center gap-2">
              <span>✅</span>
              <span className="marker">이미 등록했어요</span>
            </h2>
            <div className="mt-3 font-round text-[17px]">
              📍 <b>{mine.from}</b>
              <br />
              🚪 {mine.seats}자리 중{' '}
              <b className="text-coral">{remaining(mine, bookings)}자리</b> 남음
            </div>
            <button
              type="button"
              onClick={cancel}
              className="btn-3d w-full rounded-[18px] bg-white text-coral font-round text-lg mt-5 flex items-center justify-center gap-2"
              style={{ minHeight: '60px' }}
            >
              <Trash2 className="w-5 h-5" /> 내 카풀 등록 취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <div className="sticker p-6">
            <h2 className="font-display text-2xl flex items-center gap-2">
              <span>🧑‍✈️</span>
              <span className="marker">카풀 등록</span>
            </h2>
            <div className="mt-5 space-y-5">
              <div>
                <label className="font-round text-[18px] ml-1" htmlFor="seatCount">
                  🚪 몇 명 태울 수 있어요?
                </label>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <button
                    type="button"
                    onClick={dec}
                    aria-label="줄이기"
                    className="btn-3d rounded-full w-14 h-14 bg-white grid place-items-center"
                  >
                    <Minus className="w-7 h-7" />
                  </button>
                  <input
                    id="seatCount"
                    className="field font-display text-3xl text-center"
                    style={{ maxWidth: '100px', fontSize: '28px' }}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_SEATS}
                    value={seats}
                    onChange={(e) => {
                      const n = Number(e.target.value) || 1;
                      setSeats(Math.max(1, Math.min(MAX_SEATS, n)));
                    }}
                  />
                  <button
                    type="button"
                    onClick={inc}
                    aria-label="늘리기"
                    className="btn-3d rounded-full w-14 h-14 bg-white grid place-items-center"
                  >
                    <Plus className="w-7 h-7" />
                  </button>
                  <span className="font-round text-lg text-pool">명</span>
                </div>
              </div>
              <div>
                <label className="font-round text-[18px] ml-1" htmlFor="driverFrom">
                  📍 어디서 출발해요?
                </label>
                <input
                  ref={fromRef}
                  id="driverFrom"
                  className="field font-round mt-2"
                  style={{ fontSize: '18px', padding: '16px' }}
                  type="text"
                  maxLength={30}
                  placeholder="예) 하늘도시 홈플러스 앞"
                />
              </div>
              <Button
                variant="sticker"
                type="button"
                onClick={submit}
                className="w-full rounded-[20px] text-2xl"
                style={{ minHeight: '64px' }}
              >
                🚗 등록하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- 카풀 타기 (renderRideList) ---------- */
function RiderView({
  db,
  me,
  mut,
  onBack,
}: {
  db: ReturnType<typeof useDB>['data'];
  me: string;
  mut: ReturnType<typeof useRoomMutation>;
  onBack: () => void;
}) {
  const rides = db?.rides ?? [];
  const bookings = db?.bookings ?? [];
  const myBooking = bookings.find((b) => b.rider === me);

  function pick(rideId: number) {
    const existing = bookings.find((b) => b.rider === me);
    const isCancel = !!existing && existing.rideId === rideId;
    if (isCancel) {
      toast('예약을 취소했어요');
    } else {
      const ride = rides.find((r) => r.id === rideId);
      if (!ride) return;
      const left = remaining(ride, bookings.filter((b) => b.rider !== me));
      if (left <= 0) {
        toast.error('😢 자리가 다 찼어요! 다른 카풀을 골라주세요');
        return;
      }
      toast.success(`✅ '${ride.driver}'님 카풀에 탔어요!`);
    }
    mut.mutate({
      reduce: (d) => R.pickRide(d, me, { rideId }),
      run: () => pickRideAction(me, { rideId }),
    });
  }

  return (
    <section className="mt-6">
      <RoleBack onBack={onBack} className="mb-1" />
      <p className="font-round text-[15px] text-pool ml-1">
        자리 남은 카풀을 골라 타세요! (한 개만 선택돼요)
      </p>
      <div className="mt-4 space-y-4">
        {rides.length === 0 ? (
          <div className="sticker p-6 text-center font-round text-[17px] text-ink/60">
            아직 등록된 카풀이 없어요 🥲
            <br />
            운전자분의 등록을 기다려요!
          </div>
        ) : (
          rides.map((ride) => {
            const left = remaining(ride, bookings);
            const full = left <= 0;
            const mine = !!myBooking && myBooking.rideId === ride.id;
            const isMyOwnRide = !!me && ride.driver === me;
            const riders = bookings.filter((b) => b.rideId === ride.id).map((b) => b.rider);
            return (
              <div key={ride.id} className={cn('sticker p-5', mine && 'ring-4 ring-aqua')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-2xl truncate">
                      🧑‍✈️ {ride.driver}
                      {isMyOwnRide && (
                        <span className="font-round text-sm text-pool"> (내 차)</span>
                      )}
                    </div>
                    <div className="font-round text-[16px] text-ink/80 mt-1">📍 {ride.from}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn('font-display text-3xl', full ? 'text-ink/40' : 'text-coral')}>
                      {full ? 0 : left}
                    </div>
                    <div className="font-round text-sm text-pool">남은자리</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-ink/10">
                  <div className="font-round text-[14px] text-ink/60 mb-1.5">
                    🙋 탄 사람 {riders.length}/{ride.seats}명
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {riders.length ? (
                      riders.map((rname) => (
                        <span
                          key={rname}
                          className="tag bg-foam px-2.5 py-1 text-[14px] font-round"
                        >
                          {rname}
                          {rname === me ? ' (나)' : ''}
                        </span>
                      ))
                    ) : (
                      <span className="font-round text-[14px] text-ink/40">아직 아무도 안 탔어요</span>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  {mine ? (
                    <Button
                      variant="sticker"
                      type="button"
                      onClick={() => pick(ride.id)}
                      className="w-full rounded-[16px] py-4 bg-ink text-xl h-auto"
                    >
                      ✅ 선택됨 (취소)
                    </Button>
                  ) : full ? (
                    <Button
                      variant="sticker"
                      type="button"
                      disabled
                      className="w-full rounded-[16px] py-4 bg-white text-ink text-xl h-auto"
                    >
                      🈵 자리 다 참
                    </Button>
                  ) : (
                    <Button
                      variant="sticker"
                      type="button"
                      onClick={() => pick(ride.id)}
                      className="w-full rounded-[16px] py-4 text-xl h-auto"
                    >
                      이거 탈래요
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
