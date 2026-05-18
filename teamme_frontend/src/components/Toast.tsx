import React, { useEffect } from "react";

export type ToastKind = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  kind?: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
}

type Props = {
  toast: ToastMessage;
  onClose: (id: string) => void;
};

export default function Toast({ toast, onClose }: Props) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onClose(toast.id);
    }, 7000);

    return () => window.clearTimeout(timeoutId);
  }, [toast.id, onClose]);

  return (
    <div className={`toast toast-${toast.kind ?? "info"}`}>
      <div style={{ display: "grid", gap: 4 }}>
        <b>{toast.title}</b>
        <span>{toast.message}</span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {toast.actionLabel && toast.onAction && (
          <button className="toast-action" onClick={toast.onAction}>
            {toast.actionLabel}
          </button>
        )}

        <button
          className="toast-close"
          aria-label="Zamknij powiadomienie"
          onClick={() => onClose(toast.id)}
        >
          ×
        </button>
      </div>
    </div>
  );
}