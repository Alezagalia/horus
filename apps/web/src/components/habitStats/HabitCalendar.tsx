/**
 * Habit Calendar Component
 * Sprint 11 - US-100
 */

import { useState } from 'react';
import type { CalendarDay } from '@/types/habitStats';

interface HabitCalendarProps {
  calendarData: CalendarDay[];
  habitType: 'CHECK' | 'NUMERIC';
  unit?: string;
}

export function HabitCalendar({ calendarData, habitType, unit }: HabitCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Get current month data
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get first day of month (0 = Sunday, 1 = Monday, ...)
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Week day labels
  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  // Month name
  const monthName = today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Create calendar grid
  const calendarGrid: (CalendarDay | null)[] = [];

  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData.find((d) => d.date === dateStr);

    if (dayData) {
      calendarGrid.push(dayData);
    } else {
      // Future day or not scheduled
      const date = new Date(currentYear, currentMonth, day);
      const isFuture = date > today;
      calendarGrid.push({
        date: dateStr,
        status: isFuture ? 'future' : 'not-scheduled',
      });
    }
  }

  const getStatusColor = (status: CalendarDay['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'missed':
        return 'bg-red-500';
      case 'not-scheduled':
        return 'bg-gray-200';
      case 'future':
        return 'bg-gray-100';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusLabel = (status: CalendarDay['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'missed':
        return 'No completado';
      case 'not-scheduled':
        return 'No programado';
      case 'future':
        return 'Futuro';
      default:
        return 'Desconocido';
    }
  };

  const handleMouseEnter = (day: CalendarDay, event: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{monthName}</h2>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarGrid.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayNumber = new Date(day.date).getDate();
          const isToday = day.date === today.toISOString().split('T')[0];

          return (
            <div
              key={day.date}
              className="relative aspect-square"
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={`w-full h-full rounded-lg flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                  isToday ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="text-xs font-medium text-gray-700 mb-1">{dayNumber}</div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(day.status)}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-medium mb-1">
            {new Date(hoveredDay.date).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
            })}
          </div>
          <div>{getStatusLabel(hoveredDay.status)}</div>
          {habitType === 'NUMERIC' && hoveredDay.value !== undefined && (
            <div className="mt-1 text-yellow-300">
              {hoveredDay.value} {unit || 'u'}
            </div>
          )}
          {hoveredDay.notes && <div className="mt-1 text-gray-300 italic">{hoveredDay.notes}</div>}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Completado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>No completado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded-full" />
          <span>No programado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 rounded-full" />
          <span>Futuro</span>
        </div>
      </div>
    </div>
  );
}
