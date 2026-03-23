# 🌾 TNPDS — Tamil Nadu Digital Public Distribution System

<p align="center">
  <img src="pds-web-frontend/public/favicon.png" alt="TNPDS Logo" width="80" />
</p>

<p align="center">
  A full-stack simulation of Tamil Nadu's Public Distribution System (PDS) — digitizing ration management, OTP-based verification, and commodity distribution for beneficiaries and FPS dealers.
</p>

---

## 📌 What Is This?

The **Public Distribution System (PDS)** is a government welfare scheme that distributes essential commodities (Rice, Wheat, Sugar, Dal) to eligible households through Fair Price Shops (FPS).

This project **digitizes** the entire workflow:

- Beneficiaries can view their monthly entitlements and book slots
- Dealers can verify beneficiaries via Email OTP or Biometric and distribute commodities
- The system tracks inventory, quotas, and transactions in real time

---

## ✨ Features

### 👤 Beneficiary (User) Side
| Feature | Description |
|---|---|
| 📋 Dashboard | View monthly quota, usage, and remaining balance |
| 📅 Slot Booking | Book a time slot at the assigned FPS shop |
| 🔐 OTP Verification | Email-based 6-digit OTP during collection |
| 👨‍👩‍👧 Family Management | Add / edit / remove dependents |
| 📦 Transaction History | View past distributions with receipts |
| 📬 Messages | Send support messages to the dealer |

### 🏪 Dealer Side
| Feature | Description |
|---|---|
| ✅ Identity Verification | Verify users via Email OTP or Biometric scan |
| 📦 Commodity Distribution | Enter quantities and confirm delivery |
| 📊 Dashboard | Live stats — today's completions, pending, inventory |
| 🗂️ Beneficiary Directory | Add, edit, and manage all beneficiaries |
| 📉 Inventory Tracking | Monitor stock levels with low-stock alerts |
| 💬 Community Support | View and reply to beneficiary messages |
| 📧 Email Receipts | Auto-send distribution receipts after delivery |

### ⚙️ System
- Dynamic quota per card type (PHH, AAY, NPHH)
- Monthly automatic quota reset
- OTP with 5-minute TTL and 3-attempt lockout
- JWT-secured APIs
- Real-time inventory deduction

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + TypeScript + Vite |
| Styling | Vanilla CSS + Tailwind (utility classes) |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| Email | Nodemailer (Gmail SMTP) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Dev Tools | Nodemon + Concurrently |

---

## 📁 Folder Structure

```
pds_online/
├── package.json              ← Root: run BOTH apps with one command
│
├── pds-backend/              ← Express.js API Server
│   ├── server.js             ← App entry point
│   ├── seed.js               ← Database seed script
│   ├── .env                  ← Environment variables (not committed)
│   ├── config/
│   │   ├── db.js             ← MongoDB connection
│   │   └── mailer.js         ← Nodemailer transporter
│   ├── models/               ← Mongoose schemas
│   │   ├── User.js
│   │   ├── OTP.js
│   │   ├── Transaction.js
│   │   ├── Inventory.js
│   │   ├── Slot.js
│   │   └── ...
│   ├── controllers/          ← Business logic
│   │   ├── dealerController.js
│   │   ├── user.controller.js
│   │   └── ...
│   ├── routes/               ← API route definitions
│   ├── middleware/           ← Auth, error handling
│   └── utils/                ← OTP, email, quota helpers
│
└── pds-web-frontend/         ← React + Vite Frontend
    ├── index.html
    ├── src/
    │   ├── pages/            ← All page components
    │   ├── components/       ← Navbar, shared UI
    │   └── services/
    │       └── api.ts        ← Axios base config
    └── public/
        └── favicon.png
```

---

## ⚙️ Environment Variables

Create `pds-backend/.env` with the following:

```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/pds_online
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> 💡 `EMAIL_PASS` is a **Gmail App Password** — not your regular password.
> Get one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB Community](https://www.mongodb.com/try/download/community) (running locally)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/your-username/pds_online.git
cd pds_online
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Configure environment
```bash
# Copy and fill in your values
cp pds-backend/.env.example pds-backend/.env
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Start the full stack (one command!)
```bash
npm run dev
```

| Service | URL |
|---|---|
| 🖥️ Frontend | http://localhost:5173 |
| ⚙️ Backend API | http://localhost:5002 |

---

## 🔑 Demo Credentials

| Role | Ration Card | Password | Email |
|---|---|---|---|
| 🏪 Dealer | `DEALER402` | `password123` | `dealer402@pds.local` |
| 👤 Suresh (PHH) | `3301010001` | `password123` | `suresh@test.com` |
| 👤 Mani (AAY) | `3301010002` | `password123` | `mani@test.com` |
| 👤 Anitha (NPHH) | `3301010003` | `password123` | `anitha@test.com` |

---

## 🔗 API Overview

| Route | Method | Description |
|---|---|---|
| `/api/users/login` | POST | Login user / dealer |
| `/api/users/:id` | PUT | Update user profile |
| `/api/dealer/queue/today` | GET | Get today's slots |
| `/api/dealer/send-otp` | POST | Send OTP to beneficiary |
| `/api/dealer/verify-otp` | POST | Verify OTP |
| `/api/dealer/distribute` | POST | Confirm distribution |
| `/api/dealer/users` | GET | Get all beneficiaries |
| `/api/contact` | POST | Submit support message |
| `/api/contact/dealer` | GET | Get dealer's messages |

---

## 📸 Screenshots

| Page | Preview |
|---|---|
| Login | *(coming soon)* |
| Dealer Dashboard | *(coming soon)* |
| Verification | *(coming soon)* |
| Distribution | *(coming soon)* |

---

## 🔮 Future Improvements

- [ ] SMS OTP via Twilio
- [ ] PDF receipt download
- [ ] Admin super-panel
- [ ] Analytics & reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Aadhaar-based biometric integration
- [ ] Multi-language support (Tamil / English)

---

## 📄 License

ISC © 2026 Akash David Kumar
