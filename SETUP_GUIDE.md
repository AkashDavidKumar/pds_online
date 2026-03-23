# 📖 Beginner Setup Guide — TNPDS System

> This guide will help you set up and run the full TNPDS project on your computer, even if you've never done this before. Follow every step carefully.

---

## 🧑‍💻 Step 1: Install Required Software

You need to install **two programs** before anything else.

---

### 1A. Install Node.js

Node.js lets you run JavaScript on your computer (outside a browser).

1. Go to → **https://nodejs.org/**
2. Click the big green **"LTS"** button (Recommended for most users)
3. Download and run the installer
4. Click **Next → Next → Install** (keep all defaults)
5. When done, open a terminal and check:

```bash
node --version
```

You should see something like `v20.11.0`. ✅

---

### 1B. Install MongoDB Community Edition

MongoDB is the database where all data is stored.

1. Go to → **https://www.mongodb.com/try/download/community**
2. Select: **Version: Latest**, **Platform: Windows**, **Package: MSI**
3. Download and install it
4. During install, check **"Install MongoDB as a Service"** ✅
5. After install, MongoDB will start automatically in the background

> 💡 To check MongoDB is running: open Task Manager → look for `mongod.exe` in the background processes.

---

### 1C. Install Git (Optional but recommended)

Git lets you clone (download) the project.

1. Go to → **https://git-scm.com/downloads**
2. Download and install (keep all defaults)
3. Check:

```bash
git --version
```

---

## 🖥️ Step 2: Open the Terminal

The terminal is where you type commands.

### On Windows:
- Press **`Win + R`**, type `cmd`, press Enter
- **OR** open **VS Code** and press `` Ctrl + ` `` (backtick) to open the built-in terminal

### On Mac:
- Press **`Cmd + Space`**, type `Terminal`, press Enter

---

## 📂 Step 3: Clone (Download) the Project

In the terminal, type these commands one by one:

```bash
git clone https://github.com/your-username/pds_online.git
cd pds_online
```

> ⚠️ Replace `your-username` with the actual GitHub username where the project is hosted.

**If you don't have git**, download the project as a ZIP from GitHub and extract it. Then navigate to the folder in your terminal:

```bash
cd path\to\pds_online
```

---

## 📦 Step 4: Install All Dependencies

This downloads all required libraries for both frontend and backend.

```bash
npm run install:all
```

This single command installs packages for:
- The root project (concurrently)
- `pds-backend` (Express, Mongoose, Nodemailer, etc.)
- `pds-web-frontend` (React, Vite, etc.)

> ⏳ This may take 2–5 minutes. Wait until it finishes.

---

## ⚙️ Step 5: Configure Environment Variables

The backend needs a `.env` file with your secret settings.

1. Navigate to the backend folder and create a new file called `.env`:

```bash
cd pds-backend
```

2. Create the file and add these lines (edit the values):

```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/pds_online
JWT_SECRET=any_long_random_string_you_make_up
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### How to get `EMAIL_PASS` (Gmail App Password):
1. Go to → https://myaccount.google.com/security
2. Make sure **2-Step Verification** is ON
3. Go to → https://myaccount.google.com/apppasswords
4. Create a new app password (call it "PDS Project")
5. Copy the 16-character password and paste it as `EMAIL_PASS`

> 💡 `EMAIL_PASS` is NOT your Gmail login password. It's a special app password.

---

## 🌱 Step 6: Seed (Fill) the Database

This creates sample users, a shop, and today's appointment slots in MongoDB.

Go back to the root folder first:

```bash
cd ..
```

Then run:

```bash
npm run seed
```

You should see output like:

```
✅ Connected to MongoDB
🗑️  All Old Collections Dropped
📦  Products Created
🏪  Shop & Dealer Linked
✅  Beneficiaries Created (all with emails)
📅  Today's Appointment Slots Seeded
🌟 🌟 🌟  SEEDING COMPLETE  🌟 🌟 🌟
```

---

## ▶️ Step 7: Start the Project

Run **both** frontend and backend with ONE command:

```bash
npm run dev
```

You'll see coloured output — **blue** for backend, **green** for frontend.

Wait until you see:

```
[FRONTEND] Local: http://localhost:5173/
[BACKEND]  Server running on port 5002
```

---

## 🌐 Step 8: Open the App in Your Browser

| What | URL |
|---|---|
| 🖥️ **Main App (Frontend)** | http://localhost:5173 |
| ⚙️ **API Server (Backend)** | http://localhost:5002 |

Open your browser and go to → **http://localhost:5173**

---

## 🧪 Step 9: Test Login

Use these ready-made accounts:

### 🏪 Dealer Login (to distribute rations):
| Field | Value |
|---|---|
| Ration Card | `DEALER402` |
| Password | `password123` |

### 👤 Beneficiary Logins (to see user dashboard):
| Name | Ration Card | Password |
|---|---|---|
| Suresh (PHH) | `3301010001` | `password123` |
| Mani (AAY) | `3301010002` | `password123` |
| Anitha (NPHH) | `3301010003` | `password123` |

---

## 🔥 Step 10: Test the OTP Flow

1. Log in as the **Dealer** (`DEALER402`)
2. Go to **Verify** page
3. Click on any beneficiary (e.g. Anitha)
4. Click **Secure OTP → Send OTP**
5. Check `anitha@test.com`'s inbox for the OTP
6. Enter the 6-digit code → Click **Authorize**
7. You'll be redirected to the Distribution page

---

## ❌ Common Problems & Fixes

| Problem | Fix |
|---|---|
| `EADDRINUSE: port 5002` | Backend already running. Close it or restart your terminal. |
| `MongoNetworkError` | MongoDB is not running. Start it from Services or restart your PC. |
| OTP email not received | Check `EMAIL_USER` and `EMAIL_PASS` in `.env`. Make sure Gmail App Password is used. |
| `npm: command not found` | Node.js not installed or not added to PATH. Reinstall Node.js. |
| Blank white page | Frontend failed to start. Check terminal for errors. |

---

## 📁 Project Folder Overview

```
pds_online/
├── package.json          ← Root: one command to run everything
├── README.md             ← Project documentation
├── SETUP_GUIDE.md        ← This file!
├── pds-backend/          ← Node.js API server (port 5002)
│   ├── .env              ← Your secret config (never share this!)
│   ├── seed.js           ← Creates sample data
│   └── server.js         ← Backend starts here
└── pds-web-frontend/     ← React app (port 5173)
    └── src/pages/        ← All the pages you see
```

---

## 🆘 Need More Help?

- **Node.js docs**: https://nodejs.org/en/docs
- **MongoDB docs**: https://www.mongodb.com/docs/
- **Nodemailer docs**: https://nodemailer.com/
- Open an Issue on GitHub if you get stuck!

---

*Made with ❤️ by Akash David Kumar — TNPDS Digital System 2026*
