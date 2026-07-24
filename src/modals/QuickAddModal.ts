import { App, Modal } from "obsidian";
import React, { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QuickAddInput } from "../components/QuickAddInput";

export class QuickAddModal extends Modal {
  private root: Root | null = null;
  private onSubmit: (text: string) => void;

  constructor(app: App, onSubmit: (text: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    this.titleEl.setText("Quick add task");
    this.modalEl.addClass("qa-modal");
    this.contentEl.addClass("qa-modal-content");
    this.root = createRoot(this.contentEl);
    this.root.render(
      React.createElement(
        StrictMode,
        null,
        React.createElement(QuickAddInput, {
          onSubmit: (text: string) => {
            this.onSubmit(text);
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
