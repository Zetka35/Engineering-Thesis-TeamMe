import React from "react";

type Props = {
  visible?: boolean | null;
};

export default function VisibilityBadge({ visible }: Props) {
  const isVisible = visible ?? true;

  return (
    <span
      className={
        isVisible
          ? "visibility-badge visibility-badge-public"
          : "visibility-badge visibility-badge-hidden"
      }
    >
      {isVisible ? "widoczny publicznie" : "ukryty publicznie"}
    </span>
  );
}