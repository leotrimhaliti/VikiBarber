// src/components/Calendar.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOfCalendar = new Date(startOfMonth);
  startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());

  const days = [];
  const currentCalendarDate = new Date(startOfCalendar);

  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentCalendarDate));
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
  }

  const monthNames = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  const dayNames = ['Diell', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'];

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isPastDate = (date: Date) => {
    const now = new Date();
    const compare = new Date(date);
    compare.setHours(23, 59, 59, 999);
    return compare < now;
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => onMonthChange('prev')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Muaji i mëparshëm"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={() => onMonthChange('next')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Muaji tjetër"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const now = new Date();
          const isPast = isPastDate(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isSelectedDate = isSelected(date);
          const isSunday = date.getDay() === 0;

          // E ndalon zgjedhjen e orëve që kanë kaluar nëse data është sot
          const isTodayDate = isToday(date);
          const isEndOfDay = isTodayDate && now.getHours() >= 23 && now.getMinutes() >= 59;

          const isDisabled =
            isPast || !isCurrentMonthDate || isSunday || isEndOfDay;

          return (
            <button
              key={index}
              onClick={() => !isDisabled && onDateSelect(date)}
              disabled={isDisabled}
              className={`
                p-3 text-sm rounded-lg transition-all duration-200 hover:scale-105
                ${isSunday
                  ? 'text-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-400 cursor-not-allowed'
                  : isPast
                    ? 'text-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-400 cursor-not-allowed'
                    : isCurrentMonthDate
                      ? isSelectedDate
                        ? 'bg-gray-800 dark:bg-gray-600 text-white shadow-lg'
                        : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white cursor-pointer'
                      : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }
                ${!isCurrentMonthDate && 'opacity-30'}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
