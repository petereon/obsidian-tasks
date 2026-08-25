import { App, Modal } from "obsidian";
import React, { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PriorityPicker } from "../components/PriorityPicker";
import type { Priority } from "../priority";

export class PriorityModal extends Modal {
  private root: Root | null = null;
  private initialPriority: Priority | null;
  private onSelect: (priority: Priority | null) => void;

  constructor(app: App, initialPriority: Priority | null, onSelect: (priority: Priority | null) => void) {
    super(app);
    this.initialPriority = initialPriority;
    this.onSelect = onSelect;
  }

  onOpen(): void {
    this.titleEl.setText("Set priority");
    this.modalEl.addClass("dtp-modal");
    this.contentEl.addClass("dtp-modal-content");
    this.root = createRoot(this.contentEl);
    this.root.render(
      React.createElement(
        StrictMode,
        null,
        React.createElement(PriorityPicker, {
          initialPriority: this.initialPriority,
          onSelect: (priority: Priority | null) => {
            this.onSelect(priority);
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
