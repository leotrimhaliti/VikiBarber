import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Check, Mail, Phone, Loader2, AlertTriangle } from 'lucide-react';

interface BookingConfirmationProps {
  selectedDate: Date;
  selectedTime: string;
  onConfirm: (clientName: string, phoneNumber: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  selectedDate,
  selectedTime,
  onConfirm,
  onCancel,
  isSaving,
}) => {
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPastTime, setIsPastTime] = useState(false);

  // --- funksioni për format shqip ---
  const weekdays = ['E Diel', 'E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë'];
  const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];

  const formatDateShqip = (date: Date) => {
    const dayName = weekdays[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  };
  // -------------------------------------

  // 🔒 kontrollon nëse ora e zgjedhur ka kalu (për datën e sotme)
  useEffect(() => {
    const now = new Date();
    const appointment = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    appointment.setHours(hours, minutes, 0, 0);
    setIsPastTime(appointment < now);
  }, [selectedDate, selectedTime]);

  const handleConfirmClick = () => {
    if (clientName.trim() && phoneNumber.trim() && !isPastTime) {
      onConfirm(clientName.trim(), phoneNumber.trim());
    } else if (isPastTime) {
      alert("Nuk mund të rezervoni një orë që ka kaluar!");
    } else {
      alert("Ju lutem plotësoni Emrin dhe Numrin e Telefonit!");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-gray-700 dark:text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Konfirmoni rezervimin
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Ju lutem plotësoni emrin dhe numrin e telefonit
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Emri dhe Mbiemri
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Emri juaj i plotë"
              required
              className="w-full py-3 pl-10 pr-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-gray-800 dark:focus:ring-gray-500 focus:border-gray-800 dark:focus:border-gray-500 transition"
              disabled={isSaving}
            />
          </div>
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Numri i Telefonit
          </label>
          <div className="relative">
            <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="P.sh. +383 44 123 456"
              required
              className="w-full py-3 pl-10 pr-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-gray-800 dark:focus:ring-gray-500 focus:border-gray-800 dark:focus:border-gray-500 transition"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-3" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
            <p className="font-medium text-gray-800 dark:text-white">{formatDateShqip(selectedDate)}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-3" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ora</p>
            <p className={`font-medium ${isPastTime ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
              {selectedTime}
            </p>
          </div>
        </div>

        {isPastTime && (
          <div className="flex items-center text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Nuk mund të rezervoni një orë që ka kaluar.
          </div>
        )}

        <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-3" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Shërbimi</p>
            <p className="font-medium text-gray-800 dark:text-white">Qethje flokësh (Barber)</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anulo
        </button>
        <button
          onClick={handleConfirmClick}
          disabled={!clientName.trim() || !phoneNumber.trim() || isPastTime || isSaving}
          className="flex-1 py-3 px-4 bg-gray-800 dark:bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSaving ? (
            <Loader2 className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <Check className="w-5 h-5 mr-2" />
          )}
          {isSaving ? 'Duke ruajtur...' : 'Konfirmo Rezervimin'}
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
