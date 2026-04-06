# Vinzons DigiPath - Document Management System

A full-stack document management and tracking application built with React, FastAPI, and MongoDB.

## Features
- User authentication and authorization
- Document uploads and tracking
- Office and transmission management
- Document archiving
- Real-time notifications
- JWT-based security

## Tech Stack
- **Frontend**: React 19 + Vite
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Deployment**: Vercel (Frontend), Render/Railway (Backend)

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Environment Variables

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend-api.com
```

### Backend (.env)
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=vinzons_digipath
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=480
```

Access the app at `http://localhost:5173`
