import Database from 'better-sqlite3';
import path from 'path';

export type Booking = {
  id: number;
  date: string;
  employee_name: string | null;
  employee_email: string | null;
  created_at: string;
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
};

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
 * Close database connection (useful for cleanup)
 */
export function closeDatabase(): void {
  db.close();
}