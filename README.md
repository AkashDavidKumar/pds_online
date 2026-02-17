# PDS Backend

Backend for the Digital Public Distribution System (PDS).

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

## Setup Instructions

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the root directory and add your variables:
    ```
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    ```

3.  **Run Sever**
    - Development (with nodemon):
      ```bash
      npm run dev
      ```
    - Production:
      ```bash
      npm start
      ```

## API Endpoints & Testing (Postman)

### 1. Register User
**POST** `http://localhost:5000/api/users/register`

Body (JSON):
```json
{
  "rationCardNumber": "RCN123456789",
  "headOfFamily": "John Doe",
  "mobileNumber": "9876543210",
  "password": "password123"
}
```

### 2. Login User
**POST** `http://localhost:5000/api/users/login`

Body (JSON):
```json
{
  "rationCardNumber": "RCN123456789",
  "password": "password123"
}
```
*Response contains `token`. Use this token in the Authorization header for protected routes.*

### 3. Get User Profile (Protected)
**GET** `http://localhost:5000/api/users/profile`

Headers:
- `Authorization`: `Bearer <your_token_here>`

### 4. Enable Fingerprint (Protected)
**PUT** `http://localhost:5000/api/users/fingerprint`

Headers:
- `Authorization`: `Bearer <your_token_here>`

### 5. Update Monthly Quota (Protected)
**PUT** `http://localhost:5000/api/users/quota`

Headers:
- `Authorization`: `Bearer <your_token_here>`

Body (JSON):
```json
{
  "rice": 10,
  "wheat": 5,
  "sugar": 2
}
```

### 6. Add Family Member (Protected)
**POST** `http://localhost:5000/api/users/family`

Headers:
- `Authorization`: `Bearer <your_token_here>`

Body (JSON):
```json
{
  "name": "Jane Doe",
  "age": 30,
  "relation": "Wife"
}
```

### 7. Get Transaction History (Protected)
**GET** `http://localhost:5000/api/users/transactions`

Headers:
- `Authorization`: `Bearer <your_token_here>`
