import { useCallback, useState } from "react";
import type { Toast, ToastType } from "../types";
import { uid } from "../utils";

const TOAST_DURATION_MS = 2200;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((msg: string, type: ToastType = "inf") => {
    const id = uid();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      TOAST_DURATION_MS,
    );
  }, []);

  return { toasts, toast } as const;
}
