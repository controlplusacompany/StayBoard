'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-2), { id, message, type }]); // Keep last 3 toasts max
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-[2000] flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const icons = {
    success: <CheckCircle2 size={18} className="text-success" />,
    error: <AlertCircle size={18} className="text-danger" />,
    warning: <AlertTriangle size={18} className="text-warning" />,
    info: <Info size={18} className="text-accent" />
  };

  const bgStyles = {
    success: "border-success/20 bg-white",
    error: "border-danger/20 bg-white",
    warning: "border-warning/20 bg-white",
    info: "border-accent/20 bg-white"
  };

  return (
    <div
      onClick={onRemove}
      className={twMerge(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-sm rounded-xl border border-border-subtle shadow-lg transition-all duration-300 ease-out cursor-pointer active:scale-[0.98]",
        bgStyles[toast.type],
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
      )}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="flex-grow text-sm font-medium text-ink-secondary pr-2">{toast.message}</p>
      <button 
        className="p-1 text-ink-muted hover:text-ink-primary hover:bg-bg-sunken rounded transition-colors"
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
