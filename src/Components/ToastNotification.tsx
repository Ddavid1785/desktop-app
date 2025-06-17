import { useState, useEffect } from "react";
import { CheckCircle, X, Info, AlertCircle } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-900/90 border-green-700 text-green-100";
      case "error":
        return "bg-red-900/90 border-red-700 text-red-100";
      case "info":
        return "bg-blue-900/90 border-blue-700 text-blue-100";
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm ${getStyles()} animate-in slide-in-from-right duration-300`}
    >
      {getIcon()}
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="hover:opacity-70 transition-opacity hover:cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
    duration?: number
  ) => {
    const id = crypto.randomUUID();
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Expose the addToast function globally so it can be called from anywhere
  useEffect(() => {
    (window as any).showToast = addToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

// Hook to use toast notifications
export function useToast() {
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
    duration?: number
  ) => {
    if ((window as any).showToast) {
      (window as any).showToast(message, type, duration);
    }
  };

  return { showToast };
}
