import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotificationsWsUrl,
  type NotificationEvent,
} from "../api/notifications.api";
import { fetchMyRecruitmentRequests } from "../api/teams.api";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "./NotificationsContext";

function countPendingRecruitmentRequests(requests: Array<{ status?: string | null }>) {
  return requests.filter((request) => request.status === "PENDING").length;
}

export default function NotificationWatcher() {
  const { user } = useAuth();
  const nav = useNavigate();
  const {
    setPendingRecruitmentCount,
    refreshSignal,
    notifyRecruitmentChanged,
    showToast,
  } = useNotifications();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  async function refreshPendingCount() {
    try {
      const requests = await fetchMyRecruitmentRequests();
      setPendingRecruitmentCount(countPendingRecruitmentRequests(requests ?? []));
    } catch {
      // Nie pokazujemy błędu globalnie, bo to tylko licznik pomocniczy.
    }
  }

  useEffect(() => {
    if (!user) {
      setPendingRecruitmentCount(0);
      return;
    }

    void refreshPendingCount();
  }, [user?.username, refreshSignal]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let manuallyClosed = false;

    function connect() {
      const ws = new WebSocket(getNotificationsWsUrl());
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as NotificationEvent;

          notifyRecruitmentChanged();

          showToast({
            title: payload.title || "Nowe powiadomienie",
            message: payload.message || "Masz nową aktualizację.",
            kind: payload.status === "ACCEPTED" ? "success" : "info",
            actionLabel: "Zobacz",
            onAction: () => nav("/messages"),
          });
        } catch {
          // Ignorujemy niepoprawne eventy.
        }
      };

      ws.onclose = () => {
        wsRef.current = null;

        if (!manuallyClosed) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      manuallyClosed = true;

      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.username]);

  return null;
}