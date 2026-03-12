# Equestrian - Horse Riding Management Platform

A comprehensive equestrian management platform with mobile app, admin web portal, and backend API.

## Architecture

```
Equestrian/
├── backend/          # Node.js + Express + Sequelize + MySQL API
├── frontend-admin/   # React + Vite + Tailwind admin dashboard
└── mobile-app/       # Flutter mobile app (iOS + Android)
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Mobile App | Flutter 3.9+ (Dart) |
| Admin Web | React 19, Vite 7, Tailwind CSS, Redux Toolkit |
| Backend API | Node.js, Express 5, Sequelize ORM |
| Database | MySQL 8+ |
| Auth | JWT (Bearer tokens) |
| Email | Nodemailer + SMTP |
| Payments | TapPay / HyperPay (planned) |

## Quick Start

### Prerequisites

- Node.js 18+ (recommended 20+)
- MySQL 8+
- Flutter 3.9+ SDK
- npm

### Backend

```bash
cd backend
cp .env.example .env    # Edit with your credentials
npm install
npm run dev
```

### Admin Frontend

```bash
cd frontend-admin
cp .env.example .env    # Edit API URL if needed
npm install
npm run dev
```

### Mobile App

```bash
cd mobile-app
flutter pub get
flutter run
```

## Features

- **Rider**: Browse stables/horses, book sessions, enroll in courses, manage profile
- **Coach**: Manage availability, create courses, track sessions
- **Admin**: Full CRUD for stables, arenas, horses, disciplines, coaches, courses, riders
- **Payments**: Subscription plans, direct coach payments (TapPay/HyperPay)

## API Documentation

Base URL: `/api/v1`

Route groups: `/users`, `/admin`, `/disciplines`, `/stables`, `/arenas`, `/horses`, `/courses`, `/coaches`, `/enrollments`, `/sessions`, `/coach-availability`, `/riders`, `/coach-reviews`, `/mail`

## License

ISC
