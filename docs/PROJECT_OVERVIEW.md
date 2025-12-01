# MoveNmeal - Project Overview

**Project Name:** MoveNmeal
**Version:** 1.0.0
**Date:** December 1, 2025

---

## Executive Summary

MoveNmeal is a full-stack web application that combines **food delivery clustering** and **ride-sharing** services with **AI-powered recommendations**. The platform enables users to form collaborative groups for shared food deliveries and rides, reducing costs and promoting community engagement.

---

## Table of Contents

1. [What is MoveNmeal?](#1-what-is-movenmeal)
2. [How It Works](#2-how-it-works)
3. [Core Features](#3-core-features)
4. [Technical Architecture](#4-technical-architecture)
5. [User Roles](#5-user-roles)
6. [Key Workflows](#6-key-workflows)
7. [Technology Stack](#7-technology-stack)
8. [Project Structure](#8-project-structure)
9. [API Overview](#9-api-overview)
10. [Security Features](#10-security-features)

---

## 1. What is MoveNmeal?

MoveNmeal is an innovative platform designed to solve common problems in food delivery and transportation:

### The Problem

- **High Delivery Costs:** Individual food orders often have high delivery fees
- **Minimum Order Requirements:** Restaurants have minimum basket amounts for delivery
- **Expensive Solo Rides:** Single passengers pay full fare for rides
- **Inefficient Resource Use:** Multiple deliveries to nearby locations

### The Solution

MoveNmeal allows users to:
- **Cluster Food Orders:** Group together with nearby users to meet minimum basket requirements and share delivery costs
- **Share Rides:** Find others traveling in the same direction to split transportation costs
- **AI Recommendations:** Get intelligent suggestions for the best clusters to join based on preferences and location

---

## 2. How It Works

### Food Delivery Clustering Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FOOD CLUSTER LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User A creates cluster         Other users join          Minimum basket   │
│   for "Pizza Hut"                with their orders          reached         │
│         │                              │                        │           │
│         ▼                              ▼                        ▼           │
│   ┌──────────┐    ──────────>    ┌──────────┐    ──────────>  ┌──────────┐  │
│   │  OPEN    │                   │  OPEN    │                 │  FILLED  │  │
│   │          │                   │ +Members │                 │          │  │
│   └──────────┘                   └──────────┘                 └──────────┘  │
│                                                                     │       │
│         ┌───────────────────────────────────────────────────────────┘       │
│         ▼                                                                   │
│   ┌──────────┐    ──────────>    ┌──────────┐    ──────────>  ┌──────────┐  │
│   │ ORDERED  │                   │  READY   │                 │COLLECTING│  │
│   │ OTPs sent│                   │ for pickup│                │ via OTP  │  │
│   └──────────┘                   └──────────┘                 └──────────┘  │
│                                                                     │       │
│         ┌───────────────────────────────────────────────────────────┘       │
│         ▼                                                                   │
│   ┌──────────┐                                                              │
│   │COMPLETED │  All members verified collection with OTP                    │
│   │          │                                                              │
│   └──────────┘                                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ride-Sharing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RIDE CLUSTER LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User A creates ride            Others join with          All seats        │
│   "Office → Home"                pickup points              filled          │
│         │                              │                        │           │
│         ▼                              ▼                        ▼           │
│   ┌──────────┐    ──────────>    ┌──────────┐    ──────────>  ┌──────────┐  │
│   │  OPEN    │                   │  OPEN    │                 │  FILLED  │  │
│   │ 4 seats  │                   │ 2 seats  │                 │ 0 seats  │  │
│   └──────────┘                   └──────────┘                 └──────────┘  │
│                                                                     │       │
│         ┌───────────────────────────────────────────────────────────┘       │
│         ▼                              ▼                                    │
│   ┌──────────┐    ──────────>    ┌──────────┐                               │
│   │IN_PROGRESS│                  │COMPLETED │  Passengers reached           │
│   │ Ride started│                │          │  destinations                 │
│   └──────────┘                   └──────────┘                               │
│                                                                             │
│   Fare per person = Total Fare ÷ Number of Members                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Features

### 3.1 User Authentication

| Feature | Description |
|---------|-------------|
| **Email/Password Login** | Traditional registration and login with secure password hashing |
| **OTP Authentication** | Two-factor verification via email (Nodemailer) and SMS (Twilio) |
| **JWT Tokens** | Secure session management with configurable expiration |
| **Profile Management** | Update personal info, preferences, and location |

### 3.2 Food Delivery Clusters

| Feature | Description |
|---------|-------------|
| **Create Cluster** | Initiate a group order from a restaurant with minimum basket requirements |
| **Join/Leave** | Other users can join with their individual orders |
| **Order Tracking** | Track each member's order amount and items |
| **OTP Verification** | Dual OTP system for secure order collection |
| **AI Recommendations** | Get personalized suggestions for clusters to join |

### 3.3 Ride-Sharing Clusters

| Feature | Description |
|---------|-------------|
| **Create Ride** | Set up a shared ride with start/end points and fare |
| **Join with Pickup** | Join rides and set custom pickup points |
| **Fare Splitting** | Automatic calculation of fare per person |
| **Vehicle Types** | Support for auto, cab, bike, and carpool |
| **Female-Only Rides** | Safety feature for female passengers |
| **Nearby Search** | Find rides near your location |

### 3.4 AI Recommendation Engine

The recommendation system uses Google Gemini AI combined with a multi-factor scoring algorithm:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI SCORING ALGORITHM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Distance Factor (Max 25 points)                               │
│   ├── Closer clusters = Higher score                            │
│   └── Beyond 20km = 0 points                                    │
│                                                                 │
│   Basket Progress (Max 20 points)                               │
│   ├── Near minimum basket = Higher score                        │
│   └── Encourages joining almost-ready clusters                  │
│                                                                 │
│   Member Count (Max 15 points)                                  │
│   ├── Optimal range gets highest score                          │
│   └── Balances social proof vs. availability                    │
│                                                                 │
│   Preference Matching (Bonus points)                            │
│   ├── Cuisine preferences                                       │
│   └── Dietary restrictions                                      │
│                                                                 │
│   TOTAL SCORE = Distance + Basket + Members + Preferences       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Real-time Communication

| Feature | Description |
|---------|-------------|
| **Socket.io Integration** | Live updates for cluster activities |
| **Join/Leave Notifications** | Instant notifications when members change |
| **Status Updates** | Real-time status change broadcasts |
| **Location Tracking** | Live location updates for rides |

### 3.6 Geospatial Features

| Feature | Description |
|---------|-------------|
| **Location Storage** | GeoJSON Point format with 2dsphere indexes |
| **Distance Calculation** | Haversine formula for accurate distances |
| **Nearby Search** | MongoDB geospatial queries for proximity |
| **Map Integration** | Google Maps and Leaflet on frontend |

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         CLIENT (Next.js)                             │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │   │
│   │  │ Auth Pages│  │ Dashboard │  │ Clusters  │  │  Maps (Google/   │ │   │
│   │  │           │  │           │  │  Pages    │  │     Leaflet)     │ │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │   │
│   │  ┌─────────────────────────────────────────────────────────────────┐│   │
│   │  │                    Zustand State Management                     ││   │
│   │  └─────────────────────────────────────────────────────────────────┘│   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│                               │ HTTP/WebSocket                              │
│                               ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       SERVER (Express.js)                            │   │
│   │  ┌──────────────────────────────────────────────────────────────┐   │   │
│   │  │                      API Layer                                │   │   │
│   │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │   │
│   │  │  │  Auth   │ │  Food   │ │  Ride   │ │ Orders  │ │ Vendors │ │   │   │
│   │  │  │ Routes  │ │Clusters │ │Clusters │ │ Routes  │ │ Routes  │ │   │   │
│   │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   │  ┌──────────────────────────────────────────────────────────────┐   │   │
│   │  │                    Service Layer                              │   │   │
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │   │   │
│   │  │  │     AI      │  │ Notification│  │     Socket.io       │   │   │   │
│   │  │  │Recommendation│ │   Service   │  │      Service        │   │   │   │
│   │  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   │  ┌──────────────────────────────────────────────────────────────┐   │   │
│   │  │                    Middleware Layer                           │   │   │
│   │  │    Authentication  │  Validation  │  Rate Limiting  │  CORS  │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         DATABASE (MongoDB)                           │   │
│   │  ┌─────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐          │   │
│   │  │  Users  │ │ FoodClusters │ │ RideClusters │ │ Orders  │ ...      │   │
│   │  │(2dsphere)│ │  (2dsphere)  │ │  (2dsphere)  │ │         │          │   │
│   │  └─────────┘ └──────────────┘ └──────────────┘ └─────────┘          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                      EXTERNAL SERVICES                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│   │   Twilio    │  │  Nodemailer │  │ Google Maps │  │  Google Gemini  │   │
│   │  (SMS OTP)  │  │ (Email OTP) │  │    API      │  │   (AI Engine)   │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **User** | Regular platform user | Create/join clusters, manage orders, view recommendations |
| **Admin** | Platform administrator | User management, analytics, system monitoring |
| **Vendor** | Restaurant/food service | Manage menu, view orders, update status |
| **Rider** | Delivery personnel | Accept deliveries, update delivery status |

---

## 6. Key Workflows

### 6.1 User Registration & Login

```
1. User visits /auth/register
2. Fills registration form (email, password, phone, name)
3. Password hashed with bcrypt (12 salt rounds)
4. User created in database with isVerified: false
5. Verification email sent with OTP
6. User verifies email with OTP
7. User can now login with email/password or OTP
```

### 6.2 Creating a Food Cluster

```
1. Authenticated user navigates to food clusters
2. Clicks "Create Cluster"
3. Enters:
   - Title
   - Restaurant name
   - Restaurant address
   - Minimum basket amount
   - Maximum members
   - Delivery location
   - Delivery time
   - Notes (optional)
4. System creates cluster with status: "open"
5. Creator automatically added as first member
6. Other users can discover via recommendations or search
```

### 6.3 Joining a Food Cluster

```
1. User browses available clusters or gets AI recommendations
2. Selects a cluster to view details
3. Clicks "Join Cluster"
4. Enters their order:
   - Order amount
   - Items (name, quantity, price, special instructions)
5. System adds user to members array
6. currentTotal updated
7. Real-time notification sent to existing members
```

### 6.4 Order Collection (OTP Verification)

```
1. Cluster reaches "collecting" status
2. Each member has unique collectionOtp generated
3. Collector (creator) meets each member
4. Member provides their OTP
5. Creator verifies via /verify-otp endpoint
6. Member marked as hasCollected: true
7. When all members collected → status: "completed"
```

### 6.5 Creating a Ride Cluster

```
1. Authenticated user navigates to ride clusters
2. Clicks "Create Ride"
3. Enters:
   - Title
   - Start point (coordinates + address)
   - End point (coordinates + address)
   - Seats required
   - Total fare
   - Departure time
   - Vehicle type
   - Female only (optional)
4. System calculates farePerPerson = totalFare / seatsRequired
5. Ride created with status: "open"
6. Creator added with their pickup point
```

---

## 7. Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **TailwindCSS** | Utility-first styling |
| **shadcn/ui** | Pre-built UI components |
| **Zustand** | State management |
| **Socket.io-client** | Real-time communication |
| **React Google Maps** | Map integration |
| **Leaflet** | Alternative map library |
| **Zod** | Schema validation |
| **Framer Motion** | Animations |
| **Recharts** | Data visualization |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type-safe development |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Socket.io** | Real-time communication |
| **Google Generative AI** | AI recommendations |
| **Twilio** | SMS OTP delivery |
| **Nodemailer** | Email OTP delivery |
| **express-validator** | Input validation |
| **express-rate-limit** | Rate limiting |

### Database

| Technology | Purpose |
|------------|---------|
| **MongoDB 6.0+** | Document database |
| **2dsphere indexes** | Geospatial queries |
| **Compound indexes** | Query optimization |

---

## 8. Project Structure

```
movenmeal/
├── client/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── dashboard/         # Protected routes
│   │   │   │   ├── food-clusters/ # Food cluster management
│   │   │   │   ├── ride-clusters/ # Ride cluster management
│   │   │   │   └── profile/       # User profile
│   │   │   └── page.tsx           # Home page
│   │   ├── components/            # Reusable components
│   │   ├── context/               # Zustand stores
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Utilities (API, Socket, utils)
│   │   ├── services/              # Business logic
│   │   └── types/                 # TypeScript types
│   └── package.json
│
├── server/                          # Express.js Backend
│   ├── src/
│   │   ├── config/                # Configuration
│   │   ├── controllers/           # Request handlers
│   │   ├── models/                # Mongoose schemas
│   │   ├── routes/                # API endpoints
│   │   ├── middleware/            # Express middleware
│   │   ├── services/              # Business logic
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── utils/                 # Helper functions
│   │   └── index.ts               # Entry point
│   └── package.json
│
├── shared/                          # Shared Code
│   └── types/                      # Common type definitions
│
└── docs/                            # Documentation
    ├── TEST_PLAN.md
    ├── TEST_CASES.md
    ├── PEER_TEST_REPORTS.md
    └── PROJECT_OVERVIEW.md
```

---

## 9. API Overview

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | Email/password login |
| POST | /api/auth/otp/send | Send OTP |
| POST | /api/auth/otp/verify | Verify OTP |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/location | Update location |

### Food Cluster Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/food-clusters | List all clusters |
| GET | /api/food-clusters/my | User's clusters |
| GET | /api/food-clusters/recommended | AI recommendations |
| POST | /api/food-clusters | Create cluster |
| GET | /api/food-clusters/:id | Get cluster details |
| POST | /api/food-clusters/:id/join | Join cluster |
| POST | /api/food-clusters/:id/leave | Leave cluster |
| PUT | /api/food-clusters/:id/order | Update order |
| PATCH | /api/food-clusters/:id/status | Update status |
| POST | /api/food-clusters/:id/verify-otp | Verify collection OTP |

### Ride Cluster Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ride-clusters | List all rides |
| GET | /api/ride-clusters/my | User's rides |
| GET | /api/ride-clusters/nearby | Nearby rides |
| POST | /api/ride-clusters | Create ride |
| GET | /api/ride-clusters/:id | Get ride details |
| POST | /api/ride-clusters/:id/join | Join ride |
| POST | /api/ride-clusters/:id/leave | Leave ride |
| PUT | /api/ride-clusters/:id/pickup | Update pickup |
| PATCH | /api/ride-clusters/:id/status | Update status |

---

## 10. Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Security** | bcrypt with 12 salt rounds |
| **Token Security** | JWT with configurable expiration |
| **OTP Security** | 6-digit codes, 10-minute expiration |
| **Rate Limiting** | 100 requests per 15 minutes |
| **Input Validation** | express-validator on all inputs |
| **CORS** | Configurable origin restriction |
| **Authorization** | Role-based access control |
| **Data Protection** | Passwords excluded from queries |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm 9+

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd movenmeal

# Backend setup
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev

# Frontend setup (new terminal)
cd client
npm install
npm run dev
```

### Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

---

*End of Project Overview Document*
