import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import Toast, { type ToastMessage } from "../components/Toast";

type NotificationsContextValue = {
  pendingRecruitmentCount: number;
  setPendingRecruitmentCount: (value: number) => void;
  refreshSignal: number;
  notifyRecruitmentChanged: () => void;
  showToast: (toast: Omit<ToastMessage, "id">) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [pendingRecruitmentCount, setPendingRecruitmentCount] = useState(0);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notifyRecruitmentChanged = useCallback(() => {
    setRefreshSignal((current) => current + 1);
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    setToasts((current) => [
      ...current,
      {
        ...toast,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      },
    ]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      pendingRecruitmentCount,
      setPendingRecruitmentCount,
      refreshSignal,
      notifyRecruitmentChanged,
      showToast,
    }),
    [
      pendingRecruitmentCount,
      setPendingRecruitmentCount,
      refreshSignal,
      notifyRecruitmentChanged,
      showToast,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}

      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={closeToast} />
        ))}
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);

  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }

  return ctx;
}