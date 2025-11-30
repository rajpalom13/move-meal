# MoveNmeal

A full-stack food delivery and ride-sharing cluster application.

## Architecture

```
movenmeal/
├── client/          # Next.js frontend
├── server/          # Express.js backend
└── shared/          # Shared types and utilities
```

## Features

- **Location Services**: Detect user position, show nearby rides
- **AI Recommendation Engine**: Optimal food order clusters based on preferences, location, timing
- **Cluster System**: Create, join, and view AI-suggested groups in real-time
- **OTP Handover**: Dual verification (sender + receiver) for delivery confirmation
- **Dashboards**: User, Vendor, and Admin dashboards with analytics
- **Authentication**: JWT + OTP based secure authentication

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui components
- Socket.io client (real-time)

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- Socket.io (real-time)
- OpenAI API (recommendations)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd client && npm install
cd ../server && npm install
```

2. Set up environment variables (see `.env.example` files)

3. Run development servers:
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

## API Documentation

See `/server/docs/api.md` for detailed API documentation.
