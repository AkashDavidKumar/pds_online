# PDS Backend Updates - Tamil Nadu Logic Implementation

## Summary
The backend has been completely overhauled to simulate the **Tamil Nadu Public Distribution System (PDS)**. It now features ration card-centric entitlement calculations, monthly quota tracking, strict transaction safety, and support for a mobile app with biometric authentication placeholders.

## 1. New Database Models
- **User**: Enhanced with `role`, `biometricEnabled`, `rationCardId`.
- **RationCard**: Stores family details and card type (PHH, AAY, NPHH).
- **EntitlementRule**: Defines quota rules per card type (e.g., PHH = 5kg Rice/person).
- **MonthlyQuota**: Tracks `eligible`, `taken`, and `balance` for the current month.
- **Transaction**: Records distribution with atomic safety and PDF receipt support.
- **Shop & ShopInventory**: Manages FPS stock separately from product definitions.
- **Dealer**: Manages shop operations.
- **Product**: Normalized product list (Rice, Sugar, Oil, etc.).
- **Complaint**: User grievance redressal.

## 2. Key Features Implemented
- **Dynamic Entitlement**: Auto-calculates quota based on family size and card type.
- **Monthly Reset**: Auto-creates a new quota record for the current month upon first access.
- **Atomic Transactions**: Ration distribution is ACID-compliant; inventory and quota update together.
- **PDF Receipts**: dedicated endpoint to download transaction receipts.
- **Role-Based Auth**: Distinct access for Beneficiaries, Dealers, and Admins.

## 3. New API Endpoints

### Authentication
- `POST /api/auth/login` - Login with Ration Card Number & Password.

### User / Beneficiary
- `GET /api/rationcard/me` - View Ration Card & Family details.
- `GET /api/quota/me` - View current month's entitlement, usage, and balance.
- `GET /api/shop/my-stock` - Check stock at assigned Fair Price Shop.
- `GET /api/transactions/me` - View transaction history.
- `GET /api/transactions/:id/receipt` - Download transaction receipt (PDF).
- `POST /api/complaints` - File a complaint.

### Dealer / Transaction
- `POST /api/transactions/distribute` - Issue rations (updates stock & quota).

## 4. Setup & Usage

### Prerequisites
- MongoDB must be running (Local or Atlas).
- Create a `.env` file with `MONGO_URI` and `JWT_SECRET`.

### Installation
```bash
npm install
```

### Seeding Data (CRITICAL FIRST STEP)
Populates the database with functionality Tamil Nadu PDS rules and dummy users.
```bash
node seeder.js
```

### Running the Server
```bash
npm run dev
```

### Test Credentials (from Seeder)
- **Dealer**: `dealer001` / `password123`
- **PHH User**: `PHH1234567890` / `password123`
- **AAY User**: `AAY0987654321` / `password123`
