import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  getAllBookings,
  createBooking,
  deleteBooking,
  CreateBookingInput
} from './database';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// GET /api/bookings - Get all bookings
app.get('/api/bookings', (_req: Request, res: Response) => {
  try {
    const bookings = getAllBookings();
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings - Create a new booking
app.post('/api/bookings', (req: Request, res: Response) => {
  try {
    const { date, employee_name, employee_email } = req.body;

    // Basic validation
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const input: CreateBookingInput = {
      date,
      employee_name,
      employee_email
    };

    const booking = createBooking(input);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Handle specific error messages from database layer
    if (error instanceof Error) {
      if (error.message.includes('Invalid date format')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('already booked')) {
        return res.status(409).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// DELETE /api/bookings/:date - Delete a booking by date
app.delete('/api/bookings/:date', (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    const deleted = deleteBooking(date);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
