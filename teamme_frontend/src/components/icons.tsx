import React from "react";
import logo from "../assets/logo.png";
import teamowork from "../assets/teamwork.png";

export function TeamMeLogo({ size = 28 }: { size?: number }) {
  return (
    <div className="tm-logo" aria-label="TeamMe">
      <img
        src={logo}
        alt="TeamMe"
        width={size}
        height={size}
        className="tm-logo-img"
      />
      <span className="tm-logo-text">TeamMe</span>
    </div>
  );
}

export function TeamworkIcon({ size = 220 }: { size?: number }) {
  return (
    <img
      src={teamowork}
      alt=""
      width={size}
      height={size}
      className="teamwork-img"
      aria-hidden="true"
    />
  );
}

export function IconButton({
  title,
  children,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="icon-btn" title={title} onClick={onClick}>
      {children}
    </button>
  );
}

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 13a7.7 7.7 0 0 0 0-2l2-1.5-2-3.5-2.3.7a7.7 7.7 0 0 0-1.7-1L15 3h-6l-.4 2.7a7.7 7.7 0 0 0-1.7 1L4.6 6 2.6 9.5l2 1.5a7.7 7.7 0 0 0 0 2l-2 1.5 2 3.5 2.3-.7a7.7 7.7 0 0 0 1.7 1L9 21h6l.4-2.7a7.7 7.7 0 0 0 1.7-1l2.3.7 2-3.5-2-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M10 18a8 8 0 1 1 5.3-14l.3.3A8 8 0 0 1 10 18Zm11 3-6.2-6.2 1.4-1.4L22.4 19.6 21 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M5 12a2 2 0 1 0 0 .01V12Zm7 0a2 2 0 1 0 0 .01V12Zm7 0a2 2 0 1 0 0 .01V12Z"
        fill="currentColor"
      />
    </svg>
  );
}