import React, { useState } from "react";
import type { RepeatRule } from "../types";

interface Props {
  initialRule: RepeatRule | null;
  onSelect: (rule: RepeatRule | null) => void;
}

const QUICK_PICKS: Array<{ label: string; unit: RepeatRule["unit"] }> = [
  { label: "Daily", unit: "day" },
  { label: "Weekly", unit: "week" },
  { label: "Monthly", unit: "month" },
  { label: "Yearly", unit: "year" },
];

export function RepeatIntervalPicker({ initialRule, onSelect }: Props) {
  const [count, setCount] = useState(initialRule?.count ?? 1);
  const [unit, setUnit] = useState<RepeatRule["unit"]>(initialRule?.unit ?? "week");

  function handleCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    setCount(isNaN(v) || v < 1 ? 1 : v);
  }

  function handleSet() {
    onSelect({ count, unit });
  }

  return (
    <div className="dtp">
      <div className="dtp-quick">
        {QUICK_PICKS.map(({ label, unit: quickUnit }) => (
          <button
            key={label}
            className="dtp-quick__btn"
            onClick={() => onSelect({ count: 1, unit: quickUnit })}
          >
            {label}
          </button>
        ))}
        <button className="dtp-quick__btn dtp-quick__btn--clear" onClick={() => onSelect(null)}>
          Clear
        </button>
      </div>

      <div className="dtp-divider" />

      <div className="rip-custom">
        <span className="rip-custom__label">Every</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={count}
          onChange={handleCountChange}
          className="rip-custom__count"
          aria-label="Interval count"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as RepeatRule["unit"])}
          className="rip-custom__unit"
          aria-label="Interval unit"
        >
          <option value="day">day(s)</option>
          <option value="week">week(s)</option>
          <option value="month">month(s)</option>
          <option value="year">year(s)</option>
        </select>
      </div>

      <button className="dtp-set-btn" onClick={handleSet}>
        Set repeat interval
      </button>
    </div>
  );
}
