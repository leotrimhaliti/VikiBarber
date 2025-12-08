import React, { useState, useEffect } from 'react';
import { Trash2, Calendar as CalendarIcon, Clock, User, Phone, Loader2, LogOut, Shield, X, Check } from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import Calendar from './Calendar';
import TimeSlots from './TimeSlots';
import { ModeToggle } from './mode-toggle';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types/types';

interface Toast {
  message: string;
  type: 'success' | 'error' | null;
}

const AdminDashboard: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // State per Kalendarin
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // STATE E RE PER REZERVIM MANUAL
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [manualBookingData, setManualBookingData] = useState({
    date: new Date(),
    time: '',
    clientName: '',
    phoneNumber: '',
  });
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

  // SHTESA E RE: Për të detektuar rifreskimin në TimeSlots
  const [refreshTimeSlots, setRefreshTimeSlots] = useState(0);

  // SHTESA E RE: State për shfaqjen e njoftimit (Toast)
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: null,
  });

  // STATE PER PERIUDHAT E BLLOKUARA
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockData, setBlockData] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [isBlocking, setIsBlocking] = useState(false);

  // Albanian month names for proper formatting
  const albanianMonths = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  const albanianDays = ['E Dielë', 'E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë'];

  const formatAlbanianDate = (date: Date) => {
    return `${date.getDate()} ${albanianMonths[date.getMonth()]}`;
  };

  const formatAlbanianDateFull = (date: Date) => {
    return `${albanianDays[date.getDay()]}, ${date.getDate()} ${albanianMonths[date.getMonth()]}`;
  };

  // Funksioni për shfaqjen e toastit
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    // Zhduk njoftimin pas 5 sekondash
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 5000);
  };


  // Marrja e Profilit per te kontrolluar isAdmin
  const fetchProfile = async (userId: string, retryCount = 0) => {
    setIsLoading(true);
    setError(null);

    // Allow a small delay for RLS policies to propagate if this is a fresh session
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setIsAdmin(data.is_admin);
      if (!data.is_admin) {
        setIsLoading(false);
        setError('Nuk keni të drejta administrimi. Llogaria juaj nuk është e shënuar si "admin".');
      }
      // If admin, we leave isLoading(true) and let the useEffect([isAdmin]) trigger fetchBookings
    } else {
      // Retry logic for transient errors (e.g. auth race conditions)
      if (retryCount < 3) {
        console.log(`Retrying profile fetch (${retryCount + 1}/3)...`);
        fetchProfile(userId, retryCount + 1);
        return;
      }

      setIsLoading(false);
      setError('Gabim gjatë marrjes së profilit. Sigurohu që tabela "profiles" ekziston dhe RLS është korrekt.');
    }
  }


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchProfile(session.user.id);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
          setBookings([]);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Handler for blocking dates
  const handleBlockDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockData.startDate || !blockData.endDate) {
      showToast('Ju lutem zgjidhni datën e fillimit dhe mbarimit', 'error');
      return;
    }

    setIsBlocking(true);

    try {
      await bookingService.blockPeriod({
        start_date: blockData.startDate,
        end_date: blockData.endDate,
        reason: blockData.reason
      });

      showToast('Periudha u bllokua me sukses!', 'success');
      setIsBlockModalOpen(false);
      setBlockData({ startDate: '', endDate: '', reason: '' });
      // Trigger refresh of TimeSlots to reflect blocked dates immediately
      setRefreshTimeSlots(prev => prev + 1);
    } catch (error: any) {
      console.error('Error blocking dates:', error);
      showToast(`Gabim: ${error.message || 'Error blocking dates'}`, 'error');
    } finally {
      setIsBlocking(false);
    }
  };

  // Modifikuar fetchBookings për të marrë vetëm ato 'is_completed: false'
  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await bookingService.getBookings(selectedDate || undefined);
      setBookings(data);
    } catch (error: any) {
      console.error('Gabim gjatë marrjes së rezervimeve:', error);
      setError('Gabim. Kontrolloni RLS për SELECT në tabelën "bookings".');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session && isAdmin) {
      fetchBookings();
    }
  }, [selectedDate, session, isAdmin]);


  const handleDeleteBooking = (bookingId: number) => {
    if (!session || !isAdmin) return;
    setBookingToDelete(bookingId);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete || !session || !isAdmin) return;

    const bookingId = bookingToDelete;

    try {
      await bookingService.deleteBooking(bookingId);
      showToast('Rezervimi u fshi me sukses!', 'success');
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setRefreshTimeSlots(prev => prev + 1);
    } catch (error: any) {
      console.error('Gabim gjatë fshirjes:', error);
      showToast(`Gabim gjatë fshirjes: ${error.message}`, 'error');
    } finally {
      setBookingToDelete(null);
    }
  };

  // Funksioni i pastër për të shënuar si të kryer (Pa debug RLS)
  const handleMarkCompleted = async (bookingId: number) => {
    if (!session || !isAdmin) return;

    try {
      await bookingService.completeBooking(bookingId);
      // Zëvendësojme rifreskimin me setBookings direkt
      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      showToast('Rezervimi u shënua si i kryer!', 'success');
      // Trigger rifreskimin e TimeSlots
      setRefreshTimeSlots(prev => prev + 1);
    } catch (error: any) {
      console.error('Gabim gjatë shënimit si të kryer:', error);
      showToast(`Gabim gjatë përditësimit: ${error.message}. Kontrollo RLS Policy (UPDATE).`, 'error');
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
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

  // 1. Thirrje kur Admini klikon orarin e lirë (nga TimeSlots)
  const handleAdminReserve = (time: string, date: Date) => {
    setManualBookingData({
      date: date,
      time: time,
      clientName: '',
      phoneNumber: '',
    });
    setIsManualBookingOpen(true);
  };

  // 2. Funksioni për ruajtjen në databazë (Tani me showToast)
  const saveManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBookingData.clientName.trim() || !manualBookingData.phoneNumber.trim()) {
      showToast("Emri i klientit dhe telefoni janë të detyrueshëm.", 'error');
      return;
    }

    setIsSavingManual(true);

    const dateToInsert = manualBookingData.date.toISOString().split('T')[0];

    try {
      await bookingService.createBooking({
        date: dateToInsert,
        time_slot: manualBookingData.time,
        client_name: manualBookingData.clientName.trim(),
        client_phone: manualBookingData.phoneNumber.trim(),
        service_type: 'Qethje flokësh (Barber)'
      });

      showToast(`Rezervimi për ${manualBookingData.clientName} në ${manualBookingData.time} u shtua!`, 'success');
      setIsManualBookingOpen(false);

      // RIFRESKIMI DIREKT PËR LISTËN E REZERVIMEVE TË ADMIN DASHBOARDIT
      fetchBookings();

      // SHTESA E RE: TRIGGER PËR RIFRESKIMIN E TimeSlots
      setRefreshTimeSlots(prev => prev + 1);
    } catch (error: any) {
      showToast(`Gabim gjatë rezervimit: ${error.message}`, 'error');
    } finally {
      setIsSavingManual(false);
    }
  };


  // Show loading while checking admin status (during initial load or after login)
  if (session && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-gray-800 dark:text-gray-200 mr-2" />
        Duke kontrolluar statusin e administratorit...
      </div>
    );
  }

  // No session - show login
  if (!session) {
    return <Auth />;
  }

  // Session exists but user is not admin (and loading is complete)
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-800 mb-2">Qasje e Kufizuar</h2>
        <p className="text-red-600 mb-6">Nuk jeni i autorizuar si administrator.</p>
        {error && (
          <div className="bg-red-100 p-3 rounded text-red-700 mb-4 max-w-md text-center text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Dilni nga llogaria
        </button>
      </div>
    );
  }

  // Dashboardi i Adminit
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <img
                  src="/image.png"
                  alt="VikiBarber Logo"
                  className="h-16 w-auto object-contain invert dark:invert-0 transition-opacity hover:opacity-80"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  onClick={() => setIsBlockModalOpen(true)}
                  className="flex"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Blloko Datat
                </Button>
                <ModeToggle />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Dil
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Kontrolli i Data/Orarit */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Calendar
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />
          <TimeSlots
            selectedDate={selectedDate || new Date()}
            selectedTime={selectedTime}
            onTimeSelect={(time) => setSelectedTime(time)}
            isAdmin={true}
            onAdminReserve={handleAdminReserve}
            refreshTrigger={refreshTimeSlots}
          />
        </div>

        {/* Bookings Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Rezervimet: {selectedDate && formatAlbanianDateFull(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Duke rifreskuar...
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg mb-4">{error}</div>
            )}

            {bookings.length === 0 && !isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nuk ka rezervime për këtë datë.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 border dark:border-gray-700 rounded-lg hover:bg-muted/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center"
                  >
                    <div className="flex-1 space-y-2 mb-4 sm:mb-0">
                      <div className="flex items-center space-x-4">
                        <Clock className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                        <span className="font-semibold text-xl">{booking.time_slot}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Klienti: <span className="font-medium ml-1">{booking.client_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          Tel: <span className="font-medium ml-1">{booking.client_phone}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">Rezervuar: {new Date(booking.created_at).toLocaleString('sq-AL')}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => handleMarkCompleted(booking.id)}
                        disabled={isLoading}
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Kryer
                      </Button>

                      <Button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={isLoading}
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Fshij
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL PËR REZERVIM MANUAL (SHTIMI I KLIENTIT) */}
      {isManualBookingOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={saveManualBooking}
            className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full relative"
          >
            <button
              type="button"
              onClick={() => setIsManualBookingOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>

            <h4 className="text-2xl font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-3 mb-6">
              Rezervim i Ri Manual
            </h4>

            <div className="space-y-4 mb-6">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <CalendarIcon className="w-5 h-5 inline mr-2 text-blue-600 dark:text-blue-400" />
                Data: {formatAlbanianDate(manualBookingData.date)} në <Clock className="w-5 h-5 inline mr-1 text-blue-600 dark:text-blue-400" /> {manualBookingData.time}
              </p>

              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emri i Klientit</label>
                <input
                  id="clientName"
                  type="text"
                  value={manualBookingData.clientName}
                  onChange={(e) => setManualBookingData({ ...manualBookingData, clientName: e.target.value })}
                  placeholder="Emri i klientit"
                  required
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-gray-800 focus:border-gray-800"
                  disabled={isSavingManual}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numri i Telefonit</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={manualBookingData.phoneNumber}
                  onChange={(e) => setManualBookingData({ ...manualBookingData, phoneNumber: e.target.value })}
                  placeholder="Numri i telefonit"
                  required
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-gray-800 focus:border-gray-800"
                  disabled={isSavingManual}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSavingManual || !manualBookingData.clientName.trim() || !manualBookingData.phoneNumber.trim()}
              className="w-full h-12"
            >
              {isSavingManual && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              {isSavingManual ? 'Duke ruajtur...' : 'Shto Klientin Tani'}
            </Button>
          </form>
        </div>
      )}

      {/* SHTESA E RE: KOMPONENTI I NJOFTIMIT (TOAST) */}
      {toast.type && (
        <div
          className={`fixed bottom-5 right-5 z-[100] p-4 rounded-lg shadow-xl transition-opacity duration-300 ${toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
            } flex items-center space-x-3`}
        >
          {toast.type === 'success' ? (
            <Check className="w-6 h-6" />
          ) : (
            <X className="w-6 h-6" />
          )}
          <p className="font-medium">{toast.message}</p>
          <button onClick={() => setToast({ message: '', type: null })} className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal for Deleting */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Konfirmo Fshirjen</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                A jeni i sigurt që dëshironi të fshini këtë rezervim? Ky veprim nuk mund të kthehet.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setBookingToDelete(null)}
                  className="flex-1"
                >
                  Anulo
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteBooking}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Fshije
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PER BLLOKIM DATASH */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleBlockDates}
            className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full relative"
          >
            <button
              type="button"
              onClick={() => setIsBlockModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>

            <h4 className="text-2xl font-bold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-3 mb-6">
              Blloko Periudhe
            </h4>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Përzgjidhni periudhën gjatë së cilës nuk dëshironi të pranohen rezervime.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data e Fillimit</label>
                  <input
                    type="date"
                    value={blockData.startDate}
                    onChange={(e) => setBlockData({ ...blockData, startDate: e.target.value })}
                    required
                    className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data e Mbarimit</label>
                  <input
                    type="date"
                    value={blockData.endDate}
                    onChange={(e) => setBlockData({ ...blockData, endDate: e.target.value })}
                    required
                    className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arsyeja (Opsionale)</label>
                <input
                  type="text"
                  value={blockData.reason}
                  onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
                  placeholder="psh. Pushime verore"
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isBlocking}
              className="w-full h-12"
            >
              {isBlocking ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {isBlocking ? 'Duke bllokuar...' : 'Konfirmo Bllokimin'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;