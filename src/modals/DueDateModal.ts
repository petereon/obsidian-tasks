import { App, Modal } from "obsidian";
import React, { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DateTimePicker } from "../components/DateTimePicker";

export class DueDateModal extends Modal {
  private root: Root | null = null;
  private initialDate: Date | null;
  private initialHasTime: boolean;
  private onSelect: (date: Date | null, hasTime: boolean) => void;

  constructor(
    app: App,
    initialDate: Date | null,
    initialHasTime: boolean,
    onSelect: (date: Date | null, hasTime: boolean) => void,
  ) {
    super(app);
    this.initialDate = initialDate;
    this.initialHasTime = initialHasTime;
    this.onSelect = onSelect;
  }

  onOpen(): void {
    this.titleEl.setText("Set due date");
    this.modalEl.addClass("dtp-modal");
    this.contentEl.addClass("dtp-modal-content");
    this.root = createRoot(this.contentEl);
    this.root.render(
      React.createElement(
        StrictMode,
        null,
        React.createElement(DateTimePicker, {
          initialDate: this.initialDate,
          initialHasTime: this.initialHasTime,
          onSelect: (date, hasTime) => {
            this.onSelect(date, hasTime);
            this.close();
          },
          onClose: () => this.close(),
        }),
      ),
    );
  }

  onClose(): void {
    this.root?.unmount();
    this.root = null;
  }
}
