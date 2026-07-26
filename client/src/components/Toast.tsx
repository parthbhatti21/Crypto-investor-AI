"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "info" | "pending";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  toast: (opts: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  pending: (title: string, message?: string) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, string> = {
  success: "✅",
  error: "⚠️",
  info: "ℹ️",
  pending: "⏳",
};

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Enter animation
    const enter = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(enter);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 ${
        STYLES[t.type]
      } ${
        visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
      style={{ minWidth: 280, maxWidth: 360 }}
    >
      <span className="text-base shrink-0 mt-0.5">{ICONS[t.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{t.title}</p>
        {t.message && (
          <p className="text-xs opacity-75 mt-0.5 leading-relaxed break-words">{t.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-sm leading-none mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string) => toast({ type: "success", title, message }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string) => toast({ type: "error", title, message, duration: 6000 }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string) => toast({ type: "info", title, message }),
    [toast]
  );
  const pending = useCallback(
    (title: string, message?: string) => toast({ type: "pending", title, message, duration: 0 }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss, success, error, info, pending }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
