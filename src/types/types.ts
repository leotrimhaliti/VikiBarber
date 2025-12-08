export interface Booking {
    id: number;
    created_at: string;
    date: string; // YYYY-MM-DD
    time_slot: string;
    client_name: string;
    client_phone: string;
    service_type: string;
    is_completed: boolean;
    user_id?: string;
}

export interface Profile {
    id: string;
    email: string;
    is_admin: boolean;
    created_at: string;
}

export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'is_completed'>;

export interface BlockedPeriod {
    id: number;
    start_date: string;
    end_date: string;
    reason?: string;
    created_at?: string;
}

export interface BlockedPeriodInsert {
    start_date: string;
    end_date: string;
    reason?: string;
}
