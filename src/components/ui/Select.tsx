'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LucideIcon } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: LucideIcon;
  className?: string;
}

export default function Select({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select option", 
  label, 
  icon: Icon,
  className = "" 
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.id === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`field ${className} ${isOpen ? 'relative z-[150]' : ''}`} ref={containerRef}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full h-[46px] px-4 py-2 bg-bg-sunken border border-border-subtle rounded-xl text-sm transition-all duration-200 outline-none hover:bg-white hover:border-accent/40 ${
            isOpen ? 'bg-white border-accent ring-4 ring-accent/10 shadow-sm' : ''
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {Icon && <Icon size={16} className={`${isOpen ? 'text-accent' : 'text-ink-muted'}`} />}
            {!Icon && selectedOption?.icon && <selectedOption.icon size={16} className="text-accent" />}
            <span className={`truncate ${selectedOption ? 'text-ink-primary font-medium' : 'text-ink-muted'}`}>
              {displayLabel}
            </span>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-ink-muted transition-transform duration-250 ease-spring ${isOpen ? 'rotate-180 text-accent' : ''}`} 
          />
        </button>

        {isOpen && (
          <div 
            className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white border border-border-subtle rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="max-h-[280px] overflow-y-auto no-scrollbar">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 text-left transition-colors hover:bg-bg-sunken ${
                    value === option.id ? 'bg-accent/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <option.icon 
                        size={16} 
                        className={value === option.id ? 'text-accent' : 'text-ink-muted'} 
                      />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-sm font-medium ${
                        value === option.id ? 'text-accent' : 'text-ink-primary'
                      }`}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-[10px] text-ink-muted uppercase font-bold tracking-tight">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {value === option.id && (
                    <Check size={14} className="text-accent animate-in zoom-in duration-300" />
                  )}
                </button>
              ))}
              {options.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <span className="text-xs text-ink-muted">No options available</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
