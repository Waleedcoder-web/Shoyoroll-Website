# BLUENEEDLE Express Backend

REST API for the BLUENEEDLE platform, built with Node.js, Express, and PostgreSQL.

## Features

- **Express.js** REST API
- **PostgreSQL** integration using `pg` connection pooling
- **Security & Logging**: Helmet for headers, CORS configuration, Morgan for logging
- **Modular Architecture**: Clean separation into `controllers/`, `routes/`, `config/`, and `middleware/`
- **Graceful Shutdown**: Safe connection termination on process exit
- **Database Schema & Seeding**: Automated initialization script (`initDb.js`)

## Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js           # PostgreSQL pool configuration & testConnection
│   │   └── initDb.js       # Database tables schema and sample seed
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── inquiry.controller.js
│   │   └── product.controller.js
│   ├── middleware/
│   │   └── errorHandler.js # Central error & 404 handler
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── inquiry.routes.js
│   │   └── product.routes.js
│   ├── app.js              # Express application configuration
│   └── server.js           # Server entry point
├── .env.example            # Sample environment variables
├── .env                    # Local environment variables
├── package.json
└── README.md
```

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Edit `.env` with your PostgreSQL credentials:

```ini
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=blueneedle_db

CLIENT_URL=http://localhost:3000
```

### 3. Initialize Database Tables

Once the PostgreSQL database is created and `.env` has your password:

```bash
npm run db:init
```

### 4. Run the Server

- **Development Mode** (with nodemon auto-restart):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  ```bash
  npm start
  ```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API welcome & list of main endpoints |
| `GET` | `/api/health` | Health check (checks server and database status) |
| `GET` | `/api/products` | Get all active products (supports `?category=` and `?search=`) |
| `GET` | `/api/products/:id` | Get single product by ID |
| `POST` | `/api/products` | Add a new product |
| `GET` | `/api/inquiries` | Retrieve inquiries/quote submissions |
| `POST` | `/api/inquiries` | Submit an inquiry/quote request |
