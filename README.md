# Car Park Booking Application

A full-stack web application for managing car park bookings, built as a technical assessment demonstrating practical TypeScript, Node.js, and React skills.

## Overview

This application allows users to:

- View all car park bookings in a visual grid
- Book parking spots for specific dates
- Optionally associate bookings with employee details (name and email)
- Cancel existing bookings
- Prevent double-booking through database-level constraints

**Built with:** Node.js, TypeScript, Express, SQLite, React, and Vite

---

## Installation & Setup

### Prerequisites

- Node.js v18 or higher (tested with v20.19.0)
- npm (bundled with Node.js)

### Backend Setup

```bash
# Install backend dependencies
npm install

# Run backend tests
npm test

# Start the backend server (runs on http://localhost:3000)
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the frontend dev server (runs on http://localhost:5173)
npm run dev
```

### Access the Application

Once both servers are running:

- **Frontend UI:** [http://localhost:5173/]
- **Backend API:** [http://localhost:3000/api/bookings]

---

## Technical Stack

### Backend

- **Node.js + TypeScript -** Type-safe server-side development
- **Express -** Lightweight HTTP server with RESTful API endpoints
- **SQLite (better-sqlite3) -** Embedded database with ACID compliance
- **Jest + ts-jest -** Unit testing framework

### Frontend

- **React 19 -** Component-based UI library
- **TypeScript -** Type safety throughout the frontend
- **Vite -** Fast build tool and dev server (~1s startup vs 10-30s with CRA)
- **Axios -** HTTP client for API communication

---

## Key Technical Decisions

### 1. SQLite with better-sqlite3

**Decision:** Use SQLite instead of in-memory storage

**Reasoning:**

- **Persistent storage -** Data survives server restarts
- **ACID compliance -** Transactions ensure data integrity
- **Zero configuration -** No separate database server needed
- **Perfect for assessment -** Easy to set up and evaluate

**Implementation:**

- WAL (Write-Ahead Logging) mode for better concurrency
- Prepared statements for performance and SQL injection prevention
- Transaction-based double-booking prevention

### 2. Transaction-Based Concurrency Control

**Decision:** Use SQLite transactions + UNIQUE constraint for double-booking prevention

**Reasoning:**

- **Atomic operations -** Either booking succeeds completely or fails
- **Database-level guarantee -** Can't be bypassed by application code
- **Race condition safe -** Two simultaneous requests for same date handled correctly

**Implementation:**

```typescript
const transaction = db.transaction(() => {
  // UNIQUE constraint on date column ensures atomicity
  const info = statements.createBooking.run(date, name, email);
  return statements.getBookingById.get(info.lastInsertRowid);
});
```

**Trade-off:** This approach is simpler than application-level locking but ties us to SQLite's transaction semantics. For a distributed system, we'd need Redis or similar.

### 3. snake_case Naming Convention

**Decision:** Use `snake_case` for all identifiers (database columns, API responses, TypeScript types)

**Reasoning:**

- **Consistency -** Database columns naturally use snake_case
- **No mapping layer -** Data flows through unchanged
- **Simpler code -** No camelCase ↔ snake_case conversions

**Trade-off:** Less idiomatic for JavaScript/TypeScript (which prefer camelCase), but the simplicity wins in a time-constrained assessment. In production, I'd add a mapping layer.

### 4. Vite Instead of Create React App

**Decision:** Use Vite for frontend tooling

**Reasoning:**

- **Speed -** Sub-second dev server startup vs 10-30s with CRA
- **Modern -** Native ES modules, optimized for modern browsers
- **Time-efficient -** Faster iteration during development

### 5. Axios Instead of Fetch

**Decision:** Use axios for HTTP requests

**Reasoning:**

- **Simpler API -** Automatic JSON parsing, better error handling
- **Industry standard -** Familiar to most developers
- **Time-saving -** Less boilerplate than fetch

**Trade-off:** Adds ~13KB dependency, but worth it for developer experience in this context.

### 6. Error Handling Strategy

**Decision:** Transform errors at the database layer, translate to HTTP codes at server layer

**Implementation:**

```typescript
// Database layer: User-friendly error messages
if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
  throw new Error(`Date ${date} is already booked`);
}

// Server layer: HTTP status codes
if (error.message.includes("already booked")) {
  return res.status(409).json({ error: error.message });
}
```

**Reasoning:**

- **Clear responsibility -** Database handles SQLite errors, server handles HTTP
- **Testable -** Can unit test error transformations
- **User-friendly -** No SQLite error codes leak to frontend

---

## API Endpoints

### GET /api/bookings

Retrieve all bookings, ordered by date ascending.

**Response:**

```json
[
  {
    "id": 1,
    "date": "2025-11-01",
    "employee_name": "John Doe",
    "employee_email": "john@example.com",
    "created_at": "2025-10-27 10:30:00"
  }
]
```

### POST /api/bookings

Create a new booking.

**Request:**

```json
{
  "date": "2025-11-01",
  "employee_name": "John Doe",
  "employee_email": "john@example.com"
}
```

**Response:** `201 Created` with created booking object

**Errors:**

- `400` - Invalid date format
- `409` - Date already booked

### DELETE /api/bookings/:date

Delete a booking by date.

**Response:** `204 No Content` on success

**Errors:**

- `404` - Booking not found
