# VaxCare – Vaccine Booking Platform

A full-stack Node.js + MongoDB web app for booking vaccine appointments.

## Quick Start

```bash
npm install
npm start          # or: node server.js
```

Open http://localhost:5000 in your browser.

---

## Project Structure

```
222-219 project1/
├── server.js               ← Entry point (Express app, mounts all routes)
├── .env                    ← MONGO_URI, JWT_SECRET, PORT
├── package.json
│
├── frontend/               ← Static files served by Express
│   ├── index.html          ← Landing page (login/signup modal)
│   ├── patient-dashboard.html
│   ├── patient-appointments.html
│   ├── hospital-admin-dashboard.html
│   ├── styles.css
│   └── js/
│       ├── auth.js         ← Auth modal logic (login/signup forms)
│       └── interceptor.js  ← Injects JWT token into all API requests
│
├── backend/                ← App logic
│   ├── controllers/        ← Request handlers (signup, login, etc)
│   ├── routes/             ← Express routes
│   └── middleware/         ← auth.js (JWT validation)
│
├── database/               ← Data layer
│   ├── db.js               ← MongoDB connection config
│   ├── models/             ← Mongoose schemas (User, Vaccine, Booking)
│   └── scripts/            ← Database utilities (seed.js)
│
├── frontend/               ← Static web files
│   ├── index.html
│   ├── ...
│   └── js/
│       ├── auth.js
│       └── interceptor.js
│
└── scripts/                ← Dev utility scripts
    └── show-structure.js   ← Print this folder tree (npm run structure)
```

---

## API Endpoints

| Method | Endpoint                        | Auth Required | Role     | Description                  |
|--------|---------------------------------|---------------|----------|------------------------------|
| POST   | /signup                         | No            | Any      | Register new user/hospital   |
| POST   | /login                          | No            | Any      | Login, returns JWT token     |
| GET    | /vaccines                       | Yes           | Any      | List vaccines (with filter)  |
| POST   | /vaccines                       | Yes           | Hospital | Add a new vaccine            |
| PUT    | /vaccines/:id                   | Yes           | Hospital | Update vaccine stock         |
| DELETE | /vaccines/:id                   | Yes           | Hospital | Delete a vaccine             |
| GET    | /bookings                       | Yes           | Any      | Get bookings (filter by user)|
| GET    | /bookings/booked-slots          | Yes           | Any      | Get booked time slots        |
| POST   | /bookings                       | Yes           | Patient  | Create a booking             |
| PUT    | /bookings/:id                   | Yes           | Any      | Update booking status/rating |
| GET    | /hospitals                      | Yes           | Any      | List hospitals with ratings  |
| GET    | /hospitals/:name/timings        | Yes           | Any      | Get hospital working hours   |
| PUT    | /hospitals/:name/timings        | Yes           | Hospital | Save working hours           |

---

## NPM Scripts

| Command          | Description                              |
|------------------|------------------------------------------|
| `npm start`      | Start the server                         |
| `npm run dev`    | Start the server (same as start)         |
| `npm run seed`   | Wipe all MongoDB collections             |
| `npm run structure` | Print the project folder structure    |

---

## Environment Variables (`.env`)

```
MONGO_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-secret-key>
PORT=5000
```

## Auth Flow

1. **Signup** → POST `/signup` → bcrypt hash password → save to DB → return JWT
2. **Login** → POST `/login` → verify password → match role → return JWT
3. **Protected routes** → `interceptor.js` attaches `Authorization: Bearer <token>` to every API call
4. **Middleware** → `backend/middleware/auth.js` verifies JWT and checks role
