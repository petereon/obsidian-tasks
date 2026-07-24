import React, { useState } from "react";

interface Props {
  onSubmit: (text: string) => void;
}

export function QuickAddInput({ onSubmit }: Props) {
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  }

  return (
    <div className="qa">
      <input
        type="text"
        className="qa__input"
        placeholder="Task description"
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button className="qa__submit" onClick={submit}>
        Add
      </button>
    </div>
  );
}
