# GRAND OMR RESIDENCY — BACKEND & PMS ARCHITECTURE

> High-performance, production-grade hotel room booking API and Property Management System (PMS) for **GRAND OMR RESIDENCY**, 5 Rajiv Gandhi Salai, Sholinganallur, Navalur, Chennai, Tamil Nadu 600130.

Live Landing Page: [https://grandomrresidency.ai.studio/](https://grandomrresidency.ai.studio/)

---

## 1. Technology Stack

- **Runtime & Language**: Node.js (v20+ / v24) with strict TypeScript
- **Framework**: Express.js
- **Database & ODM**: MongoDB & Mongoose
- **Request & Schema Validation**: Zod
- **Authentication & Security**:
  - JWT (short-lived access tokens + refresh token rotation & revocation table)
  - Fine-grained server-side permission middleware
  - bcrypt password hashing
  - Helmet security headers, CORS allowlist, and express rate limiting
  - Data minimization (guest PII protection & ID masking)
- **API Documentation**: OpenAPI 3.0 / Swagger UI (`/api/docs`)
- **Testing**: Vitest & Supertest with `mongodb-memory-server`
- **Transactions & Concurrency**:
  - Multi-tier concurrency control using shared `RoomInventoryLock` documents
  - MongoDB replica set ACID transaction support with bounded retries
  - Process-level mutex serialization per physical room / category

---

## 2. Directory Structure

```
Hotel-Website/
├── docker-compose.yml           # Local dev multi-container setup with replica set
├── README.md                    # Root architecture & run documentation
└── server/
    ├── .env.example             # Environment template
    ├── .env                     # Local configuration
    ├── Dockerfile               # Multi-stage production container build
    ├── package.json             # NPM dependencies & scripts
    ├── tsconfig.json            # Strict TypeScript configuration
    ├── vitest.config.ts         # Vitest automated test configuration
    └── src/
        ├── app.ts               # Express application initialization & middleware stack
        ├── server.ts            # HTTP server & graceful shutdown lifecycle
        ├── config/
        │   ├── database.ts      # Mongoose connection & transaction retry helpers
        │   └── env.ts           # Zod-validated environment configuration
        ├── models/              # Mongoose data models
        │   ├── User.ts
        │   ├── RoomType.ts
        │   ├── Room.ts
        │   ├── RatePlan.ts
        │   ├── Guest.ts
        │   ├── Booking.ts
        │   ├── RoomHold.ts
        │   ├── RoomInventoryLock.ts
        │   ├── GuestRegistration.ts
        │   ├── StayRecord.ts
        │   ├── Payment.ts
        │   ├── Refund.ts
        │   ├── PartnerHotel.ts
        │   ├── AuditLog.ts
        │   ├── PropertySettings.ts
        │   ├── NotificationLog.ts
        │   └── IdempotencyRecord.ts
        ├── services/            # Authoritative business logic
        │   ├── auth.service.ts
        │   ├── availability.service.ts
        │   ├── pricing.service.ts
        │   ├── booking.service.ts
        │   ├── qr.service.ts
        │   ├── stay.service.ts
        │   ├── dashboard.service.ts
        │   ├── payment.service.ts
        │   └── notification.service.ts
        ├── controllers/         # Express request handlers
        ├── routes/              # Modular REST routes
        ├── middleware/          # Auth, Permissions, Validation, Idempotency, Error
        ├── validators/          # Zod request validation schemas
        ├── utils/               # Errors, Response formatters, Audit logger, Swagger
        ├── jobs/                # Database seed script
        ├── types/               # System enums, interfaces, permissions
        └── tests/               # Automated unit, integration & API test suites
```

---

## 3. Database Models & Schema Design

| Model | Purpose | Key Attributes & Indexes |
|---|---|---|
| `User` | Staff & admin authentication | Email (unique), mobile, bcrypt password hash, role (`SUPER_ADMIN`, `MANAGER`, `FRONT_DESK`), fine-grained permissions array, refresh token hash, active status |
| `RoomType` | Room category definition | Code (`deluxe-king`, `executive-suite`, `garden-cottage`), baseRate & defaultNightlyRate in integer paise, maxOccupancy, bedConfiguration, amenities, features, images |
| `Room` | Physical rooms | RoomNumber (unique), floor, maxGuests, operational status (`ACTIVE`, `MAINTENANCE`), housekeeping status (`CLEAN`, `DIRTY`, `INSPECTED`, `OUT_OF_SERVICE`), maintenanceInfo blocks |
| `RatePlan` | Server-side pricing rules | Currency (INR), defaultRate (paise), dateSpecificRates, weekday/weekend multipliers, seasonal rules, extra guest charges, promotional discount codes, GST tax configuration |
| `Guest` | Guest directory & PII minimization | Full name, phone, email, address, nationality, masked government ID (e.g. `****9012`), consent records |
| `Booking` | Reservation records | BookingReference (unique e.g. `GOR-YYYYMMDD-XXXX`), room reference, check-in/check-out dates (YYYY-MM-DD), nightly breakdown, immutable historical pricing snapshot in paise, reservationStatus (`CONFIRMED`, `CANCELLED`), stayStatus (`NOT_CHECKED_IN`, `CHECKED_IN`, `CHECKED_OUT`), QR token hash |
| `RoomHold` | 15-minute temporary holds | Room reference, hashed hold token, expiration timestamp, active status |
| `RoomInventoryLock` | Shared inventory serialization | Physical room reference (unique), atomic incrementing version number, concurrency write target |
| `GuestRegistration` | Pre-arrival digital registration | Booking reference, primary and additional guest details, vehicle number, arrival time, verification status (`PENDING`, `SUBMITTED`, `VERIFIED`, `REJECTED`) |
| `StayRecord` | Physical hotel stay tracking | Actual check-in/out timestamps, staff ID, additional charges (mini-bar, laundry, damage), final settled bill reference |
| `Payment` | Payment transactions | Provider (`DEVELOPMENT_ADAPTER`, `RAZORPAY`, `STRIPE`), order ID, transaction reference, amount (paise), verification timestamp, HMAC signature tracking |
| `Refund` | Financial refunds | Refund reference, payment reference, authorized staff user, amount (paise), reason |
| `PartnerHotel` | Channel manager & partner links | Hotel name, city, official URL, external booking link (HTTPS validated), approval status |
| `AuditLog` | Security & compliance audit trail | Actor, action, entity type, entity ID, before/after changes (passwords and card data redacted), correlation ID, IP address |
| `PropertySettings` | Hotel property configuration | Check-in/out times, timezone (`Asia/Kolkata`), hold duration, cancellation grace hours |
| `NotificationLog` | Outbound communication log | Email, SMS, WhatsApp delivery records |
| `IdempotencyRecord` | Duplicate prevention | Idempotency key (unique), request hash, cached response, TTL index |

---

## 4. Concurrency Control Strategy

Double bookings are prevented using a **two-tier reservation serialization architecture**:

1. **Shared Inventory-Control Document**: Each physical room has a dedicated `RoomInventoryLock` record.
2. **MongoDB Transaction Boundary**:
   - Inside a MongoDB replica-set transaction, the reservation writer performs an atomic update to the room's inventory lock (`$inc: { version: 1 }`).
   - The writer re-verifies that no confirmed overlapping bookings exist for the requested dates (`existing.checkIn < requested.checkOut && existing.checkOut > requested.checkIn`).
   - The writer re-verifies that no active, unexpired holds exist (`expirationTimestamp > new Date() && status == ACTIVE`).
   - The writer re-verifies that no maintenance blocks overlap the stay.
   - The writer calculates authoritative pricing server-side in integer paise.
   - The booking or hold is created, and the transaction commits.
3. **Process-Level Mutex (`RoomMutex`)**:
   - Prevents local event-loop race conditions during simultaneous request bursts on identical room inventory, ensuring deterministic queueing even in standalone development environments.
4. **Bounded Retries**:
   - In case of `TransientTransactionError` or `WriteConflict` under high database contention, transactions retry up to 3 times with exponential backoff before returning HTTP 409 `ROOM_UNAVAILABLE`.

---

## 5. API Endpoints Reference

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/docs` | Interactive Swagger UI API documentation |
| `POST` | `/api/auth/login` | Staff login with rate limiting |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `GET` | `/api/rooms/availability` | Check room availability & authoritative pricing |
| `GET` | `/api/rooms` | List public active rooms |
| `GET` | `/api/rooms/:id` | Get room details |
| `GET` | `/api/room-types` | List room types with photos and amenities |
| `POST` | `/api/holds` | Create temporary 15-minute room hold |
| `POST` | `/api/bookings` | Confirm guest reservation |
| `GET` | `/api/bookings/:reference` | Lookup reservation (requires matching email/mobile) |
| `POST` | `/api/bookings/:reference/cancel` | Cancel booking within property cancellation policy |
| `GET` | `/api/qr/:token/validate` | Validate digital check-in QR link |
| `POST` | `/api/guest-registrations` | Submit guest pre-arrival registration |
| `GET` | `/api/partners` | List approved partner hotel extensions |
| `POST` | `/api/payments/create` | Create payment order |
| `POST` | `/api/payments/webhook` | Process payment provider webhook with HMAC verification |

### Staff & Admin Endpoints (Require Bearer Token & Fine-Grained Permissions)

| Method | Endpoint | Required Permission | Description |
|---|---|---|---|
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated staff profile |
| `POST` | `/api/auth/logout` | Authenticated | Revoke refresh token and log out |
| `GET` | `/api/admin/staff` | `staff.manage` | List staff members |
| `POST` | `/api/admin/staff` | `staff.manage` | Create new staff user |
| `PATCH` | `/api/admin/staff/:id/permissions` | `permissions.manage` | Grant or revoke permissions (SUPER_ADMIN only) |
| `PATCH` | `/api/admin/staff/:id/status` | `staff.manage` | Activate or deactivate staff account |
| `GET` | `/api/admin/bookings` | `bookings.view` | Paginated booking list with filters |
| `POST` | `/api/admin/bookings` | `bookings.create` | Staff walk-in or phone reservation |
| `PATCH` | `/api/admin/bookings/:id` | `bookings.update` | Update reservation details |
| `POST` | `/api/admin/bookings/:id/cancel` | `bookings.cancel` | Administrative reservation cancellation override |
| `POST` | `/api/admin/bookings/:id/reissue-qr` | `bookings.update` | Reissue new QR registration link |
| `GET` | `/api/admin/registrations` | `qr_registrations.view` | List guest pre-arrival registrations |
| `POST` | `/api/admin/registrations/:id/approve`| `qr_registrations.approve`| Verify & approve guest government ID |
| `POST` | `/api/admin/registrations/:id/reject` | `qr_registrations.approve`| Reject registration with reason |
| `POST` | `/api/stays/:id/check-in` | `checkin.complete` | Check in guest & activate stay |
| `POST` | `/api/stays/:id/check-out` | `checkout.complete` | Settle extra charges, checkout, flag room DIRTY |
| `GET` | `/api/admin/stays` | `dashboard.view` | List active and completed hotel stays |
| `GET` | `/api/admin/rooms` | `rooms.view` | View all rooms, housekeeping, and maintenance |
| `POST` | `/api/admin/rooms` | `rooms.manage` | Add new physical room |
| `PATCH` | `/api/admin/rooms/:id` | `rooms.manage` | Update room status or housekeeping state |
| `POST` | `/api/admin/rooms/:id/maintenance` | `rooms.manage` | Schedule maintenance block (checks collisions) |
| `DELETE` | `/api/admin/rooms/:id/maintenance`| `rooms.manage` | Clear maintenance block |
| `POST` | `/api/admin/room-types` | `rooms.manage` | Create new room type |
| `PATCH` | `/api/admin/room-types/:id` | `rooms.manage` | Update room type catalog |
| `PATCH` | `/api/admin/rate-plans/:id` | `rates.manage` | Update rates, weekend rules, or discount codes |
| `GET` | `/api/admin/dashboard` | `dashboard.view` | Real-time occupancy, arrivals, and revenue metrics |
| `GET` | `/api/admin/reports/occupancy` | `reports.view` | Occupancy report across date ranges |
| `GET` | `/api/admin/reports/revenue` | `reports.view` | Verified paid revenue & transactions report |
| `GET` | `/api/admin/reports/check-ins` | `reports.view` | Today's arrivals and check-ins |
| `GET` | `/api/admin/reports/check-outs` | `reports.view` | Today's departures and check-outs |
| `GET` | `/api/admin/audit-logs` | `audit_logs.view` | System-wide immutable audit trail |
| `GET` | `/api/admin/payments` | `payments.view` | View all payment transactions |
| `POST` | `/api/admin/payments/:id/refund` | `payments.refund` | Issue payment refund with audit log |

---

## 6. Local Setup and Startup Instructions

### Prerequisites
- Node.js v20.x or v24.x
- npm v10+ or v11+
- MongoDB (or Docker)

### Installation

```bash
# 1. Navigate to the backend directory
cd server

# 2. Install dependencies
npm install

# 3. Create .env from template
cp .env.example .env
```

### Running with Docker Compose (Recommended for Replica Set)

MongoDB replica sets are required for MongoDB transactions. The provided `docker-compose.yml` initializes a single-node replica set (`rs0`) automatically:

```bash
# From the project root
docker compose up -d
```

### Database Seeding (Development)

Populate default administrative accounts, authentic Grand OMR Residency room categories (`deluxe-king`, `executive-suite`, `garden-cottage`), physical rooms 101–303, rate plans, and partner listings:

```bash
cd server
npm run seed
```

#### Default Staff Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@grandomrresidency.com` | `SuperAdmin@2026` |
| **Manager** | `manager@grandomrresidency.com` | `Manager@2026` |
| **Front Desk** | `frontdesk@grandomrresidency.com` | `FrontDesk@2026` |

### Running the Server

```bash
# Development mode with live reload
npm run dev

# Build TypeScript to dist/
npm run build

# Start production server
npm start
```

Once started:
- API Base: `http://localhost:5000/api`
- Interactive Swagger UI: `http://localhost:5000/api/docs`
- Health check: `http://localhost:5000/api/health`

---

## 7. Running Automated Tests

All tests execute against an isolated in-memory MongoDB environment using Vitest and Supertest:

```bash
cd server

# Run all automated tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Suites Included

1. `pricing.service.test.ts`: Date calculations, date-specific rates, weekend multiplier, seasonal rules, extra guest charges, discount codes, GST calculation, rounding.
2. `availability.service.test.ts`: Overlap rules, adjacent bookings (checkout exclusive), active holds, cancelled bookings, maintenance blocks, capacity filtering.
3. `auth.test.ts`: Password hashing, token generation, login rejection on deactivated accounts, refresh token rotation, revocation of used refresh tokens, fine-grained permission middleware, SuperAdmin bypass, Manager restrictions.
4. `booking.concurrency.test.ts`: **Simultaneous booking collision verification** (proves two concurrent attempts on the same room result in exactly 1 confirmation and 1 rejection), idempotent headers, immutable historical pricing snapshots, unauthorized guest lookup rejection.
5. `qr.stay.test.ts`: Cryptographic QR token validation, digital check-in submission, staff verification, check-in validation, duplicate check-in prevention, check-out with additional charges, automatic room housekeeping status transition to `DIRTY`.
6. `payment.partner.test.ts`: Payment order initiation, HMAC webhook signature verification, forged signature rejection, refunds with audit logging, HTTPS partner URL validation.

---

## 8. Production Deployment & Database Maintenance

### Environment Variables for Production

Ensure these are set securely in your hosting environment (AWS ECS, Render, Railway, DigitalOcean, or Kubernetes):

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/grand_omr_residency?retryWrites=true&w=majority
CLIENT_URL=https://grandomrresidency.ai.studio
JWT_ACCESS_SECRET=<64_character_cryptographically_secure_random_string>
JWT_REFRESH_SECRET=<64_character_cryptographically_secure_random_string>
QR_TOKEN_SECRET=<64_character_cryptographically_secure_random_string>
PAYMENT_PROVIDER=RAZORPAY
PAYMENT_WEBHOOK_SECRET=<provider_webhook_secret>
RAZORPAY_KEY_ID=<live_key_id>
RAZORPAY_KEY_SECRET=<live_key_secret>
```

### Database Backup & Recovery

#### Creating a Consistent Backup (`mongodump`)

```bash
# Using oplog to ensure point-in-time replica set consistency:
mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/grand_omr_residency" \
  --oplog \
  --gzip \
  --archive=backup-$(date +%Y%m%d_%H%M%S).gz
```

#### Restoring from Backup (`mongorestore`)

```bash
# Restore without dropping unaffected collections:
mongorestore --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/grand_omr_residency" \
  --oplogReplay \
  --gzip \
  --archive=backup-20261015_120000.gz
```

---

## 9. Security & Data Protection Checklist

- [x] Passwords hashed with bcrypt (salt rounds 10).
- [x] Passwords, refresh token hashes, and secret keys excluded by default from queries (`select: false`).
- [x] Guest government ID numbers masked (e.g., `****1234`) before database storage.
- [x] Public reservation lookups require verification of matching email or phone number.
- [x] Brute force login protection via express rate limiting.
- [x] Webhook signatures cryptographically validated via constant-time HMAC comparison (`crypto.timingSafeEqual`).
- [x] No payment card details (PAN or CVV) ever stored or handled by the server.
- [x] Audit logs record changes with passwords, tokens, and identity numbers automatically redacted.

---

## 10. Frontend Architecture & Setup (React + Redux Toolkit + RTK Query)

The frontend client is implemented in `client/` following a clean, modular, feature-based architecture with luxury branding:

### Technology Stack
- **Framework**: React 19 + Vite (bundler mode, 800ms cold builds)
- **Language**: TypeScript with strict mode
- **State Management**: Redux Toolkit (`@reduxjs/toolkit` + `react-redux`)
- **Data Fetching & Caching**: RTK Query with tag-based cache invalidation
- **Routing**: React Router (hierarchical Public & Admin route trees)
- **Styling**: Tailwind CSS with custom luxury palette (Forest Green `#0F3A2E`, Champagne Gold `#D4AF37`, Deep Obsidian `#0C0A09`)
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Icons**: Lucide React
- **Digital Passes**: `qrcode.react` (scannable SVG QR codes for contactless check-in)
- **Celebration Effects**: `canvas-confetti` (booking confirmation)
- **Testing**: Vitest + React Testing Library + `@testing-library/jest-dom` + `jsdom`

### Client Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── store.ts             # Redux store with RTK Query middleware
│   │   ├── hooks.ts             # Typed useAppDispatch & useAppSelector
│   │   ├── router.tsx           # Route tree (Public & Protected PMS)
│   │   ├── providers.tsx        # Redux Provider wrapper
│   │   ├── uiSlice.ts           # Mobile menu & sidebar UI state
│   │   └── App.tsx              # Root component
│   ├── components/
│   │   ├── common/              # Button, Input, Select, Modal, DatePicker, StatusBadge, PriceDisplay...
│   │   └── layout/              # Header, Footer, PublicLayout, Sidebar, AdminLayout
│   ├── features/
│   │   ├── auth/                # authSlice, authApi, LoginPage
│   │   ├── availability/        # bookingSearchSlice, availabilityApi, SearchWidget, AvailabilityResultsPage
│   │   ├── rooms/               # roomsApi, RoomCard, RoomsListPage
│   │   ├── bookings/            # checkoutSlice, bookingsApi, bookingValidation, CheckoutPage, BookingLookupPage
│   │   ├── qr-registration/     # registrationApi, QrRegistrationPage
│   │   ├── stays/               # staysApi, StaysManagementPage
│   │   ├── admin/               # dashboardApi, AdminDashboardPage, AdminBookingsPage, AdminRoomsPage, AdminStaffPage, AdminReportsPage
│   │   ├── partners/            # partnersApi, PartnersPage
│   │   └── home/                # HeroSection, FeaturedRooms, AmenitiesSection, LocationMapSection, ReviewsSection, HomePage
│   ├── services/api/
│   │   ├── baseApi.ts           # RTK Query fetchBaseQuery with JWT token injection
│   │   └── apiTags.ts           # Cache tags (Rooms, Bookings, Stays, Dashboard, Registrations...)
│   ├── types/                   # Shared TypeScript models and API envelopes
│   ├── utils/                   # formatters, dates, storage
│   └── test/                    # setup.ts and automated unit/integration test suites
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.app.json
└── vite.config.ts
```

### Running the Client

```bash
cd client
npm install

# Start development dev server (http://localhost:5173 with proxy to port 5000):
npm run dev

# Run Vitest automated test suite:
npm test

# Produce production build:
npm run build
```

### Seeded Staff Credentials for PMS Testing

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@grandomrresidency.com` | `SuperAdmin@2026` | Full system control, staff creation, financial reports, all permissions |
| **Hotel Manager** | `manager@grandomrresidency.com` | `Manager@2026` | Front desk supervision, room maintenance, rate plans, revenue reports |
| **Front Desk** | `frontdesk@grandomrresidency.com` | `FrontDesk@2026` | Check-in / check-out, QR pass verification, walk-in reservations, billing |

