# Prescripto

Prescripto is a full‑stack healthcare appointment system that lets patients book doctor appointments, chat with doctors, and manage prescriptions and reviews. It includes role‑based dashboards for patients, doctors, and admins.

## Features

- **Patient booking**
  - Browse/filter doctors by speciality
  - Real‑time available slots for the next 7 days
  - Unavailable days/times are hidden/disabled
  - Secure appointment creation, reschedule and cancel

- **Doctor availability**
  - Per‑day working hours (Mon–Sun) with start/end
  - Days off management
  - Slot duration control
  - Server‑side enforcement: bookings outside availability are blocked

- **Chat (doctor ⇄ patient)**
  - Live messaging via WebSockets
  - Unread badges update in real time
  - Messages auto‑marked read when conversation is open; persists across refresh/login

- **Prescriptions**
  - Doctor sees patient details (age, gender, phone, email)
  - Doctor sees patient‑submitted symptoms for the appointment
  - Add diagnosis, medicines, recommendations, next visit

- **Reviews**
  - Patients can submit reviews
  - Doctor rating and review display

- **Dashboards**
  - Patient: appointments, profile
  - Doctor: appointments, patients, chats, earnings, availability, profile
  - Admin: doctors, patients, appointments overview

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Realtime:** socket.io

## Project Structure

```
Prescripto-main/
  backend/               # Express API + Socket.IO server
  src/                   # React app (Vite)
  ...
```

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud)

## Backend Setup

1) Configure environment
- Copy `backend/config.env.example` to `backend/config.env`
- Fill required values (Mongo URI, JWT secret, Stripe/Razorpay as needed)

2) Install & run
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

Optional: seed sample data
```bash
npm run seed
```

## Frontend Setup

Install & run the React app from the project root:
```bash
npm install
npm run dev
# App runs on http://localhost:5173
```

The frontend expects the API at `http://localhost:5000/api` by default.

## Key Workflows

- **Booking:** frontend fetches slots via `GET /api/doctors/:id/slots?date=YYYY-MM-DD` and creates appointments with `POST /api/appointments`. Backend blocks bookings on days off and outside working hours.
- **Availability:** doctors manage availability via `GET/PUT /api/doctors/me/availability`. Slots are generated from this config and existing bookings.
- **Chat:** Socket.IO client authenticates with the user token. Unread counters increment for new messages, clear when the conversation is opened and are persisted via `PUT /api/chat/:chatId/read`.
- **Prescription:** doctors see patient demographics and the appointment’s symptoms before saving a prescription via `PUT /api/appointments/:id/prescription`.

## Scripts

- Backend
  - `npm run dev` – start API with nodemon
  - `npm run seed` – seed sample data
- Frontend
  - `npm run dev` – start Vite dev server
  - `npm run build` – production build

## Notes

- Default ports: API `5000`, Frontend `5173`
- Ensure CORS configuration allows the frontend origin
- For production, configure environment variables and HTTPS as appropriate

## License

MIT





