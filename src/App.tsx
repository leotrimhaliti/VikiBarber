import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Check, Phone } from 'lucide-react';
import Calendar from './components/Calendar';
import TimeSlots from './components/TimeSlots';
import BookingConfirmation from './components/BookingConfirmation';
import { ModeToggle } from './components/mode-toggle';
import { bookingService } from './services/bookingService';

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Derived state from URL
  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');
  const successParam = searchParams.get('success');

  const selectedDate = dateParam ? new Date(dateParam) : null;
  const selectedTime = timeParam;

  // Determine current step
  let step: 'calendar' | 'time' | 'confirmation' | 'success' = 'calendar';
  if (successParam === 'true') step = 'success';
  else if (selectedDate && selectedTime) step = 'confirmation';
  else if (selectedDate) step = 'time';

  const [isSaving, setIsSaving] = useState(false);

  const handleConfirmBooking = async (clientName: string, phoneNumber: string) => {
    if (!selectedDate || !selectedTime || !clientName.trim() || !phoneNumber.trim()) return;

    setIsSaving(true);
    const dateToInsert = selectedDate.toISOString().split('T')[0];

    try {
      await bookingService.createBooking({
        date: dateToInsert,
        time_slot: selectedTime,
        client_name: clientName,
        client_phone: phoneNumber,
        service_type: 'Qethje flokësh (Barber)',
      });

      // Navigate to success
      setSearchParams({ success: 'true' });

      // Auto reset after 3 seconds
      setTimeout(() => {
        setSearchParams({});
      }, 3000);

    } catch (error: any) {
      console.error('Gabim gjatë rezervimit:', error.message);
      alert(`Gabim gjatë rezervimit: ${error.message}. Ju lutem provoni përsëri.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    // Format YYYY-MM-DD manually to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setSearchParams({ date: dateStr });
  };

  const handleTimeSelect = (time: string) => {
    if (dateParam) {
      setSearchParams({ date: dateParam, time });
    }
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
    if (dateParam) {
      setSearchParams({ date: dateParam });
    } else {
      setSearchParams({});
    }
  };

  const resetToCalendar = () => {
    setSearchParams({});
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
          <div className="flex items-center justify-center mt-3">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 transition-colors">
              <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <a href="tel:043980804" className="text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white">
                043 980 804
              </a>
            </div>
          </div>
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
                      <li>Qethje flokësh</li>
                      <li>Rregullim mjekre</li>
                      <li>Larje flokësh</li>
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
                onClick={() => setSearchParams({ date: dateParam! })}
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
                  Ju faleminderit që zgjodhët VikiBarber.
                </p>
                <div className="w-full h-1 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 dark:bg-green-500 w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instagram Footer */}
      <footer className="py-4">
        <div className="container mx-auto flex justify-center">
          <a
            href="https://www.instagram.com/vikibarber1/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 hover:scale-125 inline-block"
            aria-label="Visit our Instagram"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;