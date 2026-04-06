# Flight Booking App Migration (React + Vite)

This project has been migrated from a Flask templates app to a modern React + Vite Single Page Application (SPA).

## Structure
- **backend/**: The Flask application (`app.py`, `users.db`).
- **frontend/**: The new React application.

## Prerequisites
- Node.js installed.
- Python installed.

## Setup Instructions

### 1. Backend
The backend has been refactored to serve a JSON API and supports CORS.
```bash
# Install dependencies (if not already installed)
pip install flask python-dotenv google-generativeai flask-cors

# Run the server
python app.py
```
The server runs on `http://127.0.0.1:5000`.

### 2. Frontend
The frontend is a Vite React app located in the `frontend` folder.
```bash
cd frontend

# Install dependencies (only need to do this once)
npm install

# Start the development server
npm run dev
```
The frontend will typically run on `http://localhost:5173`.

## Features
- **Modern UI**: Built with Tailwind CSS and Lucide icons.
- **Flight Chat**: Real-time looking chat interface with flight cards.
- **Authentication**: Login and Register functionality integrated with the Flask backend.

## Notes
- The `vite.config.js` is configured to proxy API requests (`/api/*`, `/login`, `/register`, etc.) to the Flask backend, so you don't need to worry about CORS in development if you use the proxy.
