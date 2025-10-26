import {
  getAllBookings,
  getBookingByDate,
  createBooking,
  deleteBooking,
  closeDatabase
} from './database';

describe('Car Park Booking Database', () => {
  // Clean up after all tests
  afterAll(() => {
    closeDatabase();
  });

  describe('createBooking', () => {
    it('should create a booking with valid data', () => {
      const date = '2025-12-01';
      const booking = createBooking({
        date,
        employee_name: 'John Doe',
        employee_email: 'john@example.com'
      });

      expect(booking).toMatchObject({
        date,
        employee_name: 'John Doe',
        employee_email: 'john@example.com'
      });
      expect(booking.id).toBeDefined();
      expect(booking.created_at).toBeDefined();

      // Clean up
      deleteBooking(date);
    });

    it('should create a booking with minimal data (only date)', () => {
      const date = '2025-12-02';
      const booking = createBooking({ date });

      expect(booking.date).toBe(date);
      expect(booking.employee_name).toBeNull();
      expect(booking.employee_email).toBeNull();

      // Clean up
      deleteBooking(date);
    });

    it('should throw error for invalid date format', () => {
      expect(() => {
        createBooking({ date: '2025/12/03' });
      }).toThrow('Date must be in YYYY-MM-DD format');

      expect(() => {
        createBooking({ date: '12-03-2025' });
      }).toThrow('Date must be in YYYY-MM-DD format');

      expect(() => {
        createBooking({ date: 'not-a-date' });
      }).toThrow('Date must be in YYYY-MM-DD format');
    });

    it('should prevent double-booking on the same date', () => {
      const date = '2025-12-04';
      
      // First booking should succeed
      createBooking({
        date,
        employee_name: 'John Doe',
        employee_email: 'john@example.com'
      });

      // Second booking on same date should fail
      expect(() => {
        createBooking({
          date,
          employee_name: 'Jane Smith',
          employee_email: 'jane@example.com'
        });
      }).toThrow('already booked');

      // Clean up
      deleteBooking(date);
    });
  });

  describe('getAllBookings', () => {
    it('should return all bookings sorted by date', () => {
      // Create test bookings
      createBooking({ date: '2025-12-10' });
      createBooking({ date: '2025-12-08' });
      createBooking({ date: '2025-12-09' });

      const bookings = getAllBookings();

      expect(bookings.length).toBeGreaterThanOrEqual(3);
      
      // Check that bookings are sorted by date
      const testBookings = bookings.filter(b => 
        b.date === '2025-12-08' || 
        b.date === '2025-12-09' || 
        b.date === '2025-12-10'
      );
      
      expect(testBookings[0].date).toBe('2025-12-08');
      expect(testBookings[1].date).toBe('2025-12-09');
      expect(testBookings[2].date).toBe('2025-12-10');

      // Clean up
      deleteBooking('2025-12-08');
      deleteBooking('2025-12-09');
      deleteBooking('2025-12-10');
    });
  });

  describe('getBookingByDate', () => {
    it('should return a booking for an existing date', () => {
      const date = '2025-12-11';
      createBooking({
        date,
        employee_name: 'Test User',
        employee_email: 'test@example.com'
      });

      const booking = getBookingByDate(date);

      expect(booking).toBeDefined();
      expect(booking?.date).toBe(date);
      expect(booking?.employee_name).toBe('Test User');

      // Clean up
      deleteBooking(date);
    });

    it('should return undefined for non-existent date', () => {
      const booking = getBookingByDate('2099-12-31');
      expect(booking).toBeUndefined();
    });
  });

  describe('deleteBooking', () => {
    it('should delete an existing booking', () => {
      const date = '2025-12-12';
      createBooking({ date });

      const deleted = deleteBooking(date);
      expect(deleted).toBe(true);

      const booking = getBookingByDate(date);
      expect(booking).toBeUndefined();
    });

    it('should return false when deleting non-existent booking', () => {
      const deleted = deleteBooking('2099-12-31');
      expect(deleted).toBe(false);
    });
  });

  describe('Concurrency handling', () => {
    it('should handle rapid concurrent booking attempts gracefully', () => {
      const date = '2025-12-15';
      let successCount = 0;
      let errorCount = 0;

      // Attempt multiple bookings simultaneously
      const attempts = [
        () => createBooking({ date, employee_name: 'User 1' }),
        () => createBooking({ date, employee_name: 'User 2' }),
        () => createBooking({ date, employee_name: 'User 3' })
      ];

      attempts.forEach(attempt => {
        try {
          attempt();
          successCount++;
        } catch (error) {
          errorCount++;
        }
      });

      // Exactly one should succeed, others should fail
      expect(successCount).toBe(1);
      expect(errorCount).toBe(2);

      // Clean up
      deleteBooking(date);
    });
  });
});
