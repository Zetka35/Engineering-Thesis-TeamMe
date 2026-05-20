import React from "react";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">∅</div>

      <div className="empty-state-content">
        <div className="empty-state-title">{title}</div>
        <div className="empty-state-description">{description}</div>

        {actionLabel && onAction && (
          <button type="button" className="btn btn-ghost" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}