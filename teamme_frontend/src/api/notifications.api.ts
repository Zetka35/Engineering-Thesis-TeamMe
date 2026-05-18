export type NotificationEventType =
  | "RECRUITMENT_REQUEST_CREATED"
  | "RECRUITMENT_REQUEST_UPDATED";

export interface NotificationEvent {
  type: NotificationEventType;
  title: string;
  message: string;
  teamId?: number | null;
  teamName?: string | null;
  requestId?: number | null;
  requestType?: "APPLICATION" | "INVITATION" | string | null;
  status?: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | string | null;
}

export function getNotificationsWsUrl() {
  const apiBase = import.meta?.env?.VITE_API_URL ?? "http://localhost:8080";

  return apiBase
    .replace(/^http:\/\//, "ws://")
    .replace(/^https:\/\//, "wss://") + "/ws/notifications";
}