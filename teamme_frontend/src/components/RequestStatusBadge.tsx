import React from "react";

type Props = {
  status?: string | null;
};

function requestStatusLabel(value?: string | null) {
  switch (value) {
    case "PENDING":
      return "Oczekujące";
    case "ACCEPTED":
      return "Zaakceptowane";
    case "REJECTED":
      return "Odrzucone";
    case "CANCELLED":
      return "Anulowane";
    default:
      return value || "—";
  }
}

function statusClass(value?: string | null) {
  switch (value) {
    case "PENDING":
      return "status-badge-pending";
    case "ACCEPTED":
      return "status-badge-accepted";
    case "REJECTED":
      return "status-badge-rejected";
    case "CANCELLED":
      return "status-badge-cancelled";
    default:
      return "status-badge-default";
  }
}

export default function RequestStatusBadge({ status }: Props) {
  return (
    <span className={`status-badge ${statusClass(status)}`}>
      {requestStatusLabel(status)}
    </span>
  );
}