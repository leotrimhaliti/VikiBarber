import React from 'react';
import { Calendar, Clock, Trash2, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from '../types/types';
import { bookingService } from '../services/bookingService';

interface MyBookingsProps {
    bookings: Booking[];
    onBack: () => void;
    onDelete: (id: number) => void;
}

const MyBookings: React.FC<MyBookingsProps> = ({ bookings, onBack, onDelete }) => {
    const handleDelete = async (id: number) => {
        if (window.confirm('A jeni i sigurt që dëshironi ta anuloni këtë termin?')) {
            try {
                await bookingService.deleteBooking(id);
                onDelete(id);
            } catch (error) {
                console.error('Gabim gjatë anulimit:', error);
                alert('Ka ndodhur një gabim gjatë anulimit. Ju lutem provoni përsëri.');
            }
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const days = ['E Diele', 'E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë'];
        const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];

        const dayName = days[date.getDay()];
        const dayNum = date.getDate();
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();

        return `${dayName}, ${dayNum} ${monthName} ${year}`;
    };

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium flex items-center transition-colors"
            >
                ← Kthehu
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Scissors className="w-6 h-6" />
                    Terminet e mia
                </h2>

                {bookings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nuk keni asnjë termin aktiv.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {bookings.map((booking) => (
                                <motion.div
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -200 }}
                                    className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-medium mb-1">
                                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            {formatDate(booking.date)}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                            <Clock className="w-4 h-4" />
                                            {booking.time_slot}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(booking.id)}
                                        className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Anulo Terminin
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
