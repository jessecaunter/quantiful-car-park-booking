import Database from 'better-sqlite3';
import path from 'path';

export type Booking = {
  id: number;
  date: string;
  employee_name: string | null;
  employee_email: string | null;
  created_at: string;
}

export type CreateBookingInput = {
  date: string;
  employee_name?: string;
  employee_email?: string;
}

// Initialize database
const db = new Database(path.join(__dirname, '../bookings.db'));

// Configure for better concurrency handling
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

// Create bookings table
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    employee_name TEXT,
    employee_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepared statements for better performance
const statements = {
  getAllBookings: db.prepare('SELECT * FROM bookings ORDER BY date ASC'),
  getBookingByDate: db.prepare('SELECT * FROM bookings WHERE date = ?'),
  getBookingById: db.prepare('SELECT * FROM bookings WHERE id = ?'),
  createBooking: db.prepare(`
    INSERT INTO bookings (date, employee_name, employee_email)
    VALUES (?, ?, ?)
  `),
  deleteBooking: db.prepare('DELETE FROM bookings WHERE date = ?'),
};

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Check it's a valid calendar date
  const parsedDate = new Date(date);
  return parsedDate.toISOString().startsWith(date);
}

/**
 * Get all bookings ordered by date
 */
export function getAllBookings(): Booking[] {
  return statements.getAllBookings.all() as Booking[];
}

/**
 * Get a specific booking by date
 */
export function getBookingByDate(date: string): Booking | undefined {
  return statements.getBookingByDate.get(date) as Booking | undefined;
}

/**
 * Create a new booking with transaction-based double-booking prevention
 * 
 * Uses SQLite's UNIQUE constraint and transactions to ensure atomicity.
 * If two requests try to book the same date simultaneously, one will succeed
 * and the other will fail with a constraint violation.
 */
export function createBooking(input: CreateBookingInput): Booking {
  const { date, employee_name, employee_email } = input;

  // Validate date format
  if (!isValidDateFormat(date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  // Use a transaction to ensure atomicity
  const transaction = db.transaction(() => {
    try {
      const info = statements.createBooking.run(
        date,
        employee_name || null,
        employee_email || null
      );
      
      // Retrieve the created booking
      const booking = statements.getBookingById.get(info.lastInsertRowid) as Booking;
      return booking;
    } catch (error: any) {
      // SQLite error code for UNIQUE constraint violation
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error(`Date ${date} is already booked`);
      }
      throw error;
    }
  });

  return transaction();
}

/**
 * Delete a booking by date
 * Returns true if a booking was deleted, false if no booking existed
 */
export function deleteBooking(date: string): boolean {
  const info = statements.deleteBooking.run(date);
  return info.changes > 0;
}

/**
 * Close database connection (useful for cleanup)
 */
export function closeDatabase(): void {
  db.close();
}