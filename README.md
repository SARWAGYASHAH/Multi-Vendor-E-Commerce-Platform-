# Multi-Vendor E-Commerce Platform

A full-stack multi-vendor e-commerce platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Tech Stack

- **Frontend**: React.js, Redux Toolkit, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (Access + Refresh Tokens)
- **Realtime**: Socket.io
- **Payments**: Stripe API
- **Storage**: Cloudinary (image uploads)
- **Email**: Nodemailer

## Project Structure

```
root/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── admin/
│       │   ├── seller/
│       │   └── buyer/
│       ├── redux/
│       │   └── slices/
│       ├── hooks/
│       ├── utils/
│       └── App.jsx
│
└── server/          # Express backend
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── sockets/
    └── utils/
```

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- Stripe account

### Installation

1. Clone the repository
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```
3. Install client dependencies:
   ```bash
   cd client
   npm install
   ```
4. Set up environment variables (see `server/.env.example`)
5. Run the development servers:
   ```bash
   # Server
   cd server && npm run dev

   # Client
   cd client && npm run dev
   ```