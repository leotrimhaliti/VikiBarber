import { supabase } from '../components/supabaseClient';
import { Booking, BookingInsert, BlockedPeriodInsert } from '../types/types';

export const bookingService = {
    /**
     * Fetch all active bookings (not completed) for a specific date (optional)
     */
    async getBookings(date?: Date) {
        let query = supabase
            .from('bookings')
            .select('*')
            .eq('is_completed', false)
            .order('date', { ascending: true })
            .order('time_slot', { ascending: true });

        if (date) {
            const dateQuery = date.toISOString().split('T')[0];
            query = query.eq('date', dateQuery);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Booking[];
    },

    /**
     * Fetch booked time slots for a specific date
     */
    async getBookedSlots(date: Date) {
        const dateQuery = date.toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('bookings')
            .select('time_slot')
            .eq('date', dateQuery); // No is_completed filter, completed bookings still take up a slot? Or should they? usually yes.

        if (error) throw error;
        return data.map((b: { time_slot: string }) => b.time_slot);
    },

    /**
     * Create a new booking
     */
    async createBooking(booking: BookingInsert) {
        const { data, error } = await supabase
            .from('bookings')
            .insert([booking])
            .select()
            .single();

        if (error) throw error;
        return data as Booking;
    },

    /**
     * Delete a booking (Admin only via RLS)
     */
    async deleteBooking(id: number) {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Mark a booking as completed
     */
    async completeBooking(id: number) {
        const { error } = await supabase
            .from('bookings')
            .update({ is_completed: true })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Check if a date is blocked
     */
    async checkBlockedDate(date: Date) {
        const dateQuery = date.toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('blocked_periods')
            .select('reason')
            .lte('start_date', dateQuery)
            .gte('end_date', dateQuery)
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            return { isBlocked: true, reason: data[0].reason || 'Nuk ka termine për këtë datë.' };
        }
        return { isBlocked: false, reason: null };
    },

    /**
     * Block a period (Admin only)
     */
    async blockPeriod(period: BlockedPeriodInsert) {
        const { error } = await supabase
            .from('blocked_periods')
            .insert([period]);

        if (error) throw error;
    }
};
