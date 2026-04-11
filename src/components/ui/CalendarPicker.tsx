'use client';

import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isBefore,
  startOfToday,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarPickerProps {
  startDate: string;
  endDate: string;
  blockedDates: string[];
  onChange: (start: string, end: string) => void;
}

export default function CalendarPicker({ startDate, endDate, blockedDates, onChange }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionType, setSelectionType] = useState<'start' | 'end'>('start');
  const today = startOfToday();

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-semibold text-ink-primary font-display flex items-center gap-2">
           <span className="w-1.5 h-6 bg-accent/80 rounded-full" />
           {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-1">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-bg-sunken rounded-lg border border-border-subtle transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-bg-sunken rounded-lg border border-border-subtle transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-[10px] font-medium text-ink-muted/70 uppercase tracking-widest text-center py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const onDateClick = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    // Prevent selecting blocked dates
    if (blockedDates.includes(dayStr)) return;
    
    // Prevent selecting past dates
    if (isBefore(day, today)) return;

    if (selectionType === 'start') {
      onChange(dayStr, dayStr);
      setSelectionType('end');
    } else {
      // If end date is before start date, restart selection
      if (isBefore(day, new Date(startDate))) {
        onChange(dayStr, dayStr);
        setSelectionType('end');
      } else {
        // CHECK FOR OVERLAPS: Airbnb check!
        // We cannot select a range that has a blocked date in the middle
        const interval = eachDayOfInterval({
          start: new Date(startDate),
          end: day
        });
        
        const hasConflict = interval.some(d => blockedDates.includes(format(d, 'yyyy-MM-dd')));
        
        if (hasConflict) {
          // Restart selection from this new start point
          onChange(dayStr, dayStr);
          setSelectionType('end');
        } else {
          onChange(startDate, dayStr);
          setSelectionType('start');
        }
      }
    }
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateView = startOfWeek(monthStart);
    const endDateView = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDateView;
    let formattedDate = "";

    while (day <= endDateView) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "yyyy-MM-dd");
        const cloneDay = day;
        const isBlocked = blockedDates.includes(formattedDate);
        const isPast = isBefore(day, today);
        const isSelectedStart = isSameDay(day, parseISO(startDate));
        const isSelectedEnd = isSameDay(day, parseISO(endDate));
        const isInRange = day >= parseISO(startDate) && day <= parseISO(endDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`relative h-11 flex items-center justify-center cursor-pointer transition-all ${
              !isCurrentMonth ? "opacity-20" : ""
            } ${isBlocked || isPast ? "cursor-not-allowed" : ""}`}
            onClick={() => onDateClick(cloneDay)}
          >
            {/* Range Background */}
            {isInRange && isCurrentMonth && !isBlocked && (
              <div 
                className={`absolute inset-y-2 inset-x-0 z-0 ${
                  isSelectedStart && isSelectedEnd ? 'rounded-lg mx-2' :
                  isSelectedStart ? 'rounded-l-lg ml-2' :
                  isSelectedEnd ? 'rounded-r-lg mr-2' : ''
                } bg-accent shadow-sm shadow-accent/20`} 
              />
            )}

            <span className={`relative z-20 text-xs font-medium font-mono transition-colors duration-200 ${
              (isSelectedStart || isSelectedEnd || (isInRange && !isBlocked)) && isCurrentMonth ? "text-white" : 
              isBlocked ? "text-ink-muted line-through opacity-30" : 
              isPast ? "text-ink-muted/30" :
              "text-ink-primary"
            }`}>
              {format(day, "d")}
            </span>

            {isBlocked && isCurrentMonth && (
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-ink-muted opacity-40" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-2xl border border-border-subtle p-5 shadow-sm overflow-hidden animate-slide-up">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-wider">Plan Your Stay</span>
            <span className="text-xs font-semibold text-accent/90">
              {format(parseISO(startDate), 'dd MMM')} — {format(parseISO(endDate), 'dd MMM')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-accent/5 px-2 py-1 rounded-md border border-accent/10">
            <span className="text-[11px] font-semibold text-accent/90">
               {selectionType === 'start' ? 'Select Check-in' : 'Select Check-out'}
            </span>
          </div>
        </div>

        {blockedDates.length > 0 && (
          <div className="bg-ink-muted/5 p-2 rounded-lg flex items-center gap-2">
            <AlertTriangle size={12} className="text-ink-muted" />
            <span className="text-[10px] text-ink-muted font-medium italic">Reserved dates are disabled for this room</span>
          </div>
        )}
      </div>
    </div>
  );
}
