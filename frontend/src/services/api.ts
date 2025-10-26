import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export type Booking = {
  id: number;
  date: string;
  employee_name: string | null;
  employee_email: string | null;
  created_at: string;
};

export type CreateBookingInput = {
  date: string;
  employee_name?: string;
  employee_email?: string;
};

export const bookingApi = {
  // Get all bookings
  getAllBookings: async (): Promise<Booking[]> => {
    const response = await axios.get(`${API_BASE_URL}/bookings`);
    return response.data;
  },

  // Create a new booking
  createBooking: async (input: CreateBookingInput): Promise<Booking> => {
    const response = await axios.post(`${API_BASE_URL}/bookings`, input);
    return response.data;
  },

  // Delete a booking
  deleteBooking: async (date: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/bookings/${date}`);
  }
};