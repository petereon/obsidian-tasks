import { App, Modal } from "obsidian";
import React, { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RepeatIntervalPicker } from "../components/RepeatIntervalPicker";
import type { RepeatRule } from "../types";

export class RepeatIntervalModal extends Modal {
  private root: Root | null = null;
  private initialRule: RepeatRule | null;
  private onSelect: (rule: RepeatRule | null) => void;

  constructor(app: App, initialRule: RepeatRule | null, onSelect: (rule: RepeatRule | null) => void) {
    super(app);
    this.initialRule = initialRule;
    this.onSelect = onSelect;
  }

  onOpen(): void {
    this.titleEl.setText("Set repeat interval");
    this.modalEl.addClass("dtp-modal");
    this.contentEl.addClass("dtp-modal-content");
    this.root = createRoot(this.contentEl);
    this.root.render(
      React.createElement(
        StrictMode,
        null,
        React.createElement(RepeatIntervalPicker, {
          initialRule: this.initialRule,
          onSelect: (rule: RepeatRule | null) => {
            this.onSelect(rule);
            this.close();
          },
        }),
      ),
    );
  }

  onClose(): void {
    this.root?.unmount();
    this.root = null;
  }
}
