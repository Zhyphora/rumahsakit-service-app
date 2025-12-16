# Rumah Sakit Service App

Sistem Manajemen Rumah Sakit Terintegrasi dengan fitur antrian real-time, stock opname, dokumen, dan absensi.

## Tech Stack

- **Backend**: Express.js, TypeScript, PostgreSQL, TypeORM, Socket.IO
- **Frontend**: Next.js 14, TypeScript, React, CSS Modules

## Project Structure

```
rumahsakit/
├── backend/          # Express.js API Server
│   ├── src/
│   │   ├── config/       # Database, WebSocket config
│   │   ├── controllers/  # Route controllers
│   │   ├── entities/     # TypeORM entities
│   │   ├── middlewares/  # Auth, upload middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── index.ts      # Entry point
│   └── package.json
│
└── frontend/         # Next.js Web App
    ├── src/
    │   ├── app/          # App router pages
    │   ├── contexts/     # React contexts
    │   ├── hooks/        # Custom hooks
    │   ├── services/     # API client
    │   └── types/        # TypeScript types
    └── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

1. **Clone repository**

   ```bash
   git clone https://github.com/Zhyphora/rumahsakit-service-app.git
   cd rumahsakit-service-app
   ```

2. **Setup Backend**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run migration:run
   npm run seed
   npm run dev
   ```

3. **Setup Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Queue Display (TV): http://localhost:3000/queue-display
   - Take Queue: http://localhost:3000/take-queue

## Default Login

- Email: `admin@rumahsakit.com`
- Password: `password123`

## Features

- Real-time Queue Management with WebSocket
- Stock/Inventory Management with Stock Opname
- Document Management with Access Control
- Staff Attendance with Photo Capture
- Patient Records Management

## License

MIT
