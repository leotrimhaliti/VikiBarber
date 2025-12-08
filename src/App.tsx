import React, { useState } from 'react';
import { Scissors, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import Calendar from './components/Calendar';
import TimeSlots from './components/TimeSlots';
import BookingConfirmation from './components/BookingConfirmation';
import { supabase } from './components/supabaseClient';
import { ModeToggle } from './components/mode-toggle';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'calendar' | 'time' | 'confirmation' | 'success'>('calendar');

  const [isSaving, setIsSaving] = useState(false);

  /**
   * FUNKSIONI PËR INSERT NË SUPABASE
   */
  const handleConfirmBooking = async (clientName: string, phoneNumber: string) => {
    if (!selectedDate || !selectedTime || !clientName.trim() || !phoneNumber.trim()) return;

    setIsSaving(true);

    // Konverto selectedDate në formatin 'YYYY-MM-DD'
    const dateToInsert = selectedDate.toISOString().split('T')[0];

    const newBookingData = {
      date: dateToInsert,
      time_slot: selectedTime,
      client_name: clientName,
      client_phone: phoneNumber,
      service_type: 'Qethje flokësh (Barber)',
    };

    const { error } = await supabase
      .from('bookings')
      .insert([newBookingData]);

    setIsSaving(false);

    if (error) {
      console.error('Gabim gjatë rezervimit:', error.message);
      alert(`Gabim gjatë rezervimit: ${error.message}. Ju lutem provoni përsëri.`);
    } else {
      setStep('success');

      // Pas 3 sekondave, kthehu te kalendari dhe bëj reset state-in
      setTimeout(() => {
        setStep('calendar');
        setSelectedDate(null);
        setSelectedTime(null);
      }, 3000);
    }
  };


  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirmation');
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleCancelBooking = () => {
    setStep('time');
  };

  const resetToCalendar = () => {
    setStep('calendar');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300 overflow-hidden flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 overflow-y-auto">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/image.png"
              alt="VikiBarber Logo"
              className="w-28 h-28 object-contain invert dark:invert-0"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">VikiBarber</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Rezervoni terminin tuaj online</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step !== 'calendar' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step !== 'calendar' ? 'bg-gray-800 dark:bg-gray-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                <CalendarIcon className="w-5 h-5" />
              </div>
              <span className="ml-2 font-medium">Data</span>
            </div>

            <div className={`w-8 h-0.5 ${step === 'confirmation' || step === 'success' || step === 'time' ? 'bg-gray-800 dark:bg-gray-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>

            <div className={`flex items-center ${step === 'time' || step === 'confirmation' || step === 'success' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'time' || step === 'confirmation' || step === 'success' ? 'bg-gray-800 dark:bg-gray-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                <Clock className="w-5 h-5" />
              </div>
              <span className="ml-2 font-medium">Ora</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {step === 'calendar' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Calendar
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onMonthChange={handleMonthChange}
                />
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Informacione</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <h4 className="font-medium text-gray-800 dark:text-blue-200 mb-2">Orari i punës</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">E Hënë - E Shtunë: 08:00 - 20:00</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">E Diel: Mbyllur</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Sherbimet</h4>
                    <ul className="text-gray-600 dark:text-gray-300 text-sm">
                      <li>• Qethje flokësh</li>
                      <li>• Rregullim mjekre</li>
                      <li>• Larje flokësh</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Kohezgjatja</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Çdo termin: 30 minuta</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'time' && selectedDate && (
            <div className="space-y-6">
              <button
                onClick={resetToCalendar}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium flex items-center transition-colors"
              >
                ← Kthehu te kalendari
              </button>
              <TimeSlots
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
                isAdmin={false} // Klienti nuk është admin
              />
            </div>
          )}

          {step === 'confirmation' && selectedDate && selectedTime && (
            <div className="space-y-6">
              <button
                onClick={() => setStep('time')}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium flex items-center transition-colors"
              >
                ← Kthehu te oraret
              </button>
              <BookingConfirmation
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onConfirm={handleConfirmBooking}
                onCancel={handleCancelBooking}
                isSaving={isSaving}
              />
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md mx-auto transition-colors duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-700 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  Rezervimi u konfirmua!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                </p>
                <div className="w-full h-1 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 dark:bg-green-500 w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GitHub Footer */}
      <footer className="py-4">
        <div className="container mx-auto flex justify-center">
          <a
            href="https://github.com/leotrimhaliti/VikiBarber"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all duration-300 hover:scale-125 inline-block"
            aria-label="View source on GitHub"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;