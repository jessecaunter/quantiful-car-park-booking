import React, { useState, useEffect } from 'react'
import { bookingApi } from './services/api';
import type { Booking, CreateBookingInput } from './services/api';
import './App.css';

function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState<CreateBookingInput>({
    date: '',
    employee_name: '',
    employee_email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await bookingApi.getAllBookings()
      setBookings(data)
    } catch (err) {
      setError('Failed to load bookings. Please try again.')
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date) {
      setError('Date is required')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const bookingInput: CreateBookingInput = {
        date: formData.date,
        ...(formData.employee_name && { employee_name: formData.employee_name }),
        ...(formData.employee_email && { employee_email: formData.employee_email })
      }

      await bookingApi.createBooking(bookingInput)

      // Reset form data and refresh bookings
      setFormData({ date: '', employee_name: '', employee_email: '' })
      await fetchBookings()
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } }
        if (axiosError.response?.status === 409) {
          setError('This date is already booked. Please choose another date.')
        } else if (axiosError.response?.status === 400) {
          setError('Invalid date format. Please use a valid date.')
        } else {
          setError('Failed to create booking. Please try again.')
        }
      } else {
        setError('Failed to create booking. Please try again.')
      }
      console.error('Error creating booking:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (date: string) => {
    if (!confirm(`Are you sure you want to delete the booking for ${date}?`)) {
      return
    }

    try {
      setError('')
      await bookingApi.deleteBooking(date)
      await fetchBookings()
    } catch (err) {
      setError('Failed to delete booking. Please try again.')
      console.error('Error deleting booking:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-NZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Quantiful Car Park Booking System</h1>
        <p>Reserve your parking spot</p>
      </header>

      {error && (
        <div className="error-banner">
          <strong>{error}</strong>
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      <main className="main-content">
        {/* Booking Form */}
        <section className="booking-form-section">
          <h2>Book a Parking Spot</h2>
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label htmlFor="date">
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={submitting}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="employee_name">Employee Name</label>
              <input
                type="text"
                id="employee_name"
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                placeholder="John Doe"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="employee_email">Employee Email</label>
              <input
                type="email"
                id="employee_email"
                value={formData.employee_email}
                onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                placeholder="john.doe@example.com"
                disabled={submitting}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Booking...' : 'Book Parking Spot'}
            </button>
          </form>
        </section>

        {/* Bookings List */}
        <section className="bookings-section">
          <h2>Current Bookings</h2>

          {loading ? (
            <div className="loading">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet. Book your first parking spot!</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {bookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-date">
                    <span className="date-icon">📅</span>
                    <span className="date-text">{formatDate(booking.date)}</span>
                  </div>

                  {booking.employee_name && (
                    <div className="booking-detail">
                      <strong>Name:</strong> {booking.employee_name}
                    </div>
                  )}

                  {booking.employee_email && (
                    <div className="booking-detail">
                      <strong>Email:</strong> {booking.employee_email}
                    </div>
                  )}

                  <div className="booking-footer">
                    <span className="booking-time">
                      Booked: {new Date(booking.created_at).toLocaleString('en-NZ')}
                    </span>
                    <button
                      onClick={() => handleDelete(booking.date)}
                      className="delete-btn"
                      title="Delete booking"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Car Park Booking System | Total Bookings: {bookings.length}</p>
      </footer>
    </div>
  )
}

export default App
