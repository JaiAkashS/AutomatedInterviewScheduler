# AutoSched - Automated Interview Scheduling Platform

AutoSched is a production-quality, automated recruitment interview scheduling application designed for hiring teams and recruiters. It seamlessly merges the scheduling power of Calendly with recruitment interview management inspired by Greenhouse.

---

## Key Capabilities & Features

- **Recruiter Authentication & Authorization**: Secure email/password registration and authentication using bcrypt hashing and JWT tokens stored in HTTP-Only cookies (and Bearer tokens).
- **Google OAuth 2.0 & Calendar API Integration**:
  - Live FreeBusy availability queries for interviewers.
  - Automatic Google Calendar Event creation upon candidate slot confirmation.
  - Automatic Google Meet video conference link generation.
  - Seamless fallback mock provider when Google credentials are not configured, enabling complete out-of-the-box demonstration.
- **Intelligent Scheduling Engine**:
  - Internal conversion of dates and timezone handling using IANA timezone names (e.g., `Asia/Kolkata`, `America/New_York`, `Europe/London`).
  - Merges overlapping busy intervals from Google Calendar and existing MongoDB interview appointments (e.g. `10:00-11:00` + `10:30-12:00` -> `10:00-12:00`).
  - Computes mutual availability intersections across multiple interviewers.
  - Strict enforcement of recruiter working hours (e.g. `09:00 - 17:00`), minimum notice requirements (e.g. 12 hours), and candidate timezone translation.
- **Candidate Scheduling Portal**:
  - Public scheduling links protected by cryptographically secure tokens (`/schedule/:token`).
  - Account-free candidate scheduling experience.
  - Real-time time slot selector, candidate timezone converter, and instant confirmation step.
- **Double-Booking & Race Condition Prevention**:
  - Live re-validation of Google Calendar FreeBusy and database locks right before slot finalization.
- **Interview State Machine**:
  - Strict status transitions: `DRAFT` -> `SCHEDULING` -> `SCHEDULED` -> `RESCHEDULE_REQUESTED` -> `CANCELLED` -> `COMPLETED` -> `EXPIRED`.
- **Recruiter Dashboard & Interactive Calendar View**:
  - Analytics widgets, filterable interview table, candidate directory, interview templates manager, and interactive monthly/weekly recruiter calendar view.

---

## Tech Stack

### Frontend (`/client`)
- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Date Manipulation**: `date-fns`, `date-fns-tz`

### Backend (`/server`)
- **Core**: Node.js, Express.js, TypeScript
- **Database**: MongoDB, Mongoose ODM
- **Authentication**: JWT, bcryptjs, cookie-parser
- **Google Integration**: `googleapis` (OAuth2 & Google Calendar v3 API)
- **Validation**: `express-validator`
- **Documentation**: Swagger UI (`swagger-ui-express`)
- **Testing**: Jest, Supertest

---

## Project Structure

```text
AutomatedInterviewScheduler/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── api/                # API wrappers (auth, interviews, candidates, schedule, templates, google)
│   │   ├── components/         # Reusable UI components (Button, Modal, Badge, CalendarView, etc.)
│   │   ├── context/            # AuthContext for session management
│   │   ├── layouts/            # DashboardLayout, AuthLayout, PublicLayout
│   │   ├── pages/              # Recruiter Dashboard, Interviews, Templates, Public Schedule Page
│   │   ├── routes/             # AppRoutes definition
│   │   └── types/              # TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
└── server/                     # Express TypeScript API Backend
    ├── src/
    │   ├── config/             # Environment & DB config
    │   ├── controllers/        # Express request controllers
    │   ├── integrations/       # Google Calendar API integration service & mock fallback
    │   ├── middleware/         # Auth, error handling, validation middleware
    │   ├── models/             # Mongoose schemas (User, Candidate, Interview, Availability, Template)
    │   ├── routes/             # API endpoint routes
    │   ├── services/           # Core Scheduling Engine & State Machine
    │   ├── swagger.json        # OpenAPI 3.0 specs
    │   └── app.ts              # Express application entrypoint
    ├── tests/                  # Jest test suites
    ├── .env.example
    └── package.json
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI.

---

### Step 1: Backend Setup (`server`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```
   The backend API will start on **`http://localhost:5000`**.  
   Swagger API documentation is available at **`http://localhost:5000/api-docs`**.

5. Run Backend Test Suite:
   ```bash
   npm test
   ```

---

### Step 2: Frontend Setup (`client`)

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The React web app will start on **`http://localhost:5173`**.

---

## Google Calendar API Setup (Optional)

To enable live Google OAuth & Calendar API synchronization:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Calendar API**.
3. Create OAuth 2.0 Web Client credentials. Set the Redirect URI to `http://localhost:5000/api/google/callback`.
4. Update `server/.env` with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_actual_google_client_id
   GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/google/callback
   ```
*If Google credentials are left as defaults, AutoSched automatically uses its built-in Mock Provider, allowing full end-to-end testing without external API setup.*

---

## Verification & End-to-End Workflow

1. Register a Recruiter account at `http://localhost:5173/register`.
2. Connect Google Calendar on the Settings page or proceed with the default setup.
3. Click **New Interview**, select or add a candidate (e.g. John Doe), pick an interview type, duration, and click **Create Interview**.
4. Copy the generated scheduling link: `http://localhost:5173/schedule/:token`.
5. Open the link in a new browser tab (or incognito window).
6. Select candidate timezone, pick a date, choose an available time slot, and click **Confirm & Schedule Interview**.
7. The system re-validates interviewer availability live, acquires database lock, updates status to `SCHEDULED`, and generates Google Calendar Event details and a Google Meet conference link!
