'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  showX?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-[400px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[960px]',
  full: 'max-w-full m-4 h-[calc(100vh-32px)]'
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  showX = true,
  size = 'md'
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
        document.body.style.overflow = '';
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 transition-all duration-[220ms] ease-out",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm transition-opacity duration-[220ms] ease-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={cn(
          "relative w-full bg-surface border border-border-subtle rounded-xl shadow-2xl flex flex-col transition-all duration-[220ms] ease-out",
          sizeClasses[size],
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-2 opacity-0 scale-[0.98]",
          className
        )}
      >
        {/* Header */}
        {(title || showX) && (
          <header className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            {title ? (
              <h3 className="text-lg font-display text-ink-primary">{title}</h3>
            ) : <div />}
            
            {showX && (
              <button 
                onClick={onClose}
                className="p-1 rounded-md text-ink-muted hover:text-ink-primary hover:bg-bg-sunken transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </header>
        )}

        {/* Body */}
        <div className="flex-1 px-5 py-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <footer className="px-5 py-4 border-t border-border-subtle flex flex-col md:flex-row md:items-center md:justify-end gap-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
