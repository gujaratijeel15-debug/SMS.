# Service Management System (SMS) - System Diagrams

## 1) System Architecture Diagram

```mermaid
flowchart LR
  subgraph Client[Frontend Angular 18]
    V[Visitor]
    U[User]
    P[Provider]
    A[Admin]

    AR[Angular Routes<br/>app.routes.ts<br/>AUTH_ROUTES<br/>USER_ROUTES<br/>PROVIDER_ROUTES<br/>ADMIN_ROUTES]
    AG[Guards<br/>RoleGuard<br/>TokenReadyGuard<br/>browserReadyGuard]
    AI[HTTP Interceptor<br/>core/interceptors/auth.interceptor.ts<br/>Bearer JWT]
    FS[Angular Services<br/>AuthService<br/>UserService<br/>ProviderService<br/>AdminService<br/>PaymentService]

    V --> AR
    U --> AR
    P --> AR
    A --> AR
    AR --> AG
    AR --> FS
    FS --> AI
  end

  AI -->|HTTP /api/*| API

  subgraph Server[Backend Node.js Express]
    API[Express App<br/>server.js]
    R1[api/auth<br/>authRoutes.js]
    R2[api/users<br/>userRoutes.js]
    R3[api/bookings<br/>bookingRoutes.js]
    R4[api/services<br/>serviceRoutes.js]
    R5[api/admin<br/>adminRoutes.js]
    R6[api/contact<br/>contact.js]

    MW[Middleware<br/>authMiddleware.js<br/>verifyToken and requireRole]
  end

  API --> R1
  API --> R2
  API --> R3
  API --> R4
  API --> R5
  API --> R6

  R2 --> MW
  R3 --> MW
  R5 --> MW

  subgraph Data[MongoDB serviceDB]
    M1[(User)]
    M2[(Booking)]
    M3[(Service)]
    M4[(Contact)]
  end

  R1 --> M1
  R2 --> M1
  R3 --> M1
  R3 --> M2
  R3 --> M3
  R4 --> M3
  R5 --> M1
  R5 --> M2
  R5 --> M4
  R6 --> M4

  subgraph Integrations[External Integrations]
    SMTP[Nodemailer Gmail SMTP]
    RP[Razorpay API]
  end

  R1 --> SMTP
  R3 --> SMTP
  R5 --> SMTP
  R3 --> RP
```

## 2) Level 0 DFD

```mermaid
flowchart TB
  Visitor[Visitor]
  User[User]
  Provider[Provider]
  Admin[Admin]

  SMS[(SMS System)]

  Visitor -->|Browse public pages| SMS
  User -->|Register login book pay review| SMS
  Provider -->|Manage requests jobs payments| SMS
  Admin -->|Approve providers and manage support| SMS

  SMS -->|Data persistence| DB[(MongoDB serviceDB)]
  SMS -->|OTP receipt support emails| SMTP[Gmail SMTP via Nodemailer]
  SMS -->|Create and verify payments| Razorpay[Razorpay]
```

## 3) Level 1 DFD

```mermaid
flowchart LR
  Visitor[Visitor]
  User[User]
  Provider[Provider]
  Admin[Admin]

  P1[Authentication and Account Verification<br/>POST /api/auth/register<br/>POST /api/auth/verify-account<br/>POST /api/auth/login<br/>POST /api/auth/forgot-password<br/>POST /api/auth/verify-otp<br/>POST /api/auth/reset-password]

  P2[User and Provider Profile Management<br/>GET /api/users/profile<br/>PUT /api/users/profile<br/>GET /api/bookings/provider/availability<br/>PUT /api/bookings/provider/availability]

  P3[Booking Management<br/>GET /api/bookings/providers/by-service/:serviceName<br/>POST /api/bookings<br/>GET /api/bookings/my<br/>PUT /api/bookings/:id/accept<br/>PUT /api/bookings/:id/reject<br/>PUT /api/bookings/:id/complete<br/>PUT /api/bookings/:id/review]

  P4[Payment Management<br/>POST /api/bookings/:id/cash-payment<br/>POST /api/bookings/:id/create-order<br/>POST /api/bookings/:id/verify-payment<br/>PUT /api/bookings/:id/mark-paid]

  P5[Admin Operations<br/>GET /api/admin/stats<br/>GET /api/admin/users<br/>GET /api/admin/providers<br/>PUT /api/admin/providers/:id/approve<br/>PUT /api/admin/providers/:id/availability<br/>GET /api/admin/messages<br/>PUT /api/admin/messages/:id/status<br/>POST /api/admin/messages/:id/reply<br/>GET /api/admin/reviews]

  P6[Contact and Support<br/>POST /api/contact]

  D1[(User)]
  D2[(Booking)]
  D3[(Service)]
  D4[(Contact)]

  SMTP[Gmail SMTP]
  RP[Razorpay]

  Visitor --> P1
  Visitor --> P6

  User --> P1
  User --> P2
  User --> P3
  User --> P4

  Provider --> P1
  Provider --> P2
  Provider --> P3
  Provider --> P4

  Admin --> P5

  P1 --> D1
  P1 --> SMTP

  P2 --> D1

  P3 --> D1
  P3 --> D2
  P3 --> D3
  P3 --> SMTP

  P4 --> D2
  P4 --> RP
  P4 --> SMTP

  P5 --> D1
  P5 --> D2
  P5 --> D4
  P5 --> SMTP

  P6 --> D4
```

## 4) Booking Flow Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant U as User Angular
  participant B as Backend api/bookings
  participant UM as User Model
  participant BM as Booking Model
  participant RP as Razorpay
  participant SMTP as Nodemailer SMTP
  participant P as Provider Angular

  U->>B: GET /api/bookings/providers/by-service/:serviceName
  B->>UM: Find user city and matching providers
  B-->>U: providers list or not available message

  U->>B: POST /api/bookings with serviceName price providerId
  B->>UM: Validate user and provider constraints
  B->>BM: Create booking status pending paymentStatus unpaid
  B-->>U: 201 booking created

  P->>B: GET /api/bookings/provider/pending
  B->>BM: Fetch pending by providerId
  B-->>P: Pending requests

  alt Accept
    P->>B: PUT /api/bookings/:id/accept
    B->>BM: Update status accepted
    B-->>P: Booking accepted
  else Reject
    P->>B: PUT /api/bookings/:id/reject with reason
    B->>BM: Update status rejected
    B-->>P: Booking rejected
  end

  alt Online payment
    U->>B: POST /api/bookings/:id/create-order
    B->>RP: Create order
    RP-->>B: order id and amount
    B-->>U: order data with key
    U->>RP: Open checkout
    RP-->>U: payment id order id signature
    U->>B: POST /api/bookings/:id/verify-payment
    B->>B: Verify HMAC signature
    B->>BM: Set paymentMethod online and paymentStatus paid
    B->>SMTP: Send receipt email
    B-->>U: Payment successful
  else Cash payment
    U->>B: POST /api/bookings/:id/cash-payment
    B->>BM: Set paymentMethod cash paymentStatus unpaid
    B-->>U: Cash payment selected

    P->>B: PUT /api/bookings/:id/mark-paid
    B->>BM: Set paymentStatus paid and paidAt
    B->>SMTP: Send receipt email
    B-->>P: Payment marked as received
  end

  P->>B: PUT /api/bookings/:id/complete
  B->>BM: Validate payment method selected and status paid
  B->>BM: Set status completed
  B-->>P: Job completed

  U->>B: PUT /api/bookings/:id/review with rating response
  B->>BM: Save review for completed booking
  alt Low rating 1 or 2
    B->>SMTP: Send warning email to provider
  end
  B-->>U: Review submitted
```

## 5) Authentication Flow Diagram

```mermaid
flowchart TD
  A[Visitor User Provider] --> B[Angular Auth Pages]
  B --> C[AuthService frontend]

  C --> D1[POST /api/auth/register]
  D1 --> E1[Create user with bcrypt password and verify OTP]
  E1 --> UDB[(User Collection)]
  E1 --> N1[Send verify OTP email]

  C --> D2[POST /api/auth/verify-account]
  D2 --> E2[Validate OTP and expiry then set isVerified true]
  E2 --> UDB
  E2 --> N2[Send welcome email]

  C --> D3[POST /api/auth/login]
  D3 --> E3[Validate email verified state and password]
  E3 --> T[Sign JWT with id and role expires in 1 day]
  T --> R[Return token name email role avatar providerService]
  R --> LS[Store token role user in localStorage]

  LS --> I[Angular HTTP interceptor]
  I --> H[Attach Authorization Bearer token]
  H --> PAPI[Protected APIs]
  PAPI --> VT[verifyToken middleware]
  VT --> RR[requireRole middleware]

  C --> D4[POST /api/auth/forgot-password]
  D4 --> E4[Generate reset OTP and expiry]
  E4 --> UDB
  E4 --> N3[Send reset OTP email]

  C --> D5[POST /api/auth/verify-otp]
  D5 --> E5[Validate reset OTP and expiry]

  C --> D6[POST /api/auth/reset-password]
  D6 --> E6[Hash new password clear reset OTP]
  E6 --> UDB
```

## 6) Database ER Diagram

```mermaid
erDiagram
  USER {
    ObjectId _id PK
    string name
    string email
    string password
    string role
    string status
    string address
    boolean isAvailable
    string providerService
    string avatar
    string cover
    string about
    string phone
    string city
    string resetOTP
    date resetOTPExpiry
    boolean isVerified
    string verifyOTP
    date verifyOTPExpiry
    date createdAt
    date updatedAt
  }

  SERVICE {
    ObjectId _id PK
    string name
    string description
    number price
    string status
    date createdAt
    date updatedAt
  }

  BOOKING {
    ObjectId _id PK
    ObjectId userId FK
    ObjectId providerId FK
    ObjectId serviceId FK
    string serviceName
    number price
    date date
    string address
    string status
    string paymentMethod
    string paymentStatus
    string paymentId
    date paidAt
    string rejectionReason
    number review_rating
    string review_response
    date review_createdAt
    date createdAt
    date updatedAt
  }

  CONTACT {
    ObjectId _id PK
    string name
    string email
    string message
    string status
    string adminReply
    date repliedAt
    date createdAt
  }

  USER ||--o{ BOOKING : creates
  USER ||--o{ BOOKING : assigned
  SERVICE ||--o{ BOOKING : referenced
```
