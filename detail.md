# PDS Project - User Module Detailed Documentation

## 📌 Project Overview
The **Public Distribution System (PDS) Digital Portal** is a full-stack MERN application replicating the Tamil Nadu Digital Ration Card system. It allows cardholders (Beneficiaries) to check their monthly entitlements, view family details, book visit slots at their assigned FPS (Fair Price Shop), and download collection receipts.

---

## 🏗️ System Architecture

### 1. Frontend Architecture (`pds-web-frontend`)
- **Framework**: React.js with TypeScript & Vite
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **State Management**: React Context API (`AuthContext`)
- **Routing**: React Router DOM (v6) with Protected Route wrappers
- **Visuals**: Modern Glassmorphism UI with government-style aesthetics (official blue/white theme, blur overlays).

### 2. Backend Architecture (`pds-backend`)
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: JWT (JSON Web Tokens) for stateless authentication
- **Mailing**: Nodemailer (Gmail SMTP) for support inquiry notifications.

---

## 👤 User Module Features (Complete)

### 1. Unified Authentication System
- **Login Mechanism**: Authentication via `Ration Card Number` and `Mobile Number` (instead of traditional email/username).
- **JWT Handling**: Successfully generated tokens stored in `localStorage` and attached to axios headers via `api.ts` interceptors.
- **Roles**: System supports `beneficiary`, `dealer`, and `admin` roles, currently focused on the `beneficiary` journey.

### 2. Intelligent Dashboard
- **TN Entitlement Engine**: Quotas are calculated dynamically based on card category:
  - **PHH**: 20kg Rice, 5kg Wheat, 1kg Sugar, 1kg Dal.
  - **AAY**: 35kg Rice, 0kg Wheat, 1kg Sugar, 1kg Dal.
  - **NPHH**: 0kg Rice/Wheat, 1kg Sugar, 1kg Dal.
- **Consumption Tracking**: Fetches monthly transactions to deduct "used" amounts from "total" entitlements.
- **Glass-Cards**: Interactive UI showing remaining balance with micro-animations.

### 3. Family Module
- **Storage**: Member details (Name, Relation, Age) stored in a linked `FamilyMember` collection or embedded in `RationCard`.
- **API**: `/api/family` fetches all members associated with the logged-in user's card.
- **Relation Mapping**: Correctly maps relations (Self/Head, Spouse, Child) to the UI.

### 4. Smart Slot Booking
- **Flow**: User selects a Date and Time Slot (e.g., 09:00 AM - 10:00 AM).
- **Logic**: Prevents multiple active bookings for the same month.
- **Validation**: Stores slots with a `booked` status.
- **UI**: Dedicated page with a clear appointment confirmation card.

### 5. Transaction History
- **Data Source**: Fetches from the `Transaction` collection.
- **Details**: Shows transaction number, date, items collected, and shop ID.
- **Architecture**: Separates "History" (`/history`) and "Transactions" (`/transactions`) for future detailed views.

### 6. Official Receipt System
- **PDF Generation**: Powered by `pdfkit` (backend).
- **QR Code**: Embedded QR code containing encrypted booking meta-data for shop-side verification.
- **Custom Header**: Professional "Government of Tamil Nadu" header with official watermark style.
- **Download**: Triggered via `/api/receipt/:slotId` with proper content-disposition headers.

### 7. Support & Contact System
- **Full-Stack Loop**: Frontend Form -> API -> MongoDB Storage -> Admin Email Notification.
- **Nodemailer**: Uses a centralized `mailer.js` config with error handling for mismatched credentials.
- **Persistence**: Messages are saved with an `unread` status for future Admin use.

---

## 🛠️ API Endpoint Manifest

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Public | Token generation via Ration Card No |
| **GET** | `/api/quota` | Private | Dynamic entitlement calculation |
| **GET** | `/api/family` | Private | List all family members |
| **POST** | `/api/slots/book`| Private | Save a shop visit appointment |
| **GET** | `/api/slots/me` | Private | View all past/current bookings |
| **GET** | `/api/receipt/:id`| Private | Generate secure PDF receipt |
| **POST** | `/api/contact` | Public | Submit support ticket/email |
| **GET** | `/api/transactions`| Private | Monthly distribution history |

---

## 🗄️ Database Schema Summary

### User Model
- `rationCardNumber`: Primary identifier
- `mobileNumber`: Auth second factor
- `cardType`: (PHH / AAY / NPHH) determines rules
- `role`: Auth scope control

### Transaction Model
- `transactionNumber`: Unique audit ID
- `items`: Array of products (Rice/Wheat/Dal/Sugar) with quantities
- `date`: For monthly filtering

### Slot Model
- `userId`: Reference to beneficiary
- `date`: Visit date
- `timeSlot`: 1-hour windows
- `status`: (booked / completed / cancelled)

---

## 🚧 Limitations & Constraints
- **Simulation**: Shop IDs are currently linked to a sample "Anna Nagar FPS".
- **Biometrics**: `biometricEnabled` flag exists in User schema but is not yet triggered by hardware.
- **Security**: Password hashing exists, but "ForgotPassword" flow is yet to be implemented.

---

# 🚉 Ready for Phase 2: Dealer Module

The Dealer Module will build upon the foundation of the User Module to create a closed-loop system.

### Dealer Module Requirements
1. **Receipt Verification**: 
   - A tool to scan/read the QR codes generated for users.
   - Endpoint: `POST /api/dealer/verify-slot`.
2. **Issue Commodities**:
   - interface to log a new transaction after verifying biometrics (simulated).
   - Backend logic to subtract quantity from the shop's local inventory.
3. **Inventory Management**:
   - Dealer should see "Stock Received" vs "Stock Issued".
   - Alert system for low stock (e.g., Rice < 500kg).
4. **Member Verification**:
   - Ability to fetch a user's `FamilyList` for identity verification at the shop.

### Required APIs for Dealer
- `GET /api/dealer/inventory`: Get current shop stock.
- `GET /api/dealer/slots/today`: List of users expected today.
- `POST /api/dealer/transactions`: Log a successful ration distribution.
- `PUT /api/dealer/inventory/update`: Manual stock correction.

---
**Document Status**: Finalized
**Architect**: Akash David Kumar (Senior MERN Developer)
