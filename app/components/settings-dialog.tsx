"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type SettingsDialogProps = {
  open: boolean;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onClose: () => void;
};

export function SettingsDialog({
  open,
  apiKey,
  onApiKeyChange,
  onClose,
}: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="settings-backdrop" onMouseDown={onClose}>
      <div
        className="settings-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="eyebrow">Meeting controls</p>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button className="icon-button" ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close Settings">
            <X aria-hidden="true" size={20} />
          </button>
        </header>
        <label className="field-label" htmlFor="api-key">OpenAI API key</label>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder="sk-…"
        />
        <p id="settings-description" className="dialog-copy">
          Held in this page&apos;s memory only and cleared when the page unloads. It is sent to this app&apos;s <code>/api/chat</code> route for each board seat.
        </p>
        <button className="button button--primary" type="button" onClick={onClose}>Save changes</button>
      </div>
    </div>
  );
}
