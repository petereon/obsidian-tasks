import React, { useState } from "react";

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

interface Props {
  initialDate: Date | null;
  initialHasTime: boolean;
  onSelect: (date: Date | null, hasTime: boolean) => void;
  onClose: () => void;
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

function offsetDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

const WEEKDAY_HEADS = ["M", "T", "W", "T", "F", "S", "S"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const QUICK_TIMES = [
  { h: 9, m: 0, label: "09:00" },
  { h: 12, m: 0, label: "12:00" },
  { h: 15, m: 0, label: "15:00" },
  { h: 18, m: 0, label: "18:00" },
] as const;

interface MiniCalendarProps {
  selectedIso: string | undefined;
  onSelect: (iso: string) => void;
}

function MiniCalendar({ selectedIso, onSelect }: MiniCalendarProps) {
  const todayStr = todayIso();
  const seed = selectedIso ? new Date(`${selectedIso}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(seed.getFullYear());
  const [viewMonth, setViewMonth] = useState(seed.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  return (
    <div className="dtp-calendar">
      <div className="dtp-calendar__nav">
        <button className="dtp-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
        <span className="dtp-calendar__month">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="dtp-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
      </div>
      <div className="dtp-calendar__grid">
        {WEEKDAY_HEADS.map((d, i) => (
          <div key={i} className="dtp-calendar__weekday">{d}</div>
        ))}
        {Array.from({ length: offset }, (_, i) => <div key={`gap-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = `${viewYear}-${padTwo(viewMonth + 1)}-${padTwo(day)}`;
          const isPast = iso < todayStr;
          const isToday = iso === todayStr;
          const isSelected = iso === selectedIso;
          let cls = "dtp-calendar__day";
          if (isSelected) cls += " dtp-calendar__day--selected";
          else if (isToday) cls += " dtp-calendar__day--today";
          if (isPast && !isSelected) cls += " dtp-calendar__day--past";
          return (
            <button key={iso} type="button" aria-label={iso} onClick={() => onSelect(iso)} className={cls}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateTimePicker({ initialDate, initialHasTime, onSelect, onClose }: Props) {
  const initIso = initialDate ? dateToIso(initialDate) : undefined;
  const initHour = initialDate && initialHasTime ? initialDate.getHours() : 9;
  const initMinute = initialDate && initialHasTime ? initialDate.getMinutes() : 0;

  const [selectedDateIso, setSelectedDateIso] = useState<string | undefined>(initIso);
  const [hasTime, setHasTime] = useState(initialHasTime);
  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMinute);

  function buildDate(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    if (hasTime) return new Date(y, m - 1, d, hour, minute, 0);
    return new Date(y, m - 1, d, 0, 0, 0);
  }

  function handleQuickPick(iso: string) {
    onSelect(buildDate(iso), hasTime);
  }

  function handleSet() {
    if (!selectedDateIso) return;
    onSelect(buildDate(selectedDateIso), hasTime);
  }

  function handleHourChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0 && v <= 23) setHour(v);
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0 && v <= 59) setMinute(v);
  }

  function handleHourBlur(e: React.FocusEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    setHour(isNaN(v) ? 0 : Math.min(23, Math.max(0, v)));
  }

  function handleMinuteBlur(e: React.FocusEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    setMinute(isNaN(v) ? 0 : Math.min(59, Math.max(0, v)));
  }

  function handleQuickTime(h: number, m: number) {
    if (!hasTime) setHasTime(true);
    setHour(h);
    setMinute(m);
  }

  return (
    <div className="dtp">
      {/* Quick date picks */}
      <div className="dtp-quick">
        {[
          { label: "Today", iso: todayIso() },
          { label: "Tomorrow", iso: offsetDaysIso(1) },
          { label: "Next week", iso: offsetDaysIso(7) },
        ].map(({ label, iso }) => (
          <button key={label} className="dtp-quick__btn" onClick={() => handleQuickPick(iso)}>
            {label}
          </button>
        ))}
        <button className="dtp-quick__btn dtp-quick__btn--clear" onClick={() => { onSelect(null, false); onClose(); }}>
          Clear
        </button>
      </div>

      <div className="dtp-divider" />

      <MiniCalendar selectedIso={selectedDateIso} onSelect={setSelectedDateIso} />

      <div className="dtp-divider" />

      {/* Time row */}
      <div className="dtp-time">
        <button
          className={`dtp-time__toggle${hasTime ? " dtp-time__toggle--active" : ""}`}
          onClick={() => setHasTime((h) => !h)}
          title="Toggle time"
          aria-label="Toggle time"
        >
          <ClockIcon />
        </button>
        <div className={`dtp-time__inputs${!hasTime ? " dtp-time__inputs--disabled" : ""}`}>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Hour"
            value={padTwo(hour)}
            onChange={handleHourChange}
            onBlur={handleHourBlur}
            className="dtp-time__input"
            disabled={!hasTime}
          />
          <span className="dtp-time__colon">:</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Minute"
            value={padTwo(minute)}
            onChange={handleMinuteChange}
            onBlur={handleMinuteBlur}
            className="dtp-time__input"
            disabled={!hasTime}
          />
          <div className="dtp-time__quick">
            {QUICK_TIMES.map(({ h, m, label }) => {
              const isActive = hasTime && hour === h && minute === m;
              return (
                <button
                  key={label}
                  className={`dtp-time__quick-btn${isActive ? " dtp-time__quick-btn--active" : ""}`}
                  onClick={() => handleQuickTime(h, m)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button className="dtp-set-btn" disabled={!selectedDateIso} onClick={handleSet}>
        Set due date
      </button>
    </div>
  );
}
