import React from "react";
import type { Priority } from "../priority";

interface Props {
  initialPriority: Priority | null;
  onSelect: (priority: Priority | null) => void;
}

const LEVELS: Array<{ label: string; value: Priority }> = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export function PriorityPicker({ initialPriority, onSelect }: Props) {
  return (
    <div className="dtp">
      <div className="dtp-quick">
        {LEVELS.map(({ label, value }) => (
          <button
            key={value}
            className={`dtp-quick__btn${value === initialPriority ? " dtp-quick__btn--active" : ""}`}
            onClick={() => onSelect(value)}
          >
            {label}
          </button>
        ))}
        <button className="dtp-quick__btn dtp-quick__btn--clear" onClick={() => onSelect(null)}>
          Clear
        </button>
      </div>
    </div>
  );
}
