import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { supabase } from './supabaseClient';

interface TimeSlotsProps {
  selectedDate: Date;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isAdmin?: boolean;
  onAdminReserve?: (time: string, date: Date) => void;
  refreshTrigger?: number;
}

const TimeSlots: React.FC<TimeSlotsProps> = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  isAdmin = false,
  onAdminReserve,
  refreshTrigger,
}) => {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlockedDate, setIsBlockedDate] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    const startHour = 8;
    const endHour = 20;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const weekdays = [
    'E Diel',
    'E Hënë',
    'E Martë',
    'E Mërkurë',
    'E Enjte',
    'E Premte',
    'E Shtunë',
  ];
  const months = [
    'Janar',
    'Shkurt',
    'Mars',
    'Prill',
    'Maj',
    'Qershor',
    'Korrik',
    'Gusht',
    'Shtator',
    'Tetor',
    'Nëntor',
    'Dhjetor',
  ];

  const formatDateShqip = (date: Date) => {
    const dayName = weekdays[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  };

  const isSunday = selectedDate.getDay() === 0;

  useEffect(() => {
    const loadData = async () => {
      // Logic for sunday
      if (isSunday) {
        setBookedSlots(timeSlots);
        setIsBlockedDate(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Check if blocked
        const blockedStatus = await bookingService.checkBlockedDate(selectedDate);

        if (blockedStatus.isBlocked) {
          setIsBlockedDate(true);
          setBlockReason(blockedStatus.reason);
          setBookedSlots([]);
        } else {
          setIsBlockedDate(false);
          setBlockReason(null);

          // 2. Fetch booked slots
          const slots = await bookingService.getBookedSlots(selectedDate);
          setBookedSlots(slots);
        }
      } catch (error) {
        console.error('Error loading time slots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Realtime Subscription
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const channel = supabase
      .channel(`timeslots_${dateStr}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
        },
        (payload: any) => {
          // Reload if the change is relevant to this date
          // Optimization: Check if new date matches current view (or if generic delete)
          if ((payload.new && payload.new.date === dateStr) || payload.eventType === 'DELETE') {
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [selectedDate, refreshTrigger, isSunday]);

  const isBooked = (time: string): boolean => bookedSlots.includes(time);

  const isPastTime = (selectedDate: Date, selectedTime: string) => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const now = new Date();
    const dateCopy = new Date(selectedDate);
    dateCopy.setHours(hours, minutes, 0, 0);
    return dateCopy < now;
  };

  const isToday = (date: Date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const isPastDate =
    selectedDate.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full transition-colors duration-300">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Zgjidhni orarin
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Duke ngarkuar oraret...
        </div>
      ) : isBlockedDate ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg text-center flex flex-col items-center justify-center h-48">
          <CheckCircle className="w-12 h-12 mb-3 opacity-50" />
          <h4 className="text-lg font-bold mb-1">Mbyllur</h4>
          <p className="opacity-90">{blockReason || 'Nuk ka termine të lira për këtë datë.'}</p>
        </div>
      ) : isPastDate ? (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-center font-medium">
          Kjo datë ka kaluar.
        </div>
      ) : isSunday ? (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-center font-medium">
          Sot jemi të mbyllur. Ju lutem zgjidhni një ditë tjetër.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
          {timeSlots.map((time) => {
            const booked = isBooked(time);
            const isSelected = selectedTime === time;
            const past = isToday(selectedDate) && isPastTime(selectedDate, time);

            if (isAdmin) {
              return (
                <button
                  key={time}
                  onClick={() => {
                    if (!booked && !past && onAdminReserve) onAdminReserve(time, selectedDate);
                  }}
                  disabled={booked || past}
                  className={`
                    p-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center
                    ${booked
                      ? 'bg-red-100 text-red-600 cursor-not-allowed opacity-75 flex-col'
                      : past
                        ? 'bg-red-200 text-red-700 cursor-not-allowed opacity-70'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105 shadow-md'
                    }
                  `}
                >
                  {booked ? (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {time}
                      </div>
                      <span className="text-xs text-red-500 font-normal">
                        E Zënë
                      </span>
                    </div>
                  ) : past ? (
                    <div className="flex flex-col items-center space-y-1 text-red-700">
                      <span className="font-semibold">{time}</span>
                      <span className="text-xs font-normal">Ka Kalur</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1">
                      <span className="font-semibold">{time}</span>
                      <span className="text-xs font-normal">Shto Rezervim</span>
                    </div>
                  )}
                </button>
              );
            }

            // Normal Client
            return (
              <button
                key={time}
                onClick={() => !booked && !isSunday && !past && onTimeSelect(time)}
                disabled={booked || isSunday || past}
                className={`
                  p-3 text-sm rounded-lg font-medium transition-all duration-200 flex items-center justify-center
                  ${booked || isSunday
                    ? 'bg-red-100 text-red-600 cursor-not-allowed opacity-75 flex-col'
                    : past
                      ? 'bg-red-200 text-red-700 cursor-not-allowed opacity-70'
                      : isSelected
                        ? 'bg-gray-800 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-800 hover:scale-105'
                  }
                `}
              >
                {booked ? (
                  <div className="flex flex-col items-center space-y-1">
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {time}
                    </div>
                    <span className="text-xs text-red-500 font-normal">
                      E Zënë
                    </span>
                  </div>
                ) : past ? (
                  <div className="flex flex-col items-center space-y-1 text-red-700">
                    <span className="font-semibold">{time}</span>
                    <span className="text-xs font-normal">Ka Kalur</span>
                  </div>
                ) : (
                  time
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedTime && !isAdmin && !isSunday && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-gray-800 dark:text-gray-200 font-medium">
            Ora e zgjedhur: {selectedTime} - {formatDateShqip(selectedDate)}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlots;