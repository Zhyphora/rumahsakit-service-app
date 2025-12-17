# Rumah Sakit Service App

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A **full‑stack Hospital Management System** featuring real‑time queue handling, stock opname, document management, and staff attendance.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [Default Login](#default-login)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack

- **Backend**: Express.js, TypeScript, PostgreSQL, TypeORM, Socket.IO
- **Frontend**: Next.js 14, TypeScript, React, CSS Modules

---

## Project Structure

```text
rumahsakit/
├── backend/          # Express.js API Server
│   ├── src/
│   │   ├── config/       # Database, WebSocket config
│   │   ├── controllers/  # Route controllers
{{ ... }}
    │   ├── services/     # API client
    │   └── types/        # TypeScript types
    └── package.json
```

---

## Quick Start

### Prerequisites

- Node.js **18+**
- PostgreSQL **14+**

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Zhyphora/rumahsakit-service-app.git
   cd rumahsakit-service-app
   ```

2. **Backend**

   ```bash
   cd backend
   cp .env.example .env   # configure DB credentials
   npm install
   npm run migration:run
   npm run seed
   npm run dev            # http://localhost:3001
   ```

3. **Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev            # http://localhost:3000
   ```

---

## Default Login

- **Email**: `admin@rumahsakit.com`
- **Password**: `password123`

---

## Features

- 📊 **Real‑time Queue Management** – powered by Socket.IO
- 📦 **Stock / Inventory Management** with stock opname
- 📄 **Document Management** with fine‑grained access control
- 📸 **Staff Attendance** using photo capture
- 🏥 **Patient Records** management

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes with clear messages.
4. Open a Pull Request describing the changes.

---

## License

MIT © Zhyphora
