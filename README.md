
# Service Management System (SMS)

A full-stack web application that connects customers with service providers and helps manage service bookings, job requests, and service history.

## Overview

The Service Management System provides separate panels for users, providers, administrators, and public visitors. Users can book services, providers can manage their jobs, and administrators can oversee system operations.

## Features

- User registration and authentication
- Role-based access for users, providers, and administrators
- Service browsing and booking
- Provider request acceptance and rejection
- Active job management and completion
- Booking cancellation and status tracking
- User profile and address management
- Public Home, About, Contact, and Help Center pages
- Administrative backend routes
- MongoDB database integration
- Responsive interface using Angular and Bootstrap

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Angular 18, TypeScript |
| UI Framework | Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs, cookies |
| Payments | Razorpay SDK integration |
| Email | Nodemailer |

## Project Structure

```text
SMS/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── frontend-angular/
│   ├── src/
│   └── package.json
├── diagrams.md
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Prerequisites

Install the following:

- Node.js and npm
- MongoDB Community Server
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/gujaratijeel15-debug/SMS.git
cd SMS
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` directory.

Example configuration:

```env
CORS_ORIGIN=http://localhost:4200
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=replace-with-a-strong-password
DEFAULT_ADMIN_NAME=System Admin
DEFAULT_ADMIN_CITY=Your City
DEFAULT_ADMIN_ADDRESS=Admin Office
```

Keep all credentials and secrets private. Never commit your `.env` file to GitHub.

The backend currently connects to a local MongoDB database named `serviceDB` at:

```text
mongodb://127.0.0.1:27017/serviceDB
```

Start MongoDB before running the backend.

### 4. Start the backend

From the `backend` directory:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Install frontend dependencies

Open a second terminal from the project root:

```bash
cd frontend-angular
npm install
```

### 6. Start the Angular frontend

```bash
npm start
```

Open the application at:

http://localhost:4200

## API Route Groups

| Endpoint | Purpose |
|---|---|
| `/api/auth` | Authentication |
| `/api/users` | User operations |
| `/api/bookings` | Booking management |
| `/api/services` | Service operations |
| `/api/admin` | Administrative operations |
| `/api/contact` | Contact form operations |

## Production Build

Build the Angular frontend:

```bash
cd frontend-angular
npm run build
```

The Express server is configured to serve the Angular production build from:

```text
frontend-angular/dist/frontend-angular/browser
```

For deployment, configure the production database, environment variables, CORS, authentication, email, and payment settings securely.

## Architecture and Diagrams

See [diagrams.md](./diagrams.md) for project architecture and workflow diagrams.

## Future Improvements

- Automated testing and CI/CD
- Production deployment
- Improved reporting and analytics
- Enhanced booking notifications
- Additional security and performance improvements

## Author

**Jeel Gujarati**

GitHub: [@gujaratijeel15-debug](https://github.com/gujaratijeel15-debug)

## License

No license has been specified yet.
